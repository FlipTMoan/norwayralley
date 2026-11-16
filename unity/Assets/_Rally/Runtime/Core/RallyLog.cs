using System;
using System.Collections.Generic;

namespace Rally.Core
{
    /// <summary>Ring-buffered log shown in the debug window and dumped by the share/debug tools (port of log.js).</summary>
    public static class RallyLog
    {
        const int Capacity = 400;
        static readonly Queue<string> lines = new Queue<string>(Capacity);
        public static event Action<string> Written;

        public static void Info(string msg) => Write("INFO", msg);
        public static void Warn(string msg) { Write("WARN", msg); UnityEngine.Debug.LogWarning(msg); }
        public static void Error(string msg) { Write("ERR ", msg); UnityEngine.Debug.LogError(msg); }

        static void Write(string level, string msg)
        {
            var line = $"{DateTime.UtcNow:HH:mm:ss.fff} {level} {msg}";
            if (lines.Count >= Capacity) lines.Dequeue();
            lines.Enqueue(line);
            Written?.Invoke(line);
        }

        public static string Dump() => string.Join("\n", lines);
    }
}
