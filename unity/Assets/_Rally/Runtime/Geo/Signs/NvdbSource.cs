using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using Rally.Core;

namespace Rally.Geo
{
    /// <summary>
    /// signs.js <c>fetchRoadSigns</c>: Statens vegvesen's NVDB (API Les v4) for two object types in a
    /// kartutsnitt — 96 Skiltplate (every sign plate as a point with its sign number) and 105
    /// Fartsgrense (speed limits as polylines). Pages follow <c>metadata.neste.href</c> up to
    /// <see cref="MaxPages"/>. The <c>X-Client</c> header names the app, as NVDB asks. Unreachable
    /// NVDB yields null, never an error: the caller asks again after NVDB's pause (Rally.Gameplay.OverlayFetch). Licence: <see cref="Attribution"/>.
    /// Street lights (<see cref="FetchLights"/>) come from the same API: 87 Belysningspunkt, 181 Lysmast, 86 Belysningsstrekning.
    /// </summary>
    public sealed class NvdbSource : ISignSource, ILightSource
    {
        public const string Attribution = "Inneholder data under norsk lisens for offentlige data (NLOD) tilgjengeliggjort av Statens vegvesen.";
        public const string Base = "https://nvdbapiles.atlas.vegvesen.no/vegobjekter/api/v4/vegobjekter";
        public const int TypeSignPlate = 96, TypeSpeedLimit = 105;
        public const int PropSignNumber = 5530, PropFacing = 1894, PropText = 1910, PropKmh = 2021, PropSize = 1970;
        public const int TypeRoadSurface = 241, PropMassetype = 1216;   // roads.js: Vegdekke, Massetype
        /// <summary>Belysningspunkt: Plassering, Avstand fra vegkant, Bruksområde (datakatalog, checked 2026-11-22).</summary>
        public const int TypeLightPoint = 87, PropLightPlacement = 1874, PropLightFromEdge = 1883, PropLightUse = 1272;
        /// <summary>Lysmast: Mastelengde synlig, Utligger, Utliggerarmens lengde.</summary>
        public const int TypeLightMast = 181, PropMastLength = 1338, PropMastArm = 3895, PropMastArmLength = 10020;
        /// <summary>Belysningsstrekning: Avstand innbyrdes, Bruksområde.</summary>
        public const int TypeLightStretch = 86, PropStretchSpacing = 1714, PropStretchUse = 1271;
        /// <summary>A mast without a parent relation belongs to the light point within this distance.</summary>
        public const double MastJoin = 0.5;
        public const int TimeoutMs = 20000;
        public const int MaxPages = 20;
        public static readonly IReadOnlyDictionary<string, string> Headers = new Dictionary<string, string>
        {
            { "X-Client", Http.AppName }, { "Accept", "application/json" },
        };

        readonly CachedSource<string> cache;
        public NvdbSource(IGeoCache cache) { this.cache = CachedSource<string>.Text(cache, "nvdb"); }

        /// <summary>kartutsnitt=minE,minN,maxE,maxN at one decimal, srid 5973 (25833 + height).</summary>
        public static string FirstPageUrl(int typeId, Bounds25833 b, string include = "geometri,egenskaper,lokasjon")
            => $"{Base}/{typeId}?kartutsnitt={Http.Fixed(b.MinE, 1)},{Http.Fixed(b.MinN, 1)},{Http.Fixed(b.MaxE, 1)},{Http.Fixed(b.MaxN, 1)}"
             + $"&srid=5973&inkluder={include}&antall=1000";

        /// <summary>The lights' include: their relations join a mast to its point.</summary>
        public const string LightInclude = "geometri,egenskaper,relasjoner";

        /// <summary>
        /// Every sign plate and speed limit in the bounds, each page through the GeoCache (kind "nvdb", like the road
        /// surfaces): a second visit reads them from disk / IndexedDB without asking NVDB.
        /// </summary>
        public async Task<SignSet> FetchSigns(Bounds25833 bounds, CancellationToken ct)
        {
            using var cts = CancellationTokenSource.CreateLinkedTokenSource(ct);
            cts.CancelAfter(TimeoutMs);
            try
            {
                var plates = FetchObjects(TypeSignPlate, bounds, cts.Token);
                var limits = FetchObjects(TypeSpeedLimit, bounds, cts.Token);
                var set = new SignSet();
                foreach (var o in await plates) { var p = ParseSignPlate(o); if (p != null) set.Plates.Add(p); }
                foreach (var o in await limits) { var l = ParseSpeedLimit(o); if (l != null) set.SpeedLimits.Add(l); }
                return set;
            }
            catch (Exception e) when (!ct.IsCancellationRequested)
            {
                RallyLog.Warn($"overlay: road signs unavailable: {e.Message}");
                return null;
            }
        }

