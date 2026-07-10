// Generate a branded, text-based PDF of a Verdkt Verified report and download
// it. Built programmatically (not a DOM screenshot) so it is crisp, selectable
// text, and unaffected by the app's oklch colors. jsPDF is imported lazily so it
// stays out of the main bundle.

import type { StoredReport } from "@/lib/reports";
import type { Tone } from "@/lib/analysis";

type RGB = [number, number, number];

const INK: RGB = [17, 24, 39];
const MUTE: RGB = [107, 114, 128];
const FAINT: RGB = [156, 163, 175];
const AMBER: RGB = [181, 121, 31];
const RULE: RGB = [229, 231, 235];

const TONE_HEX: Record<Tone, RGB> = {
  pass: [22, 127, 75],
  warn: [154, 116, 18],
  fail: [178, 59, 40],
  none: [181, 121, 31],
};

const r3 = (v: number) => `${v >= 0 ? "+" : ""}${v.toFixed(3)}R`;
const pct = (v: number) => `${(v * 100).toFixed(0)}%`;
const money = (v: number) =>
  `${v < 0 ? "-" : ""}${Math.abs(v).toLocaleString(undefined, { maximumFractionDigits: 0 })}`;

function fileSlug(s: string): string {
  return (
    s
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 50) || "report"
  );
}

export async function downloadReportPdf(report: StoredReport): Promise<void> {
  const { jsPDF } = await import("jspdf");
  const a = report.analysis;
  const doc = new jsPDF({ unit: "pt", format: "a4" });

  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const M = 48;
  const CW = W - M * 2;
  let y = 56;

  const setColor = (c: RGB) => doc.setTextColor(c[0], c[1], c[2]);
  const rule = (yy: number) => {
    doc.setDrawColor(RULE[0], RULE[1], RULE[2]);
    doc.setLineWidth(0.7);
    doc.line(M, yy, W - M, yy);
  };
  const ensure = (need: number) => {
    if (y + need > H - 60) {
      doc.addPage();
      y = 56;
    }
  };

  // ---- header ----
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  setColor(AMBER);
  doc.text("VERDKT VERIFIED", M, y, { charSpace: 1.2 });
  doc.setFont("helvetica", "normal");
  setColor(FAINT);
  doc.text("verdkt.vercel.app", W - M, y, { align: "right" });
  y += 12;
  rule(y);
  y += 26;

  // ---- title + meta ----
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  setColor(INK);
  doc.text(report.title, M, y);
  y += 18;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  setColor(MUTE);
  const meta = [
    report.author,
    `Published ${new Date(report.createdAt).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    })}`,
    "Method-verified on submitted data",
  ]
    .filter(Boolean)
    .join("    ·    ");
  doc.text(meta, M, y);
  y += 28;

  // ---- verdict + summary ----
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  setColor(TONE_HEX[a.tone]);
  doc.text(a.verdict, M, y);
  y += 20;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10.5);
  setColor(INK);
  const summary = doc.splitTextToSize(a.summary, CW);
  doc.text(summary, M, y);
  y += summary.length * 14 + 12;
  rule(y);
  y += 22;

  // ---- key metrics (3 columns) ----
  const label = (t: string, x: number, yy: number) => {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    setColor(FAINT);
    doc.text(t.toUpperCase(), x, yy, { charSpace: 0.6 });
  };
  const value = (t: string, x: number, yy: number, color: RGB = INK) => {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    setColor(color);
    doc.text(t, x, yy);
  };

  const pf = Number.isFinite(a.profitFactor) ? a.profitFactor.toFixed(2) : "inf";
  const cells: { l: string; v: string; c?: RGB }[] = [
    { l: "Trades", v: `${a.n}  (${a.wins}W / ${a.losses}L)` },
    { l: a.usingRProxy ? "Expectancy (R proxy)" : "Expectancy", v: r3(a.expectancyR), c: a.expectancyR > 0 ? TONE_HEX.pass : TONE_HEX.fail },
    { l: "Win rate", v: pct(a.winRate) },
    { l: "Payoff", v: `${a.payoff.toFixed(2)}x  (PF ${pf})` },
    { l: "Total P&L", v: money(a.totalPnl), c: a.totalPnl > 0 ? TONE_HEX.pass : TONE_HEX.fail },
    { l: "Max drawdown", v: `${a.maxDrawdownR.toFixed(1)}R`, c: TONE_HEX.fail },
  ];
  const colW = CW / 3;
  for (let i = 0; i < cells.length; i++) {
    const col = i % 3;
    const x = M + col * colW;
    if (col === 0 && i > 0) y += 42;
    label(cells[i].l, x, y);
    value(cells[i].v, x, y + 16, cells[i].c);
  }
  y += 42 + 20;
  rule(y);
  y += 22;

  // ---- out-of-sample + significance ----
  label("Out-of-sample split", M, y);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10.5);
  setColor(INK);
  doc.text(
    `First half ${r3(a.firstHalfR)}   Second half ${r3(a.secondHalfR)}   ${
      a.signFlip ? "sign flip (fails)" : "consistent"
    }`,
    M,
    y + 16,
  );
  y += 34;
  label("Significance", M, y);
  setColor(INK);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10.5);
  doc.text(
    `t-stat ${a.tStat.toFixed(2)}   p ${a.pValue < 0.001 ? "< 0.001" : a.pValue.toFixed(3)}`,
    M,
    y + 16,
  );
  y += 34;
  rule(y);
  y += 24;

  // ---- the five checks ----
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  setColor(AMBER);
  doc.text("THE FIVE CHECKS", M, y, { charSpace: 0.8 });
  y += 18;

  for (const check of a.checks) {
    const detail = doc.splitTextToSize(check.detail, CW - 18);
    ensure(18 + detail.length * 12);
    const dot = TONE_HEX[check.status === "pass" ? "pass" : check.status === "warn" ? "warn" : "fail"];
    doc.setFillColor(dot[0], dot[1], dot[2]);
    doc.circle(M + 4, y - 3, 3, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10.5);
    setColor(INK);
    doc.text(check.title, M + 18, y);
    y += 14;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9.5);
    setColor(MUTE);
    doc.text(detail, M + 18, y);
    y += detail.length * 12 + 12;
  }

  // ---- footer ----
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  setColor(FAINT);
  const disclaimer = doc.splitTextToSize(
    "This report states that these numbers, run through Verdkt's method, produce the verdict above. It does not prove the trades are real. Verdkt is an analysis tool, not financial advice.",
    CW,
  );
  doc.text(disclaimer, M, H - 44);

  doc.save(`verdkt-${fileSlug(report.title)}.pdf`);
}
