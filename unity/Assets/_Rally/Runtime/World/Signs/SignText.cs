using System.Collections.Generic;
using System.Text;

namespace Rally.World
{
    /// <summary>
    /// NVDB "Tekst" (property 1910) of a direction / name plate: plain text with embedded sign symbols between @…@ and
    /// the content of a road-number shield between $…$, e.g. "@723.15@$520$Sauda 3@31@" or "@650.40@Fjord &amp; Fjell@610.1@Bunker Oil@31@".
    /// Parsed into lines: every text run is a destination line, a 723.x symbol with its $number$ becomes a road-number
    /// shield at the start of the next line (or a line of its own); other symbols (service pictograms, the arrow tip 31)
    /// are dropped.
    /// </summary>
    public static class SignText
    {
        public sealed class Line
        {
            public string Shield;        // road number ("520", "E 39"), null for none
            public string ShieldCode;    // 723.x code of the shield, picks its colours
            public string Text;          // destination ("Sauda 3"), may be empty when the line is only a shield
        }

        public static List<Line> Parse(string text)
        {
            var lines = new List<Line>();
            if (string.IsNullOrEmpty(text)) return lines;
            string pendingCode = null, pendingShield = null;
            var run = new StringBuilder();
            void FlushRun()
            {
                var t = run.ToString().Trim();
                run.Clear();
                if (t.Length == 0) return;
                lines.Add(new Line { Shield = pendingShield, ShieldCode = pendingCode, Text = t });
                pendingShield = null; pendingCode = null;
            }
            int i = 0;
            while (i < text.Length)
            {
                char c = text[i];
                if (c == '@' || c == '$')
                {
                    int end = text.IndexOf(c, i + 1);
                    if (end < 0) { run.Append(text, i, text.Length - i); break; }
                    var token = text.Substring(i + 1, end - i - 1);
                    if (c == '@')
                    {
                        FlushRun();
                        if (token.StartsWith("723")) { FlushShield(); pendingCode = token; }
                    }
                    else
                    {
                        if (pendingShield != null) FlushShield();
                        pendingShield = token.Trim();
                        pendingCode ??= "723.15";
                    }
                    i = end + 1;
                    continue;
                }
                run.Append(c);
                i++;
            }
            FlushRun();
            FlushShield();
            return lines;

            void FlushShield()
            {
                if (pendingShield == null) { pendingCode = null; return; }
                lines.Add(new Line { Shield = pendingShield, ShieldCode = pendingCode, Text = "" });
                pendingShield = null; pendingCode = null;
            }
        }
    }
}
