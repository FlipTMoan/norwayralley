using System.Collections.Generic;
using System.Linq;
using NUnit.Framework;
using Rally.Geo;
using Rally.Net;

namespace Rally.Tests.Net
{
    /// <summary>Port of legacy-js/tests/multiplayer.test.mjs (the car repaint case lives with the Vehicle layer).</summary>
    public class MultiplayerTests
    {
        /// <summary>Records what the session sends to each peer id.</summary>
        sealed class FakeTransport : IPeerTransport
        {
            public readonly Dictionary<string, List<Dictionary<string, object>>> Sent = new Dictionary<string, List<Dictionary<string, object>>>();
            public List<Dictionary<string, object>> To(string id) => Sent.TryGetValue(id, out var l) ? l : (Sent[id] = new List<Dictionary<string, object>>());
            public bool Send(string id, Dictionary<string, object> msg) { To(id).Add(new Dictionary<string, object>(msg)); return true; }
            public void Broadcast(Dictionary<string, object> msg, string exceptId) { }
            public void Disconnect(string id) { }
            public void Close() { }
        }

        [Test]
        public void RoomCodesAvoidAmbiguousCharactersAndNormaliseUserInput()
        {
            for (int i = 0; i < 50; i++)
            {
                var code = RoomCodes.MakeRoomCode();
                Assert.AreEqual(4, code.Length);
                Assert.IsTrue(code.All(c => RoomCodes.CodeChars.IndexOf(c) >= 0), code);
            }
            Assert.AreEqual("ABCO", RoomCodes.NormaliseCode(" ab-c0 "));
            Assert.AreEqual("XIYZ", RoomCodes.NormaliseCode("x1yz"));
            Assert.AreEqual("ABCDEF", RoomCodes.NormaliseCode("abcdefgh"));
            StringAssert.IsMatch(@"^[A-ZØÅ]+-\d\d$", RoomCodes.MakeCallsign());
            Assert.AreEqual("ELG-10", RoomCodes.MakeCallsign(() => 0.0));
        }

        [Test]
        public void StatePacketsAreCompactAndGhostsInterpolateBetweenThem()
        {
            var s = new StatePacket { X = 100.123, Y = 50.5, Z = -20, Yaw = 1.5, Pitch = 0.12, Roll = -0.05, Speed = 22.26, Kind = "buggy", Name = "ELG-42" };
            var json = Json.Stringify(s.Encode());
            Assert.Less(json.Length, 120);
            Assert.AreEqual("{\"t\":\"s\",\"x\":100.12,\"y\":50.5,\"z\":-20,\"h\":1.5,\"p\":0.12,\"r\":-0.05,\"v\":22.3,\"k\":\"buggy\",\"n\":\"ELG-42\"}", json);
            var back = StatePacket.Decode(Json.ParseObject(json));
            Assert.AreEqual(100.12, back.X); Assert.AreEqual("buggy", back.Kind); Assert.AreEqual(22.3, back.Speed);

            var track = new GhostTrack(100);
            track.Push(new StatePacket { X = 0, Yaw = 0, Name = "ELG-42" }, 1000);
            track.Push(new StatePacket { X = 10, Yaw = 0.2 }, 1100);
            track.Push(new StatePacket { X = 20, Yaw = 0.4 }, 1200);
            Assert.IsTrue(track.TrySample(1250, out var mid)); // renders at t = 1150: halfway between the first two
            Assert.AreEqual(15, mid.X, 1e-9); Assert.AreEqual(0.3, mid.Yaw, 1e-9);
            Assert.IsTrue(track.TrySample(1500, out var held));
            Assert.AreEqual(20, held.X, "holds the newest packet");
            Assert.AreEqual("ELG-42", track.Name);
            track.Push(new StatePacket { X = 30, Yaw = 3.1 }, 1300);
            track.Push(new StatePacket { X = 40, Yaw = -3.1 }, 1400);
            track.TrySample(1450, out var wrapped);
            Assert.Greater(System.Math.Abs(wrapped.Yaw), 3.1, "yaw interpolates the short way round");
        }

