using System;
using System.Text;

namespace Rally.Net
{
    /// <summary>Room codes, callsigns, grid slots and paints — the pure helpers of multiplayer.js.</summary>
    public static class RoomCodes
    {
        public const string RoomPrefix = "nrr-";
        /// <summary>No 0/O/1/I, so a code read out loud or typed on a phone cannot be misheard.</summary>
        public const string CodeChars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
        static readonly string[] Callsigns = { "ELG", "REV", "ULV", "ØRN", "BJØRN", "RÅDYR", "GAUPE", "HARE", "TIUR", "MÅKE" };
        /// <summary>One paint per grid slot, the same on every screen in the room.</summary>
        public static readonly int[] PlayerColors = { 0xd34a31, 0x2f6fd6, 0xf0c020, 0x3aa655, 0xe9e6dc, 0xe2673c, 0x8a4fd6, 0x2bb3b0 };

        static readonly Random random = new Random();

        /// <summary>multiplayer.js <c>makeRoomCode</c>; <paramref name="random01"/> is injectable for tests.</summary>
        public static string MakeRoomCode(int length = 4, Func<double> random01 = null)
        {
            random01 ??= random.NextDouble;
            var sb = new StringBuilder(length);
            for (int i = 0; i < length; i++) sb.Append(CodeChars[(int)Math.Floor(random01() * CodeChars.Length)]);
            return sb.ToString();
        }

        /// <summary>multiplayer.js <c>normaliseCode</c>: upper-case, strip everything else, 0→O, 1→I, at most 6 chars.</summary>
        public static string NormaliseCode(string text)
        {
            var sb = new StringBuilder();
            foreach (char raw in (text ?? "").ToUpperInvariant())
            {
                char c = raw == '0' ? 'O' : raw == '1' ? 'I' : raw;
                if ((c >= 'A' && c <= 'Z') || (c >= '0' && c <= '9')) sb.Append(c);
                if (sb.Length == 6) break;
            }
            return sb.ToString();
        }

        /// <summary>multiplayer.js <c>makeCallsign</c>: "ELG-42".</summary>
        public static string MakeCallsign(Func<double> random01 = null)
        {
            random01 ??= random.NextDouble;
            return $"{Callsigns[(int)Math.Floor(random01() * Callsigns.Length)]}-{10 + (int)Math.Floor(random01() * 90)}";
        }

        /// <summary>
        /// Starting grid (multiplayer.js <c>spawnOffset</c>): slot 0 on the line, then pairs side by side every
        /// 6 m back (1 right, 2 left, 3 right…), so nobody spawns inside anybody else. Metres back along the
        /// road and to the right.
        /// </summary>
        public static (float back, float side) SpawnOffset(int slot)
        {
            if (slot <= 0) return (0, 0);
            int row = (slot + 1) / 2;
            return (row * 6, slot % 2 == 1 ? 1.7f : -1.7f);
        }

        public static int PaintForSlot(int slot) => PlayerColors[(slot >= 0 ? slot : 0) % PlayerColors.Length];
    }
}
