import type { PaginationState } from '../types';
import { clamp } from '../utils';

export function getPageCount(total: number, pageSize: number): number {
  if (pageSize <= 0) return 1;
  return Math.max(1, Math.ceil(total / pageSize));
}

export function paginateRows<T>(rows: T[], pagination: PaginationState): T[] {
  const { pageIndex, pageSize } = pagination;
  if (pageSize <= 0) return rows;
  const start = pageIndex * pageSize;
  return rows.slice(start, start + pageSize);
}

/** Keep the page index inside bounds after filters shrink the row set. */
export function clampPage(pagination: PaginationState, total: number): PaginationState {
  const pageCount = getPageCount(total, pagination.pageSize);
  const pageIndex = clamp(pagination.pageIndex, 0, pageCount - 1);
  return pageIndex === pagination.pageIndex ? pagination : { ...pagination, pageIndex };
}

export type PageToken = number | 'ellipsis';

/**
 * Page buttons to render: first, last, the current page and `siblingCount`
 * neighbours, with ellipses standing in for the gaps.
 */
export function getPageTokens(
  pageIndex: number,
  pageCount: number,
  siblingCount = 1,
): PageToken[] {
  const total = siblingCount * 2 + 5;
  if (pageCount <= total) return Array.from({ length: pageCount }, (_, i) => i);

  const left = Math.max(pageIndex - siblingCount, 0);
  const right = Math.min(pageIndex + siblingCount, pageCount - 1);
  const showLeftEllipsis = left > 1;
  const showRightEllipsis = right < pageCount - 2;

  const tokens: PageToken[] = [0];
  if (showLeftEllipsis) tokens.push('ellipsis');
  else for (let i = 1; i < left; i += 1) tokens.push(i);

  for (let i = Math.max(left, 1); i <= Math.min(right, pageCount - 2); i += 1) tokens.push(i);

  if (showRightEllipsis) tokens.push('ellipsis');
  else for (let i = right + 1; i < pageCount - 1; i += 1) tokens.push(i);

  tokens.push(pageCount - 1);
  return tokens;
}

export interface PageInfo {
  from: number;
  to: number;
  total: number;
  pageCount: number;
  pageIndex: number;
  pageSize: number;
  isFirst: boolean;
  isLast: boolean;
}

export function getPageInfo(pagination: PaginationState, total: number): PageInfo {
  const pageCount = getPageCount(total, pagination.pageSize);
  const from = total === 0 ? 0 : pagination.pageIndex * pagination.pageSize + 1;
  const to = Math.min((pagination.pageIndex + 1) * pagination.pageSize, total);
  return {
    from,
    to,
    total,
    pageCount,
    pageIndex: pagination.pageIndex,
    pageSize: pagination.pageSize,
    isFirst: pagination.pageIndex <= 0,
    isLast: pagination.pageIndex >= pageCount - 1,
  };
}