        [Test]
        public void SessionRelaysGuestStateAndRoutesWithoutANetwork()
        {
            var wire = new FakeTransport();
            var host = new Session("HOST", "porsche", wire, () => 0) { IsHost = true };
            host.AcceptGuest("a", "A", "porsche");
            host.SendRoute(new Dictionary<string, object> { { "kind", "baked" }, { "points", new List<object> { new List<object> { 0.0, 0.0 }, new List<object> { 1.0, 1.0 } } } });
            host.AcceptGuest("b", "B", "porsche");
            Assert.AreEqual(3, host.PlayerCount);
            Assert.IsTrue(wire.To("b").Any(m => m.Str("t") == "route"), "late joiner receives the current stage");
            Assert.IsTrue(wire.To("a").Any(m => m.Str("t") == "join" && m.Str("id") == "b"), "existing guests learn about newcomers");

            var states = new List<(string id, StatePacket s)>();
            host.State += (id, s) => states.Add((id, s));
            host.OnHostData("a", Json.ParseObject("{\"t\":\"s\",\"x\":1,\"y\":2,\"z\":3,\"h\":0,\"p\":0,\"r\":0,\"v\":5,\"k\":\"porsche\",\"n\":\"A\"}"));
            Assert.AreEqual(1, states.Count);
            Assert.IsTrue(wire.To("b").Any(m => m.Str("t") == "s" && m.Str("from") == "a"), "state is fanned out to the other guest");
            Assert.IsFalse(wire.To("a").Any(m => m.Str("t") == "s"), "not echoed back to its sender");

            var routes = new List<(Dictionary<string, object> route, string from)>();
            host.Route += (r, sender) => routes.Add((r, sender));
            var pick = Json.ParseObject("{\"kind\":\"free\",\"center\":{\"lat\":60,\"lon\":7}}");
            host.OnHostData("a", new Dictionary<string, object> { { "t", "route" }, { "route", pick } });
            Assert.AreEqual(1, routes.Count);
            Assert.AreEqual("a", routes[0].from);
            Assert.AreEqual("free", routes[0].route.Str("kind"));
            int beforeA = wire.To("a").Count, beforeB = wire.To("b").Count;
            host.SendRoute(pick, "a");
            Assert.AreEqual(beforeA, wire.To("a").Count, "not echoed to the guest who picked it");
            Assert.IsTrue(wire.To("b").Skip(beforeB).Any(m => m.Str("t") == "route" && m.Obj("route").Str("kind") == "free"), "relayed to the other guest");
            Assert.AreSame(pick, host.RouteMessage.Obj("route"), "kept for late joiners");

            host.DropPeer("b");
            Assert.AreEqual(2, host.PlayerCount);
            Assert.IsTrue(wire.To("a").Any(m => m.Str("t") == "leave" && m.Str("id") == "b"));
        }

        [Test]
        public void AGuestSessionSendsItsStagePickToTheHostAndThrottlesState()
        {
            var wire = new FakeTransport();
            var guest = new Session("G", "porsche", wire, () => 0) { IsHost = false };
            guest.SetHostConnection("host");
            guest.SendRoute(Json.ParseObject("{\"kind\":\"baked\"}"));
            Assert.AreEqual(1, wire.To("host").Count);
            Assert.AreEqual("route", wire.To("host")[0].Str("t"));
            var s = new StatePacket { Kind = "porsche", Name = "G" };
            Assert.IsTrue(guest.SendState(s, 1000));
            Assert.IsFalse(guest.SendState(s, 1050), "at most every 80 ms");
            Assert.IsTrue(guest.SendState(s, 1081));
            Assert.AreEqual(2, wire.To("host").Count(m => m.Str("t") == "s"));
            Assert.IsNull(wire.To("host").Last().Str("from"), "a guest never sets from; the host does");
        }