        /// <summary>
        /// roads.js <c>fetchRoadSurfaces</c>: the registered road surfaces (241 Vegdekke) in the bounds; objects
        /// without a Massetype are skipped (the register is patchy on municipal roads). Unreachable NVDB yields null
        /// (asked again later); meanwhile the roads keep their OSM surface.
        /// </summary>
        public async Task<List<RoadSurfaceLine>> FetchSurfaces(Bounds25833 bounds, CancellationToken ct)
        {
            using var cts = CancellationTokenSource.CreateLinkedTokenSource(ct);
            cts.CancelAfter(TimeoutMs);
            var lines = new List<RoadSurfaceLine>();
            try
            {
                foreach (var o in await FetchObjects(TypeRoadSurface, bounds, cts.Token)) { var l = ParseRoadSurface(o); if (l != null) lines.Add(l); }
            }
            catch (Exception e) when (!ct.IsCancellationRequested)
            {
                RallyLog.Warn($"overlay: road surfaces unavailable: {e.Message}");
                return null;
            }
            return lines;
        }

        /// <summary>
        /// The street lights in the bounds: every 87 Belysningspunkt with its 181 Lysmast joined (by the mast's parent relation,
        /// else by position), and the 86 Belysningsstrekning lines. Through the GeoCache like the signs; unreachable NVDB
        /// yields null (asked again later), never an error.
        /// </summary>
        public async Task<LightSet> FetchLights(Bounds25833 bounds, CancellationToken ct)
        {
            using var cts = CancellationTokenSource.CreateLinkedTokenSource(ct);
            cts.CancelAfter(TimeoutMs);
            try
            {
                var points = FetchObjects(TypeLightPoint, bounds, cts.Token, LightInclude);
                var masts = FetchObjects(TypeLightMast, bounds, cts.Token, LightInclude);
                var stretches = FetchObjects(TypeLightStretch, bounds, cts.Token, LightInclude);
                var set = new LightSet();
                foreach (var o in await points) { var p = ParseLightPoint(o); if (p != null) set.Points.Add(p); }
                JoinMasts(set.Points, await masts);
                foreach (var o in await stretches) { var l = ParseLightStretch(o); if (l != null) set.Stretches.Add(l); }
                return set;
            }
            catch (Exception e) when (!ct.IsCancellationRequested)
            {
                RallyLog.Warn($"overlay: street lights unavailable: {e.Message}");
                return null;
            }
        }

        async Task<List<Dictionary<string, object>>> FetchObjects(int typeId, Bounds25833 b, CancellationToken ct, string include = null)
        {
            string url = include != null ? FirstPageUrl(typeId, b, include) : FirstPageUrl(typeId, b);
            var objects = new List<Dictionary<string, object>>();
            for (int page = 0; page < MaxPages && url != null; page++)
            {
                var text = await cache.Get(url, () => Http.GetText(url, TimeoutMs, ct, Headers));
                var data = Json.ParseObject(text);
                var batch = data.Arr("objekter");
                if (batch == null || batch.Count == 0) break;
                foreach (var o in batch) if (o is Dictionary<string, object> d) objects.Add(d);
                url = data.Obj("metadata")?.Obj("neste")?.Str("href");
            }
            return objects;
        }

        /// <summary>signs.js <c>signNumberFromVerdi</c>: "362.50 - Fartsgrense 50 km/t" → "362.50"; "729" → "729".</summary>
        public static string SignNumber(string verdi)
        {
            if (verdi == null) return null;
            int i = 0;
            while (i < verdi.Length && char.IsWhiteSpace(verdi[i])) i++;
            int start = i;
            while (i < verdi.Length && char.IsDigit(verdi[i])) i++;
            if (i == start) return null;
            if (i < verdi.Length && verdi[i] == '.')
            {
                int j = i + 1;
                while (j < verdi.Length && char.IsDigit(verdi[j])) j++;
                if (j > i + 1) i = j;
            }
            return verdi.Substring(start, i - start);
        }

