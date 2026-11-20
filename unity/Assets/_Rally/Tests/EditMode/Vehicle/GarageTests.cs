using System.Linq;
using NUnit.Framework;
using Rally.Core;
using Rally.Vehicle;
using Unity.Mathematics;
using UnityEditor;
using UnityEngine;

namespace Rally.Tests.Edit.Vehicle
{
    /// <summary>
    /// The car chooser's garage: every CarSpec is a plausible car, every car drives and takes damage in the pure sim, the
    /// turbo cars spool, the wire ids round-trip, and every built prefab has its wheels where the spec puts them, a body box
    /// of the spec's size, a readable car-space body for the dents, an exhaust at the back and mud on the driven wheels.
    /// </summary>
    public class GarageTests
    {
        static readonly CarKind[] Kinds = Garage.Choosable;

        [Test]
        public void EverySpecIsAPlausibleCar()
        {
            foreach (var k in Kinds)
            {
                var s = CarSpec.For(k);
                string n = k.ToString();
                Assert.AreEqual(k, s.Key, n);
                Assert.That(s.Mass, Is.InRange(700f, 2600f), n);
                Assert.That(s.WheelRadius, Is.InRange(0.24f, 0.55f), n);
                Assert.That(s.GearCount - 1, Is.InRange(4, 6), n + " forward gears");
                Assert.Less(s.Gears[0], 0f, n + " reverse");
                for (int g = 2; g < s.GearCount; g++) Assert.Less(s.Gears[g], s.Gears[g - 1], $"{n} gear {g}");
                Assert.IsTrue(s.Idle < s.Downshift && s.Downshift < s.Upshift && s.Upshift < s.Redline, n + " rpm points");
                Assert.Greater(s.Power, 50000f, n);
                Assert.That(s.FrontAxle / s.Wheelbase, Is.InRange(0.4f, 0.6f), n + " origin near mid-wheelbase");
                Assert.Greater(s.Body.z, s.Wheelbase + 0.8f, n + " body longer than the wheelbase");
                Assert.Greater(s.Body.x, s.Track, n + " body wider than the track");
                Assert.Less(math.abs(s.BodyZ), s.Body.z * 0.1f, n + " body box about the car");
                if (s.Drive == DriveType.All) Assert.AreEqual(1f, s.DriveLoad, n + " 4WD puts all the weight on driven wheels");
                Assert.IsNotEmpty(Garage.Info(k).Credit, n + " credit line");
                StringAssert.Contains("hp", Garage.Stats(s));
            }
        }

        [Test]
        public void TheOriginal911KeepsItsNumbers()
        {
            var s = CarSpec.Porsche;
            Assert.AreEqual(1180f, s.Mass); Assert.AreEqual(224000f, s.Power); Assert.AreEqual(2.45f, s.Wheelbase);
            Assert.AreEqual(0f, s.TurboLag);
            Assert.AreEqual(new float3(1.82f, 1.3f, 4.05f), s.BodySize, "the old box: track + 0.2, 1.3, wheelbase + 1.6");
            Assert.AreEqual(s.FrontAxle - s.Wheelbase * 0.5f, s.BodyZ, 1e-5f, "about mid-wheelbase as before");
        }

        [Test]
        public void WireIdsRoundTripAndUnknownIdsAreThe911()
        {
            Assert.AreEqual(Garage.All.Length, Garage.All.Select(c => c.Id).Distinct().Count());
            foreach (var c in Garage.All) Assert.AreEqual(c.Kind, Garage.Parse(c.Id));
            Assert.AreEqual(CarKind.Porsche, Garage.Parse(null));
            Assert.AreEqual(CarKind.Porsche, Garage.Parse("delorean"));
            Assert.AreEqual("porsche", Garage.Info(CarKind.Porsche).Id, "the JS game's id");
            Assert.AreEqual("buggy", Garage.Info(CarKind.Buggy).Id, "the JS game's id");
        }

