"use client";

import { useState } from "react";
import type { Trade } from "@/lib/analysis";
import { Button } from "@/components/ui/Button";

type PublishState =
  | { kind: "idle" }
  | { kind: "form" }
  | { kind: "busy" }
  | { kind: "error"; message: string };

const MIN_TO_PUBLISH = 30;

export function PublishReport({ trades }: { trades: Trade[] }) {
  const [state, setState] = useState<PublishState>({ kind: "idle" });
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [agreed, setAgreed] = useState(false);

  if (trades.length < MIN_TO_PUBLISH) {
    return (
      <div className="vk-publish">
        <p className="vk-topbar-note">
          Publish a shareable Verdkt Verified report at {MIN_TO_PUBLISH}+ trades. This log has{" "}
          {trades.length}.
        </p>
      </div>
    );
  }

  async function submit() {
    setState({ kind: "busy" });
    try {
      const res = await fetch("/api/publish", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ title, author, trades }),
      });
      const data = await res.json();
      if (!res.ok) {
        setState({ kind: "error", message: data.error || "Something went wrong." });
        return;
      }
      if (data.mode === "checkout" && data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
        return;
      }
      // free mode: go straight to the owner's report view
      window.location.href = `/r/${data.id}?mt=${encodeURIComponent(data.manageToken)}`;
    } catch {
      setState({ kind: "error", message: "Network error. Try again." });
    }
  }

  if (state.kind === "idle") {
    return (
      <div className="vk-publish">
        <div className="vk-section-label" style={{ padding: 0, marginBottom: 6 }}>
          Prove it to others
        </div>
        <p className="vk-attr-sub" style={{ marginBottom: 14 }}>
          Turn this verdict into an independent, shareable report at its own link, with an
          embeddable <strong>Verdkt Verified</strong> badge for your profile or sales page.
        </p>
        <Button onClick={() => setState({ kind: "form" })}>Publish a verified report →</Button>
      </div>
    );
  }

  return (
    <div className="vk-publish">
      <div className="vk-section-label" style={{ padding: 0, marginBottom: 12 }}>
        Publish a verified report
      </div>
      <div className="vk-publish-form">
        <label className="vk-field">
          <span>Strategy name</span>
          <input
            className="vk-input"
            value={title}
            maxLength={80}
            placeholder="e.g. London breakout v3"
            onChange={(e) => setTitle(e.target.value)}
          />
        </label>
        <label className="vk-field">
          <span>Your name or handle (optional)</span>
          <input
            className="vk-input"
            value={author}
            maxLength={60}
            placeholder="@yourname"
            onChange={(e) => setAuthor(e.target.value)}
          />
        </label>
        <label className="vk-check-row">
          <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} />
          <span>
            I understand this verifies the method on my submitted data. It does not prove the trades
            are real.
          </span>
        </label>

        {state.kind === "error" && <div className="vk-error">{state.message}</div>}

        <div className="vk-report-row">
          <Button onClick={submit} disabled={!agreed || state.kind === "busy"}>
            {state.kind === "busy" ? "Publishing…" : "Publish"}
          </Button>
          <Button variant="ghost" onClick={() => setState({ kind: "idle" })} disabled={state.kind === "busy"}>
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}
