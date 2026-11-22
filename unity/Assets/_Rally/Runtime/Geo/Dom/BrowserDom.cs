using System.Runtime.InteropServices;

namespace Rally.Geo
{
    /// <summary>
    /// The C# side of <c>Plugins/WebGL/dom.jslib</c>: the page URL (share links), localStorage, the
    /// clipboard, the loader overlay and the Leaflet route map the template provides as <c>window.rallyMap</c>.
    /// Outside the web build every call is a harmless no-op (the URL is empty, storage is in memory), so the
    /// editor runs the same code path with a query string from the inspector.
    /// </summary>
    public static class BrowserDom
    {
#if UNITY_WEBGL && !UNITY_EDITOR
        [DllImport("__Internal")] static extern string RallyUrlParams();
        [DllImport("__Internal")] static extern void RallyUrlReplace(string query);
        [DllImport("__Internal")] static extern string RallyLocalGet(string key);
        [DllImport("__Internal")] static extern void RallyLocalSet(string key, string value);
        [DllImport("__Internal")] static extern void RallyClipboardWrite(string text);
        [DllImport("__Internal")] static extern void RallySetTitle(string title);
        [DllImport("__Internal")] static extern void RallyMapOpen(string optionsJson);
        [DllImport("__Internal")] static extern void RallyMapClose();
        [DllImport("__Internal")] static extern void RallyMapStatus(string text);
        [DllImport("__Internal")] static extern void RallyMapSetPin(int which, double lat, double lon);
        [DllImport("__Internal")] static extern void RallyMapSetRoute(string json);
        [DllImport("__Internal")] static extern void RallyMapSetRoutes(string json, string note);
        [DllImport("__Internal")] static extern void RallyLoaderText(string text);
        [DllImport("__Internal")] static extern void RallyLoaderHide();

        /// <summary>location.search without the '?' (empty outside the browser).</summary>
        public static string UrlParams() => RallyUrlParams() ?? "";
        public static void UrlReplace(string query) => RallyUrlReplace((query ?? "").TrimStart('?'));   // the jslib adds the "?" itself
        public static string LocalGet(string key) => RallyLocalGet(key);
        public static void LocalSet(string key, string value) => RallyLocalSet(key, value ?? "");
        public static void ClipboardWrite(string text) => RallyClipboardWrite(text ?? "");
        public static void SetTitle(string title) => RallySetTitle(title ?? "");
        public static void MapOpen(string optionsJson) => RallyMapOpen(optionsJson ?? "{}");
        public static void MapClose() => RallyMapClose();
        public static void MapStatus(string text) => RallyMapStatus(text ?? "");
        public static void MapSetPin(int which, double lat, double lon) => RallyMapSetPin(which, lat, lon);
        public static void MapSetRoute(string json) => RallyMapSetRoute(json ?? "[]");
        /// <summary>MY ROUTES in the map panel: [{ id, name, info }] JSON and a note line.</summary>
        public static void MapSetRoutes(string json, string note) => RallyMapSetRoutes(json ?? "[]", note ?? "");
        public static void LoaderText(string text) => RallyLoaderText(text ?? "");
        public static void LoaderHide() => RallyLoaderHide();
#else
        static readonly System.Collections.Generic.Dictionary<string, string> local = new System.Collections.Generic.Dictionary<string, string>();
        public static string UrlParams() => "";
        public static void UrlReplace(string query) { }
        public static string LocalGet(string key) => local.TryGetValue(key, out var v) ? v : null;
        public static void LocalSet(string key, string value) => local[key] = value;
        public static void ClipboardWrite(string text) => UnityEngine.GUIUtility.systemCopyBuffer = text;
        public static void SetTitle(string title) { }
        public static void MapOpen(string optionsJson) { }
        public static void MapClose() { }
        public static void MapStatus(string text) { }
        public static void MapSetPin(int which, double lat, double lon) { }
        public static void MapSetRoute(string json) { }
        public static void MapSetRoutes(string json, string note) { }
        public static void LoaderText(string text) { }
        public static void LoaderHide() { }
#endif
    }
}
