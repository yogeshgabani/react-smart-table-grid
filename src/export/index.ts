import type { ExportFormat, ExportOptions, GridRow, ResolvedColumn } from '../types';
import { toText } from '../utils';
import { SmartDataGridError, warnOnce } from '../core/errors';

export interface ExportInput<T> {
  rows: T[];
  columns: ResolvedColumn<T>[];
  options: ExportOptions<T>;
  title?: string;
}

/* ------------------------------------------------------------------ *
 * Value extraction
 * ------------------------------------------------------------------ */

function cellText<T>(
  row: T,
  index: number,
  column: ResolvedColumn<T>,
  options: ExportOptions<T>,
): string {
  const value = column.getValue(row, index);
  if (options.formatCell) return options.formatCell(value, row, column.id);
  if (options.raw) return toText(value);
  if (column.format) return column.format(value, row);
  return toText(value);
}

function headerText<T>(column: ResolvedColumn<T>): string {
  const header = column.header;
  if (typeof header === 'string') return header;
  if (typeof header === 'number') return String(header);
  // Function and element headers can't be stringified reliably; fall back to id.
  return column.id;
}

/** Columns actually included in an export. */
export function exportColumns<T>(
  columns: ResolvedColumn<T>[],
  options: ExportOptions<T>,
): ResolvedColumn<T>[] {
  const skip = new Set(['__select__', '__expander__', '__actions__', '__drag__']);
  let list = columns.filter((column) => !skip.has(column.id));
  if (options.columns?.length) {
    const wanted = new Set(options.columns);
    list = list.filter((column) => wanted.has(column.id));
    // Preserve the caller's column order rather than the grid's.
    list.sort((a, b) => options.columns!.indexOf(a.id) - options.columns!.indexOf(b.id));
  }
  return list;
}

/** Rows and columns as a plain matrix — the base for every format. */
export function toMatrix<T>(input: ExportInput<T>): { headers: string[]; body: string[][] } {
  const columns = exportColumns(input.columns, input.options);
  return {
    headers: columns.map(headerText),
    body: input.rows.map((row, index) =>
      columns.map((column) => cellText(row, index, column, input.options)),
    ),
  };
}

/* ------------------------------------------------------------------ *
 * Formats
 * ------------------------------------------------------------------ */

/** A plain number like `-42`, `+1.5` or `-1,234.50` — safe to leave unescaped. */
const PLAIN_NUMBER = /^[-+]?\d[\d,]*(\.\d+)?$/;

/** Strict numeric test for spreadsheet cells; `Number()` also accepts `0x1F`, `Infinity` and blanks. */
const NUMERIC_CELL = /^-?\d+(\.\d+)?(e[-+]?\d+)?$/i;

function escapeCsv(value: string, delimiter: string): string {
  const needsQuotes =
    value.includes(delimiter) || value.includes('"') || value.includes('\n') || value.includes('\r');
  // Prefix formula-like values so spreadsheets don't execute them — but leave
  // negative numbers alone, or every `-42` would import as text.
  const formulaLike = /^[=+\-@\t\r]/.test(value) && !PLAIN_NUMBER.test(value);
  const safe = formulaLike ? `'${value}` : value;
  return needsQuotes ? `"${safe.replace(/"/g, '""')}"` : safe;
}

export function toCsv<T>(input: ExportInput<T>): string {
  const delimiter = input.options.delimiter ?? ',';
  const { headers, body } = toMatrix(input);
  const lines: string[] = [];
  if (input.options.includeHeaders !== false) {
    lines.push(headers.map((cell) => escapeCsv(cell, delimiter)).join(delimiter));
  }
  for (const row of body) lines.push(row.map((cell) => escapeCsv(cell, delimiter)).join(delimiter));
  return lines.join('\r\n');
}

