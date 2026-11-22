using System.Collections;
using System.Collections.Generic;
using System.Globalization;
using System.IO;
using System.Reflection;
using System.Text;
using Rally.Core;
using Rally.Gameplay;
using Rally.World;
using Unity.Mathematics;
using UnityEngine;

namespace Rally.Editor
{
    /// <summary>
    /// <c>-previewSigns</c>: the road sign survey. Once the overlay queue is idle, every built sign post of the loaded tiles is
    /// compared with the ground it stands on now (<c>TileWorld.HeightAt</c> at each foot; a foot more than 5 cm off is
    /// <b>floating</b> or <b>sunk</b>), and listed with its plates top to bottom (DIR/sign_posts.tsv, DIR/sign_survey.txt). Shots:
    /// the 10 posts with the most plates from 7 m in front of their busiest face (20_post_*) and the 6 worst floating feet
    /// (21_float_*). The posts are not rebuilt first: the survey sees them as the game drew them.
    /// </summary>
    public static partial class PreviewShots
    {
        static bool signSurvey;

        static void SignReport()
        {
            var inv = CultureInfo.InvariantCulture;
            var layer = (SignLayer)typeof(GameController).GetField("signs", BindingFlags.NonPublic | BindingFlags.Instance).GetValue(game);
            var tiles = (IDictionary)typeof(SignLayer).GetField("tiles", BindingFlags.NonPublic | BindingFlags.Instance).GetValue(layer);
            var tsv = new StringBuilder("tile\tpost\te\tn\tplates\tfaces\tground\tfoot\tdelta\tnvdb_z\tstack\n");
            var posts = new List<(SignPost post, int faces, float topY)>();
            var feet = new List<(float2 xz, float foot, float ground)>();
            int built = 0, floating = 0, sunk = 0, footCount = 0, postsTotal = 0, platesTotal = 0;
            var perPost = new SortedDictionary<int, int>();
            foreach (var t in tiles.Values)
            {
                var key = (TileKey)Field(t, "Key");
                var list = (List<SignPost>)Field(t, "Posts");
                var go = (GameObject)Field(t, "Go");
                var tf = (List<(float3 foot, float height, float radius)>)Field(t, "Feet");
                postsTotal += list.Count;
                foreach (var p in list) { platesTotal += p.Plates.Count; perPost.TryGetValue(p.Plates.Count, out var c); perPost[p.Plates.Count] = c + 1; }
                if (go == null) continue;
                built++;
                var origin = (float3)FloatingOrigin.ToWorld(key.Origin, 0);
                foreach (var (foot, height, _) in tf)
                {
                    var w = origin + foot;
                    float g = world.HeightAt(w.xz);
                    footCount++;
                    if (w.y - g > 0.05f) floating++;
                    else if (w.y - g < -0.05f) sunk++;
                    feet.Add((w.xz, w.y, g));
                }
                foreach (var p in list)
                {
                    var xz = FloatingOrigin.ToWorldXZ(p.Position);
                    float g = world.HeightAt(xz);
                    // the foot the mesh used: the nearest recorded foot
                    float foot = float.NaN, best = 1.5f;
                    foreach (var (f, _, _) in tf) { float d = math.distance((origin + f).xz, xz); if (d < best) { best = d; foot = origin.y + f.y; } }
                    var faces = new List<double2>();
                    var stack = new StringBuilder();
                    double nz = double.NaN;
                    foreach (var pp in p.Plates)
                    {
                        if (!double.IsNaN(pp.Plate.Height)) nz = pp.Plate.Height;
                        int fi = faces.FindIndex(f => math.dot(f, pp.Face) > 0.7);
                        if (fi < 0) { faces.Add(pp.Face); fi = faces.Count - 1; }
                        stack.Append($"{(stack.Length > 0 ? " " : "")}{pp.Plate.Code}[f{fi} o{pp.Plate.Order} {pp.Plate.Side}]");
                    }
                    tsv.Append($"{key}\t{p.Id}\t{p.Position.E.ToString("0.00", inv)}\t{p.Position.N.ToString("0.00", inv)}\t{p.Plates.Count}\t{faces.Count}\t{g.ToString("0.00", inv)}\t{foot.ToString("0.00", inv)}\t{(foot - g).ToString("0.00", inv)}\t{nz.ToString("0.00", inv)}\t{stack}\n");
                    posts.Add((p, faces.Count, foot));
                }
            }
            File.WriteAllText(Path.Combine(outDir, "sign_posts.tsv"), tsv.ToString());
            var sum = new StringBuilder();
            sum.Append($"tiles {tiles.Count}, built {built}; posts {postsTotal}, plates {platesTotal}\n");
            sum.Append("plates per post:"); foreach (var kv in perPost) sum.Append($" {kv.Key}:{kv.Value}"); sum.Append('\n');
            sum.Append($"feet {footCount}: floating (>5 cm over the ground now) {floating}, sunk (>5 cm under) {sunk}\n");
            feet.Sort((a, b) => math.abs(b.foot - b.ground).CompareTo(math.abs(a.foot - a.ground)));
            for (int i = 0; i < math.min(15, feet.Count); i++) sum.Append($"  worst foot {i}: {FloatingOrigin.ToUtm(feet[i].xz)} foot {feet[i].foot:0.00} ground {feet[i].ground:0.00} ({feet[i].foot - feet[i].ground:+0.00;-0.00})\n");
            File.WriteAllText(Path.Combine(outDir, "sign_survey.txt"), sum.ToString());
            Debug.Log("PreviewShots signs:\n" + sum);

            posts.Sort((a, b) => b.post.Plates.Count.CompareTo(a.post.Plates.Count));
            var car = FloatingOrigin.ToUtm(((float3)UnityEngine.Object.FindAnyObjectByType<Rally.Vehicle.CarController>().transform.position).xz);
            for (int i = 0; i < math.min(10, posts.Count); i++)
            {
                var p = posts[i].post;
                // the face direction most plates of the post look along
                double2 face = p.Plates[0].Face; int most = 0;
                foreach (var a in p.Plates) { int n = 0; foreach (var b in p.Plates) if (math.dot(a.Face, b.Face) > 0.7) n++; if (n > most) { most = n; face = a.Face; } }
                float2 at = FloatingOrigin.ToWorldXZ(p.Position), dir = (float2)math.normalizesafe(face);
                int k = i;
                shots.Enqueue(($"20_post_{k}_{p.Plates.Count}plates", () => Look(at + dir * 7f, 1.5f, at, 2.0f)));
                shots.Enqueue(($"20_post_{k}_side", () => Look(at + dir * 4f + new float2(dir.y, -dir.x) * 5f, 1.5f, at, 1.6f)));
            }
            for (int i = 0; i < math.min(6, feet.Count); i++)
            {
                if (math.abs(feet[i].foot - feet[i].ground) < 0.05f) break;
                var at = feet[i].xz; float y = feet[i].foot;
                shots.Enqueue(($"21_float_{i}", () => Look(at + new float2(4f, 3f), 1.2f, at, 0.8f, y)));
            }
        }
    }
}
