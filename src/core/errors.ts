/** Developer-facing errors and warnings. Stripped down in production builds. */

export class SmartDataGridError extends Error {
  override readonly name = 'SmartDataGridError';
  readonly code: string;

  constructor(code: string, message: string) {
    // Same `[SmartDataGrid:code]` prefix as the dev warnings, so both are greppable.
    super(`[SmartDataGrid:${code}] ${message}`);
    this.code = code;
  }
}

const isDev = process.env.NODE_ENV !== 'production';
const seen = new Set<string>();

/** Warn once per unique message. Silent in production. */
export function warnOnce(code: string, message: string): void {
  if (!isDev) return;
  if (seen.has(code)) return;
  seen.add(code);
  // eslint-disable-next-line no-console
  console.warn(`[SmartDataGrid:${code}] ${message}`);
}

export function invariant(condition: unknown, code: string, message: string): asserts condition {
  if (condition) return;
  throw new SmartDataGridError(code, message);
}

/** Reset the warning cache. Test-only. */
export function __resetWarnings(): void {
  seen.clear();
}
