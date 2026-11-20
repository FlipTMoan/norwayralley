using System;
using System.Collections.Generic;
using System.Globalization;
using System.IO;
using System.Text;
using Rally.Core;
using Rally.World;
using Unity.Mathematics;
using UnityEngine;
using UnityEngine.Rendering;

namespace Rally.Editor
{
    /// <summary>
    /// <c>-previewSeams</c>: the tile-border survey. Walks every border of the loaded tiles — coarse/coarse and fine/fine
    /// shared edges (grid against grid, base and carved), and the drawn ground across every border incl. fine/coarse
    /// outlines (TileWorld.CarvedHeightAt and VergeMaskAt on both sides) — and logs the height step, the normal step (against
    /// the same measure on a line inside the tile), the ground-colour step of the splat (against neighbouring texels inside
    /// the tile), coarse tiles the shader's tile table cannot reach, and road ribbon drawn by two tiles. Writes DIR/seams.txt
    /// and DIR/seam_spots.txt (the worst places); with <c>-previewSeamSpots FILE</c> it shoots those places instead of its
    /// own worst ones, so a before and an after run look at the same ground. Run with -previewNoCompute for the masks.
    /// </summary>
    public static partial class PreviewShots
    {
        static bool seams;
        static string seamSpotsFile;

        sealed class Stat
        {
            public readonly List<float> V = new List<float>();
            public void Add(float v) => V.Add(v);
            public string Line(string unit, float scale, params float[] over)
            {
                if (V.Count == 0) return "none";
                V.Sort();
                double sum = 0; foreach (var v in V) sum += v;
                float P(float p) => V[Math.Min(V.Count - 1, Math.Max(0, (int)Math.Ceiling(p * V.Count) - 1))];
                var sb = new StringBuilder(FormattableString.Invariant($"n {V.Count} mean {sum / V.Count * scale:0.###} p95 {P(0.95f) * scale:0.###} p99 {P(0.99f) * scale:0.###} max {V[V.Count - 1] * scale:0.###} {unit}"));
                foreach (var o in over) { int c = 0; foreach (var v in V) if (v > o) c++; sb.Append(FormattableString.Invariant($", >{o * scale:0.##} {c}")); }
                return sb.ToString();
            }
        }

        struct Spot { public string Kind; public float Step; public double E, N; public float2 Along; }

