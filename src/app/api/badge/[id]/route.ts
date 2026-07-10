// Serves the embeddable "Verdkt Verified" badge as an SVG image.

import { badgeSvg } from "@/lib/reports/badge";
import { getStore, isValidId } from "@/lib/reports";

export const runtime = "nodejs";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const svg = isValidId(id)
    ? await (async () => {
        const report = await (await getStore()).get(id);
        return report
          ? badgeSvg(report.analysis.verdict, report.analysis.tone)
          : badgeSvg("UNVERIFIED", "none");
      })()
    : badgeSvg("UNVERIFIED", "none");

  return new Response(svg, {
    headers: {
      "content-type": "image/svg+xml; charset=utf-8",
      "cache-control": "public, max-age=300, s-maxage=300",
    },
  });
}
