using UnityEngine;
using UnityEngine.UIElements;

namespace Rally.UI
{
    /// <summary>
    /// UI Toolkit HUD (port of the HUD block in legacy-js/index.html + main.js): speed, gear, rpm bar, stage
    /// clock, the pace-note box with a rotated arrow (turn box), surface tag and damage. Element names match
    /// Hud.uxml. The arrow rotates by the signed turn angle, positive = left, same as the JS turn box after
    /// the 2026-11-15 mirror fix.
    /// </summary>
    [RequireComponent(typeof(UIDocument))]
    public sealed class HudController : MonoBehaviour
    {
        Label speed, gear, clock, penalty, noteKind, noteDist, surface, status, distLeft;
        VisualElement rpmBar, arrow, damageBar, turnBox, startScreen, friends;
        Label startInfo, roomStatus;
        TextField roomCode;

        /// <summary>Start-screen buttons (index.html: START ENGINE, HOST A ROOM, JOIN). GameController subscribes.</summary>
        public event System.Action StartClicked, HostClicked;
        /// <summary>GEARBOX, SLIDING, the route map (start screen and the MAP button), cache CLEAR, and three quick taps on the speed (debug on phones).</summary>
        public event System.Action GearboxClicked, SlideClicked, MapClicked, CacheClearClicked, DebugTapped;
        Button gearboxBtn, slideBtn;
        Label cacheInfo, debugPanel, helpLine;
        VisualElement touchControls;
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
            rpmBar = root.Q("rpmBar"); arrow = root.Q("arrow"); damageBar = root.Q("damageBar"); turnBox = root.Q("turnBox");
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
            root.Q<Button>("cacheClear")?.RegisterCallback<ClickEvent>(_ => CacheClearClicked?.Invoke());
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
        }

        /// <summary>Show or hide the start screen; `info` is the loading/stage line under the title.</summary>
        public void ShowStartScreen(bool visible, string info = null)
        {
            if (startScreen == null) return;
            startScreen.style.display = visible ? DisplayStyle.Flex : DisplayStyle.None;
            SetRacingHud(!visible);
            if (info != null && startInfo != null) startInfo.text = info;
        }

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
            if (helpLine != null) helpLine.style.display = touch ? DisplayStyle.None : DisplayStyle.Flex;
        }

        bool racingHud = true;

        /// <summary>The start screen also hides the touch buttons (they would sit on top of it).</summary>
        void SetRacingHud(bool value) { racingHud = value; if (!value) Rally.Core.TouchInput.Release(); }

        public void SetGearbox(bool automatic) { if (gearboxBtn != null) gearboxBtn.text = automatic ? "GEARBOX: AUTOMATIC" : "GEARBOX: MANUAL (Q/E)"; }
        public void SetSliding(int level, string name) { if (slideBtn != null) slideBtn.text = $"SLIDING: {level} {name.ToUpperInvariant()}"; }
        public void SetCacheInfo(string text) { if (cacheInfo != null) cacheInfo.text = text; }

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
            gear.text = f.Gear == 0 ? "R" : f.Gear.ToString();
            rpmBar.style.width = Length.Percent(Mathf.Clamp01(f.Rpm / f.Redline) * 100f);
            rpmBar.EnableInClassList("redline", f.Rpm > f.Redline * 0.92f);
            clock.text = Clock(f.StageTime + f.PenaltyTime);
            penalty.text = f.PenaltyTime > 0 ? $"+{f.PenaltyTime:0}s" : "";
            bool note = !string.IsNullOrEmpty(f.NoteKind);
            turnBox.style.display = note ? DisplayStyle.Flex : DisplayStyle.None;
            if (note)
            {
                noteKind.text = f.NoteKind;
                noteDist.text = f.NoteDistance > 0 ? f.NoteDistance.ToString() : "NOW";
                arrow.style.rotate = new Rotate(new Angle(-f.NoteAngle, AngleUnit.Degree)); // screen: left = anticlockwise
            }
            surface.text = f.Surface;
            distLeft.text = f.DistanceLeft > 0 ? $"{f.DistanceLeft / 1000f:0.00} km" : "";
            damageBar.style.width = Length.Percent(f.Damage * 100f);
            status.text = f.Status ?? "";
        }

        public static string Clock(float t)
        {
            int m = (int)(t / 60); float s = t - m * 60;
            return $"{m}:{s:00.00}";
        }
    }
}