        [Test]
        public void StartingGridKeepsEveryPlayerApartAndOnTheRoad()
        {
            var seen = new HashSet<(float, float)>();
            for (int slot = 0; slot < 8; slot++)
            {
                var o = RoomCodes.SpawnOffset(slot);
                Assert.LessOrEqual(System.Math.Abs(o.side), 1.8f, "inside a 3.2 m half-width road");
                Assert.IsTrue(seen.Add(o), $"slot {slot} collides");
            }
            Assert.AreEqual((0f, 0f), RoomCodes.SpawnOffset(0));
            Assert.AreEqual((6f, 1.7f), RoomCodes.SpawnOffset(1));
            Assert.AreEqual((6f, -1.7f), RoomCodes.SpawnOffset(2));
            Assert.AreEqual((12f, 1.7f), RoomCodes.SpawnOffset(3));
        }

        [Test]
        public void JoinersGetAGridSlotAndLearnEveryoneElses()
        {
            var wire = new FakeTransport();
            var host = new Session("HOST", "porsche", wire, () => 0) { IsHost = true };
            host.AcceptGuest("a", "a", "porsche");
            host.AcceptGuest("b", "b", "porsche");
            var helloA = wire.To("a").First(m => m.Str("t") == "hello");
            var helloB = wire.To("b").First(m => m.Str("t") == "hello");
            Assert.AreEqual(1, helloA.Num("slot"));
            Assert.AreEqual(2, helloB.Num("slot"));
            var peersB = helloB.Arr("peers").Cast<Dictionary<string, object>>().Select(p => (p.Str("id"), (int)p.Num("slot"))).ToList();
            CollectionAssert.AreEqual(new[] { ("a", 1) }, peersB);
            Assert.AreEqual("HOST", helloB.Obj("host").Str("name"));

            var guest = new Session("C", "porsche", wire, () => 0);
            int assigned = -1;
            guest.SlotAssigned += s => assigned = s;
            guest.OnGuestData(Json.ParseObject("{\"t\":\"hello\",\"slot\":3,\"host\":{\"name\":\"HOST\",\"kind\":\"porsche\",\"slot\":0},\"peers\":[{\"id\":\"a\",\"name\":\"a\",\"kind\":\"porsche\",\"slot\":1}]}"));
            guest.OnGuestData(Json.ParseObject("{\"t\":\"join\",\"id\":\"b\",\"name\":\"b\",\"kind\":\"buggy\",\"slot\":2}"));
            Assert.AreEqual(3, guest.Slot);
            Assert.AreEqual(3, assigned);
            CollectionAssert.AreEqual(new[] { ("host", 0), ("a", 1), ("b", 2) }, guest.Peers.Select(kv => (kv.Key, kv.Value.Slot)).ToList());
            Assert.AreEqual("buggy", guest.Peers["b"].Kind);
            guest.OnGuestData(Json.ParseObject("{\"t\":\"s\",\"x\":1,\"y\":0,\"z\":0,\"h\":0,\"p\":0,\"r\":0,\"v\":1,\"k\":\"porsche\",\"n\":\"a\",\"from\":\"a\"}"));
            Assert.AreEqual(1, guest.Peers["a"].Track.Count);
            guest.OnGuestData(Json.ParseObject("{\"t\":\"leave\",\"id\":\"b\"}"));
            Assert.AreEqual(3, guest.PlayerCount);
        }

        [Test]
        public void EveryRoomSlotGetsItsOwnPaintAndIceConfigSerialises()
        {
            Assert.AreEqual(RoomCodes.PlayerColors.Length, RoomCodes.PlayerColors.Distinct().Count());
            Assert.AreEqual(RoomCodes.PlayerColors[0], RoomCodes.PaintForSlot(0));
            Assert.AreEqual(RoomCodes.PlayerColors[1], RoomCodes.PaintForSlot(9));
            IceConfig.Turn = null;
            StringAssert.StartsWith("{\"iceServers\":[{\"urls\":\"stun:stun.l.google.com:19302\"}", IceConfig.ToJson());
            IceConfig.Turn = new IceConfig.TurnServer { Urls = "turn:relay.example:3478", Username = "u", Credential = "c" };
            StringAssert.Contains("{\"urls\":\"turn:relay.example:3478\",\"username\":\"u\",\"credential\":\"c\"}", IceConfig.ToJson());
            IceConfig.Turn = null;
        }
    }
}
