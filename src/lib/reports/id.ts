// URL-safe ids and secret manage tokens, using Web Crypto (available in both
// Node route handlers and the edge runtime). No dependencies.

const ALPHABET = "0123456789abcdefghijklmnopqrstuvwxyz";

function randomString(len: number): string {
  const bytes = new Uint8Array(len);
  crypto.getRandomValues(bytes);
  let out = "";
  for (const b of bytes) out += ALPHABET[b % ALPHABET.length];
  return out;
}

/** Short, shareable report id, e.g. "k3f9a1qp". */
export function newReportId(): string {
  return randomString(8);
}

/** Long secret the owner uses to manage (unpublish/replace) a report. */
export function newManageToken(): string {
  return randomString(32);
}

/** True for strings that could be a report id (defensive route validation). */
export function isValidId(id: string): boolean {
  return /^[0-9a-z]{6,16}$/.test(id);
}
