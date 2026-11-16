using System;
using System.Collections;
using System.Collections.Generic;
using System.Globalization;
using System.Text;

namespace Rally.Geo
{
    /// <summary>
    /// A small JSON reader/writer for the service answers (Overpass, OSRM, NVDB) and the peer wire
    /// format. Unity's JsonUtility cannot read dictionaries (OSM tags) or untyped arrays, so this
    /// parses into the plain shapes JS would: <c>Dictionary&lt;string, object&gt;</c>, <c>List&lt;object&gt;</c>,
    /// <c>string</c>, <c>double</c>, <c>bool</c>, <c>null</c>.
    /// </summary>
    public static class Json
    {
        public static object Parse(string text)
        {
            var p = new Parser(text);
            p.SkipWs();
            var v = p.Value();
            p.SkipWs();
            if (p.Pos != text.Length) throw new FormatException($"JSON: trailing characters at {p.Pos}");
            return v;
        }

        public static Dictionary<string, object> ParseObject(string text) => Parse(text) as Dictionary<string, object>
            ?? throw new FormatException("JSON: expected an object");

        // ---- typed accessors in the spirit of `obj?.field ?? fallback` -----------------
        public static object Get(this Dictionary<string, object> o, string key) => o != null && o.TryGetValue(key, out var v) ? v : null;
        public static Dictionary<string, object> Obj(this Dictionary<string, object> o, string key) => o.Get(key) as Dictionary<string, object>;
        public static List<object> Arr(this Dictionary<string, object> o, string key) => o.Get(key) as List<object>;
        public static string Str(this Dictionary<string, object> o, string key) => o.Get(key) is string s ? s : null;
        public static double Num(this Dictionary<string, object> o, string key, double fallback = double.NaN)
        {
            var v = o.Get(key);
            if (v is double d) return d;
            if (v is string s && double.TryParse(s, NumberStyles.Float, CultureInfo.InvariantCulture, out var r)) return r;
            return fallback;
        }
        public static long Long(this Dictionary<string, object> o, string key) => o.Get(key) is double d ? (long)d : 0;

        /// <summary>Compact serialisation (no whitespace) matching <c>JSON.stringify</c> for the shapes above.</summary>
        public static string Stringify(object value)
        {
            var sb = new StringBuilder();
            Write(sb, value);
            return sb.ToString();
        }

        static void Write(StringBuilder sb, object v)
        {
            switch (v)
            {
                case null: sb.Append("null"); break;
                case string s: WriteString(sb, s); break;
                case bool b: sb.Append(b ? "true" : "false"); break;
                case double d: WriteNumber(sb, d); break;
                case float f: WriteNumber(sb, f); break;
                case int i: sb.Append(i.ToString(CultureInfo.InvariantCulture)); break;
                case long l: sb.Append(l.ToString(CultureInfo.InvariantCulture)); break;
                case IDictionary<string, object> o:
                {
                    sb.Append('{');
                    bool first = true;
                    foreach (var kv in o)
                    {
                        if (!first) sb.Append(',');
                        first = false;
                        WriteString(sb, kv.Key);
                        sb.Append(':');
                        Write(sb, kv.Value);
                    }
                    sb.Append('}');
                    break;
                }
                case IEnumerable e:
                {
                    sb.Append('[');
                    bool first = true;
                    foreach (var item in e)
                    {
                        if (!first) sb.Append(',');
                        first = false;
                        Write(sb, item);
                    }
                    sb.Append(']');
                    break;
                }
                default: WriteString(sb, v.ToString()); break;
            }
        }

        static void WriteNumber(StringBuilder sb, double d)
        {
            if (double.IsNaN(d) || double.IsInfinity(d)) { sb.Append("null"); return; }
            // JS prints integers without a fraction and others in shortest round-trip form.
            if (d == Math.Floor(d) && Math.Abs(d) < 1e15) sb.Append(((long)d).ToString(CultureInfo.InvariantCulture));
            else sb.Append(d.ToString("R", CultureInfo.InvariantCulture));
        }

