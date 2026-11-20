using UnityEngine;
using UnityEngine.UIElements;

namespace Rally.UI
{
    /// <summary>
    /// UI Toolkit HUD (port of the HUD block in legacy-js/index.html + main.js): speed, gear, rpm bar, stage
    /// clock, the pace-note box (metres to the next turn and its kind; the direction arrow lies on the road since
    /// 2026-11-20, Gameplay/RoadArrow), surface tag and damage. Element names match Hud.uxml.
    /// </summary>
    [RequireComponent(typeof(UIDocument))]
    public sealed class HudController : MonoBehaviour
    {
        Label speed, gear, clock, penalty, noteKind, noteDist, surface, status, distLeft;
        VisualElement rpmBar, damageBar, turnBox, startScreen, friends;
        Label startInfo, roomStatus;
        TextField roomCode;

        /// <summary>Start-screen buttons (index.html: START ENGINE, HOST A ROOM, JOIN). GameController subscribes.</summary>
        public event System.Action StartClicked, HostClicked;
        /// <summary>GEARBOX, SLIDING, the route map (start screen and the MAP button), cache CLEAR, and three quick taps on the speed (debug on phones).</summary>
        public event System.Action GearboxClicked, SlideClicked, MapClicked, CacheClearClicked, DebugTapped;
        /// <summary>The HUD's MENU button (Esc on a keyboard): back to the start screen.</summary>
        public event System.Action MenuClicked;
        Button gearboxBtn, slideBtn;
        Label cacheInfo, debugPanel, helpLine;
        VisualElement touchControls, hud, startControls;
        bool menu;
        readonly float[] speedTaps = new float[3];
        int tapIndex;
        public event System.Action<string> JoinClicked;
        public bool Visible { set => root.style.display = value ? DisplayStyle.Flex : DisplayStyle.None; }
        VisualElement root;

        void OnEnable()
        {
            root = GetComponent<UIDocument>().rootVisualElement;
            speed = root.Q<Label>("speed"); gear = root.Q<Label>("gear"); clock = root.Q<Label>("clock");
            penalty = root.Q<Label>("penalty"); noteKind = root.Q<Label>("noteKind"); noteDist = root.Q<Label>("noteDist");
            surface = root.Q<Label>("surface"); status = root.Q<Label>("status"); distLeft = root.Q<Label>("distLeft");
            rpmBar = root.Q("rpmBar"); damageBar = root.Q("damageBar"); turnBox = root.Q("turnBox");
            if (!TryGetComponent<LogWindow>(out _)) gameObject.AddComponent<LogWindow>();   // the log window ships with the HUD, no scene edit needed
            startScreen = root.Q("startScreen"); friends = root.Q("friends");
            startInfo = root.Q<Label>("startInfo"); roomStatus = root.Q<Label>("roomStatus"); roomCode = root.Q<TextField>("roomCode");
            root.Q<Button>("startButton")?.RegisterCallback<ClickEvent>(_ => StartClicked?.Invoke());
            root.Q<Button>("hostButton")?.RegisterCallback<ClickEvent>(_ => HostClicked?.Invoke());
            root.Q<Button>("joinButton")?.RegisterCallback<ClickEvent>(_ => JoinClicked?.Invoke(roomCode != null ? roomCode.value : ""));
            gearboxBtn = root.Q<Button>("gearboxBtn"); slideBtn = root.Q<Button>("slideBtn");
            gearboxBtn?.RegisterCallback<ClickEvent>(_ => GearboxClicked?.Invoke());
            slideBtn?.RegisterCallback<ClickEvent>(_ => SlideClicked?.Invoke());
            root.Q<Button>("mapBtn")?.RegisterCallback<ClickEvent>(_ => MapClicked?.Invoke());
            root.Q<Button>("mapButton")?.RegisterCallback<ClickEvent>(_ => MapClicked?.Invoke());
            root.Q<Button>("menuButton")?.RegisterCallback<ClickEvent>(_ => MenuClicked?.Invoke());
            hud = root.Q("hud"); startControls = root.Q("startControls");
            // The start column is at least as tall as the view: centred when it fits, scrolls when it does not (phones).
            var scroll = root.Q<ScrollView>("startScroll"); var column = root.Q("startColumn");
            scroll?.contentViewport.RegisterCallback<GeometryChangedEvent>(e => column.style.minHeight = e.newRect.height);
            root.Q<Button>("cacheClear")?.RegisterCallback<ClickEvent>(_ => CacheClearClicked?.Invoke());
            helpOverlay = root.Q("helpOverlay");
            root.Q<Button>("helpButton")?.RegisterCallback<ClickEvent>(_ => HelpVisible = !HelpVisible);
            root.Q<Button>("helpBtn")?.RegisterCallback<ClickEvent>(_ => HelpVisible = true);
            root.Q<Button>("helpClose")?.RegisterCallback<ClickEvent>(_ => HelpVisible = false);
            cacheInfo = root.Q<Label>("cacheInfo"); debugPanel = root.Q<Label>("debugPanel"); helpLine = root.Q<Label>("helpLine");
            touchControls = root.Q("touchControls");
            Touch("touchLeft", v => Rally.Core.TouchInput.Left = v);
            Touch("touchRight", v => Rally.Core.TouchInput.Right = v);
            Touch("touchBrake", v => Rally.Core.TouchInput.Brake = v);
            Touch("touchThrottle", v => Rally.Core.TouchInput.Throttle = v);
            Touch("touchDrift", v => Rally.Core.TouchInput.Handbrake = v);
            // main.js:2072 phones have no F10: three quick taps on the speedometer open the debug window.
            speed?.RegisterCallback<PointerDownEvent>(_ =>
            {
                speedTaps[tapIndex] = Time.unscaledTime; tapIndex = (tapIndex + 1) % 3;
                if (Time.unscaledTime - speedTaps[tapIndex] < 0.9f) { DebugTapped?.Invoke(); System.Array.Clear(speedTaps, 0, 3); }
            });
            if (speed != null) speed.pickingMode = PickingMode.Position;
            ShowStartScreen(true);   // the UXML opens on the start screen; the game's first phase (Loading) keeps it
        }

