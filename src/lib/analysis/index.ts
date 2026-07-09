// Public surface of the analysis domain. UI imports from here, not from
// individual files, so internal reorganisation stays invisible to callers.

export { parseTradeLog, ParseError } from "./parse";
export { analyze } from "./analyze";
export { sampleTradeLogCsv } from "./sample";
export type {
  Trade,
  ParseResult,
  DetectedColumns,
  Analysis,
  Check,
  CheckStatus,
  Verdict,
  Tone,
  SegmentStat,
  DimensionAttribution,
} from "./types";
