using NUnit.Framework;
using Rally.Core;
using Rally.Gameplay;

namespace Rally.Tests.Edit.Gameplay
{
    public class CameraShakeTests
    {
        [Test]
        public void RougherSurfacesAndHigherSpeedsShakeMore()
        {
            float asphalt = GameController.CameraShake(true, true, Surface.Asphalt, 30f);
            float gravel = GameController.CameraShake(true, true, Surface.Gravel, 30f);
            float offroad = GameController.CameraShake(true, false, Surface.Offroad, 30f);
            Assert.Less(asphalt, gravel);
            Assert.Less(gravel, offroad);
            Assert.AreEqual(1f, offroad, 1e-5f);
            Assert.Less(GameController.CameraShake(true, true, Surface.Gravel, 10f), gravel);
            Assert.AreEqual(0f, GameController.CameraShake(true, true, Surface.Gravel, 0f));
            Assert.AreEqual(0f, GameController.CameraShake(false, false, Surface.Offroad, 30f), "nothing in the air");
        }
    }
}
