using NUnit.Framework;
using Rally.Core;

namespace Rally.Tests.Edit.Core
{
    public class FrameStatsTests
    {
        [Test]
        public void AverageAndPercentileOfTheWindow()
        {
            var f = new FrameStats();
            for (int i = 1; i <= 100; i++) f.Record(i / 1000f);   // 1 … 100 ms
            Assert.AreEqual(50.5f, f.AvgMs, 1e-3f);
            Assert.AreEqual(95f, f.PercentileMs(0.95f), 1e-3f);
            Assert.AreEqual(100f, f.PercentileMs(1f), 1e-3f);
        }

        [Test]
        public void OldFramesLeaveTheWindow()
        {
            var f = new FrameStats();
            for (int i = 0; i < FrameStats.Window; i++) f.Record(0.1f);
            for (int i = 0; i < FrameStats.Window; i++) f.Record(0.010f);
            Assert.AreEqual(FrameStats.Window, f.Count);
            Assert.AreEqual(10f, f.AvgMs, 1e-2f);
            Assert.AreEqual(10f, f.PercentileMs(0.95f), 1e-3f);
        }
    }
}
