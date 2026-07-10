// Pure SVG builder for the embeddable "Verdkt Verified" badge. Kept
// dependency-free and unit-tested; the route handler just serves this string.

import type { Tone, Verdict } from "@/lib/analysis";

const TONE_COLOR: Record<Tone, string> = {
  pass: "#4ec58a",
  warn: "#e6c34a",
  fail: "#e0603f",
  none: "#EBA84C",
};

function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Rough monospace width so the pill fits the verdict text. */
function verdictWidth(verdict: string): number {
  return verdict.length * 7.4 + 24;
}

export function badgeSvg(verdict: Verdict | "UNVERIFIED", tone: Tone): string {
  const color = TONE_COLOR[tone] ?? TONE_COLOR.none;
  const labelW = 122;
  const valueW = Math.max(96, verdictWidth(verdict));
  const w = labelW + valueW;
  const h = 30;
  const v = escapeXml(verdict);

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" role="img" aria-label="Verdkt Verified: ${v}">
  <rect width="${w}" height="${h}" rx="6" fill="#0e1421"/>
  <rect x="1" y="1" width="${w - 2}" height="${h - 2}" rx="5" fill="none" stroke="#2a3340"/>
  <g font-family="ui-monospace, SFMono-Regular, Menlo, monospace" font-size="11" font-weight="600">
    <text x="12" y="19" fill="#EBA84C" letter-spacing="0.5">VERDKT</text>
    <text x="70" y="19" fill="#8a94a3" letter-spacing="0.5">VERIFIED</text>
    <line x1="${labelW}" y1="6" x2="${labelW}" y2="${h - 6}" stroke="#2a3340"/>
    <text x="${labelW + 12}" y="19" fill="${color}" letter-spacing="0.5">${v}</text>
  </g>
</svg>`;
}
