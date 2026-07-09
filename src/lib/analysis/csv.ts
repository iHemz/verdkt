// Low-level, side-effect-free CSV utilities. Kept separate from the trade-log
// domain logic in parse.ts so each piece is independently unit-testable.

/** Minimal RFC-4180-ish parser: handles quoted fields and embedded commas/newlines. */
export function splitCSV(text: string): string[][] {
  const rows: string[][] = [];
  let field = "";
  let row: string[] = [];
  let inQuotes = false;

  const pushField = () => {
    row.push(field);
    field = "";
  };
  const pushRow = () => {
    pushField();
    if (row.some((c) => c.trim() !== "")) rows.push(row);
    row = [];
  };

  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += c;
      }
      continue;
    }
    if (c === '"') inQuotes = true;
    else if (c === ",") pushField();
    else if (c === "\r") continue;
    else if (c === "\n") pushRow();
    else field += c;
  }
  if (field !== "" || row.length) pushRow();
  return rows;
}

/** Split tab-delimited text (fallback for TSV exports). */
export function splitTSV(text: string): string[][] {
  return text
    .split(/\r?\n/)
    .map((l) => l.split("\t"))
    .filter((r) => r.some((c) => c.trim() !== ""));
}

/** Guess the delimiter from the first few lines. */
export function detectDelimiter(text: string): "," | "\t" {
  const head = text.split(/\r?\n/).slice(0, 5).join("\n");
  const commas = (head.match(/,/g) || []).length;
  const tabs = (head.match(/\t/g) || []).length;
  return tabs > commas ? "\t" : ",";
}

/** Normalise a header cell for matching: lowercase, strip separators and punctuation. */
export function normalizeHeader(s: string): string {
  return s
    .toLowerCase()
    .replace(/[\s_./-]+/g, "")
    .replace(/[()#:]/g, "")
    .trim();
}

/**
 * Parse a currency/number cell into a JS number, or null if it isn't numeric.
 * Handles: "$1,234.50", accounting negatives "(120.00)", "-45", european
 * decimals "1 234,56", percentages "3.2%", and stray currency codes.
 */
export function parseNumber(raw: string | undefined | null): number | null {
  if (raw == null) return null;
  let s = raw.trim();
  if (s === "" || s === "-" || s === "—") return null;

  let negative = false;
  if (/^\(.*\)$/.test(s)) {
    negative = true;
    s = s.slice(1, -1);
  }
  s = s.replace(/[%\s]/g, "").replace(/[a-zA-Z$€£¥]/g, "");

  const hasComma = s.includes(",");
  const hasDot = s.includes(".");
  if (hasComma && hasDot) {
    s = s.replace(/,/g, ""); // comma = thousands
  } else if (hasComma && !hasDot) {
    const parts = s.split(",");
    if (parts.length === 2 && parts[1].length !== 3) {
      s = parts[0] + "." + parts[1]; // european decimal, e.g. 1234,56
    } else {
      s = s.replace(/,/g, ""); // thousands, e.g. 1,234
    }
  }
  if (s.startsWith("+")) s = s.slice(1);
  if (s.startsWith("-")) {
    negative = true;
    s = s.slice(1);
  }
  const n = Number(s);
  if (!Number.isFinite(n)) return null;
  return negative ? -n : n;
}

/** Parse a date cell into epoch ms, or undefined. Handles ISO and dd.mm.yyyy. */
export function parseDate(raw: string | undefined | null): number | undefined {
  const s = (raw ?? "").trim();
  if (!s) return undefined;

  const t = Date.parse(s);
  if (Number.isFinite(t)) return t;

  const m = s.match(/^(\d{1,2})[.\-/](\d{1,2})[.\-/](\d{2,4})(?:\s+(\d{1,2}):(\d{2}))?/);
  if (m) {
    const [, a, b, c, hh, mm] = m;
    const year = c.length === 2 ? 2000 + Number(c) : Number(c);
    const d = new Date(year, Number(b) - 1, Number(a), Number(hh || 0), Number(mm || 0));
    if (Number.isFinite(d.getTime())) return d.getTime();
  }
  return undefined;
}
