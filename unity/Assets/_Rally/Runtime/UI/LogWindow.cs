using System.Collections.Generic;
using Rally.Core;
using UnityEngine;
using UnityEngine.InputSystem;
using UnityEngine.UIElements;

namespace Rally.UI
{
    /// <summary>
    /// The in-game log window: a scrolling, virtualised list of <see cref="RallyLog"/> lines (3000 kept) with
    /// filter chips for the tile, overlay (OSM roads and features, SR16 forest, signs) and cache traffic, a
    /// FOLLOW mode that sticks to the newest line until the user scrolls up, and COPY to put the visible text on
    /// the clipboard so it can be pasted into a bug report. F2 or the LOG button toggles it. It is open while
    /// the world loads and closes itself when the countdown starts, unless the player opened or closed it by hand.
    /// Elements are named in Hud.uxml (logWindow, logList, logButton, logAll …).
    /// </summary>
    [RequireComponent(typeof(UIDocument))]
    public sealed class LogWindow : MonoBehaviour
    {
        enum Filter { All, Tiles, Overlays, Cache, Warnings }

        const int LevelEnd = 18;            // "HH:mm:ss.fff LEVEL " is 18 characters (see RallyLog.Write)
        const float RefreshSeconds = 0.2f;
        const float FollowSlack = 6f;       // px from the bottom that still counts as "at the end"

        VisualElement window;
        ListView list;
        Button toggleButton, followButton;
        readonly Dictionary<Filter, Button> chips = new Dictionary<Filter, Button>();
        readonly List<string> shown = new List<string>(RallyLog.Capacity);

        Filter filter = Filter.All;
        bool follow = true, open = true, userToggled;
        int seenVersion = -1;
        float nextRefresh;

        void OnEnable()
        {
            var root = GetComponent<UIDocument>().rootVisualElement;
            window = root.Q("logWindow");
            list = root.Q<ListView>("logList");
            toggleButton = root.Q<Button>("logButton");
            followButton = root.Q<Button>("logFollow");
            if (window == null || list == null) { enabled = false; return; }

            list.fixedItemHeight = 15;
            list.virtualizationMethod = CollectionVirtualizationMethod.FixedHeight;
            list.selectionType = SelectionType.None;
            list.showAlternatingRowBackgrounds = AlternatingRowBackground.None;
            list.itemsSource = shown;
            list.makeItem = () => { var l = new Label(); l.AddToClassList("logLine"); return l; };
            list.bindItem = (e, i) => Bind((Label)e, shown[i]);

            var scroller = list.Q<ScrollView>()?.verticalScroller;
            if (scroller != null)
                scroller.valueChanged += v => { if (!settingScroll) SetFollow(v >= scroller.highValue - FollowSlack, false); };

            Chip("logAll", Filter.All); Chip("logTiles", Filter.Tiles); Chip("logOverlays", Filter.Overlays);
            Chip("logCache", Filter.Cache); Chip("logWarn", Filter.Warnings);
            followButton?.RegisterCallback<ClickEvent>(_ => { SetFollow(!follow, true); if (follow) ScrollToEnd(); });
            root.Q<Button>("logCopy")?.RegisterCallback<ClickEvent>(_ => Copy());
            root.Q<Button>("logClose")?.RegisterCallback<ClickEvent>(_ => Toggle(true));
            toggleButton?.RegisterCallback<ClickEvent>(_ => Toggle(true));

            Mark();
            SetOpen(true);
        }

        bool settingScroll;

        void Chip(string name, Filter f)
        {
            var b = window.Q<Button>(name);
            if (b == null) return;
            chips[f] = b;
            b.RegisterCallback<ClickEvent>(_ => { filter = f; Mark(); seenVersion = -1; Refresh(); });
        }

        void Mark()
        {
            foreach (var kv in chips) kv.Value.EnableInClassList("on", kv.Key == filter);
        }

        void Update()
        {
            if (Keyboard.current != null && Keyboard.current.f2Key.wasPressedThisFrame) Toggle(true);
            if (!open || Time.unscaledTime < nextRefresh) return;
            nextRefresh = Time.unscaledTime + RefreshSeconds;
            Refresh();
        }

        /// <summary>Open or close; `byHand` stops the automatic close at the countdown.</summary>
        public void Toggle(bool byHand) { if (byHand) userToggled = true; SetOpen(!open); }

        /// <summary>Called by the game when the countdown starts: closes the window unless the player took control of it.</summary>
        public void AutoHide() { if (!userToggled) SetOpen(false); }

        void SetOpen(bool value)
        {
            open = value;
            window.style.display = value ? DisplayStyle.Flex : DisplayStyle.None;
            toggleButton?.EnableInClassList("on", value);
            if (value) { seenVersion = -1; Refresh(); }
        }

        void SetFollow(bool value, bool byButton)
        {
            follow = value;
            followButton?.EnableInClassList("on", follow);
            if (byButton) userToggled = true;
        }

        void Refresh()
        {
            if (seenVersion == RallyLog.Version) return;
            seenVersion = RallyLog.Version;
            shown.Clear();
            for (int i = 0; i < RallyLog.Count; i++)
            {
                var line = RallyLog.Line(i);
                if (Matches(line, filter)) shown.Add(line);
            }
            list.RefreshItems();
            if (follow) ScrollToEnd();
        }

        void ScrollToEnd()
        {
            if (shown.Count == 0) return;
            settingScroll = true;
            list.ScrollToItem(-1);
            settingScroll = false;
        }

        /// <summary>The category prefix the log lines carry decides which chip they belong to.</summary>
        static bool Matches(string line, Filter f)
        {
            if (f == Filter.All) return true;
            if (line.Length <= LevelEnd) return false;
            if (f == Filter.Warnings) return line[13] == 'W' || line[13] == 'E';
            switch (f)
            {
                case Filter.Tiles: return HasPrefix(line, "tile:");
                case Filter.Overlays: return HasPrefix(line, "overlay:");
                case Filter.Cache: return HasPrefix(line, "cache:");
            }
            return true;
        }

        /// <summary>True when the message part of the line (after time and level) starts with the category prefix; no allocation.</summary>
        static bool HasPrefix(string line, string prefix) =>
            line.Length >= LevelEnd + prefix.Length && string.CompareOrdinal(line, LevelEnd, prefix, 0, prefix.Length) == 0;

        static void Bind(Label label, string line)
        {
            label.text = line;
            bool warn = line.Length > 14 && line[13] == 'W', err = line.Length > 14 && line[13] == 'E';
            bool tile = HasPrefix(line, "tile:"), overlay = HasPrefix(line, "overlay:"), cache = HasPrefix(line, "cache:");
            label.EnableInClassList("warn", warn);
            label.EnableInClassList("err", err);
            label.EnableInClassList("tile", tile);
            label.EnableInClassList("overlay", overlay);
            label.EnableInClassList("cache", cache);
        }

        /// <summary>The lines in view (respecting the filter) as one text block, for bug reports.</summary>
        void Copy()
        {
            Rally.Geo.BrowserDom.ClipboardWrite(string.Join("\n", shown));
        }
    }
}
