import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface DataPaginationProps {
  page: number;
  totalPages: number;
  total: number;
  perPage: number;
  onPageChange: (page: number) => void;
  onPerPageChange?: (perPage: number) => void;
  perPageOptions?: number[];
}

function pageNumbers(page: number, totalPages: number): (number | 'ellipsis')[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }
  const siblings = new Set<number>([1, 2, page - 1, page, page + 1, totalPages - 1, totalPages]);
  const sorted = [...siblings].filter((n) => n >= 1 && n <= totalPages).sort((a, b) => a - b);
  const result: (number | 'ellipsis')[] = [];
  let prev = 0;
  for (const n of sorted) {
    if (n - prev > 1) result.push('ellipsis');
    result.push(n);
    prev = n;
  }
  return result;
}

/** Shared pagination footer: numbered pages + total + rows-per-page. */
export default function DataPagination({
  page,
  totalPages,
  total,
  perPage,
  onPageChange,
  onPerPageChange,
  perPageOptions = [10, 15, 25, 50],
}: DataPaginationProps) {
  if (total === 0) return null;

  const from = (page - 1) * perPage + 1;
  const to = Math.min(page * perPage, total);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4">
      <p className="text-sm text-muted-foreground order-2 sm:order-1">
        Showing {from}–{to} of {total}
      </p>
      <div className="order-1 sm:order-2 flex items-center gap-3">
        {onPerPageChange && (
          <Select value={String(perPage)} onValueChange={(v) => onPerPageChange(Number(v))}>
            <SelectTrigger className="w-[110px] h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {perPageOptions.map((n) => (
                <SelectItem key={n} value={String(n)}>
                  {n} / page
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        <Pagination className="mx-0 w-auto">
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  if (page > 1) onPageChange(page - 1);
                }}
                className={page <= 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
              />
            </PaginationItem>
            {pageNumbers(page, totalPages).map((n, i) =>
              n === 'ellipsis' ? (
                <PaginationItem key={`e-${i}`}>
                  <PaginationEllipsis />
                </PaginationItem>
              ) : (
                <PaginationItem key={n}>
                  <PaginationLink
                    href="#"
                    isActive={n === page}
                    onClick={(e) => {
                      e.preventDefault();
                      onPageChange(n);
                    }}
                    className="cursor-pointer"
                  >
                    {n}
                  </PaginationLink>
                </PaginationItem>
              ),
            )}
            <PaginationItem>
              <PaginationNext
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  if (page < totalPages) onPageChange(page + 1);
                }}
                className={page >= totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>
    </div>
  );
}
