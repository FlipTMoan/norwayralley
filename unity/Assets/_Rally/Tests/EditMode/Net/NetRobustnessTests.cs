using System;
using System.Collections.Generic;
using System.Linq;
using NUnit.Framework;
using Rally.Geo;
using Rally.Net;

namespace Rally.Tests.Net
{
    /// <summary>The LAN-robustness layer: seq/ack retransmits over a lossy wire, heartbeat timeouts, rejoin keeping the slot, go-time maths, results.</summary>
    public class NetRobustnessTests
    {
        /// <summary>A wire that can drop ctl packets and report channels closed; delivers what it keeps into per-id logs.</summary>
        sealed class LossyTransport : IPeerTransport
        {
            public readonly Dictionary<string, List<Dictionary<string, object>>> Delivered = new Dictionary<string, List<Dictionary<string, object>>>();
            public Func<string, Dictionary<string, object>, string, bool> Drop = (id, m, label) => false;
            public HashSet<string> ClosedCtl = new HashSet<string>();
            public int Sent;
            public List<Dictionary<string, object>> To(string id) => Delivered.TryGetValue(id, out var l) ? l : (Delivered[id] = new List<Dictionary<string, object>>());
            public bool Send(string id, Dictionary<string, object> msg, string label)
            {
                Sent++;
                if (label == PeerBridge.Ctl && ClosedCtl.Contains(id)) return false;
                if (Drop(id, msg, label)) return true;
                To(id).Add(new Dictionary<string, object>(msg));
                return true;
            }
            public bool IsOpen(string id, string label) => label != PeerBridge.Ctl || !ClosedCtl.Contains(id);
            public void Disconnect(string id) { }
            public void Close() { }
        }

        [Test]
        public void SequencedMessagesAreResentUntilAckedAndDuplicatesAreDroppedOnce()
        {
            double now = 0;
            var wire = new LossyTransport();
            var host = new Session("HOST", "porsche", wire, () => now) { IsHost = true };
            int dropped = 0;
            wire.Drop = (id, m, label) => label == PeerBridge.Ctl && m.Str("t") == "hello" && dropped++ < 2; // the first two sends of hello vanish
            host.OpenCtl("a");
            host.AcceptGuest("a", "A", "porsche", ctl: true);
            Assert.IsFalse(wire.To("a").Any(m => m.Str("t") == "hello"), "lost on the wire");
            host.Tick(500);
            Assert.IsFalse(wire.To("a").Any(m => m.Str("t") == "hello"), "not resent before 1 s");
            host.Tick(1000);  // first resend, dropped
            host.Tick(2000);  // second resend arrives
            var hello = wire.To("a").First(m => m.Str("t") == "hello");
            Assert.AreEqual(1, hello.Num("seq"));

            // The guest side: applies seq 1 once, acks every copy.
            var guest = new Session("A", "porsche", wire, () => now);
            guest.SetHostConnection("nrr-ROOM", ctl: true);
            int slots = 0;
            guest.SlotAssigned += _ => slots++;
            guest.OnGuestData(hello);
            guest.OnGuestData(hello);  // a late duplicate retransmit
            Assert.AreEqual(1, slots, "applied once");
            Assert.AreEqual(2, wire.To("nrr-ROOM").Count(m => m.Str("t") == "ack" && m.Num("seq") == 1), "every copy is acked");

            // The host stops resending once the ack lands.
            now = 4500;
            host.OnHostData("a", new Dictionary<string, object> { { "t", "ack" }, { "seq", 1.0 } });
            int before = wire.To("a").Count;
            host.Tick(5000);
            Assert.AreEqual(before + 1, wire.To("a").Count, "only the heartbeat goes out after the ack");
            Assert.AreEqual("hb", wire.To("a").Last().Str("t"));
        }

