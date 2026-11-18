using System;
using System.Collections.Generic;
using UnityEngine;

namespace Rally.Tests.Play
{
    /// <summary>
    /// Collects warnings, errors and exceptions while a scene test runs. RallyLog mirrors every info line to the
    /// console ([rally] …), so LogAssert.NoUnexpectedReceived would fail on ordinary progress; this keeps the
    /// intent of those tests (nothing went wrong) without forbidding information.
    /// </summary>
    public sealed class LogWatch : IDisposable
    {
        public readonly List<string> Problems = new List<string>();
        public LogWatch() { Application.logMessageReceived += OnLog; }
        void OnLog(string text, string stack, LogType type) { if (type != LogType.Log) Problems.Add($"{type}: {text}"); }
        public void Dispose() { Application.logMessageReceived -= OnLog; }
        public string Summary => string.Join("\n", Problems);
    }
}
