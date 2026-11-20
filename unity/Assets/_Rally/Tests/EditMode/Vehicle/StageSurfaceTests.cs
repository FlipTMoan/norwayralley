using System;
using NUnit.Framework;
using Rally.Core;
using Rally.Track;
using Rally.Vehicle;
using Unity.Mathematics;

namespace Rally.Tests.Edit.Vehicle
{
    /// <summary>
    /// "The HUD surface tag reads GRAVEL inside Nestunnelen, which is asphalt" (2026-11-20). A stage line knows only the stage's
    /// default surface (gravel); the drawn road under the car knows what it is. And a car waiting on the start line shows it too.
    /// </summary>
    public class StageSurfaceTests
    {
        /// <summary>The level test road, its line gravel, the road drawn under it asphalt (what TileWorld.SurfaceAt answers).</summary>
        sealed class AsphaltUnderAGravelLine : IGround
        {
            public RoadGround Road;
            public float HeightAt(float2 xz) => Road.HeightAt(xz);
            public Surface SurfaceAt(float2 xz) => Road.SurfaceAt(xz) == Surface.Offroad ? Surface.Offroad : Surface.Asphalt;
            public WaterSample WaterAt(float2 xz) => WaterSample.Dry;
            public bool IsLoaded(float2 xz) => Road.IsLoaded(xz);
        }

        [Test]
        public void OnAStageTheDrawnRoadSaysAsphalt()
        {
            var road = Worlds.Road(_ => 100f, 12000f, new Utm33(0, -5900), new Utm33(0, 5900), 3.4f, Surface.Gravel);
            var ground = new AsphaltUnderAGravelLine { Road = road };
            var spec = CarSpec.For(CarKind.Porsche);
            var s = CarState.Create(spec, 42);
            CarSim.Reset(ref s, spec, ground, new float2(0f, -5800f), 0f);
            // waiting for the start (frozen): already the surface it stands on
            CarSim.Step(ref s, spec, new CarInput { Frozen = true }, ground, road.Route, ReadOnlySpan<WallBox>.Empty, 1f / 60f);
            Assert.AreEqual(Surface.Asphalt, s.SurfaceKind, "on the start line");
            float top = 0f;
            for (int i = 0; i < 60 * 60 && s.Pos.z < 5700f; i++)
            {
                CarSim.Step(ref s, spec, TestCar.Input(1f), ground, road.Route, ReadOnlySpan<WallBox>.Empty, 1f / 60f);
                top = math.max(top, s.SpeedKmh);
            }
            Assert.AreEqual(Surface.Asphalt, s.SurfaceKind);
            Assert.Greater(top, CarSim.GravelMaxSpeed * 3.6f + 20f, $"not held to the gravel limit on asphalt: {top:F0} km/h");
        }
    }
}
