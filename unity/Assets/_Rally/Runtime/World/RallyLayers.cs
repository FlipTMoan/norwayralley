using UnityEngine;

namespace Rally.World
{
    /// <summary>
    /// Physics layer conventions (names, resolved once). The terrain has NO collider: ground height
    /// comes from the HeightGrid through IGround, which is cheaper and exact. Everything else the car
    /// can hit is a collider on one of these layers:
    ///   Buildings  static MeshCollider on each tile's combined footprint mesh
    ///   Trees      pooled CapsuleColliders re-targeted to the trees within 40 m of the car (TreeColliderPool)
    ///   Props      signs, posts, poles, fences: pooled Capsule/BoxColliders (PropColliderPool)
    ///   Water      triggers: lake meshes (convex), the sea slab, river box chains — entry events only,
    ///              depth still comes from IGround.WaterAt
    ///   Actors     other cars and the player
    /// The layers must exist in Project Settings → Tags and Layers (see unity/README-world.md).
    /// </summary>
    public static class RallyLayers
    {
        public const string BuildingsName = "Buildings", TreesName = "Trees", PropsName = "Props", WaterName = "Water", ActorsName = "Actors";
        public static readonly int Buildings = Resolve(BuildingsName), Trees = Resolve(TreesName), Props = Resolve(PropsName), Water = Resolve(WaterName), Actors = Resolve(ActorsName);
        /// <summary>Everything solid the car collides with (not Water, not Actors).</summary>
        public static int SolidMask => (1 << Buildings) | (1 << Trees) | (1 << Props);

        static int Resolve(string name)
        {
            int l = LayerMask.NameToLayer(name);
            if (l < 0) { Rally.Core.RallyLog.Warn($"Layer '{name}' is not defined; using Default"); return 0; }
            return l;
        }
    }
}
