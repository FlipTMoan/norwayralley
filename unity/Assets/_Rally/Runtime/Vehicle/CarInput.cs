namespace Rally.Vehicle
{
    /// <summary>
    /// One frame of driver input (the `input` object main.js:257 hands to car.update). Steer is −1..1 in the
    /// car's yaw sense: +1 turns from +z towards +x, which in the Unity frame (x east, z north) is a right
    /// turn — main.js:1575 negated the keys because its frame had +x on the left; Unity needs no negation.
    /// ShiftUp / ShiftDown are one-frame edges (manual box only). GripMode is the sliding level (car.js
    /// kept it on the car; here the driver supplies it every frame so the sim has no hidden settings).
    /// </summary>
    public struct CarInput
    {
        public float Throttle;  // 0..1
        public float Brake;     // 0..1
        public float Steer;     // −1..1
        public bool Handbrake;
        public bool Jump;
        public bool ShiftUp;
        public bool ShiftDown;
        /// <summary>main.js:2147 frozen: countdown / finished — the car sits still on the ground.</summary>
        public bool Frozen;
        public SlideMode GripMode;
    }
}
