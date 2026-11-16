using UnityEngine;

namespace Rally.World
{
    /// <summary>Destroy that also works in EditMode tests and editor tooling (Destroy is play-mode only).</summary>
    public static class RallyObjects
    {
        public static void Destroy(Object o)
        {
            if (o == null) return;
            if (Application.isPlaying) Object.Destroy(o); else Object.DestroyImmediate(o);
        }
    }
}
