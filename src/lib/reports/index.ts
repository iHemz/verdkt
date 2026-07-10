// Public surface of the reports domain. Server code imports getStore(); the
// store implementations (fs/redis) are loaded lazily so this barrel stays safe
// to import for types anywhere.

export type { StoredReport, NewReport, Disclosure, ReportRecord } from "./types";
export type { ReportStore } from "./store";
export { getStore } from "./store";
export { newReportId, newManageToken, isValidId } from "./id";
export { sanitizeTitle, sanitizeAuthor, coerceTrades } from "./validate";