        [Test]
        public void MessagesQueuedWhileTheCtlChannelIsClosedAreFlushedOnReopen()
        {
            double now = 0;
            var wire = new LossyTransport();
            var host = new Session("HOST", "porsche", wire, () => now) { IsHost = true };
            wire.ClosedCtl.Add("a");
            host.AcceptGuest("a", "A", "porsche", ctl: true);        // ctl announced but not open yet
            host.SendRoute(new Dictionary<string, object> { { "kind", "osrm" }, { "query", "?route=osrm:1,2;3,4;driving" } });
            Assert.IsFalse(wire.To("a").Any(m => m.Str("t") == "hello" || m.Str("t") == "route"), "nothing sent on a closed channel");
            wire.ClosedCtl.Remove("a");
            host.OpenCtl("a");
            var kinds = wire.To("a").Select(m => m.Str("t")).ToList();
            CollectionAssert.AreEqual(new[] { "hello", "route" }, kinds, "flushed in order");
            CollectionAssert.AreEqual(new[] { 1.0, 2.0 }, wire.To("a").Select(m => m.Num("seq")).ToList());
        }

        [Test]
        public void AJsPeerWithoutCtlGetsPlainRosterMessagesOnTheStateChannel()
        {
            var wire = new LossyTransport();
            var host = new Session("HOST", "porsche", wire, () => 0) { IsHost = true };
            host.AcceptGuest("js", "JS", "porsche");
            var hello = wire.To("js").First(m => m.Str("t") == "hello");
            Assert.IsFalse(hello.ContainsKey("seq"), "the JS client knows no sequence numbers");
            host.Tick(5000);
            Assert.IsFalse(wire.To("js").Any(m => m.Str("t") == "hb"), "and no heartbeats, so it is never timed out");
        }

        [Test]
        public void FiveSecondsOfSilenceDropsAPeerWithReasonTimeoutAndHeartbeatsKeepItAlive()
        {
            double now = 0;
            var wire = new LossyTransport();
            var host = new Session("HOST", "porsche", wire, () => now) { IsHost = true };
            host.OpenCtl("a"); host.AcceptGuest("a", "A", "porsche", ctl: true);
            host.OpenCtl("b"); host.AcceptGuest("b", "B", "porsche", ctl: true);
            var left = new List<(string id, string reason)>();
            host.PeerLeave += (id, reason) => left.Add((id, reason));
            for (now = 1000; now <= 4000; now += 1000) { host.Tick(now); host.OnHostData("a", new Dictionary<string, object> { { "t", "hb" }, { "ts", now } }); }
            Assert.AreEqual(4, wire.To("a").Count(m => m.Str("t") == "hb"), "one heartbeat per second to a");
            Assert.AreEqual(4, wire.To("a").Count(m => m.Str("t") == "hbr"), "each of a's heartbeats answered");
            Assert.IsEmpty(left);
            now = 5001; host.Tick(now);
            CollectionAssert.AreEqual(new[] { ("b", "timeout") }, left, "b said nothing for 5 s; a kept talking");
            Assert.IsFalse(host.Peers.ContainsKey("b"));
            Assert.IsTrue(wire.To("a").Any(m => m.Str("t") == "leave" && m.Str("id") == "b"), "the room is told");
        }

        [Test]
        public void ARejoiningCallsignGetsItsSlotBackWithinTwoMinutes()
        {
            double now = 0;
            var wire = new LossyTransport();
            var host = new Session("HOST", "porsche", wire, () => now) { IsHost = true };
            host.AcceptGuest("a1", "ELG-42", "porsche");
            host.AcceptGuest("b1", "REV-17", "porsche");
            Assert.AreEqual(1, host.Peers["a1"].Slot);
            host.DropPeer("a1", "timeout");
            now = 30000;
            host.AcceptGuest("a2", "ELG-42", "porsche");
            Assert.AreEqual(1, host.Peers["a2"].Slot, "same callsign, same slot");
            Assert.AreEqual(1, wire.To("a2").First(m => m.Str("t") == "hello").Num("slot"));
            host.AcceptGuest("c1", "ULV-33", "porsche");
            Assert.AreEqual(3, host.Peers["c1"].Slot, "a newcomer takes the next free slot");
            host.DropPeer("b1", "left");
            now = 30000 + Session.RememberSlotMs + 1;
            host.AcceptGuest("b2", "REV-17", "porsche");
            Assert.AreEqual(4, host.Peers["b2"].Slot, "after two minutes the slot is forgotten");
        }

