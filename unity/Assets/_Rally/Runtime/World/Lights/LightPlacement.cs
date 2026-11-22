using System;
using System.Collections.Generic;
using Rally.Core;
using Rally.Geo;
using Unity.Mathematics;

namespace Rally.World
{
    /// <summary>A street light at the roadside: its foot, the unit direction (E, N) from the foot to the road, mast height and arm.</summary>
    public sealed class LightPost
    {
        public long Id;
        public Utm33 Position;
        public double2 ToRoad;
        /// <summary>Visible mast height (m) over the ground at the foot.</summary>
        public float Height;
        /// <summary>Horizontal reach of the arm (or the short bracket) from the mast to the lamp head, towards the road.</summary>
        public float Arm;
        /// <summary>Made up from a lit stretch (86) without registered points, not an NVDB point.</summary>
        public bool Filled;
    }

    /// <summary>
    /// Where the street lights stand. A registered point (87 Belysningspunkt) keeps its place along the nearest drawn road and
    /// its side, but stands at least <see cref="LightPoint.FromEdge"/> (default 1 m) outside the road's flat band (carriageway +
    /// shoulder), at its real distance when that is further out (at most <see cref="MaxSetback"/> m more). A lit stretch (86
    /// Belysningsstrekning) with no registered points near gets a post every "Avstand innbyrdes" (default
    /// <see cref="DefaultSpacing"/> m) along it, on its right in its digitising direction. A post is dropped when no ground road
    /// is within <see cref="SearchRadius"/> m (it lights a path the game does not draw), when a bridge deck or a tunnel is the
    /// nearer road, or when its foot lands on any road's flat band, on a deck or in a tunnel. Pure (tests): heights come later.
    /// </summary>
    public static class LightPlacement
    {
        public const double SearchRadius = 20, DefaultFromEdge = 1, MaxSetback = 3, DefaultSpacing = 40;
        /// <summary>A stretch sample takes the road within this distance (the stretch is drawn on the road's centre line).</summary>
        public const double FillReach = 8;
        /// <summary>No post is made up within this fraction of the spacing of a registered point.</summary>
        public const double FillSuppress = 0.5;
        /// <summary>A registered point this close to one already placed is the same mast.</summary>
        public const double SameMast = 0.5;
        /// <summary>Mast heights without a Lysmast: town streets (single-lane roads) and main roads (the two-lane class).</summary>
        public const float TownMast = 8f, MainRoadMast = 10f;
        /// <summary>Arm length when Utligger = Ja without a length; the short bracket of a mast without an arm.</summary>
        public const float DefaultArm = 2f, Bracket = 0.4f;

        public struct Stats { public int Real, Filled, NotOnMast, OffRoad, DeckOrTunnel, OnRoad; }

