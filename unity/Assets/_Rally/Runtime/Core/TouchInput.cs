namespace Rally.Core
{
    /// <summary>
    /// The on-screen touch buttons (index.html #touchControls: ◀ ▶ BRAKE GAS DRIFT), written by the HUD and read by
    /// the car's input next to the keyboard and gamepad. A static because there is one screen and one local car.
    /// </summary>
    public static class TouchInput
    {
        public static bool Left, Right, Throttle, Brake, Handbrake;
        public static void Release() { Left = Right = Throttle = Brake = Handbrake = false; }
    }
}
