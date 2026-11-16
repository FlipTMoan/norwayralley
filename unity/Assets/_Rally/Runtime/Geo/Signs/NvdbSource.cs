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
    /// NVDB yields an empty set, never an error: signs are decoration. Licence: <see cref="Attribution"/>.
    /// </summary>
    public sealed class NvdbSource : ISignSource
    {
        public const string Attribution = "Inneholder data under norsk lisens for offentlige data (NLOD) tilgjengeliggjort av Statens vegvesen.";
        public const string Base = "https://nvdbapiles.atlas.vegvesen.no/vegobjekter/api/v4/vegobjekter";
        public const int TypeSignPlate = 96, TypeSpeedLimit = 105;
        public const int PropSignNumber = 5530, PropFacing = 1894, PropText = 1910, PropKmh = 2021;
        public const int TimeoutMs = 20000;
        public const int MaxPages = 20;
        public static readonly IReadOnlyDictionary<string, string> Headers = new Dictionary<string, string>
        {
            { "X-Client", Http.AppName }, { "Accept", "application/json" },
        };

        readonly CachedSource<string> cache;
        public NvdbSource(IGeoCache cache) { this.cache = CachedSource<string>.Text(cache, "nvdb"); }

        /// <summary>kartutsnitt=minE,minN,maxE,maxN at one decimal, srid 5973 (25833 + height).</summary>
        public static string FirstPageUrl(int typeId, Bounds25833 b)
            => $"{Base}/{typeId}?kartutsnitt={Http.Fixed(b.MinE, 1)},{Http.Fixed(b.MinN, 1)},{Http.Fixed(b.MaxE, 1)},{Http.Fixed(b.MaxN, 1)}"
             + "&srid=5973&inkluder=geometri,egenskaper,lokasjon&antall=1000";

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
            catch (Exception e)
            {
                RallyLog.Warn($"road signs unavailable: {e.Message}");
                return SignSet.Empty;
            }
        }

        async Task<List<Dictionary<string, object>>> FetchObjects(int typeId, Bounds25833 b, CancellationToken ct)
        {
            string url = FirstPageUrl(typeId, b);
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

        static SignFacing Facing(string verdi)
        {
            var v = (verdi ?? "").ToLowerInvariant();
            if (v.StartsWith("tosidig")) return SignFacing.Both;
            if (v.Contains("trafikk mot")) return SignFacing.Against;
            if (v.Contains("trafikk i")) return SignFacing.With;
            return SignFacing.Unknown;
        }

        public static SignPlate ParseSignPlate(Dictionary<string, object> obj)
        {
            var verdi = Property(obj, PropSignNumber);
            var number = SignNumber(verdi);
            var geometry = Wkt.Parse(obj.Obj("geometri")?.Str("wkt"));
            if (number == null || geometry == null || geometry.Type != "POINT") return null;
            var placements = obj.Obj("lokasjon")?.Arr("stedfestinger");
            var sidePos = placements != null && placements.Count > 0 ? (placements[0] as Dictionary<string, object>)?.Str("sideposisjon") : null;
            return new SignPlate
            {
                Id = obj.Long("id"),
                Number = number,
                Label = LabelOf(verdi, number),
                Text = Property(obj, PropText),
                Facing = Facing(Property(obj, PropFacing)),
                Side = sidePos == "V" ? RoadSide.Left : sidePos == "H" ? RoadSide.Right : RoadSide.Unknown,
                Position = geometry.Points[0],
                Height = geometry.Heights[0],
            };
        }

        public static SpeedLimitSegment ParseSpeedLimit(Dictionary<string, object> obj)
        {
            var kmhText = Property(obj, PropKmh);
            if (!double.TryParse(kmhText, System.Globalization.NumberStyles.Float, System.Globalization.CultureInfo.InvariantCulture, out var kmh)) return null;
            var geometry = Wkt.Parse(obj.Obj("geometri")?.Str("wkt"));
            if (geometry == null || geometry.Points.Count < 2) return null;
            return new SpeedLimitSegment { Kmh = (int)kmh, Points = geometry.Points };
        }
    }
}
