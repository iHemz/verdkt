"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/Button";

type DropzoneProps = {
  /** Called with raw CSV text from a dropped/browsed file or the paste box. */
  onSubmit: (text: string) => void;
  /** Called when the user asks to load the built-in sample. */
  onLoadSample: () => void;
  /** Called when a file can't be read at the browser level. */
  onFileError: (message: string) => void;
  errorMessage?: string;
};

export function Dropzone({ onSubmit, onLoadSample, onFileError, errorMessage }: DropzoneProps) {
  const [dragOver, setDragOver] = useState(false);
  const [showPaste, setShowPaste] = useState(false);
  const [paste, setPaste] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  function readFile(file: File) {
    const reader = new FileReader();
    reader.onload = () => onSubmit(String(reader.result));
    reader.onerror = () => onFileError("Couldn't read that file.");
    reader.readAsText(file);
  }

  return (
    <div style={{ display: "grid", gap: 18 }}>
      <div
        className={`vk-drop${dragOver ? " is-over" : ""}`}
        onClick={() => fileRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") fileRef.current?.click();
        }}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          const f = e.dataTransfer.files?.[0];
          if (f) readFile(f);
        }}
        role="button"
        tabIndex={0}
        aria-label="Upload a trade log CSV"
      >
        <div className="vk-drop-icon">[ + ]</div>
        <p style={{ marginTop: 14, fontSize: 18 }}>
          Drop your trade log CSV here, or <span className="vk-link">browse</span>
        </p>
        <p className="vk-topbar-note" style={{ marginTop: 8 }}>
          MT4 / MT5 · cTrader · TradingView · or any CSV with a profit/loss column
        </p>
        <input
          ref={fileRef}
          type="file"
          accept=".csv,text/csv,text/plain"
          style={{ display: "none" }}
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) readFile(f);
          }}
        />
      </div>

      {errorMessage && (
        <div className="vk-error" role="alert">
          {errorMessage}
        </div>
      )}

      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center" }}>
        <Button variant="ghost" onClick={() => setShowPaste((v) => !v)}>
          {showPaste ? "Hide paste box" : "Paste CSV instead"}
        </Button>
        <Button variant="ghost" onClick={onLoadSample}>
          Try a sample log →
        </Button>
      </div>

      {showPaste && (
        <div style={{ display: "grid", gap: 12 }}>
          <textarea
            className="vk-textarea"
            aria-label="Paste trade log CSV"
            placeholder={"Close Time,Symbol,Profit\n2025-09-01 08:00,EUR_USD,-42.10\n..."}
            value={paste}
            onChange={(e) => setPaste(e.target.value)}
          />
          <div>
            <Button onClick={() => onSubmit(paste)} disabled={!paste.trim()}>
              Analyse pasted log
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
