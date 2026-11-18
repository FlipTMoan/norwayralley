using System;
using System.Collections.Generic;

namespace Rally.Core
{
    /// <summary>
    /// Ring-buffered log shown in the in-game log window (Rally.UI.LogWindow) and dumped by the share/debug
    /// tools (port of log.js). Lines are written as "HH:mm:ss.fff LEVEL category: text"; the category prefix
    /// ("tile:", "overlay:", "cache:", "overpass:" …) is what the window's filters read. Everything also goes
    /// to the browser console with a [rally] prefix, so it can be read there with the developer tools.
    /// Main-thread only (on web there is only one C# thread; in the editor async continuations resume on it).
    /// </summary>
    public static class RallyLog
    {
        public const int Capacity = 3000;
        static readonly List<string> lines = new List<string>(Capacity);
        /// <summary>Bumped on every write and on every trim so a viewer knows when to refresh.</summary>
        public static int Version { get; private set; }
        public static int Count => lines.Count;
        public static event Action<string> Written;

        public static void Info(string msg) { Write("INFO", msg); UnityEngine.Debug.Log("[rally] " + msg); }
        public static void Warn(string msg) { Write("WARN", msg); UnityEngine.Debug.LogWarning(msg); }
        public static void Error(string msg) { Write("ERR ", msg); UnityEngine.Debug.LogError(msg); }

        static void Write(string level, string msg)
        {
            var line = $"{DateTime.UtcNow:HH:mm:ss.fff} {level} {msg}";
            // A List with a block trim keeps writes O(1) amortised and lets the window index lines directly.
            if (lines.Count >= Capacity) lines.RemoveRange(0, Capacity / 10);
            lines.Add(line);
            Version++;
            Written?.Invoke(line);
        }

        public static string Line(int index) => lines[index];

        public static string Dump() => string.Join("\n", lines);
    }
}