        /// <summary>One car on the start-screen chooser.</summary>
        public struct CarCard { public string Name, Stats; public Texture2D Picture; }

        /// <summary>A car card was clicked or tapped (index into the list given to <see cref="SetCars"/>).</summary>
        public event System.Action<int> CarClicked;
        readonly System.Collections.Generic.List<VisualElement> carCards = new System.Collections.Generic.List<VisualElement>();

        /// <summary>Fill the car chooser: a card per car (picture, name, stats), <paramref name="selected"/> outlined.</summary>
        public void SetCars(System.Collections.Generic.IReadOnlyList<CarCard> cards, int selected)
        {
            var row = root?.Q("carCards");
            if (row == null) return;
            row.Clear(); carCards.Clear();
            for (int i = 0; i < cards.Count; i++)
            {
                int index = i;
                var card = new VisualElement { name = "car" + i };
                card.AddToClassList("carCard");
                var pic = new VisualElement();
                pic.AddToClassList("carPicture");
                if (cards[i].Picture != null) pic.style.backgroundImage = new StyleBackground(cards[i].Picture);
                card.Add(pic);
                var name = new Label(cards[i].Name); name.AddToClassList("carName"); card.Add(name);
                var stats = new Label(cards[i].Stats); stats.AddToClassList("carStats"); card.Add(stats);
                card.RegisterCallback<ClickEvent>(_ => CarClicked?.Invoke(index));
                row.Add(card); carCards.Add(card);
            }
            SelectCar(selected);
        }

        public void SelectCar(int index) { for (int i = 0; i < carCards.Count; i++) carCards[i].EnableInClassList("selected", i == index); }

        /// <summary>
        /// Show or hide the start screen. While it is up the driving HUD (clock, pace note, speed, status line, MENU / MAP / ?)
        /// is hidden (.menu on the HUD root) and the status line moves into the start column under START ENGINE.
        /// </summary>
        public void ShowStartScreen(bool visible)
        {
            if (startScreen == null) return;
            startScreen.style.display = visible ? DisplayStyle.Flex : DisplayStyle.None;
            menu = visible;
            hud?.EnableInClassList("menu", visible);
            if (visible) turnBox.style.display = DisplayStyle.None;
            SetRacingHud(!visible);
        }

        /// <summary>True while the start screen is up.</summary>
        public bool StartScreenVisible => menu;

        /// <summary>A held touch button: pressed while the pointer is down on it, released on up, leave or cancel.</summary>
        void Touch(string name, System.Action<bool> set)
        {
            var b = root.Q<Button>(name);
            if (b == null) return;
            void Down() { set(true); b.AddToClassList("held"); }
            void Up() { set(false); b.RemoveFromClassList("held"); }
            b.RegisterCallback<PointerDownEvent>(_ => Down(), TrickleDown.TrickleDown);
            b.RegisterCallback<PointerUpEvent>(_ => Up());
            b.RegisterCallback<PointerLeaveEvent>(_ => Up());
            b.RegisterCallback<PointerCancelEvent>(_ => Up());
        }