        [Test]
        public void GoTimeIsMappedThroughTheMeasuredHostClockOffset()
        {
            var sync = new ClockSync();
            // Guest clock runs 10 s behind the host; 40 ms round trip, symmetric.
            sync.OnReply(sentTs: 1000, hostAt: 11020, now: 1040);
            Assert.AreEqual(40, sync.RttMs, 1e-9);
            Assert.AreEqual(10000, sync.OffsetMs, 1e-9);
            Assert.AreEqual(2000, sync.ToLocal(12000), 1e-9);
            Assert.AreEqual(12000, sync.ToHost(2000), 1e-9);
            // A slow reply (asymmetric delay) is blended in, a faster one replaces the estimate.
            sync.OnReply(2000, 12300, 2400);
            Assert.AreEqual(40, sync.RttMs, 1e-9);
            Assert.Less(Math.Abs(sync.OffsetMs - 10000), 40);
            sync.OnReply(3000, 13010, 3020);
            Assert.AreEqual(20, sync.RttMs, 1e-9);
            Assert.AreEqual(10000, sync.OffsetMs, 1e-9);

            double now = 5000;
            var wire = new LossyTransport();
            var guest = new Session("A", "porsche", wire, () => now);
            guest.SetHostConnection("nrr-ROOM", ctl: true);
            guest.OnGuestData(new Dictionary<string, object> { { "t", "hbr" }, { "ts", 4000.0 }, { "at", 14500.0 } });
            double goAt = double.NaN;
            guest.Go += at => goAt = at;
            guest.OnGuestData(new Dictionary<string, object> { { "t", "go" }, { "atMs", 20000.0 } });
            Assert.AreEqual(10000, goAt, 1e-6, "host 20 s = local 10 s");
        }

        [Test]
        public void ResultsAreCollectedByTheHostSortedAndBroadcastAsABoard()
        {
            var wire = new LossyTransport();
            var host = new Session("HOST", "porsche", wire, () => 0) { IsHost = true };
            host.OpenCtl("a"); host.AcceptGuest("a", "A", "porsche", ctl: true);
            host.OpenCtl("b"); host.AcceptGuest("b", "B", "porsche", ctl: true);
            int changed = 0;
            host.ResultsChanged += () => changed++;
            host.OnHostData("a", new Dictionary<string, object> { { "t", "result" }, { "name", "A" }, { "timeMs", 90000.0 }, { "penaltyMs", 5000.0 }, { "seq", 1.0 } });
            host.SendResult(80000, 0);
            host.OnHostData("b", new Dictionary<string, object> { { "t", "result" }, { "name", "B" }, { "timeMs", 70000.0 }, { "penaltyMs", 30000.0 }, { "seq", 1.0 } });
            CollectionAssert.AreEqual(new[] { "HOST", "A", "B" }, host.Results.Select(r => r.Name).ToList());
            Assert.AreEqual(3, changed);
            var board = wire.To("a").Last(m => m.Str("t") == "board");
            Assert.AreEqual(3, board.Arr("results").Count);
            StringAssert.StartsWith("1. HOST 01:20.000 · 2. A 01:35.000", host.Leaderboard());

            var guest = new Session("B", "porsche", wire, () => 0);
            guest.SetHostConnection("nrr-ROOM", ctl: true);
            guest.OnGuestData(board);
            Assert.AreEqual("HOST", guest.Results[0].Name);
            guest.SendResult(1000, 0);
            Assert.IsTrue(wire.To("nrr-ROOM").Any(m => m.Str("t") == "result" && m.ContainsKey("seq")), "a guest's result is sequenced");
            host.SendRoute(new Dictionary<string, object> { { "kind", "free" }, { "query", "?drive=59,6" } });
            Assert.IsEmpty(host.Results, "a new stage clears the board");
        }

        [Test]
        public void PathEventsLabelTheConnection()
        {
            Assert.AreEqual("LAN direct", Session.PathLabel(PathKind.Lan));
            Assert.AreEqual("via internet", Session.PathLabel(PathKind.Internet));
            Assert.AreEqual("relayed", Session.PathLabel(PathKind.Relay));
            StringAssert.Contains("\"iceServers\"", IceConfig.ToJson());
        }
    }
}
