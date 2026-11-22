using System;
using System.Collections.Generic;
using Rally.Core;
using Rally.Geo;
using Unity.Mathematics;

namespace Rally.World
{
    /// <summary>One plate on a post: what it shows, which way its face points and whether its back is a face too.</summary>
    public struct PostPlate
    {
        public SignPlate Plate;
        public SignDesign Design;
        /// <summary>Unit direction (E, N) the face points to: towards the traffic that reads it.</summary>
        public double2 Face;
        public bool TwoSided;
    }

    /// <summary>A sign post at the road shoulder with its plates, top to bottom per face direction.</summary>
    public sealed class SignPost
    {
        public long Id;
        public Utm33 Position;
        public readonly List<PostPlate> Plates = new List<PostPlate>();
        /// <summary>Unit road tangent at the post (the plates of a wide sign span across it on two posts).</summary>
        public double2 RoadTangent;
    }

    /// <summary>
    /// Where the NVDB plates stand and which way they face. NVDB gives each plate's point (shared by the plates of one
    /// post), its side of the road and the face direction relative to the road's metering direction, which the OSM road
    /// does not have. The metering direction is recovered from the two sides: the plate stands on NVDB side S of the
    /// metering direction and on side S' of the OSM tangent, so metering = tangent when S = S', else −tangent. A plate
    /// "Trafikk i metreringsretning" then faces against it (towards the traffic coming along it), "mot" the other way;
    /// without the sides the Norwegian right-hand rule decides (a plate on the right of a direction of travel faces the
    /// traffic driving that way). Posts are put on the carved shoulder, beyond the flat band of the nearest road, at the
    /// real distance when that is further out (at most <see cref="MaxSetback"/> m more), keeping the real position along it.
    /// </summary>
    public static class SignPlacement
    {
        /// <summary>A plate further than this from every road is dropped (it stands on a road OSM does not have).</summary>
        public const double SearchRadius = 25;
        /// <summary>Post axis beyond the flat band (carriageway + shoulder) of the road: inside the carve's flat apron.</summary>
        public const double PostSetback = 0.9;
        public const double MaxSetback = 2.5;
        /// <summary>Plates closer than this share a post (NVDB gives the plates of one post the same point).</summary>
        public const double SamePost = 0.6;
        /// <summary>A made-up speed-limit plate is not put where a real one stands within this distance.</summary>
        public const double SpeedSignSuppress = 40;

        /// <summary>
        /// The face direction of a plate. <paramref name="tangent"/> is the OSM road direction at the plate and
        /// <paramref name="realSide"/> &gt; 0 when the plate stands left of it; <paramref name="toRoad"/> points from the
        /// plate to the road.
        /// </summary>
        public static double2 FaceDirection(SignFacing facing, RoadSide nvdbSide, double2 tangent, double realSide, double2 toRoad)
        {
            bool left = realSide > 0;
            double2 rightHand = left ? tangent : -tangent;      // faces the traffic driving on its side of the road
            if (facing == SignFacing.TowardRoad) return toRoad;
            if (facing == SignFacing.AwayFromRoad) return -toRoad;
            if (nvdbSide == RoadSide.Unknown || (facing != SignFacing.With && facing != SignFacing.Against)) return rightHand;
            double2 metering = (nvdbSide == RoadSide.Left) == left ? tangent : -tangent;
            return facing == SignFacing.With ? -metering : metering;
        }

        /// <summary>Sort rank on a post: priority signs on top, then prohibitions and warnings, mandatory, information, service, direction, markers.</summary>
        static int Rank(SignPlate p)
        {
            var c = p.Code ?? p.Number ?? "";
            if (c.Length == 0 || !char.IsDigit(c[0])) return 9;
            switch (c[0]) { case '2': return 0; case '3': case '1': return 1; case '4': return 2; case '5': return 3; case '6': return 4; case '7': return 5; case '9': return 7; default: return 6; }
        }

