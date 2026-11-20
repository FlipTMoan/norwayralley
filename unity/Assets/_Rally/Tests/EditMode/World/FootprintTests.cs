using NUnit.Framework;
using Rally.World;
using Unity.Mathematics;

namespace Rally.Tests.World
{
    /// <summary>
    /// The car box against house footprints in plan view (Footprints): inside a house counts, a car half way through a wall
    /// goes out on its own side (the wall mesh's nearest triangle could push it inward), a shallow scrape is left to the wall
    /// mesh, and a car in the notch of an L-shaped house is not inside it.
    /// </summary>
    public class FootprintTests
    {
        const float HL = 2.2f, HW = 0.9f;
        static readonly float2 North = new float2(0, 1), East = new float2(1, 0);
        // 12 × 8 m, centred on the origin, long side along x (east).
        static readonly float2[] Square = { new float2(-6, -4), new float2(6, -4), new float2(6, 4), new float2(-6, 4) };
        // L: the north-east quarter (x > 0, y > 0) is cut out.
        static readonly float2[] L = { new float2(-6, -4), new float2(6, -4), new float2(6, 0), new float2(0, 0), new float2(0, 4), new float2(-6, 4) };

        static float2 Push(float2 car, float2 fwd) => Footprints.PushOut(car, fwd, HL, HW, East, 6f, 4f);

        [Test]
        public void ACarInsideAHouseIsInfinitelyDeepAndThePushTakesItWhollyOut()
        {
            foreach (var car in new[] { new float2(0, 0), new float2(4, 1), new float2(-5, -3) })
                foreach (var fwd in new[] { North, East, math.normalize(new float2(1, 1)) })
                {
                    Assert.IsTrue(float.IsPositiveInfinity(Footprints.Depth(car, fwd, HL, HW, Square)));
                    var after = car + Push(car, fwd);
                    Assert.AreEqual(0f, Footprints.Depth(after, fwd, HL, HW, Square), $"car {car} facing {fwd}: out at {after}");
                    Assert.Less(math.length(Push(car, fwd)), 6f + HL + 0.1f, "the shortest way, not across the house");
                }
        }

        [Test]
        public void HalfWayThroughAWallTheCarGoesOutOnItsOwnSide()
        {
            // Nose 1.6 m into the south wall (y = −4), centre still outside: pushed south.
            var car = new float2(1f, -4f - HL + 1.6f);
            Assert.AreEqual(1.6f, Footprints.Depth(car, North, HL, HW, Square), 1e-3f);
            var p = Push(car, North);
            Assert.Less(p.y, -1.5f); Assert.AreEqual(0f, p.x, 1e-4f);
            // Centre 0.4 m inside, the car's back still out: deep, and still out south, not through the house.
            car = new float2(1f, -3.6f);
            Assert.IsTrue(float.IsPositiveInfinity(Footprints.Depth(car, North, HL, HW, Square)));
            Assert.Less(Push(car, North).y, 0f);
        }

        [Test]
        public void AShallowScrapeIsShallowAndClearIsZero()
        {
            var car = new float2(0f, -4f - HW + 0.08f);   // sideways along the south wall, 8 cm in
            Assert.AreEqual(0.08f, Footprints.Depth(car, East, HL, HW, Square), 1e-3f);
            Assert.AreEqual(0f, Footprints.Depth(new float2(0, -6), East, HL, HW, Square));
        }

        [Test]
        public void TheNotchOfAnLShapedHouseIsNotInside()
        {
            Assert.AreEqual(0f, Footprints.Depth(new float2(3.2f, 2f), North, 1.5f, 0.8f, L));
            Assert.Greater(Footprints.Depth(new float2(-3f, 2f), North, HL, HW, L), 0f);
            // A car reaching across the notch into the house counts too.
            Assert.Greater(Footprints.Depth(new float2(1.5f, 1.5f), North, HL, HW, L), 0.5f);
        }

        [Test]
        public void ASetPushesOnlyHousesDeeperThanTheThreshold()
        {
            var set = new BuildingSet();
            set.Boxes.Add(new FootprintBox { Centre = new double2(1000, 2000), Yaw = math.PI / 2, HalfLength = 6, HalfWidth = 4, Height = 6 });
            set.Rings.Add(Square);
            float2 push = 0f;
            Assert.IsFalse(Footprints.PushOutOfSet(set, new double2(1000, 2000 - 4 - HW + 0.08), East, HL, HW, 0.5f, ref push), "a scrape: the wall mesh's job");
            Assert.IsTrue(Footprints.PushOutOfSet(set, new double2(1000, 2000 - 4 - HW + 0.08), East, HL, HW, 0f, ref push), "placement: any overlap");
            push = 0f;
            Assert.IsTrue(Footprints.PushOutOfSet(set, new double2(1001, 2001), North, HL, HW, 0.5f, ref push));
            Assert.AreEqual(0f, Footprints.Depth(new float2(1, 1) + push, North, HL, HW, Square));
        }
    }
}
