using UnityEngine;

namespace Rally.World
{
    /// <summary>
    /// The tree prototypes the scatter draws, one per species, assigned in the editor (fields only).
    /// Index order is fixed because the scatter writes it into every instance:
    ///   0 spruce, 1 pine, 2 birch, 3 mountain birch (fjellbjørk, near the tree line), 4 shrub (above it).
    /// Each prototype has three LOD meshes and a billboard impostor for LOD 3 (Editor/TreeBuilder generates all of
    /// them, with their own LOD distances); the materials use Rally/Tree (wind, per-instance tint and snow) — see
    /// unity/README-world.md.
    /// </summary>
    [CreateAssetMenu(menuName = "Rally/Vegetation Set", fileName = "VegetationSet")]
    public sealed class VegetationSetSO : ScriptableObject
    {
        [System.Serializable]
        public sealed class Prototype
        {
            public string Name = "spruce";
            [Tooltip("LOD 0 (near), 1, 2 meshes")] public Mesh[] Lods = new Mesh[3];
            public Material Material;
            [Tooltip("Camera-facing quad for the far LOD")] public Mesh Billboard;
            public Material BillboardMaterial;
            [Tooltip("Trunk collision radius in metres at scale 1")] public float TrunkRadius = 0.25f;
            [Tooltip("Height in metres at scale 1")] public float Height = 14f;
            [Tooltip("Random scale range (stream.js treeGeometries scale)")] public Vector2 ScaleRange = new Vector2(0.8f, 1.3f);
            [Tooltip("Per-species LOD switches (x LOD0→1, y 1→2, z 2→impostor) and draw distance (w), metres; 0 = the set's LodDistances / the renderer's draw distance. A 1.4 m shrub needs neither the near detail nor the far range of a 22 m spruce")]
            public Vector4 LodDistances;
        }

        public const int SpeciesCount = 5;
        public const int Spruce = 0, Pine = 1, Birch = 2, MountainBirch = 3, Shrub = 4;
        public const int Lods = 4;   // 3 meshes + billboard

        public Prototype[] Prototypes = new Prototype[SpeciesCount];
        [Tooltip("LOD switch distances in metres: LOD0 below x, LOD1 below y, LOD2 below z, billboard beyond up to the draw distance")]
        public Vector3 LodDistances = new Vector3(60, 180, 450);
        [Tooltip("Shadows only from LOD 0 and 1 (near trees)")] public bool FarShadows = false;

        /// <summary>LOD switches (xyz) and draw distance (w) of a prototype, falling back to the set and <paramref name="drawDistance"/>.</summary>
        public Vector4 LodFor(int prototype, float drawDistance)
        {
            var p = Prototypes != null && prototype < Prototypes.Length ? Prototypes[prototype] : null;
            var d = p != null ? p.LodDistances : Vector4.zero;
            return new Vector4(d.x > 0 ? d.x : LodDistances.x, d.y > 0 ? d.y : LodDistances.y, d.z > 0 ? d.z : LodDistances.z,
                               d.w > 0 ? Mathf.Min(d.w, drawDistance) : drawDistance);
        }
    }
}
