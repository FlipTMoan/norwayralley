using System.Collections.Generic;
using System.Text;

namespace Rally.World
{
    /// <summary>
    /// NVDB "Tekst" (property 1910) of a direction / name plate: plain text with embedded sign symbols between @…@ and
    /// the content of a road-number shield between $…$, e.g. "@723.15@$520$Sauda 3@31@" or "@650.40@Fjord &amp; Fjell@610.1@Bunker Oil@31@".
    /// Parsed into lines: every text run is a destination line, a 723.x symbol with its $number$ becomes a road-number
    /// shield at the start of the next line (or a line of its own); other symbols (service pictograms, the arrow tip 31)
    /// are dropped. Also read (all seen in NVDB): the number written after the shield symbol ("@723.15@285@@Hønefoss"), inside
    /// it ("@723.11 E134Seljord", unclosed) or between ¤ ("@723.16¤282¤@Asker"), "@@" as a line break, and text between @…@
    /// that is not a symbol number ("@100 m@") as a line.
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
            text = text.Replace('¤', '$');                   // "@723.16¤282¤@Asker": ¤ marks the shield's number too
            string pendingCode = null, pendingShield = null;
            var run = new StringBuilder();
            void FlushRun()
            {
                var t = run.ToString().Trim();
                run.Clear();
                if (t.Length == 0) return;
                // "@723.15@285@@Hønefoss": the number written straight after the shield symbol is the shield's, not a line
                if (pendingShield == null && Numbered(pendingCode) && IsRoadNumber(t)) { pendingShield = Road(t); return; }
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
                    if (end < 0) end = text.Length;              // "@723.11 E134Seljord": an unclosed symbol runs to the end
                    var token = text.Substring(i + 1, end - i - 1).Trim();
                    if (c == '@')
                    {
                        FlushRun();
                        if (token.StartsWith("723"))
                        {
                            FlushShield();
                            int sp = 0;
                            while (sp < token.Length && (char.IsDigit(token[sp]) || token[sp] == '.')) sp++;
                            pendingCode = token.Substring(0, sp);
                            // "723.11 E134Seljord", "723.16$282$": the number (and a destination) inside the symbol itself
                            var rest = token.Substring(sp).Replace('$', ' ').Trim();
                            int k = RoadNumberLength(rest);
                            if (k > 0 && Numbered(pendingCode)) { pendingShield = Road(rest.Substring(0, k)); run.Append(rest.Substring(k)); }
                        }
                        else if (pendingShield == null && Numbered(pendingCode) && IsRoadNumber(token)) pendingShield = Road(token);   // "@723.11@@E6@"
                        else if (!IsSymbol(token)) { run.Append(token); FlushRun(); }   // "@100 m@", "@Kronborgseter@": text set off as a line
                    }
                    else
                    {
                        if (pendingShield != null) FlushShield();
                        pendingShield = Road(token);
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

        /// <summary>The plain text of a plate: symbols (@…@) dropped, shield numbers kept, lines joined by <paramref name="sep"/>.</summary>
        public static string Plain(string text, string sep = " ")
        {
            var parts = new List<string>();
            foreach (var l in Parse(text))
            {
                var t = string.IsNullOrEmpty(l.Shield) ? l.Text : string.IsNullOrEmpty(l.Text) ? l.Shield : l.Shield + " " + l.Text;
                if (!string.IsNullOrEmpty(t)) parts.Add(t);
            }
            return parts.Count == 0 ? null : string.Join(sep, parts);
        }

        /// <summary>A sign or symbol number between @…@ ("31", "611", "650.40", "807.8", arrow "H90"), not text.</summary>
        static bool IsSymbol(string t) => System.Text.RegularExpressions.Regex.IsMatch(t, @"^(\d{1,3}(\.\d+[A-Z]?)?|[HVR]\d{0,3})$");

        /// <summary>723.1x / 723.2x carry a road number; 723.3x and up are route symbols (tourist route …) without one.</summary>
        static bool Numbered(string code)
            => code != null && code.StartsWith("723.") && code.Length >= 5 && (code[4] == '1' || code[4] == '2');

        /// <summary>Length of a leading road number: "E 134", "E6", "285", "Rv7" → its characters; 0 when none.</summary>
        static int RoadNumberLength(string s)
        {
            int i = 0;
            if (i < s.Length && (s[i] == 'E' || s[i] == 'e')) { i++; if (i < s.Length && s[i] == 'v') i++; }
            else if (s.StartsWith("Rv") || s.StartsWith("Fv")) i = 2;
            while (i < s.Length && s[i] == ' ') i++;
            int digits = 0;
            while (i < s.Length && char.IsDigit(s[i])) { i++; digits++; }
            return digits > 0 && digits <= 4 ? i : 0;
        }

        /// <summary>The road number a plain text is ("E134", "64", "E 6"), or null.</summary>
        public static string AsRoadNumber(string s) => s != null && IsRoadNumber(s.Trim()) ? Road(s) : null;

        static bool IsRoadNumber(string s) => RoadNumberLength(s) == s.Length && s.Length > 0;

        /// <summary>"E 134" / "Ev134" / "e6" → "E 134" style kept as written, but "Ev" and a lower-case e normalised to "E".</summary>
        static string Road(string s)
        {
            s = s.Trim();
            if (s.StartsWith("Ev")) s = "E" + s.Substring(2);
            else if (s.StartsWith("e")) s = "E" + s.Substring(1);
            else if (s.StartsWith("Rv") || s.StartsWith("Fv")) s = s.Substring(2);
            return s.Trim();
        }
    }
}