        /// <summary>
        /// Posts for the plates inside <paramref name="bounds"/> (each plate belongs to the tile its point is in).
        /// <paramref name="design"/> picks a plate's design (null = not drawn); plates without a design or a road are
        /// counted in <paramref name="skipped"/> / <paramref name="offRoad"/>.
        /// </summary>
        public static List<SignPost> Place(IReadOnlyList<SignPlate> plates, IRoadQuery roads, Func<SignPlate, SignDesign> design, Bounds25833 bounds, out int skipped, out int offRoad)
        {
            skipped = 0; offRoad = 0;
            var sorted = new List<SignPlate>();
            foreach (var p in plates) if (p != null && bounds.Contains(p.Position)) sorted.Add(p);
            sorted.Sort((a, b) => a.Id.CompareTo(b.Id));
            var posts = new List<SignPost>();
            // NVDB gives every plate of a sign point the same point, the plates on both sides of the road included (a speed
            // hump signed on both sides): a post is the plates at one point on one NVDB side (sideposisjon).
            var byPoint = new List<(Utm33 at, RoadSide nvdb, double side, SignPost post)>();
            foreach (var p in sorted)
            {
                var d = design(p);
                if (d == null) { skipped++; continue; }
                if (!roads.Nearest(p.Position, SearchRadius, out var hit)) { offRoad++; continue; }
                double2 q = new double2(p.Position.E, p.Position.N), t = math.normalizesafe(hit.Tangent, new double2(1, 0));
                double2 off = q - hit.Point;
                double2 left = new double2(-t.y, t.x);
                double side = math.dot(off, left);
                if (math.abs(side) < 0.05) side = p.Side == RoadSide.Left ? 1 : -1;   // on the centre line: trust NVDB's side (metering ≈ tangent)
                SignPost post = null;
                foreach (var (at, nvdb, s, existing) in byPoint)
                {
                    if (math.distance(new double2(at.E, at.N), q) >= SamePost) continue;
                    if (nvdb == p.Side) { post = existing; side = s; break; }
                    // the same point, the other side of the metering direction: the other side of the road
                    if (nvdb != RoadSide.Unknown && p.Side != RoadSide.Unknown) side = -math.sign(s) * math.max(math.abs(s), 1);
                }
                double2 outward = left * math.sign(side);
                var face = FaceDirection(p.Facing, p.Side, t, side, -outward);
                if (post == null)
                {
                    double min = RoadConstants.FlatHalf(hit.Half) + PostSetback;
                    double dist = math.clamp(math.abs(side), min, min + MaxSetback);
                    var foot = hit.Point + t * math.dot(off, t);
                    post = new SignPost { Id = p.Id, Position = new Utm33(foot.x + outward.x * dist, foot.y + outward.y * dist), RoadTangent = t };
                    posts.Add(post);
                    byPoint.Add((p.Position, p.Side, side, post));
                }
                post.Plates.Add(new PostPlate { Plate = p, Design = d, Face = face, TwoSided = p.Facing == SignFacing.Both });
            }
            foreach (var post in posts) SortPlates(post.Plates);
            return posts;
        }

        /// <summary>
        /// By NVDB's Plasseringskode when every plate has one; else main signs by rank (NVDB id within a rank), each
        /// supplementary plate (8xx) right under the first main sign facing its way.
        /// </summary>
        static void SortPlates(List<PostPlate> plates)
        {
            if (plates.Count < 2) return;
            // NVDB's Plasseringskode is the real order (lowest on top); the rules below only when a plate lacks it
            if (plates.TrueForAll(p => p.Plate.Order > 0))
            {
                plates.Sort((a, b) => { int r = a.Plate.Order.CompareTo(b.Plate.Order); return r != 0 ? r : a.Plate.Id.CompareTo(b.Plate.Id); });
                return;
            }
            var main = new List<PostPlate>(); var extra = new List<PostPlate>();
            foreach (var p in plates) (p.Design.Supplementary ? extra : main).Add(p);
            main.Sort((a, b) => { int r = Rank(a.Plate).CompareTo(Rank(b.Plate)); return r != 0 ? r : a.Plate.Id.CompareTo(b.Plate.Id); });
            plates.Clear();
            plates.AddRange(main);
            foreach (var e in extra)
            {
                int at = plates.FindIndex(m => !m.Design.Supplementary && math.dot(m.Face, e.Face) > 0.5);
                if (at < 0) plates.Add(e);
                else
                {
                    int k = at + 1;
                    while (k < plates.Count && plates[k].Design.Supplementary) k++;
                    plates.Insert(k, e);
                }
            }
        }

        /// <summary>The NVDB speed limit (type 105) nearest to a point within <paramref name="maxDist"/> m, or 0.</summary>
        public static int KmhAt(IReadOnlyList<SpeedLimitSegment> limits, Utm33 p, double maxDist = 15)
        {
            if (limits == null) return 0;
            double best = maxDist; int kmh = 0;
            var q = new double2(p.E, p.N);
            foreach (var l in limits)
                for (int i = 0; i + 1 < l.Points.Count; i++)
                {
                    double2 a = new double2(l.Points[i].E, l.Points[i].N), b = new double2(l.Points[i + 1].E, l.Points[i + 1].N), ab = b - a;
                    double tt = math.saturate(math.dot(q - a, ab) / math.max(1e-9, math.dot(ab, ab)));
                    double d = math.distance(q, a + ab * tt);
                    if (d < best) { best = d; kmh = l.Kmh; }
                }
            return kmh;
        }