        /// <summary>The code token before the label: "906V - Hindermarkering" → "906V"; "713.H - Vanlig vegviser" → "713.H".</summary>
        public static string CodeOf(string verdi)
        {
            if (verdi == null) return null;
            var t = verdi.Trim();
            int i = 0;
            while (i < t.Length && !char.IsWhiteSpace(t[i])) i++;
            return i > 0 ? t.Substring(0, i) : null;
        }

        /// <summary>The label after the number: strips "362.50 - " / "729 ".</summary>
        public static string LabelOf(string verdi, string number)
        {
            if (verdi == null) return null;
            var rest = verdi.TrimStart();
            if (number != null && rest.StartsWith(number)) rest = rest.Substring(number.Length);
            rest = rest.TrimStart();
            if (rest.StartsWith("-") || rest.StartsWith("–")) rest = rest.Substring(1);
            rest = rest.Trim();
            return rest.Length > 0 ? rest : null;
        }

        static string Property(Dictionary<string, object> obj, int id)
        {
            var props = obj.Arr("egenskaper");
            if (props == null) return null;
            foreach (var po in props)
                if (po is Dictionary<string, object> p && (long)p.Num("id", -1) == id)
                {
                    var v = p.Get("verdi");
                    return v == null ? null : v is string s ? s : Json.Stringify(v);
                }
            return null;
        }

        public static SignFacing Facing(string verdi)
        {
            var v = (verdi ?? "").ToLowerInvariant();
            if (v.StartsWith("tosidig")) return SignFacing.Both;
            if (v.StartsWith("parallelt mot")) return SignFacing.TowardRoad;
            if (v.StartsWith("parallelt fra")) return SignFacing.AwayFromRoad;
            if (v.Contains("trafikk mot")) return SignFacing.Against;
            if (v.Contains("trafikk i")) return SignFacing.With;
            return SignFacing.Unknown;
        }

        /// <summary>Sideposisjon "V" / "VT" (left, beside the road) → Left, "H" / "HT" → Right; middle and unknown → Unknown.</summary>
        public static RoadSide SideOf(string sidePos)
            => sidePos == "V" || sidePos == "VT" ? RoadSide.Left : sidePos == "H" || sidePos == "HT" ? RoadSide.Right : RoadSide.Unknown;

        public static SignPlate ParseSignPlate(Dictionary<string, object> obj)
        {
            var verdi = Property(obj, PropSignNumber);
            var number = SignNumber(verdi);
            var geometry = Wkt.Parse(obj.Obj("geometri")?.Str("wkt"));
            if (number == null || geometry == null || geometry.Type != "POINT") return null;
            var placements = obj.Obj("lokasjon")?.Arr("stedfestinger");
            var sidePos = placements != null && placements.Count > 0 ? (placements[0] as Dictionary<string, object>)?.Str("sideposisjon") : null;
            var size = (Property(obj, PropSize) ?? "").ToLowerInvariant();
            return new SignPlate
            {
                Id = obj.Long("id"),
                Number = number,
                Code = CodeOf(verdi),
                Size = size.StartsWith("liten") ? SignSize.Small : size.StartsWith("stor") ? SignSize.Large : SignSize.Medium,
                Label = LabelOf(verdi, number),
                Text = Property(obj, PropText),
                Facing = Facing(Property(obj, PropFacing)),
                Side = SideOf(sidePos),
                Position = geometry.Points[0],
                Height = geometry.Heights[0],
            };
        }

        /// <summary>roads.js <c>surfaceKindFromMassetype</c>: NVDB Massetype text → Gravel, or Asphalt for every bound surface; null when absent.</summary>
        public static Surface? SurfaceFromMassetype(string verdi)
        {
            if (string.IsNullOrEmpty(verdi)) return null;
            var v = verdi.ToLowerInvariant();
            if (v == "grus" || v.StartsWith("enkel overflatebehandling grus", StringComparison.Ordinal) || v.StartsWith("dobbel overflatebehandling grus", StringComparison.Ordinal)) return Surface.Gravel;
            if (v.Contains("grus") && !v.Contains("asfalt") && !v.Contains("emulsjon") && !v.Contains("olje")) return Surface.Gravel;
            return Surface.Asphalt;
        }

