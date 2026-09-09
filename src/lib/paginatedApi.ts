import { useEffect, useState } from 'react';

/** Paginated envelope returned by the backend when `page`/`per_page` is sent. */
export interface PageMeta {
  current_page: number;
  per_page: number;
  total: number;
  last_page: number;
  from: number | null;
  to: number | null;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: PageMeta;
}

export function isPaginatedResponse<T>(value: unknown): value is PaginatedResponse<T> {
  return (
    typeof value === 'object' &&
    value !== null &&
    Array.isArray((value as { data?: unknown }).data) &&
    typeof (value as { meta?: unknown }).meta === 'object'
  );
}

/** Accept either a legacy plain array or a `{ data, meta }` envelope. */
export function unwrapList<T>(response: T[] | PaginatedResponse<T> | null | undefined): {
  items: T[];
  meta: PageMeta | null;
} {
  if (isPaginatedResponse<T>(response)) {
    return { items: response.data, meta: response.meta };
  }
  return { items: Array.isArray(response) ? response : [], meta: null };
}

export interface ListQuery {
  page?: number;
  perPage?: number;
  search?: string;
  sortBy?: string;
  sortDir?: 'asc' | 'desc';
  filters?: Record<string, string | number | undefined>;
  dateFrom?: string;
  dateTo?: string;
}

/** Serialize list query params (`page`, `per_page`, `search`, filters...). */
export function buildListQuery(query: ListQuery): string {
  const params = new URLSearchParams();
  if (query.page !== undefined) params.set('page', String(query.page));
  if (query.perPage !== undefined) params.set('per_page', String(query.perPage));
  if (query.search && query.search.trim() !== '') params.set('search', query.search.trim());
  if (query.sortBy) params.set('sort_by', query.sortBy);
  if (query.sortDir) params.set('sort_dir', query.sortDir);
  if (query.filters) {
    for (const [key, value] of Object.entries(query.filters)) {
      if (value !== undefined && value !== '' && value !== 'all') {
        params.set(key, String(value));
      }
    }
  }
  if (query.dateFrom) params.set('date_from', query.dateFrom);
  if (query.dateTo) params.set('date_to', query.dateTo);
  const serialized = params.toString();
  return serialized ? `?${serialized}` : '';
}

/** Debounce a value (e.g. search input) to avoid a request per keystroke. */
export function useDebouncedValue<T>(value: T, delayMs = 400): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);

  return debounced;
}
