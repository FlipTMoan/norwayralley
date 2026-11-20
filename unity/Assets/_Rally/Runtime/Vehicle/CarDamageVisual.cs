using Rally.Core;
using Unity.Mathematics;
using UnityEngine;

namespace Rally.Vehicle
{
    /// <summary>
    /// Shows <see cref="CarDamage"/> on the model:
    ///  (a) dents through the Rally/CarBody shader — a StructuredBuffer of up to 16 impact points in object
    ///      space {pos, radius, depth}; the vertex shader pushes vertices in along their normal, no CPU mesh
    ///      rewrite (WebGPU); (b) on WebGL 2 (no compute buffers) the same dents are written into a copy of the
    ///      mesh with Mesh.SetVertices; (c) a cracked-windscreen decal faded in by Windscreen; (d) headlights
    ///      off per side; (e) smoke / steam from the bonnet by Engine and Radiator, sparks on scrapes;
    ///  (f) bumper and bonnet wobble above Body 0.6 and fall off as rigidbody props above 0.9; (g) paint
    ///      scratches stamped into a damage mask render texture at the impact, which the body shader samples
    ///      by planar object-space xz (so no UV lookup is needed).
    /// Prefab slots: Body renderer (material Rally/CarBody), WindscreenCrack quad renderer, HeadlightL/R,
    /// Smoke / Sparks particle systems, Bumper / Bonnet transforms, optional Crumple SkinnedMeshRenderer
    /// with a blend shape named "crumple".
    /// </summary>
    public sealed class CarDamageVisual : MonoBehaviour
    {
        public Renderer Body;
        public Renderer WindscreenCrack;
        public Light HeadlightL, HeadlightR;
        public ParticleSystem Smoke, Sparks;
        public Transform Bumper, Bonnet;
        public SkinnedMeshRenderer Crumple;
        [Tooltip("Rally/DamageStamp; found by name when empty.")]
        public Shader StampShader;
        public int MaskSize = 512;

        const int MaxImpacts = 16;
        struct Impact { public float3 Pos; public float Radius; public float Depth; public float3 Pad; } // 32 bytes, matches the shader

        static readonly int ImpactsId = Shader.PropertyToID("_Impacts");
        static readonly int ImpactCountId = Shader.PropertyToID("_ImpactCount");
        static readonly int MaskId = Shader.PropertyToID("_DamageMask");
        static readonly int BodySizeId = Shader.PropertyToID("_BodySize");
        static readonly int BaseColorId = Shader.PropertyToID("_BaseColor");
        static readonly int StampId = Shader.PropertyToID("_Stamp");

        readonly Impact[] impacts = new Impact[MaxImpacts];
        int impactCount, impactNext;
        ComputeBuffer impactBuffer;
        bool gpuDents;
        Mesh deformed;
        Vector3[] baseVerts, baseNormals, verts;
        RenderTexture mask;
        Material stamp, body;
        float3 bodySize = new float3(1.8f, 1.3f, 4.3f);
        bool bumperOff, bonnetOff;
        int crumpleIndex = -1;
        float wobble;

        void Awake()
        {
            if (Body != null)
            {
                body = Body.material; // instance: the dents and the mask are this car's
                gpuDents = GpuCaps.Compute && body.HasProperty(ImpactCountId);
                if (gpuDents)
                {
                    impactBuffer = new ComputeBuffer(MaxImpacts, 32);
                    impactBuffer.SetData(impacts);
                    body.SetBuffer(ImpactsId, impactBuffer);
                    body.SetInt(ImpactCountId, 0);
                }
                else if (Body is MeshRenderer && Body.TryGetComponent<MeshFilter>(out var filter) && filter.sharedMesh != null)
                {
                    deformed = Instantiate(filter.sharedMesh);
                    deformed.MarkDynamic();
                    filter.mesh = deformed;
                    baseVerts = deformed.vertices;
                    baseNormals = deformed.normals;
                    verts = (Vector3[])baseVerts.Clone();
                }
                mask = new RenderTexture(MaskSize, MaskSize, 0, RenderTextureFormat.R8, RenderTextureReadWrite.Linear) { name = "car damage mask" }; // linear: a mask, not a colour (R8 sRGB is unsupported on some GPUs)
                mask.Create();
                var active = RenderTexture.active;
                RenderTexture.active = mask;
                GL.Clear(false, true, Color.black);
                RenderTexture.active = active;
                body.SetTexture(MaskId, mask);
                var shader = StampShader != null ? StampShader : Shader.Find("Rally/DamageStamp");
                if (shader != null) stamp = new Material(shader);
            }
            if (Crumple != null && Crumple.sharedMesh != null) crumpleIndex = Crumple.sharedMesh.GetBlendShapeIndex("crumple");
        }

        void OnDestroy()
        {
            impactBuffer?.Release();
            if (mask != null) mask.Release();
        }

        /// <summary>The body box, from the controller's spec, so impact points land on the skin.</summary>
        public void SetBodySize(float3 size)
        {
            bodySize = size;
            if (body != null) body.SetVector(BodySizeId, new Vector4(size.x, size.y, size.z, 0f));
        }

        /// <summary>A hit from CarController: dent the panel the normal points out of, scratch the paint there, spark on a scrape.</summary>
        public void OnImpact(CollisionEvent ev, in CarSpec spec)
        {
            if (ev.TreeSnapped) return;
            SetBodySize(spec.BodySize);
            var n = ev.NormalLocal;
            // The contact point: where the car's box meets the obstacle, i.e. the face opposite the push-out normal.
            var point = new float3(-n.x * bodySize.x * 0.5f, 0.55f, spec.BodyZ - n.z * bodySize.z * 0.5f);
            float depth = math.clamp(ev.SpeedInto / 15f, 0f, 1f) * 0.14f;
            if (depth > 0.01f) AddImpact(point, 0.45f + depth * 3f, depth);
            if (Sparks != null && ev.SpeedInto < 3f) Sparks.Emit(12);
            Stamp(point, 0.08f + depth * 0.4f);
        }