        static void SeamReport()
        {
            var sb = new StringBuilder($"# {DateTime.UtcNow:yyyy-MM-dd HH:mm} UTC  {(live ? "live " + query : "fake")}  {(noCompute ? "WebGL2 path (no compute)" : "compute path")}\n");
            var spots = new List<Spot>();
            void Worst(string kind, float step, Utm33 at, float2 along)
            {
                spots.Add(new Spot { Kind = kind, Step = step, E = at.E, N = at.N, Along = along });
            }
            int coarseN = 0, fineN = 0;
            foreach (var t in world.Tiles.Values) if (t.HasHeights) { if (t.Key.Kind == TileKind.Coarse) coarseN++; else fineN++; }
            sb.Append($"tiles ready: {coarseN} coarse, {fineN} fine\n");

            // 1. Shared edges, grid against grid: the edge samples of two neighbours of one kind sit on the same points.
            foreach (var kind in new[] { TileKind.Coarse, TileKind.Fine })
            {
                var carved = new Stat(); var bse = new Stat();
                float worst = 0; Utm33 worstAt = default; float2 worstAlong = default;
                foreach (var a in world.Tiles.Values)
                {
                    if (a.Key.Kind != kind || !a.HasHeights) continue;
                    int n = a.Grid.N;
                    for (int dir = 0; dir < 2; dir++)
                    {
                        var nk = new TileKey(kind, a.Key.I + (dir == 0 ? 1 : 0), a.Key.J + (dir == 1 ? 1 : 0));
                        if (!world.Tiles.TryGetValue(nk, out var b) || !b.HasHeights) continue;
                        for (int k = 0; k < n; k++)
                        {
                            int ia = dir == 0 ? k * n + n - 1 : (n - 1) * n + k, ib = dir == 0 ? k * n : k;
                            float dc = math.abs(a.Grid.Heights[ia] - b.Grid.Heights[ib]), db = math.abs(a.Base[ia] - b.Base[ib]);
                            carved.Add(dc); bse.Add(db);
                            if (dc > worst)
                            {
                                worst = dc;
                                worstAt = dir == 0 ? new Utm33(a.Key.Origin.E + a.Key.SizeM, a.Key.Origin.N + k * a.Key.CellM) : new Utm33(a.Key.Origin.E + k * a.Key.CellM, a.Key.Origin.N + a.Key.SizeM);
                                worstAlong = dir == 0 ? new float2(0, 1) : new float2(1, 0);
                            }
                        }
                    }
                }
                sb.Append($"edge {kind}/{kind} carved: {carved.Line("m", 1, 0.01f, 0.05f, 0.2f)}\n");
                sb.Append($"edge {kind}/{kind} base:   {bse.Line("m", 1, 0.01f, 0.05f, 0.2f)}\n");
                if (worst > 0)
                {
                    Worst($"edge_{kind}", worst, worstAt, worstAlong);
                    string road = world.Roads != null && world.Roads.Nearest(worstAt, 80, out var rq) ? FormattableString.Invariant($"road {rq.Distance:0.0} m away at y {rq.RoadY:0.0}") : "no road within 80 m";
                    var across = new double2(worstAlong.y, -worstAlong.x);
                    sb.Append(FormattableString.Invariant($"  worst {kind} edge at {worstAt.E:0} {worstAt.N:0}: carved {world.CarvedHeightAt(worstAt + across * -0.5):0.00} | {world.CarvedHeightAt(worstAt + across * 0.5):0.00}, base {world.BaseHeightAt(worstAt + across * -0.5):0.00} | {world.BaseHeightAt(worstAt + across * 0.5):0.00}, {road}\n"));
                }
            }

            // 1b. Diagnostic: carve every tile again now and compare the shared edges once more (stale carve vs segment choice).
            if (Array.IndexOf(Environment.GetCommandLineArgs(), "-previewSeamsRecarve") >= 0)
            {
                world.RecarveWithin(new Bounds25833(-1e9, -1e9, 1e9, 1e9));
                foreach (var kind in new[] { TileKind.Coarse, TileKind.Fine })
                {
                    var carved = new Stat();
                    foreach (var a in world.Tiles.Values)
                    {
                        if (a.Key.Kind != kind || !a.HasHeights) continue;
                        int n = a.Grid.N;
                        for (int dir = 0; dir < 2; dir++)
                        {
                            if (!world.Tiles.TryGetValue(new TileKey(kind, a.Key.I + (dir == 0 ? 1 : 0), a.Key.J + (dir == 1 ? 1 : 0)), out var b) || !b.HasHeights) continue;
                            for (int k = 0; k < n; k++)
                            {
                                int ia = dir == 0 ? k * n + n - 1 : (n - 1) * n + k, ib = dir == 0 ? k * n : k;
                                carved.Add(math.abs(a.Grid.Heights[ia] - b.Grid.Heights[ib]));
                            }
                        }
                    }
                    sb.Append($"after recarving all: edge {kind}/{kind} carved: {carved.Line("m", 1, 0.01f, 0.05f, 0.2f)}\n");
                }
            }

            // 2. The drawn ground across every border (what TileWorld answers, the CPU twin of the shader's lookup).
            const float Eps = 0.02f;
            var drawn = new Dictionary<string, (Stat h, Stat nrm, Stat nrmIn, Stat mask)>();
            var worstDrawn = new Dictionary<string, (float step, Utm33 at, float2 along)>();
            (Stat, Stat, Stat, Stat) Bucket(string k)
            {
                if (!drawn.TryGetValue(k, out var b)) drawn[k] = b = (new Stat(), new Stat(), new Stat(), new Stat());
                return b;
            }
            float3 Normal(Utm33 p, float h)
            {
                float hx0 = world.CarvedHeightAt(new Utm33(p.E - h, p.N)), hx1 = world.CarvedHeightAt(new Utm33(p.E + h, p.N));
                float hz0 = world.CarvedHeightAt(new Utm33(p.E, p.N - h)), hz1 = world.CarvedHeightAt(new Utm33(p.E, p.N + h));
                return math.normalize(new float3(hx0 - hx1, 2 * h, hz0 - hz1));
            }
            float Angle(float3 a, float3 b) => math.degrees(math.acos(math.clamp(math.dot(a, b), -1f, 1f)));
            void Probe(string kind, Utm33 p, double2 nrm, float cell)
            {
                var (h, nr, nrIn, mk) = Bucket(kind);
                var inside = p + nrm * -Eps; var outside = p + nrm * Eps;
                float step = math.abs(world.CarvedHeightAt(inside) - world.CarvedHeightAt(outside));
                h.Add(step);
                // Normal step: one-sided normals a cell either side of the border, against the same pair a few cells inside.
                nr.Add(Angle(Normal(p + nrm * -cell, cell * 0.5f), Normal(p + nrm * cell, cell * 0.5f)));
                var q = p + nrm * (-cell * 6);
                nrIn.Add(Angle(Normal(q + nrm * -cell, cell * 0.5f), Normal(q + nrm * cell, cell * 0.5f)));
                float mi = world.VergeMaskAt(inside), mo = world.VergeMaskAt(outside);
                if (math.max(mi, mo) > 0.2f) mk.Add(math.abs(mi - mo));
                if (!worstDrawn.TryGetValue(kind, out var w) || step > w.step) worstDrawn[kind] = (step, p, (float2)new double2(-nrm.y, nrm.x));
            }
            bool FineAt(Utm33 p) => world.Tiles.TryGetValue(TileKey.At(TileKind.Fine, p), out var f) && f.HasHeights;
            foreach (var t in world.Tiles.Values)
            {
                if (!t.HasHeights) continue;
                var o = t.Key.Origin; float size = t.Key.SizeM, cell = t.Key.CellM;
                for (int side = 0; side < 4; side++)
                {
                    // Sides: 0 east, 1 north, 2 west, 3 south; the outward normal and the walk along the edge.
                    double2 nrm = side == 0 ? new double2(1, 0) : side == 1 ? new double2(0, 1) : side == 2 ? new double2(-1, 0) : new double2(0, -1);
                    var nk = new TileKey(t.Key.Kind, t.Key.I + (int)nrm.x, t.Key.J + (int)nrm.y);
                    bool sameKind = world.Tiles.TryGetValue(nk, out var nb) && nb.HasHeights;
                    if (t.Key.Kind == TileKind.Coarse && (!sameKind || side >= 2)) continue;   // coarse/coarse once per edge; coarse with nothing beyond is the world's edge
                    if (t.Key.Kind == TileKind.Fine && sameKind && side >= 2) continue;        // fine/fine once per edge; fine/coarse on all four sides
                    string kind = t.Key.Kind == TileKind.Coarse ? "coarse/coarse" : sameKind ? "fine/fine" : "fine/coarse";
                    float stepM = t.Key.Kind == TileKind.Coarse ? 4f : 1f;
                    for (float a = stepM * 0.5f; a < size; a += stepM)
                    {
                        var p = side == 0 ? new Utm33(o.E + size, o.N + a) : side == 1 ? new Utm33(o.E + a, o.N + size) : side == 2 ? new Utm33(o.E, o.N + a) : new Utm33(o.E + a, o.N);
                        if (t.Key.Kind == TileKind.Coarse && (FineAt(p + nrm * -Eps) || FineAt(p + nrm * Eps))) continue;   // drawn by fine tiles there
                        Probe(kind, p, nrm, cell);
                    }
                }
            }
            foreach (var kv in drawn)
            {
                sb.Append($"drawn {kv.Key,-13} height step: {kv.Value.h.Line("m", 1, 0.02f, 0.05f, 0.2f)}\n");
                sb.Append($"drawn {kv.Key,-13} normal step: {kv.Value.nrm.Line("deg", 1, 2f, 5f, 10f)}\n");
                sb.Append($"drawn {kv.Key,-13} normal ref:  {kv.Value.nrmIn.Line("deg", 1, 2f, 5f, 10f)}   (same measure {6} cells inside)\n");
                sb.Append($"drawn {kv.Key,-13} verge step:  {kv.Value.mask.Line("", 1, 0.05f, 0.2f, 0.5f)}   (points with verge > 0.2)\n");
            }
            foreach (var kv in worstDrawn) Worst("drawn_" + kv.Key.Replace('/', '_'), kv.Value.step, kv.Value.at, kv.Value.along);

            // 3. Ground colour: the splat texels either side of a coarse border against neighbouring texel pairs inside.
            SplatSeams(sb);

            // 4. The shader's coarse tile table: ready tiles it cannot reach (never drawn), and how far the clipmap reaches.
            var bind = world.Binding;
            int outside = 0, inReach = 0;
            var car = FloatingOrigin.ToUtm((float3)UnityEngine.Object.FindAnyObjectByType<Rally.Vehicle.CarController>().transform.position);
            float reach = world.Clipmap != null ? world.Clipmap.BaseCell * (1 << (world.Clipmap.Levels - 1)) * world.Clipmap.Cells / 2 : 0;
            foreach (var t in world.Tiles.Values)
            {
                if (t.Key.Kind != TileKind.Coarse || !t.HasHeights) continue;
                bool inTable = t.Key.I >= bind.Coarse.I0 && t.Key.I < bind.Coarse.I0 + bind.Coarse.Dim && t.Key.J >= bind.Coarse.J0 && t.Key.J < bind.Coarse.J0 + bind.Coarse.Dim;
                if (inTable) continue;
                outside++;
                if (t.Key.RectDistance(car) < reach) inReach++;
            }
            sb.Append($"coarse table {bind.Coarse.Dim}×{bind.Coarse.Dim} from ({bind.Coarse.I0},{bind.Coarse.J0}): {outside} ready coarse tiles outside it, {inReach} of them within the clipmap's reach ({reach:0} m); view ring {world.Scheduler.ViewRadius:0} m\n");

            // 5. Road ribbon drawn by two tiles: triangles of a tile's ribbon whose centre lies outside the tile.
            double doubled = 0, total = 0;
            foreach (var mf in UnityEngine.Object.FindObjectsByType<MeshFilter>(FindObjectsSortMode.None))
            {
                if (!mf.name.StartsWith("Ribbon") || mf.sharedMesh == null) continue;
                var m = mf.sharedMesh; var v = m.vertices; var tri = m.triangles;
                for (int i = 0; i < tri.Length; i += 3)
                {
                    Vector3 a = v[tri[i]], b = v[tri[i + 1]], c = v[tri[i + 2]];
                    float area = Vector3.Cross(b - a, c - a).magnitude * 0.5f;
                    var ctr = (a + b + c) / 3;
                    total += area;
                    if (ctr.x < 0 || ctr.z < 0 || ctr.x >= TileScheduler.CoarseSize || ctr.z >= TileScheduler.CoarseSize) doubled += area;
                }
            }
            sb.Append(FormattableString.Invariant($"ribbon: {total:0} m² drawn, {doubled:0} m² of it outside its own tile (drawn twice where the neighbour is loaded)\n"));

            spots.Sort((x, y) => y.Step.CompareTo(x.Step));
            var spotText = new StringBuilder();
            foreach (var s in spots) spotText.Append(FormattableString.Invariant($"{s.Kind} {s.Step:0.000} {s.E:0.0} {s.N:0.0} {s.Along.x:0.###} {s.Along.y:0.###}\n"));
            File.WriteAllText(Path.Combine(outDir, "seam_spots.txt"), spotText.ToString());
            sb.Append("worst places:\n").Append(spotText);
            File.WriteAllText(Path.Combine(outDir, "seams.txt"), sb.ToString());
            Debug.Log("PreviewShots seams:\n" + sb);
            SeamShots(seamSpotsFile != null && File.Exists(seamSpotsFile) ? File.ReadAllText(seamSpotsFile) : spotText.ToString());
        }

