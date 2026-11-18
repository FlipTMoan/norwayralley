using NUnit.Framework;
using Rally.Core;

namespace Rally.Tests.Edit.Core
{
    public class RallyLogTests
    {
        [Test]
        public void KeepsTheNewestLinesWithinTheCapacityAndBumpsTheVersion()
        {
            int v = RallyLog.Version;
            for (int i = 0; i < RallyLog.Capacity + 500; i++) RallyLog.Info($"tile: test line {i}");
            Assert.LessOrEqual(RallyLog.Count, RallyLog.Capacity);
            Assert.Greater(RallyLog.Version, v);
            Assert.That(RallyLog.Line(RallyLog.Count - 1), Does.EndWith($"tile: test line {RallyLog.Capacity + 499}"), "the newest line is last");
        }

        [Test]
        public void LinesCarryTimeLevelAndCategoryInTheFormatTheWindowReads()
        {
            RallyLog.Info("overlay: probe");
            var line = RallyLog.Line(RallyLog.Count - 1);
            Assert.AreEqual(' ', line[12]);
            Assert.AreEqual("INFO", line.Substring(13, 4));
            Assert.AreEqual("overlay: probe", line.Substring(18), "the message starts at column 18 (LogWindow.LevelEnd)");
        }
    }
}
