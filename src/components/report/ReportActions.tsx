"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";

function useCopy() {
  const [copied, setCopied] = useState<string | null>(null);
  const copy = async (key: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(key);
      setTimeout(() => setCopied((c) => (c === key ? null : c)), 1600);
    } catch {
      /* clipboard unavailable */
    }
  };
  return { copied, copy };
}

export function ReportActions({ id, manageToken }: { id: string; manageToken?: string }) {
  const { copied, copy } = useCopy();
  const [removed, setRemoved] = useState(false);
  const [busy, setBusy] = useState(false);

  // Resolve origin after mount so SSR and first client render agree (no hydration mismatch).
  const [origin, setOrigin] = useState("");
  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  const reportUrl = `${origin}/r/${id}`;
  const badgeUrl = `${origin}/api/badge/${id}`;
  const embed = `<a href="${reportUrl}" target="_blank" rel="noopener"><img src="${badgeUrl}" alt="Verdkt Verified" height="30"></a>`;

  async function unpublish() {
    if (!manageToken) return;
    if (!confirm("Unpublish this report? The public link and badge will stop working.")) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/reports/${id}?t=${encodeURIComponent(manageToken)}`, {
        method: "DELETE",
      });
      if (res.ok) setRemoved(true);
    } finally {
      setBusy(false);
    }
  }

  if (removed) {
    return (
      <div className="vk-report-actions">
        <p className="vk-topbar-note">This report has been unpublished. The link and badge are now inactive.</p>
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
          {copied === "link" ? "Copied ✓" : "Copy report link"}
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
        <textarea className="vk-textarea" readOnly rows={2} value={embed} onFocus={(e) => e.currentTarget.select()} />
        <div style={{ marginTop: 8 }}>
          <Button onClick={() => copy("embed", embed)}>
            {copied === "embed" ? "Copied ✓" : "Copy embed code"}
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
          <Button variant="ghost" onClick={unpublish} disabled={busy}>
            {busy ? "Unpublishing…" : "Unpublish report"}
          </Button>
        </div>
      )}
    </div>
  );
}