        [Test]
        public void EveryCarDrives100mAndADamagedEngineIsWeaker()
        {
            foreach (var k in Kinds)
            {
                var car = new TestCar(Worlds.FlatRoad(), k);
                float z0 = car.S.Pos.z;
                var drive = TestCar.Input(1f);
                float t = 0f;
                while (car.S.Pos.z - z0 < 100f && t < 20f) { car.Update(1f / 60f, drive); t += 1f / 60f; }
                Assert.Less(t, 12f, $"{k} took {t:F1} s for 100 m on gravel");
                Assert.IsFalse(car.S.Damage.Wrecked, k.ToString());

                var hurt = new TestCar(Worlds.FlatRoad(), k);
                hurt.S.Damage.Apply(new float3(0f, 0f, -1f), 25f, hurt.Spec.Mass);   // a 90 km/h head-on
                Assert.Greater(hurt.S.Damage.Total, 0.1f, $"{k} damage from a head-on");
                var healthy = new TestCar(Worlds.FlatRoad(), k);
                for (int i = 0; i < 60 * 10; i++) { hurt.Update(1f / 60f, drive); healthy.Update(1f / 60f, drive); }   // past the traction-limited start
                if (hurt.S.Damage.Engine > 0f) Assert.Less(hurt.S.Speed, healthy.S.Speed, $"{k}: a hurt engine pulls less");
            }
        }

        [Test]
        public void TheTurboBuildsBoostUnderThrottleAndLosesItOffThrottle()
        {
            var car = new TestCar(Worlds.FlatRoad(Surface.Asphalt), CarKind.Turbo930);
            Assert.AreEqual(0f, car.S.Boost);
            for (int i = 0; i < 60 * 3; i++) car.Update(1f / 60f, TestCar.Input(1f));
            Assert.Greater(car.S.Boost, 0.8f, "boost after 3 s flat out");
            for (int i = 0; i < 30; i++) car.Update(1f / 60f, TestCar.Input(0f));
            Assert.Less(car.S.Boost, 0.2f, "half a second off the throttle");
            // The same spec without a turbo pulls harder in the first moments of a full-throttle burst at speed: that is the lag.
            var lag = new TestCar(Worlds.FlatRoad(Surface.Asphalt), CarKind.Turbo930);
            var none = new TestCar(Worlds.FlatRoad(Surface.Asphalt), CarKind.Turbo930);
            none.Spec.TurboLag = 0f;
            lag.S.Vel = none.S.Vel = CarSim.Forward(lag.S.Yaw) * 33f; lag.S.VF = none.S.VF = 33f; lag.S.Gear = none.S.Gear = 2;   // 120 km/h in 2nd: power, not traction, caps the pull
            for (int i = 0; i < 30; i++) { lag.Update(1f / 60f, TestCar.Input(1f)); none.Update(1f / 60f, TestCar.Input(1f)); }
            Assert.Less(lag.S.Speed, none.S.Speed, "turbo lag");
            var porsche = new TestCar(Worlds.FlatRoad(), CarKind.Porsche);
            for (int i = 0; i < 60; i++) porsche.Update(1f / 60f, TestCar.Input(1f));
            Assert.AreEqual(0f, porsche.S.Boost, "no turbo on the original 911");
        }

        [Test]
        public void TheOffroadersOutclimbTheRoadCars()
        {
            float Climb(CarKind k)
            {
                var ground = Worlds.Road(Worlds.Sloped(1200f, math.tan(math.radians(38f))), 1200f, new Utm33(0, -500), new Utm33(0, 500), 3.4f, Surface.Gravel);
                var car = new TestCar(ground, k);
                float z0 = car.S.Pos.z;
                for (int i = 0; i < 60 * 8; i++) car.Update(1f / 60f, TestCar.Input(1f));
                return car.S.Pos.z - z0;
            }
            Assert.Greater(Climb(CarKind.Ranger), 15f, "the Ranger climbs 38°");
            Assert.Less(Climb(CarKind.Volvo240), 3f, "the Volvo does not");
        }

        // ---- prefabs ----

        static GameObject Instantiate(CarKind k, out CarController ctl)
        {
            string path = k == CarKind.Porsche ? "Assets/_Rally/Prefabs/Car_Porsche911.prefab" : $"Assets/_Rally/Prefabs/Car_{k}.prefab";
            var prefab = AssetDatabase.LoadAssetAtPath<GameObject>(path);
            ctl = null;
            if (prefab == null) return null;
            var go = (GameObject)PrefabUtility.InstantiatePrefab(prefab);
            ctl = go.GetComponent<CarController>();
            return go;
        }

