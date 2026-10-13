/**
 * Canadian English number display: 253,441 grouping, period decimals.
 * Whole values omit .00; non-zero fractions keep two digits (8.40, 12.50%).
 */

/** Compact display for large counts (1K, 10K, 1.2M). Values under 1,000 use grouped integers. */
export function formatCanadianCompactNumber(n: number, maxFractionDigits = 1): string {
  if (!Number.isFinite(n)) return String(n);
  const sign = n < 0 ? "-" : "";
  const abs = Math.abs(n);
  if (abs >= 1_000_000) {
    return `${sign}${compactUnit(abs / 1_000_000, maxFractionDigits)}M`;
  }
  if (abs >= 1_000) {
    return `${sign}${compactUnit(abs / 1_000, maxFractionDigits)}K`;
  }
  return formatCanadianNumber(Math.round(abs), 0);
}

function compactUnit(value: number, maxFractionDigits: number): string {
  const factor = 10 ** maxFractionDigits;
  const rounded = Math.round(value * factor) / factor;
  if (Number.isInteger(rounded)) return String(rounded);
  const fixed = rounded.toFixed(maxFractionDigits);
  return fixed.replace(/\.?0+$/, "");
}

export function formatCanadianNumber(n: number, maxFractionDigits = 2): string {
  if (!Number.isFinite(n)) return String(n);
  const sign = n < 0 ? "-" : "";
  const abs = Math.abs(n);
  const factor = 10 ** maxFractionDigits;
  const rounded = Math.round(abs * factor) / factor;
  const isWhole = Number.isInteger(rounded);
  const [intPart, fracPart] = rounded.toFixed(isWhole ? 0 : maxFractionDigits).split(".");
  const grouped = groupThousands(intPart);
  if (isWhole || !fracPart) return `${sign}${grouped}`;
  return `${sign}${grouped}.${fracPart}`;
}

export function parseCanadianNumber(raw: string): number {
  const t = raw.trim();
  if (!t || t === "-" || t === " - ") return NaN;
  const stripped = t.endsWith("%") ? t.slice(0, -1).trim() : t;
  const n = Number(stripped.replace(/,/g, ""));
  return n;
}

/** Quote when grouping commas are present so CSV columns stay intact. */
export function csvNumberCell(n: number): string {
  const formatted = formatCanadianNumber(n);
  if (formatted.includes(",") || formatted.includes('"')) {
    return `"${formatted.replace(/"/g, '""')}"`;
  }
  return formatted;
}

export function csvDashNumberCell(n: number | null | undefined): string {
  if (n === null || n === undefined) return " - ";
  return csvNumberCell(n);
}

export function splitCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]!;
    if (inQuotes) {
      if (ch === '"') {
        if (line[i + 1] === '"') {
          cur += '"';
          i += 1;
        } else {
          inQuotes = false;
        }
      } else {
        cur += ch;
      }
    } else if (ch === ",") {
      out.push(cur);
      cur = "";
    } else if (ch === '"') {
      inQuotes = true;
    } else {
      cur += ch;
    }
  }
  out.push(cur);
  return out;
}

function groupThousands(digits: string): string {
  let out = "";
  for (let i = 0; i < digits.length; i++) {
    if (i > 0 && (digits.length - i) % 3 === 0) out += ",";
    out += digits[i];
  }
  return out;
}
