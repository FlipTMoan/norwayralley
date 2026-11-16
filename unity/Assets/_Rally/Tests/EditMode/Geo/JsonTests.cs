using System.Collections.Generic;
using NUnit.Framework;
using Rally.Geo;

namespace Rally.Tests.Geo
{
    public class JsonTests
    {
        [Test]
        public void RoundTripsTheWireShapes()
        {
            var text = "{\"t\":\"s\",\"x\":100.12,\"y\":-20,\"h\":1.5,\"k\":\"buggy\",\"n\":\"ELG-42\",\"ok\":true,\"none\":null,\"list\":[1,2,\"a\\n\"]}";
            var o = Json.ParseObject(text);
            Assert.AreEqual("s", o.Str("t"));
            Assert.AreEqual(100.12, o.Num("x"));
            Assert.AreEqual(-20, o.Num("y"));
            Assert.AreEqual(true, o.Get("ok"));
            Assert.IsNull(o.Get("none"));
            Assert.AreEqual(3, o.Arr("list").Count);
            Assert.AreEqual(text, Json.Stringify(o));
            Assert.AreEqual("[[71.133,27.655]]", Json.Stringify(new List<object> { new List<object> { 71.133, 27.655 } }));
            var rings = NorwayOutline.Parse("[[[71.133,27.655],[71.127,27.63],[71.099,27.642]]]");
            Assert.AreEqual(1, rings.Count);
            Assert.AreEqual(27.63, rings[0][1].Lon);
        }
    }
}