export function toJson<T>(input: ExportInput<T>): string {
  const columns = exportColumns(input.columns, input.options);
  const data = input.rows.map((row, index) => {
    const record: Record<string, unknown> = {};
    for (const column of columns) {
      record[column.id] = input.options.raw
        ? column.getValue(row, index)
        : cellText(row, index, column, input.options);
    }
    return record;
  });
  return JSON.stringify(data, null, 2);
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function toHtmlTable<T>(input: ExportInput<T>): string {
  const { headers, body } = toMatrix(input);
  const head =
    input.options.includeHeaders === false
      ? ''
      : `<thead><tr>${headers.map((cell) => `<th>${escapeHtml(cell)}</th>`).join('')}</tr></thead>`;
  const rows = body
    .map((row) => `<tr>${row.map((cell) => `<td>${escapeHtml(cell)}</td>`).join('')}</tr>`)
    .join('');
  return `<table>${head}<tbody>${rows}</tbody></table>`;
}

/**
 * SpreadsheetML 2003 — a plain-XML format Excel, LibreOffice and Numbers all
 * open natively, which avoids pulling a zip/xlsx dependency into the bundle.
 */
export function toExcelXml<T>(input: ExportInput<T>): string {
  const { headers, body } = toMatrix(input);
  const sheetName = (input.title ?? 'Sheet1').replace(/[\\/?*[\]:]/g, '').slice(0, 31) || 'Sheet1';

  const cell = (value: string): string => {
    const plain = value.replace(/,/g, '');
    const numeric = NUMERIC_CELL.test(plain);
    const type = numeric ? 'Number' : 'String';
    const content = numeric ? plain : escapeHtml(value);
    return `<Cell><Data ss:Type="${type}">${content}</Data></Cell>`;
  };

  const headerRow =
    input.options.includeHeaders === false
      ? ''
      : `<Row>${headers
          .map((value) => `<Cell ss:StyleID="head"><Data ss:Type="String">${escapeHtml(value)}</Data></Cell>`)
          .join('')}</Row>`;

  const bodyRows = body.map((row) => `<Row>${row.map(cell).join('')}</Row>`).join('');

  return `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
  xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
  <Styles>
    <Style ss:ID="head">
      <Font ss:Bold="1"/>
      <Interior ss:Color="#F1F5F9" ss:Pattern="Solid"/>
    </Style>
  </Styles>
  <Worksheet ss:Name="${escapeHtml(sheetName)}">
    <Table>${headerRow}${bodyRows}</Table>
  </Worksheet>
</Workbook>`;
}

/* ------------------------------------------------------------------ *
 * Delivery
 * ------------------------------------------------------------------ */

export function downloadBlob(content: string, filename: string, mime: string): void {
  if (typeof document === 'undefined') {
    warnOnce('export-ssr', 'Export was called during server rendering and has been skipped.');
    return;
  }
  // The BOM makes Excel honour UTF-8 in CSV files.
  const bom = mime.startsWith('text/csv') ? '\uFEFF' : '';
  const blob = new Blob([bom + content], { type: `${mime};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.rel = 'noopener';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  // Give the browser a tick to start the download before revoking.
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

const PRINT_STYLES = `
  body { font-family: ui-sans-serif, system-ui, sans-serif; color: #0f172a; margin: 24px; }
  h1 { font-size: 18px; margin: 0 0 16px; }
  table { border-collapse: collapse; width: 100%; font-size: 12px; }
  th, td { border: 1px solid #cbd5e1; padding: 6px 8px; text-align: left; }
  th { background: #f1f5f9; font-weight: 600; }
  tr:nth-child(even) td { background: #f8fafc; }
  @page { margin: 12mm; }
`;

/** Open a print-ready window. Used by both `print` and `pdf` (Save as PDF). */
export function printHtml<T>(input: ExportInput<T>): void {
  if (typeof window === 'undefined') return;
  const title = input.title ?? input.options.title ?? 'Export';
  const win = window.open('', '_blank', 'width=1024,height=768');
  if (!win) {
    throw new SmartDataGridError(
      'print-blocked',
      'The print window was blocked by the browser. Allow pop-ups for this site to export as PDF or print.',
    );
  }
  win.document.write(
    `<!doctype html><html><head><meta charset="utf-8"><title>${escapeHtml(title)}</title>` +
      `<style>${PRINT_STYLES}</style></head><body>` +
      `<h1>${escapeHtml(title)}</h1>${toHtmlTable(input)}</body></html>`,
  );
  win.document.close();
  win.focus();
  // Let the document lay out before invoking the print dialog.
  setTimeout(() => {
    win.print();
  }, 250);
}

export async function copyToClipboard<T>(input: ExportInput<T>): Promise<void> {
  const tsv = toCsv({ ...input, options: { ...input.options, delimiter: '\t' } });
  if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(tsv);
    return;
  }
  if (typeof document === 'undefined') return;
  // Fallback for non-secure contexts where the async Clipboard API is absent.
  const textarea = document.createElement('textarea');
  textarea.value = tsv;
  textarea.setAttribute('readonly', '');
  textarea.style.position = 'fixed';
  textarea.style.opacity = '0';
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand('copy');
  document.body.removeChild(textarea);
}

const EXTENSIONS: Record<ExportFormat, string> = {
  csv: 'csv',
  json: 'json',
  excel: 'xls',
  pdf: 'pdf',
  print: '',
  clipboard: '',
};

export const EXPORT_LABELS: Record<ExportFormat, string> = {
  csv: 'CSV',
  json: 'JSON',
  excel: 'Excel',
  pdf: 'PDF',
  print: 'Print',
  clipboard: 'Copy to clipboard',
};

/** Run an export end-to-end. */
export async function runExport<T = GridRow>(input: ExportInput<T>): Promise<void> {
  const format = input.options.format ?? 'csv';
  const base = input.options.filename?.replace(/\.[a-z]+$/i, '') ?? 'export';
  const filename = `${base}.${EXTENSIONS[format]}`;

  switch (format) {
    case 'csv':
      downloadBlob(toCsv(input), filename, 'text/csv');
      break;
    case 'json':
      downloadBlob(toJson(input), filename, 'application/json');
      break;
    case 'excel':
      downloadBlob(toExcelXml(input), filename, 'application/vnd.ms-excel');
      break;
    case 'pdf':
    case 'print':
      printHtml(input);
      break;
    case 'clipboard':
      await copyToClipboard(input);
      break;
    default:
      throw new SmartDataGridError('unknown-export-format', `Unsupported export format "${format}".`);
  }

  input.options.onComplete?.({ format, rows: input.rows.length });
}