        /// <summary>One Vegdekke object → its surface polyline, or null without a Massetype or a LINESTRING.</summary>
        public static RoadSurfaceLine ParseRoadSurface(Dictionary<string, object> obj)
        {
            var kind = SurfaceFromMassetype(Property(obj, PropMassetype));
            if (kind == null) return null;
            var geometry = Wkt.Parse(obj.Obj("geometri")?.Str("wkt"));
            if (geometry == null || geometry.Type != "LINESTRING" || geometry.Points.Count < 2) return null;
            return new RoadSurfaceLine { Kind = kind.Value, Points = geometry.Points };
        }

        public static SpeedLimitSegment ParseSpeedLimit(Dictionary<string, object> obj)
        {
            var kmhText = Property(obj, PropKmh);
            if (!double.TryParse(kmhText, System.Globalization.NumberStyles.Float, System.Globalization.CultureInfo.InvariantCulture, out var kmh)) return null;
            var geometry = Wkt.Parse(obj.Obj("geometri")?.Str("wkt"));
            if (geometry == null || geometry.Points.Count < 2) return null;
            return new SpeedLimitSegment { Kmh = (int)kmh, Points = geometry.Points };
        }
    
        static double Number(string verdi)
            => double.TryParse(verdi, System.Globalization.NumberStyles.Float, System.Globalization.CultureInfo.InvariantCulture, out var v) ? v : double.NaN;

        /// <summary>One Belysningspunkt → its point; null without a POINT. Plassering other than a mast (wall, rail, roof …) → not OnMast.</summary>
        public static LightPoint ParseLightPoint(Dictionary<string, object> obj)
        {
            var geometry = Wkt.Parse(obj.Obj("geometri")?.Str("wkt"));
            if (geometry == null || geometry.Type != "POINT") return null;
            var placement = Property(obj, PropLightPlacement);
            return new LightPoint
            {
                Id = obj.Long("id"),
                Position = geometry.Points[0],
                Height = geometry.Heights[0],
                OnMast = placement == null || placement == "Lysmast" || placement == "Mindre stolpe",
                FromEdge = Number(Property(obj, PropLightFromEdge)),
                Use = Property(obj, PropLightUse),
            };
        }

        /// <summary>
        /// Each Lysmast's height and arm onto its Belysningspunkt: the parent named in the mast's relasjoner.foreldre, else the
        /// point within <see cref="MastJoin"/> m (the mast and its point share coordinates in NVDB).
        /// </summary>
        public static void JoinMasts(List<LightPoint> points, List<Dictionary<string, object>> masts)
        {
            var byId = new Dictionary<long, LightPoint>();
            foreach (var p in points) byId[p.Id] = p;
            foreach (var m in masts)
            {
                LightPoint point = null;
                var parents = m.Obj("relasjoner")?.Arr("foreldre");
                if (parents != null)
                    foreach (var r in parents)
                        if (r is Dictionary<string, object> rel && (long)(rel.Obj("type")?.Num("id", -1) ?? -1) == TypeLightPoint)
                            foreach (var id in rel.Arr("vegobjekter") ?? new List<object>())
                                if (id is double d && byId.TryGetValue((long)d, out var q)) point = q;
                if (point == null)
                {
                    var g = Wkt.Parse(m.Obj("geometri")?.Str("wkt"));
                    if (g == null) continue;
                    double best = MastJoin;
                    foreach (var p in points)
                    {
                        double dist = Math.Sqrt((p.Position.E - g.Points[0].E) * (p.Position.E - g.Points[0].E) + (p.Position.N - g.Points[0].N) * (p.Position.N - g.Points[0].N));
                        if (dist <= best) { best = dist; point = p; }
                    }
                }
                if (point == null) continue;
                point.MastLength = Number(Property(m, PropMastLength));
                point.Arm = Property(m, PropMastArm) == "Ja";
                point.ArmLength = Number(Property(m, PropMastArmLength));
            }
        }

        /// <summary>One Belysningsstrekning → its polyline and post spacing; null without a LINESTRING.</summary>
        public static LightStretch ParseLightStretch(Dictionary<string, object> obj)
        {
            var geometry = Wkt.Parse(obj.Obj("geometri")?.Str("wkt"));
            if (geometry == null || geometry.Type != "LINESTRING" || geometry.Points.Count < 2) return null;
            double spacing = Number(Property(obj, PropStretchSpacing));
            return new LightStretch { Id = obj.Long("id"), Points = geometry.Points, Spacing = double.IsNaN(spacing) ? 0 : spacing, Use = Property(obj, PropStretchUse) };
        }
    }
}