        void AddImpact(float3 pos, float radius, float depth)
        {
            impacts[impactNext] = new Impact { Pos = pos, Radius = radius, Depth = depth };
            impactNext = (impactNext + 1) % MaxImpacts;
            impactCount = math.min(MaxImpacts, impactCount + 1);
            if (gpuDents)
            {
                impactBuffer.SetData(impacts);
                body.SetInt(ImpactCountId, impactCount);
            }
            else if (deformed != null)
            {
                for (int v = 0; v < baseVerts.Length; v++)
                {
                    float dent = 0f;
                    for (int i = 0; i < impactCount; i++)
                    {
                        float d = math.distance((float3)baseVerts[v], impacts[i].Pos);
                        float w = 1f - math.smoothstep(0f, impacts[i].Radius, d);
                        dent += impacts[i].Depth * w * w;
                    }
                    verts[v] = baseVerts[v] - baseNormals[v] * dent;
                }
                deformed.SetVertices(verts);
                deformed.RecalculateNormals();
                deformed.RecalculateBounds();
            }
        }

        /// <summary>Paint a scratch into the mask at the planar (x, z) of an object-space point; additive, accumulates.</summary>
        void Stamp(float3 objectPoint, float size)
        {
            if (mask == null || stamp == null) return;
            var uv = new Vector2(objectPoint.x / bodySize.x + 0.5f, objectPoint.z / bodySize.z + 0.5f);
            stamp.SetVector(StampId, new Vector4(uv.x, uv.y, size, 1f));
            var active = RenderTexture.active;
            Graphics.SetRenderTarget(mask);
            GL.PushMatrix();
            GL.LoadOrtho();
            stamp.SetPass(0);
            GL.Begin(GL.QUADS);
            GL.TexCoord2(0f, 0f); GL.Vertex3(uv.x - size, uv.y - size, 0f);
            GL.TexCoord2(1f, 0f); GL.Vertex3(uv.x + size, uv.y - size, 0f);
            GL.TexCoord2(1f, 1f); GL.Vertex3(uv.x + size, uv.y + size, 0f);
            GL.TexCoord2(0f, 1f); GL.Vertex3(uv.x - size, uv.y + size, 0f);
            GL.End();
            GL.PopMatrix();
            RenderTexture.active = active;
        }

        /// <summary>Per-frame state → glass, lights, smoke, loose parts.</summary>
        public void Apply(in CarDamage d)
        {
            if (WindscreenCrack != null)
            {
                WindscreenCrack.enabled = d.Windscreen > 0.05f;
                if (WindscreenCrack.enabled)
                {
                    var m = WindscreenCrack.material;
                    var c = m.HasProperty(BaseColorId) ? m.GetColor(BaseColorId) : m.color;
                    c.a = math.clamp(d.Windscreen, 0f, 1f);
                    if (m.HasProperty(BaseColorId)) m.SetColor(BaseColorId, c); else m.color = c;
                }
            }
            if (HeadlightL != null && d.LightsL >= 0.6f) HeadlightL.enabled = false;
            if (HeadlightR != null && d.LightsR >= 0.6f) HeadlightR.enabled = false;
            if (Smoke != null)
            {
                var em = Smoke.emission;
                em.rateOverTime = 40f * d.Engine + 25f * d.Radiator;
                var main = Smoke.main;
                main.startColor = Color.Lerp(new Color(0.2f, 0.2f, 0.2f, 0.6f), new Color(0.9f, 0.9f, 0.9f, 0.5f), d.Radiator / math.max(0.01f, d.Engine + d.Radiator));
            }
            if (d.Body > 0.6f)
            {
                wobble += Time.deltaTime * 14f;
                float jitter = (d.Body - 0.6f) * 6f * math.sin(wobble);
                if (Bumper != null && !bumperOff) Bumper.localRotation = Quaternion.Euler(jitter, 0f, jitter * 0.5f);
                if (Bonnet != null && !bonnetOff) Bonnet.localRotation = Quaternion.Euler(-math.abs(jitter) * 2f, 0f, 0f);
            }
            if (d.Body > 0.9f)
            {
                if (Bumper != null && !bumperOff) { Detach(Bumper); bumperOff = true; }
                if (Bonnet != null && !bonnetOff) { Detach(Bonnet); bonnetOff = true; }
            }
            if (d.Engine <= 0f && d.Body <= 0f && (bumperOff || bonnetOff)) { bumperOff = false; bonnetOff = false; } // repaired: slots re-assigned by the prefab reset
            SetCrumple(d.Total);
        }

        static void Detach(Transform part)
        {
            part.SetParent(null, true);
            if (!part.TryGetComponent<Collider>(out _)) part.gameObject.AddComponent<BoxCollider>();
            var rb = part.gameObject.AddComponent<Rigidbody>();
            rb.mass = 12f;
            rb.AddForce(Vector3.up * 2f + part.forward * 3f, ForceMode.VelocityChange);
        }

        /// <summary>Crumple blend shape weight (0..100) when the model has one; otherwise nothing.</summary>
        public void SetCrumple(float damage)
        {
            if (Crumple == null || crumpleIndex < 0) return;
            Crumple.SetBlendShapeWeight(crumpleIndex, math.clamp(damage, 0f, 1f) * 100f);
        }
    }
}
