using System;
using UnityEngine;

namespace Rally.Gameplay
{
    /// <summary>
    /// The receiver the web template's route map talks to: <c>SendMessage('Map', 'OnMapEvent', json)</c> with
    /// { ev: 'pick' | 'generate' | 'free' | 'close', … } (see WebGLTemplates/Rally/index.html). It must sit on a
    /// GameObject named exactly "Map"; GameController creates it and handles the events.
    /// </summary>
    public sealed class MapEvents : MonoBehaviour
    {
        public Action<string> Handler;
        public void OnMapEvent(string json) => Handler?.Invoke(json);
    }
}
