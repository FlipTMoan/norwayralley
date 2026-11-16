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
            startScreen = root.Q("startScreen"); friends = root.Q("friends");
            startInfo = root.Q<Label>("startInfo"); roomStatus = root.Q<Label>("roomStatus"); roomCode = root.Q<TextField>("roomCode");
            root.Q<Button>("startButton")?.RegisterCallback<ClickEvent>(_ => StartClicked?.Invoke());
            root.Q<Button>("hostButton")?.RegisterCallback<ClickEvent>(_ => HostClicked?.Invoke());
            root.Q<Button>("joinButton")?.RegisterCallback<ClickEvent>(_ => JoinClicked?.Invoke(roomCode != null ? roomCode.value : ""));
        }

        /// <summary>Show or hide the start screen; `info` is the loading/stage line under the title.</summary>
        public void ShowStartScreen(bool visible, string info = null)
        {
            if (startScreen == null) return;
            startScreen.style.display = visible ? DisplayStyle.Flex : DisplayStyle.None;
            if (info != null && startInfo != null) startInfo.text = info;
        }

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