        [Test]
        public void EveryBuiltCarHasItsWheelsBodyBoxDentsAndExhaust()
        {
            int built = 0;
            foreach (var k in Kinds)
            {
                var go = Instantiate(k, out var ctl);
                Assert.IsNotNull(go, $"no prefab for {k}: run Rally.Editor.CarGarageBuilder.Build");
                try
                {
                    built++;
                    string n = k.ToString();
                    var spec = CarSpec.For(k);
                    Assert.IsNotNull(ctl, n); Assert.AreEqual(k, ctl.Kind, n);
                    var box = go.GetComponent<BoxCollider>();
                    Assert.AreEqual((Vector3)spec.BodySize, box.size, n + " body box");
                    Assert.AreEqual(spec.BodyZ, box.center.z, 1e-4f, n);
                    for (int i = 0; i < 4; i++)
                    {
                        var w = CarSim.WheelOffset(spec, i);
                        var pivot = ctl.WheelPivots[i];
                        Assert.IsNotNull(pivot, $"{n} wheel {i}");
                        Assert.Less(Vector3.Distance(pivot.localPosition, new Vector3(w.x, spec.WheelRadius, w.y)), 0.01f, $"{n} pivot {i}");
                        var tyre = ctl.WheelSpins[i].GetComponentsInChildren<Renderer>().OrderByDescending(r => r.bounds.size.y).First();
                        Assert.Less(Vector3.Distance(tyre.bounds.center, pivot.position), 0.04f, $"{n} wheel {i} mesh centred on its pivot");
                        Assert.AreEqual(spec.WheelRadius * 2f, tyre.bounds.size.y, spec.WheelRadius * 0.15f, $"{n} wheel {i} diameter");
                    }
                    var all = go.GetComponentsInChildren<Renderer>().Where(r => r.GetComponent<ParticleSystem>() == null).ToArray();
                    var b = all[0].bounds; foreach (var r in all) b.Encapsulate(r.bounds);
                    if (k != CarKind.Porsche) Assert.AreEqual(spec.Body.z, b.size.z, spec.Body.z * 0.05f, n + " model length = body box length");   // the 911 keeps its old wheelbase + 1.6 box
                    Assert.AreEqual(0f, b.min.y, 0.06f, n + " tyres on the ground");
                    var dmg = go.GetComponent<CarDamageVisual>();
                    Assert.IsNotNull(dmg.Body, n + " body renderer for the dents");
                    var mesh = dmg.Body.GetComponent<MeshFilter>().sharedMesh;
                    Assert.IsTrue(mesh.isReadable, n + " body mesh readable (WebGL 2 CPU dents)");
                    if (k != CarKind.Porsche) Assert.AreEqual(Matrix4x4.identity, go.transform.worldToLocalMatrix * dmg.Body.transform.localToWorldMatrix, n + " body baked in car space");
                    var ex = go.GetComponent<CarExhaust>();
                    Assert.IsNotNull(ex, n + " exhaust"); Assert.IsNotEmpty(ex.Pipes, n);
                    foreach (var p in ex.Pipes)
                    {
                        var lp = p.transform.localPosition;
                        Assert.Less(lp.z, spec.BodyZ - spec.Body.z * 0.35f, n + " tailpipe at the back");
                        Assert.Less(math.abs(lp.x), spec.Body.x * 0.5f, n + " tailpipe inside the width");
                    }
                    var mud = go.GetComponent<CarMud>();
                    Assert.IsNotNull(mud, n + " mud");
                    Assert.AreEqual(spec.Drive == DriveType.All ? 4 : 2, mud.Wheels.Length, n + " one mud system per driven wheel");
                    for (int j = 0; j < mud.Wheels.Length; j++)
                    {
                        var w = CarSim.WheelOffset(spec, mud.WheelIndex[j]);
                        var lp = mud.Wheels[j].transform.localPosition;
                        Assert.Less(math.distance(new float2(lp.x, lp.z), w) , spec.WheelRadius * 1.2f, $"{n} mud {j} at its wheel");
                        Assert.Less(lp.z, w.y, $"{n} mud {j} behind its wheel");
                    }
                    Assert.IsEmpty(go.GetComponentsInChildren<Camera>(true), n + " no cameras from the file");
                }
                finally { Object.DestroyImmediate(go); }
            }
            Assert.AreEqual(Kinds.Length, built);
        }
    }
}
