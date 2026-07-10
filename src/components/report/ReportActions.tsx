"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { useClipboard } from "@/hooks/useClipboard";
import { useOrigin } from "@/hooks/useOrigin";
import { useUnpublishReport } from "@/hooks/reports/useUnpublishReport";

export function ReportActions({ id, manageToken }: { id: string; manageToken?: string }) {
  const { copiedKey, copy } = useClipboard();
  const origin = useOrigin();
  const unpublish = useUnpublishReport();
  const [removed, setRemoved] = useState(false);

  const reportUrl = `${origin}/r/${id}`;
  const badgeUrl = `${origin}/api/badge/${id}`;
  const embed = `<a href="${reportUrl}" target="_blank" rel="noopener"><img src="${badgeUrl}" alt="Verdkt Verified" height="30"></a>`;

  function onUnpublish() {
    if (!manageToken) return;
    if (!confirm("Unpublish this report? The public link and badge will stop working.")) return;
    unpublish.mutate(
      { id, manageToken },
      { onSuccess: (res) => res.removed && setRemoved(true) },
    );
  }

  if (removed) {
    return (
      <div className="vk-report-actions">
        <p className="vk-topbar-note">
          This report has been unpublished. The link and badge are now inactive.
        </p>
      </div>
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
        <Button variant="ghost" onClick={() => window.print()}>
          Save as PDF
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
          {unpublish.error && (
            <div className="vk-error" style={{ marginBottom: 10 }}>
              {unpublish.error.message}
            </div>
          )}
          <Button variant="ghost" onClick={onUnpublish} disabled={unpublish.isPending}>
            {unpublish.isPending ? "Unpublishing…" : "Unpublish report"}
          </Button>
        </div>
      )}
    </div>
  );
}
