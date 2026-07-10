"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { StoredReport } from "@/lib/reports";
import { downloadReportPdf } from "@/lib/pdf/reportPdf";
import { Button } from "@/components/ui/Button";
import { useClipboard } from "@/hooks/useClipboard";
import { useOrigin } from "@/hooks/useOrigin";
import { useUnpublishReport } from "@/hooks/reports/useUnpublishReport";

export function ReportActions({
  report,
  manageToken,
}: {
  report: StoredReport;
  manageToken?: string;
}) {
  const { copiedKey, copy } = useClipboard();
  const origin = useOrigin();
  const router = useRouter();
  const unpublish = useUnpublishReport();
  const [confirming, setConfirming] = useState(false);
  const [pdfBusy, setPdfBusy] = useState(false);

  const id = report.id;
  const reportUrl = `${origin}/r/${id}`;
  const badgeUrl = `${origin}/api/badge/${id}`;
  const embed = `<a href="${reportUrl}" target="_blank" rel="noopener"><img src="${badgeUrl}" alt="Verdkt Verified" height="30"></a>`;

  async function onDownloadPdf() {
    setPdfBusy(true);
    try {
      await downloadReportPdf(report);
    } catch {
      toast.error("Couldn't generate the PDF. Please try again.");
    } finally {
      setPdfBusy(false);
    }
  }

  function onUnpublish() {
    if (!manageToken) return;
    unpublish.mutate(
      { id, manageToken },
      {
        onSuccess: (res) => {
          if (res.removed) {
            toast.success("Report unpublished. The link and badge are now inactive.");
            router.refresh(); // re-run the server component; the report is gone now
          } else {
            toast.error("Could not unpublish. Check that you have the owner link.");
          }
        },
        onError: (err) => toast.error(err.message),
      },
    );
  }

  return (
    <div className="vk-report-actions vk-report-noprint">
      <div className="vk-section-label" style={{ padding: 0, marginBottom: 12 }}>
        Share this verdict
      </div>

      <div className="vk-report-row">
        <Button variant="ghost" onClick={() => copy("link", reportUrl)}>
          {copiedKey === "link" ? "Copied ✓" : "Copy report link"}
        </Button>
        <Button variant="ghost" onClick={onDownloadPdf} disabled={pdfBusy}>
          {pdfBusy ? "Preparing…" : "Download PDF"}
        </Button>
      </div>

      <div style={{ marginTop: 20 }}>
        <div className="vk-report-embed-label">Embed the badge on your site or sales page</div>
        <div className="vk-report-preview">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={badgeUrl} alt="Verdkt Verified badge" height={30} />
        </div>
        <textarea
          className="vk-textarea"
          readOnly
          rows={2}
          value={embed}
          onFocus={(e) => e.currentTarget.select()}
        />
        <div style={{ marginTop: 8 }}>
          <Button onClick={() => copy("embed", embed)}>
            {copiedKey === "embed" ? "Copied ✓" : "Copy embed code"}
          </Button>
        </div>
      </div>

      {manageToken && (
        <div className="vk-report-manage">
          <div className="vk-report-embed-label">Owner controls</div>
          <p className="vk-topbar-note" style={{ marginBottom: 10 }}>
            Keep this page&apos;s link private, it carries your manage token. Anyone with it can
            unpublish the report.
          </p>
          {!confirming ? (
            <Button variant="ghost" onClick={() => setConfirming(true)}>
              Unpublish report
            </Button>
          ) : (
            <div className="vk-report-row">
              <Button variant="ghost" onClick={onUnpublish} disabled={unpublish.isPending}>
                {unpublish.isPending ? "Unpublishing…" : "Confirm unpublish"}
              </Button>
              <Button
                variant="ghost"
                onClick={() => setConfirming(false)}
                disabled={unpublish.isPending}
              >
                Cancel
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