        void Update()
        {
            // index.html: touch controls appear on phones and narrow screens; the help line is for keyboards.
            bool touch = UnityEngine.InputSystem.Touchscreen.current != null || Screen.width < 900;
            if (touchControls != null) touchControls.style.display = touch && racingHud ? DisplayStyle.Flex : DisplayStyle.None;
            if (helpLine != null) helpLine.style.display = touch || menu ? DisplayStyle.None : DisplayStyle.Flex;
            if (startControls != null) startControls.style.display = touch ? DisplayStyle.None : DisplayStyle.Flex;
            // Phones in portrait (the panel scales with the screen, see RallyPanel): buttons under the clock, cards 4 + 4.
            if (hud != null && !float.IsNaN(root.layout.width)) hud.EnableInClassList("narrow", root.layout.width < 900f);
        }

        bool racingHud = true;

        /// <summary>The start screen also hides the touch buttons (they would sit on top of it).</summary>
        void SetRacingHud(bool value) { racingHud = value; if (!value) Rally.Core.TouchInput.Release(); }

        public void SetGearbox(bool automatic) { if (gearboxBtn != null) gearboxBtn.text = automatic ? "GEARBOX: AUTOMATIC" : "GEARBOX: MANUAL (Q/E)"; }
        public void SetSliding(int level, string name) { if (slideBtn != null) slideBtn.text = $"SLIDING: {level} {name.ToUpperInvariant()}"; }
        public void SetCacheInfo(string text) { if (cacheInfo != null) cacheInfo.text = text; }

        VisualElement helpOverlay;
        bool paused;
        float timeScaleBefore = 1f;

        /// <summary>
        /// The help screen (H / F1, the ? buttons). While it is open the game is paused (time stops, sound pauses) unless
        /// a room is open (the others keep driving), so closing it hands everything back as it was.
        /// </summary>
        public bool HelpVisible
        {
            get => helpOverlay != null && helpOverlay.style.display == DisplayStyle.Flex;
            set
            {
                if (helpOverlay == null) return;
                helpOverlay.style.display = value ? DisplayStyle.Flex : DisplayStyle.None;
                if (value) Rally.Core.TouchInput.Release();
                bool pause = value && !KeepRunningUnderHelp;
                if (pause && !paused) { timeScaleBefore = Time.timeScale; Time.timeScale = 0f; AudioListener.pause = true; paused = true; }
                else if (!pause && paused) { Time.timeScale = timeScaleBefore; AudioListener.pause = false; paused = false; }
            }
        }

        /// <summary>Set by the game while a multiplayer room is open: the help screen then overlays without pausing.</summary>
        public bool KeepRunningUnderHelp;

        void OnDisable() { if (paused) { Time.timeScale = timeScaleBefore; AudioListener.pause = false; paused = false; } }

        /// <summary>The debug window (F10 / F3): shown or hidden; the text is refreshed by the game a few times a second.</summary>
        public bool DebugVisible
        {
            get => debugPanel != null && debugPanel.style.display == DisplayStyle.Flex;
            set { if (debugPanel != null) debugPanel.style.display = value ? DisplayStyle.Flex : DisplayStyle.None; }
        }
        public void SetDebug(string text) { if (debugPanel != null) debugPanel.text = text; }

        /// <summary>True while a text field (the room code) has the keyboard, so letter keys do not restart the stage.</summary>
        public bool IsTyping => root?.panel?.focusController?.focusedElement is TextField;

        /// <summary>Room code / join status shown in the friends panel (also mirrored in the HUD status line).</summary>
        public void ShowRoomStatus(string text) { if (roomStatus != null) roomStatus.text = text ?? ""; }

        public void Show(in HudFrame f)
        {
            speed.text = ((int)f.SpeedKmh).ToString();
            gear.text = (f.Gear == 0 ? "R" : f.Gear.ToString()) + (f.Manual ? " M" : "");
            rpmBar.style.width = Length.Percent(Mathf.Clamp01(f.Rpm / f.Redline) * 100f);
            rpmBar.EnableInClassList("redline", f.Rpm > f.Redline * 0.92f);
            clock.text = Clock(f.StageTime + f.PenaltyTime);
            penalty.text = f.PenaltyTime > 0 ? $"+{f.PenaltyTime:0}s" : "";
            bool note = !string.IsNullOrEmpty(f.NoteKind) && !menu;
            turnBox.style.display = note ? DisplayStyle.Flex : DisplayStyle.None;
            if (note)
            {
                noteKind.text = f.NoteKind;
                noteDist.text = f.NoteDistance > 0 ? f.NoteDistance.ToString() : "NOW";
            }
            surface.text = f.Surface;
            distLeft.text = f.DistanceLeft > 0 ? $"{f.DistanceLeft / 1000f:0.00} km" : "";
            damageBar.style.width = Length.Percent(f.Damage * 100f);
            if (menu) { if (startInfo != null) startInfo.text = f.Status ?? ""; }
            else status.text = f.Status ?? "";
        }

        public static string Clock(float t)
        {
            int m = (int)(t / 60); float s = t - m * 60;
            return $"{m}:{s:00.00}";
        }
    }
}