        /// <summary>
        /// The speed of the zone a 366 / 368 plate starts or ends: the lowest NVDB limit within <paramref name="maxDist"/> m
        /// (the plate stands where the zone's limit meets the road's), 0 when none.
        /// </summary>
        public static int ZoneKmhAt(IReadOnlyList<SpeedLimitSegment> limits, Utm33 p, double maxDist = 15)
        {
            if (limits == null) return 0;
            int kmh = 0;
            var q = new double2(p.E, p.N);
            foreach (var l in limits)
                for (int i = 0; i + 1 < l.Points.Count; i++)
                {
                    double2 a = new double2(l.Points[i].E, l.Points[i].N), b = new double2(l.Points[i + 1].E, l.Points[i + 1].N), ab = b - a;
                    double tt = math.saturate(math.dot(q - a, ab) / math.max(1e-9, math.dot(ab, ab)));
                    if (math.distance(q, a + ab * tt) <= maxDist && l.Kmh > 0 && (kmh == 0 || l.Kmh < kmh)) kmh = l.Kmh;
                }
            return kmh;
        }

        /// <summary>
        /// signs.js speedChanges, for the whole network: where two NVDB speed-limit polylines meet end to end (and nothing
        /// else meets there) with different limits, each direction of travel gets a 362 plate for the limit it enters, on
        /// its right-hand side a few metres past the change, unless a real speed-limit plate stands within
        /// <see cref="SpeedSignSuppress"/> m. Only changes inside <paramref name="bounds"/>, so neighbouring tiles do not
        /// both make one. The plates have negative ids and Facing Unknown (the right-hand rule faces them).
        /// </summary>
        public static List<SignPlate> SpeedChangePlates(IReadOnlyList<SpeedLimitSegment> limits, IReadOnlyList<SignPlate> real, Bounds25833 bounds)
        {
            var made = new List<SignPlate>();
            if (limits == null) return made;
            var ends = new List<(double2 p, double2 inward, int kmh)>();     // inward: from the end point into its polyline
            foreach (var l in limits)
            {
                if (l.Points.Count < 2) continue;
                var pts = l.Points;
                double2 a = P(pts[0]), a1 = P(pts[1]), b = P(pts[pts.Count - 1]), b1 = P(pts[pts.Count - 2]);
                ends.Add((a, math.normalizesafe(a1 - a), l.Kmh));
                ends.Add((b, math.normalizesafe(b1 - b), l.Kmh));
            }
            var done = new bool[ends.Count];
            for (int i = 0; i < ends.Count; i++)
            {
                if (done[i]) continue;
                var meet = new List<int> { i };
                for (int j = i + 1; j < ends.Count; j++) if (!done[j] && math.distance(ends[i].p, ends[j].p) < 1.0) meet.Add(j);
                foreach (var m in meet) done[m] = true;
                if (meet.Count != 2) continue;
                var e0 = ends[meet[0]]; var e1 = ends[meet[1]];
                if (e0.kmh == e1.kmh || !bounds.Contains(new Utm33(e0.p.x, e0.p.y))) continue;
                AddChange(made, real, e0.p, e1.inward, e1.kmh, bounds);   // travelling from e0's line into e1's
                AddChange(made, real, e0.p, e0.inward, e0.kmh, bounds);
            }
            return made;
        }

        static double2 P(Utm33 u) => new double2(u.E, u.N);

        static void AddChange(List<SignPlate> made, IReadOnlyList<SignPlate> real, double2 at, double2 travel, int kmh, Bounds25833 bounds)
        {
            if (kmh <= 0 || kmh > 130 || kmh % 10 != 0) return;
            foreach (var r in real)
            {
                var c = r.Code ?? r.Number ?? "";
                if ((c.StartsWith("362") || c.StartsWith("364") || c.StartsWith("366") || c.StartsWith("368")) && math.distance(P(r.Position), at) < SpeedSignSuppress) return;
            }
            double2 right = new double2(travel.y, -travel.x);
            var p = at + travel * 5 + right * 4;
            made.Add(new SignPlate
            {
                Id = -(made.Count + 1) - (long)(math.abs(at.x * 31 + at.y) % 1e9) * 4,
                Number = $"362.{kmh}", Code = $"362.{kmh}", Label = $"Fartsgrense {kmh} km/t",
                Facing = SignFacing.Unknown, Side = RoadSide.Unknown, Position = new Utm33(p.x, p.y),
            });
        }
    }
}