        /// <summary>Splat weights (eight layers) either side of each coarse border vs the same texel step one texel inside.</summary>
        static void SplatSeams(StringBuilder sb)
        {
            var atlas = world.CoarseAtlas;
            if (atlas.Splat == null) return;
            int res = atlas.SplatRes;
            var cache = new Dictionary<int, (Color32[] a, Color32[] b)>();
            (Color32[], Color32[]) Read(TerrainTile t)
            {
                if (cache.TryGetValue(t.Slice, out var c)) return c;
                var ra = AsyncGPUReadback.Request(atlas.Splat, 0, 0, res, 0, res, t.Slice, 1, TextureFormat.RGBA32); ra.WaitForCompletion();
                var rb = AsyncGPUReadback.Request(atlas.Splat2, 0, 0, res, 0, res, t.Slice, 1, TextureFormat.RGBA32); rb.WaitForCompletion();
                c = (ra.hasError ? null : ra.GetData<Color32>().ToArray(), rb.hasError ? null : rb.GetData<Color32>().ToArray());
                cache[t.Slice] = c;
                return c;
            }
            float Diff((Color32[] a, Color32[] b) x, int i, (Color32[] a, Color32[] b) y, int j)
            {
                float d = 0;
                d += math.abs(x.a[i].r - y.a[j].r) + math.abs(x.a[i].g - y.a[j].g) + math.abs(x.a[i].b - y.a[j].b) + math.abs(x.a[i].a - y.a[j].a);
                d += math.abs(x.b[i].r - y.b[j].r) + math.abs(x.b[i].g - y.b[j].g) + math.abs(x.b[i].b - y.b[j].b) + math.abs(x.b[i].a - y.b[j].a);
                return d / 255f;
            }
            var edge = new Stat(); var inner = new Stat();
            foreach (var a in world.Tiles.Values)
            {
                if (a.Key.Kind != TileKind.Coarse || !a.HasHeights || !(a.UserData != null)) continue;
                for (int dir = 0; dir < 2; dir++)
                {
                    var nk = new TileKey(TileKind.Coarse, a.Key.I + (dir == 0 ? 1 : 0), a.Key.J + (dir == 1 ? 1 : 0));
                    if (!world.Tiles.TryGetValue(nk, out var b) || !b.HasHeights) continue;
                    var sa = Read(a); var sbb = Read(b);
                    if (sa.Item1 == null || sbb.Item1 == null) continue;
                    for (int k = 0; k < res; k++)
                    {
                        int last = dir == 0 ? k * res + res - 1 : (res - 1) * res + k, prev = dir == 0 ? k * res + res - 2 : (res - 2) * res + k;
                        int first = dir == 0 ? k * res : k;
                        edge.Add(Diff(sa, last, sbb, first));
                        inner.Add(Diff(sa, prev, sa, last));
                    }
                }
            }
            sb.Append($"splat colour step at coarse borders: {edge.Line("(sum of 8 weights)", 1, 0.1f, 0.3f)}\n");
            sb.Append($"splat colour step one texel inside: {inner.Line("(sum of 8 weights)", 1, 0.1f, 0.3f)}\n");
        }

        /// <summary>Two shots per place (seam_spots.txt lines: kind step E N alongX alongZ): across the border from 25 m, and low from 8 m.</summary>
        static void SeamShots(string text)
        {
            int i = 0;
            var seen = new HashSet<string>();
            foreach (var line in text.Split('\n'))
            {
                var f = line.Trim().Split(' ');
                if (f.Length < 6 || !seen.Add(f[0])) continue;
                var inv = CultureInfo.InvariantCulture;
                var at = FloatingOrigin.ToWorldXZ(new Utm33(double.Parse(f[2], inv), double.Parse(f[3], inv)));
                var along = new float2(float.Parse(f[4], inv), float.Parse(f[5], inv));
                var across = new float2(along.y, -along.x);
                int k = i++;
                string name = $"18_seam{k}_{f[0]}";
                shots.Enqueue(($"{name}_wide", () => Look(at - across * 25 + along * 12, 7f, at, 0f)));
                shots.Enqueue(($"{name}_low", () => Look(at - across * 8 + along * 4, 1.8f, at, 0f)));
                if (i >= 8) break;
            }
        }
    }
}
