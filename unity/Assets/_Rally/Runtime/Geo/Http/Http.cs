using System;
using System.Collections.Generic;
using System.Runtime.CompilerServices;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using UnityEngine;
using UnityEngine.Networking;

namespace Rally.Geo
{
    /// <summary>Thrown for a non-2xx answer so callers can map the status to the JS messages ("HTTP 504").</summary>
    public sealed class HttpException : Exception
    {
        public readonly long Status;
        public readonly bool TimedOut;
        public HttpException(string message, long status = 0, bool timedOut = false) : base(message) { Status = status; TimedOut = timedOut; }
    }

    /// <summary>
    /// The one place a request is made: UnityWebRequest with a timeout, cancellation, optional
    /// progress, and the headers the JS sets. Only NVDB wants an identifying header (<c>X-Client</c>,
    /// signs.js); browsers forbid setting <c>User-Agent</c>, so it is only set in the editor/standalone
    /// and is the app name, never a person.
    /// </summary>
    public static class Http
    {
        public const string AppName = "norwayralley";

        public static Task<byte[]> GetBytes(string url, int timeoutMs, CancellationToken ct,
            IReadOnlyDictionary<string, string> headers = null, Action<float> progress = null)
            => Send(UnityWebRequest.Get(url), timeoutMs, ct, headers, progress);

        public static async Task<string> GetText(string url, int timeoutMs, CancellationToken ct,
            IReadOnlyDictionary<string, string> headers = null)
            => Encoding.UTF8.GetString(await GetBytes(url, timeoutMs, ct, headers));

        /// <summary>POST an <c>application/x-www-form-urlencoded</c> body (Overpass takes <c>data=&lt;query&gt;</c>).</summary>
        public static Task<byte[]> PostForm(string url, string body, int timeoutMs, CancellationToken ct)
        {
            var req = new UnityWebRequest(url, UnityWebRequest.kHttpVerbPOST)
            {
                uploadHandler = new UploadHandlerRaw(Encoding.UTF8.GetBytes(body)),
                downloadHandler = new DownloadHandlerBuffer(),
            };
            req.SetRequestHeader("Content-Type", "application/x-www-form-urlencoded");
            return Send(req, timeoutMs, ct, null, null);
        }

        static async Task<byte[]> Send(UnityWebRequest req, int timeoutMs, CancellationToken ct,
            IReadOnlyDictionary<string, string> headers, Action<float> progress)
        {
            using (req)
            {
                req.timeout = Math.Max(1, (timeoutMs + 999) / 1000);
                if (headers != null) foreach (var h in headers) req.SetRequestHeader(h.Key, h.Value);
#if !UNITY_WEBGL || UNITY_EDITOR
                req.SetRequestHeader("User-Agent", AppName);
#endif
                var op = req.SendWebRequest();
                using (ct.Register(() => { if (!req.isDone) req.Abort(); }))
                {
                    if (progress == null) await op;
                    else
                    {
                        while (!op.isDone)
                        {
                            progress(Math.Min(0.92f, req.downloadProgress));
                            await Task.Yield();
                        }
                        progress(1f);
                    }
                }
                ct.ThrowIfCancellationRequested();
                if (req.result == UnityWebRequest.Result.Success) return req.downloadHandler.data;
                bool timedOut = req.result == UnityWebRequest.Result.ConnectionError && req.error != null && req.error.IndexOf("timeout", StringComparison.OrdinalIgnoreCase) >= 0;
                if (req.responseCode >= 400) throw new HttpException($"HTTP {req.responseCode}", req.responseCode);
                throw new HttpException(req.error ?? "request failed", req.responseCode, timedOut);
            }
        }

        /// <summary>encodeURIComponent: RFC 3986 unreserved plus <c>-_.!~*'()</c> stay literal.</summary>
        public static string EncodeUriComponent(string s)
        {
            var sb = new StringBuilder(s.Length * 2);
            foreach (byte b in Encoding.UTF8.GetBytes(s))
            {
                char c = (char)b;
                if ((c >= 'A' && c <= 'Z') || (c >= 'a' && c <= 'z') || (c >= '0' && c <= '9') || "-_.!~*'()".IndexOf(c) >= 0) sb.Append(c);
                else sb.Append('%').Append(((int)b).ToString("X2"));
            }
            return sb.ToString();
        }

        /// <summary>JS <c>Number.prototype.toFixed</c> (invariant culture).</summary>
        public static string Fixed(double v, int digits) => v.ToString("F" + digits, System.Globalization.CultureInfo.InvariantCulture);
    }

    /// <summary>Lets <c>await request.SendWebRequest()</c> work without a coroutine.</summary>
    public static class UnityWebRequestAwaiterExtensions
    {
        public static UnityWebRequestAwaiter GetAwaiter(this UnityWebRequestAsyncOperation op) => new UnityWebRequestAwaiter(op);
    }

    public readonly struct UnityWebRequestAwaiter : INotifyCompletion
    {
        readonly UnityWebRequestAsyncOperation op;
        public UnityWebRequestAwaiter(UnityWebRequestAsyncOperation op) { this.op = op; }
        public bool IsCompleted => op.isDone;
        public void GetResult() { }
        public void OnCompleted(Action continuation)
        {
            if (op.isDone) continuation();
            else op.completed += _ => continuation();
        }
    }
}