        /// <summary>
        /// The posts of the points and stretches inside <paramref name="bounds"/> (a point belongs to the tile it is in, a
        /// stretch sample to the tile its sample is in). <paramref name="set"/> may reach beyond the bounds: those points only
        /// keep made-up posts away. <paramref name="inTunnel"/>: a road tunnel at a point (TileWorld.TunnelAt); may be null.
        /// </summary>
        public static List<LightPost> Place(LightSet set, IRoadQuery roads, Bounds25833 bounds, Func<Utm33, bool> inTunnel, out Stats stats)
        {
            stats = default;
            var posts = new List<LightPost>();
            if (set == null || roads == null) return posts;
            var sorted = new List<LightPoint>(set.Points);
            sorted.Sort((a, b) => a.Id.CompareTo(b.Id));
            var placedAt = new List<double2>();
            foreach (var p in sorted)
            {
                if (!bounds.Contains(p.Position)) continue;
                if (!p.OnMast) { stats.NotOnMast++; continue; }
                var q = P(p.Position);
                bool same = false;
                foreach (var a in placedAt) if (math.distance(a, q) < SameMast) { same = true; break; }
                if (same) continue;
                double fromEdge = double.IsNaN(p.FromEdge) ? DefaultFromEdge : math.clamp(p.FromEdge, 0.5, 3);
                var post = Snap(q, null, fromEdge, roads, inTunnel, ref stats);
                if (post == null) continue;
                placedAt.Add(q);
                post.Id = p.Id;
                if (!double.IsNaN(p.MastLength) && p.MastLength >= 3) post.Height = (float)p.MastLength;
                post.Arm = p.Arm ? (!double.IsNaN(p.ArmLength) && p.ArmLength > 0 ? (float)p.ArmLength : DefaultArm) : Bracket;
                posts.Add(post);
                stats.Real++;
            }
            foreach (var s in set.Stretches)
            {
                if (s.Use == "Tunnel" || s.Points.Count < 2) continue;
                double spacing = s.Spacing >= 10 ? s.Spacing : DefaultSpacing;
                int k = 0;
                for (double along = 0, segStart = 0; ; )
                {
                    // the sample at `along` on the polyline
                    while (k + 1 < s.Points.Count && segStart + math.distance(P(s.Points[k]), P(s.Points[k + 1])) < along)
                    { segStart += math.distance(P(s.Points[k]), P(s.Points[k + 1])); k++; }
                    if (k + 1 >= s.Points.Count) break;
                    double2 a = P(s.Points[k]), b = P(s.Points[k + 1]);
                    double len = math.max(1e-9, math.distance(a, b));
                    double2 dir = (b - a) / len, at = a + dir * (along - segStart);
                    along += spacing;
                    if (!bounds.Contains(new Utm33(at.x, at.y))) continue;
                    bool near = false;
                    foreach (var p in set.Points) if (math.distance(P(p.Position), at) < spacing * FillSuppress) { near = true; break; }
                    if (near) continue;
                    var post = Snap(at, new double2(dir.y, -dir.x), DefaultFromEdge, roads, inTunnel, ref stats, FillReach);
                    if (post == null) continue;
                    post.Id = -(s.Id * 1000 + posts.Count + 1);
                    post.Arm = Bracket;
                    post.Filled = true;
                    posts.Add(post);
                    stats.Filled++;
                }
            }
            return posts;
        }

        /// <summary>
        /// A post for a light at <paramref name="q"/>: on the nearest ground road's side of <paramref name="q"/> (or towards
        /// <paramref name="right"/>, the stretch's right), <paramref name="fromEdge"/> m beyond its flat band or further out; null
        /// (counted) where it may not stand.
        /// </summary>
        static LightPost Snap(double2 q, double2? right, double fromEdge, IRoadQuery roads, Func<Utm33, bool> inTunnel, ref Stats stats, double reach = SearchRadius)
        {
            var u = new Utm33(q.x, q.y);
            if (!roads.Nearest(u, reach, RoadLayer.Ground, out var hit)) { stats.OffRoad++; return null; }
            if ((roads.BridgeSegmentCount > 0 && roads.Nearest(u, hit.Distance, RoadLayer.Deck, out var deck) && deck.Distance < hit.Distance)
                || (roads.TunnelSegmentCount > 0 && roads.Nearest(u, hit.Distance, RoadLayer.Tunnel, out var tube) && tube.Distance < hit.Distance))
            { stats.DeckOrTunnel++; return null; }
            double2 t = math.normalizesafe(hit.Tangent, new double2(1, 0)), left = new double2(-t.y, t.x), off = q - hit.Point;
            double side = math.dot(off, left);
            double2 outward = right.HasValue ? (math.dot(right.Value, left) > 0 ? left : -left)
                : math.abs(side) < 0.05 ? -left : left * math.sign(side);
            double min = RoadConstants.FlatHalf(hit.Half) + fromEdge;
            double dist = right.HasValue ? min : math.clamp(math.abs(side), min, min + MaxSetback);
            var foot = hit.Point + t * math.dot(off, t) + outward * dist;
            var at = new Utm33(foot.x, foot.y);
            // The foot on another road's flat band (a junction, a parallel street), on a bridge deck or in a tube: no post.
            if (roads.Nearest(at, 30, RoadLayer.Ground, out var g) && g.Distance < RoadConstants.FlatHalf(g.Half) + 0.3) { stats.OnRoad++; return null; }
            if (roads.BridgeSegmentCount > 0 && roads.Nearest(at, 30, RoadLayer.Deck, out var d) && d.Distance < RoadConstants.DeckHalf(d.Half) + 0.3) { stats.DeckOrTunnel++; return null; }
            if (inTunnel != null && inTunnel(at)) { stats.DeckOrTunnel++; return null; }
            return new LightPost { Position = at, ToRoad = -outward, Height = hit.Half >= RoadConstants.TwoLaneHalf - 0.01f ? MainRoadMast : TownMast };
        }

        static double2 P(Utm33 u) => new double2(u.E, u.N);
    }
}
