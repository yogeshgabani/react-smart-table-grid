import type { ResolvedColumn, SearchMode, SearchState } from '../types';
import { escapeRegExp, toText } from '../utils';

/**
 * Subsequence match with a quality score — "jdoe" matches "John Doe".
 * Consecutive and word-boundary hits score higher, so better matches win.
 */
export function fuzzyScore(text: string, query: string): number {
  if (!query) return 1;
  const haystack = text.toLowerCase();
  const needle = query.toLowerCase();

  const direct = haystack.indexOf(needle);
  if (direct !== -1) {
    // Exact substring: near-perfect, favouring matches at the start.
    return 1000 - direct;
  }

  let score = 0;
  let cursor = 0;
  let streak = 0;

  for (let i = 0; i < needle.length; i += 1) {
    const char = needle[i];
    const found = haystack.indexOf(char, cursor);
    if (found === -1) return 0;
    if (found === cursor && cursor > 0) {
      streak += 1;
      score += 5 + streak * 2;
    } else {
      streak = 0;
      score += 1;
      // Reward matches that begin a word.
      if (found === 0 || /[\s\-_./]/.test(haystack[found - 1])) score += 3;
    }
    cursor = found + 1;
  }
  return score;
}

export function matchesTerm(value: unknown, term: string, mode: SearchMode): boolean {
  if (!term) return true;
  const text = toText(value).toLowerCase();
  const needle = term.toLowerCase();

  switch (mode) {
    case 'exact':
      return text === needle;
    case 'startsWith':
      return text.startsWith(needle);
    case 'fuzzy':
      return fuzzyScore(text, needle) > 0;
    case 'words':
      return needle.split(/\s+/).filter(Boolean).every((word) => text.includes(word));
    case 'contains':
    default:
      return text.includes(needle);
  }
}

export interface SearchInput<T> {
  rows: T[];
  search: SearchState;
  columns: ResolvedColumn<T>[];
  mode?: SearchMode;
}

/** Apply the global query and any per-column queries. */
export function searchRows<T>({ rows, search, columns, mode = 'contains' }: SearchInput<T>): T[] {
  const query = search.query.trim();
  const columnEntries = Object.entries(search.columns).filter(([, term]) => term.trim() !== '');

  if (!query && columnEntries.length === 0) return rows;

  const searchable = columns.filter((column) => column.searchable !== false);
  const byId = new Map(columns.map((column) => [column.id, column]));

  let result = rows;

  if (columnEntries.length > 0) {
    result = result.filter((row) =>
      columnEntries.every(([columnId, term]) => {
        const column = byId.get(columnId);
        if (!column) return true;
        return matchesTerm(column.getValue(row, 0), term.trim(), mode);
      }),
    );
  }

  if (!query) return result;

  if (mode === 'fuzzy') {
    // Rank by best-scoring column so the most relevant rows surface first.
    const scored: Array<{ row: T; score: number }> = [];
    for (const row of result) {
      let best = 0;
      for (const column of searchable) {
        const score = fuzzyScore(toText(column.getValue(row, 0)), query);
        if (score > best) best = score;
      }
      if (best > 0) scored.push({ row, score: best });
    }
    scored.sort((a, b) => b.score - a.score);
    return scored.map((entry) => entry.row);
  }

  return result.filter((row) =>
    searchable.some((column) => matchesTerm(column.getValue(row, 0), query, mode)),
  );
}

export interface HighlightChunk {
  text: string;
  match: boolean;
}

/** Split text into matched / unmatched chunks for search highlighting. */
export function highlightChunks(text: string, query: string): HighlightChunk[] {
  if (!query.trim() || !text) return [{ text, match: false }];

  const pattern = new RegExp(`(${escapeRegExp(query.trim())})`, 'ig');
  const parts = text.split(pattern);
  const needle = query.trim().toLowerCase();

  return parts
    .filter((part) => part !== '')
    .map((part) => ({ text: part, match: part.toLowerCase() === needle }));
}

export const emptySearchState: SearchState = { query: '', columns: {} };
