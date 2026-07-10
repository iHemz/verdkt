"use client";

import { useState } from "react";
import {
  analyze,
  parseTradeLog,
  ParseError,
  sampleTradeLogCsv,
  type Analysis,
  type ParseResult,
} from "@/lib/analysis";
import { Button } from "@/components/ui/Button";
import { Dropzone } from "./Dropzone";
import { VerdictCard } from "./VerdictCard";

type AnalyzerState =
  | { kind: "idle" }
  | { kind: "error"; message: string }
  | { kind: "done"; analysis: Analysis; parse: ParseResult; fromSample: boolean };

const GENERIC_ERROR = "Couldn't read that file. Make sure it's a CSV export of your trades.";

export function Analyzer() {
  const [state, setState] = useState<AnalyzerState>({ kind: "idle" });

  function run(text: string, fromSample = false) {
    try {
      const parse = parseTradeLog(text);
      const analysis = analyze(parse.trades);
      setState({ kind: "done", analysis, parse, fromSample });
    } catch (err) {
      const message = err instanceof ParseError ? err.message : GENERIC_ERROR;
      setState({ kind: "error", message });
    }
  }

  if (state.kind === "done") {
    return (
      <div className="vk-rise" style={{ display: "grid", gap: 24 }}>
        {state.fromSample && (
          <div className="vk-topbar-note" style={{ textAlign: "center" }}>
            Showing a built-in sample log. Drop your own to analyse it.
          </div>
        )}
        <VerdictCard
          analysis={state.analysis}
          warnings={state.parse.warnings}
          trades={state.parse.trades}
        />
        <div>
          <Button onClick={() => setState({ kind: "idle" })}>← Analyse another log</Button>
        </div>
      </div>
    );
  }

  return (
    <Dropzone
      onSubmit={(text) => run(text)}
      onLoadSample={() => run(sampleTradeLogCsv(), true)}
      onFileError={(message) => setState({ kind: "error", message })}
      errorMessage={state.kind === "error" ? state.message : undefined}
    />
  );
}
