import { useEffect, useMemo, useRef, useState } from 'react';

interface UsePaginationResult<T> {
  page: number;
  setPage: (page: number) => void;
  perPage: number;
  setPerPage: (perPage: number) => void;
  totalPages: number;
  total: number;
  pageItems: T[];
  reset: () => void;
}

/**
 * Client-side pagination over an already-filtered array.
 * Clamps the page when the list shrinks; call `reset()` (or setPage(1))
 * when search/filter inputs change.
 */
export function usePagination<T>(items: T[], defaultPerPage = 15): UsePaginationResult<T> {
  const [page, setPageState] = useState(1);
  const [perPage, setPerPageState] = useState(defaultPerPage);

  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / perPage));
  const pageSafe = Math.min(Math.max(1, page), totalPages);

  const pageItems = useMemo(() => {
    const start = (pageSafe - 1) * perPage;
    return items.slice(start, start + perPage);
  }, [items, pageSafe, perPage]);

  const setPage = (next: number) => setPageState(Math.min(Math.max(1, next), totalPages));
  const setPerPage = (next: number) => {
    setPerPageState(next);
    setPageState(1);
  };
  const reset = () => setPageState(1);

  return { page: pageSafe, setPage, perPage, setPerPage, totalPages, total, pageItems, reset };
}

/**
 * Reset pagination whenever one of the dependency values changes
 * (skipped on first mount since the page already starts at 1).
 */
export function useResetPageOnChange(reset: () => void, deps: unknown[]): void {
  const key = JSON.stringify(deps);
  const firstRun = useRef(true);
  const resetRef = useRef(reset);
  resetRef.current = reset;

  useEffect(() => {
    if (firstRun.current) {
      firstRun.current = false;
      return;
    }
    resetRef.current();
  }, [key]);
}