        static void WriteString(StringBuilder sb, string s)
        {
            sb.Append('"');
            foreach (char c in s)
            {
                switch (c)
                {
                    case '"': sb.Append("\\\""); break;
                    case '\\': sb.Append("\\\\"); break;
                    case '\n': sb.Append("\\n"); break;
                    case '\r': sb.Append("\\r"); break;
                    case '\t': sb.Append("\\t"); break;
                    case '\b': sb.Append("\\b"); break;
                    case '\f': sb.Append("\\f"); break;
                    default:
                        if (c < 0x20) sb.Append("\\u").Append(((int)c).ToString("x4"));
                        else sb.Append(c);
                        break;
                }
            }
            sb.Append('"');
        }

        struct Parser
        {
            readonly string s;
            public int Pos;
            public Parser(string text) { s = text; Pos = 0; }

            public void SkipWs() { while (Pos < s.Length && (s[Pos] == ' ' || s[Pos] == '\n' || s[Pos] == '\r' || s[Pos] == '\t')) Pos++; }

            char Peek() => Pos < s.Length ? s[Pos] : '\0';

            public object Value()
            {
                switch (Peek())
                {
                    case '{': return Object();
                    case '[': return Array();
                    case '"': return String();
                    case 't': Expect("true"); return true;
                    case 'f': Expect("false"); return false;
                    case 'n': Expect("null"); return null;
                    default: return Number();
                }
            }

            void Expect(string word)
            {
                if (string.CompareOrdinal(s, Pos, word, 0, word.Length) != 0) throw new FormatException($"JSON: expected {word} at {Pos}");
                Pos += word.Length;
            }

            Dictionary<string, object> Object()
            {
                var o = new Dictionary<string, object>();
                Pos++; SkipWs();
                if (Peek() == '}') { Pos++; return o; }
                for (;;)
                {
                    SkipWs();
                    if (Peek() != '"') throw new FormatException($"JSON: expected key at {Pos}");
                    var key = String();
                    SkipWs();
                    if (Peek() != ':') throw new FormatException($"JSON: expected ':' at {Pos}");
                    Pos++; SkipWs();
                    o[key] = Value();
                    SkipWs();
                    char c = Peek();
                    Pos++;
                    if (c == ',') continue;
                    if (c == '}') return o;
                    throw new FormatException($"JSON: expected ',' or '}}' at {Pos - 1}");
                }
            }

            List<object> Array()
            {
                var a = new List<object>();
                Pos++; SkipWs();
                if (Peek() == ']') { Pos++; return a; }
                for (;;)
                {
                    SkipWs();
                    a.Add(Value());
                    SkipWs();
                    char c = Peek();
                    Pos++;
                    if (c == ',') continue;
                    if (c == ']') return a;
                    throw new FormatException($"JSON: expected ',' or ']' at {Pos - 1}");
                }
            }

            string String()
            {
                Pos++; // opening quote
                var sb = new StringBuilder();
                for (;;)
                {
                    if (Pos >= s.Length) throw new FormatException("JSON: unterminated string");
                    char c = s[Pos++];
                    if (c == '"') return sb.ToString();
                    if (c != '\\') { sb.Append(c); continue; }
                    char e = s[Pos++];
                    switch (e)
                    {
                        case '"': sb.Append('"'); break;
                        case '\\': sb.Append('\\'); break;
                        case '/': sb.Append('/'); break;
                        case 'b': sb.Append('\b'); break;
                        case 'f': sb.Append('\f'); break;
                        case 'n': sb.Append('\n'); break;
                        case 'r': sb.Append('\r'); break;
                        case 't': sb.Append('\t'); break;
                        case 'u':
                            sb.Append((char)int.Parse(s.Substring(Pos, 4), NumberStyles.HexNumber, CultureInfo.InvariantCulture));
                            Pos += 4;
                            break;
                        default: throw new FormatException($"JSON: bad escape at {Pos - 1}");
                    }
                }
            }

            double Number()
            {
                int start = Pos;
                while (Pos < s.Length)
                {
                    char c = s[Pos];
                    if ((c >= '0' && c <= '9') || c == '-' || c == '+' || c == '.' || c == 'e' || c == 'E') Pos++;
                    else break;
                }
                if (start == Pos) throw new FormatException($"JSON: unexpected '{Peek()}' at {Pos}");
                return double.Parse(s.Substring(start, Pos - start), NumberStyles.Float, CultureInfo.InvariantCulture);
            }
        }
    }
}
