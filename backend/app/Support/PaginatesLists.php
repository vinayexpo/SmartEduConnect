<?php

namespace App\Support;

use Illuminate\Database\Eloquent\Builder as EloquentBuilder;
use Illuminate\Database\Query\Builder as QueryBuilder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Backward-compatible list pagination.
 *
 * When the request contains `page` or `per_page`, the query is paginated and
 * the response is a `{ data, meta }` envelope. Otherwise the full mapped
 * collection is returned exactly as before, so existing clients keep working.
 *
 * Supported query params:
 * - page (int, default 1), per_page (int, default 15, max 100)
 * - search (string) matched with LIKE against `search` columns
 * - sort_by / sort_dir (asc|desc) validated against `sortable` columns
 * - exact-match filters via `filters` (request param => column)
 * - date_from / date_to (Y-m-d) applied with whereDate on `date_column`
 */
trait PaginatesLists
{
    /**
     * @param  callable  $map  fn ($row): array
     * @param array{
     *   search?: string[],
     *   filters?: array<string, string|array<int, string>>,
     *   date_column?: string|null,
     *   sortable?: string[],
     *   default_per_page?: int,
     *   max_per_page?: int
     * } $options
     */
    protected function paginatedListResponse(Request $request, EloquentBuilder|QueryBuilder $query, callable $map, array $options = []): JsonResponse
    {
        $query = $this->applyListOptions($request, $query, $options);

        if (! $this->wantsPagination($request)) {
            return response()->json($query->get()->map($map)->values());
        }

        return response()->json($this->presentPaginated($request, $query, $map, $options));
    }

    /**
     * Apply search / exact filters / date range / sorting to a query.
     * Returns the same query for chaining.
     */
    protected function applyListOptions(Request $request, EloquentBuilder|QueryBuilder $query, array $options = []): EloquentBuilder|QueryBuilder
    {
        $searchColumns = $options['search'] ?? [];
        $filters = $options['filters'] ?? [];
        $dateColumn = $options['date_column'] ?? null;
        $sortable = $options['sortable'] ?? [];

        $search = trim((string) $request->query('search', ''));
        if ($search !== '' && ! empty($searchColumns)) {
            $query->where(function ($q) use ($search, $searchColumns): void {
                foreach (array_values($searchColumns) as $i => $column) {
                    if ($i === 0) {
                        $q->where($column, 'like', "%{$search}%");
                    } else {
                        $q->orWhere($column, 'like', "%{$search}%");
                    }
                }
            });
        }

        foreach ($filters as $param => $column) {
            $value = $request->query($param);
            if ($value === null || $value === '' || $value === 'all') {
                continue;
            }
            if (is_array($value)) {
                $value = array_values(array_filter($value, fn ($v) => $v !== '' && $v !== 'all'));
                if (empty($value)) {
                    continue;
                }
                $query->whereIn($column, $value);
            } else {
                $query->where($column, $value);
            }
        }

        if ($dateColumn) {
            $dateFrom = $request->query('date_from');
            $dateTo = $request->query('date_to');
            if (is_string($dateFrom) && $dateFrom !== '') {
                $query->whereDate($dateColumn, '>=', $dateFrom);
            }
            if (is_string($dateTo) && $dateTo !== '') {
                $query->whereDate($dateColumn, '<=', $dateTo);
            }
        }

        $sortBy = $request->query('sort_by');
        $sortDir = strtolower((string) $request->query('sort_dir', 'desc')) === 'asc' ? 'asc' : 'desc';
        if (is_string($sortBy) && $sortBy !== '' && in_array($sortBy, $sortable, true)) {
            $query->reorder()->orderBy($sortBy, $sortDir);
        }

        return $query;
    }

    /**
     * Paginate an (already option-filtered) query and map items into a
     * `{ data, meta }` array. For composite payloads that embed the list
     * alongside other data.
     */
    protected function presentPaginated(Request $request, EloquentBuilder|QueryBuilder $query, callable $map, array $options = []): array
    {
        $defaultPerPage = $options['default_per_page'] ?? 15;
        $maxPerPage = $options['max_per_page'] ?? 100;

        $perPage = (int) $request->query('per_page', $defaultPerPage);
        $perPage = max(1, min($perPage, $maxPerPage));

        $paginator = $query->paginate($perPage);

        return [
            'data' => $paginator->getCollection()->map($map)->values()->all(),
            'meta' => [
                'current_page' => $paginator->currentPage(),
                'per_page' => $paginator->perPage(),
                'total' => $paginator->total(),
                'last_page' => $paginator->lastPage(),
                'from' => $paginator->firstItem(),
                'to' => $paginator->lastItem(),
            ],
        ];
    }

    protected function wantsPagination(Request $request): bool
    {
        return $request->query('page') !== null || $request->query('per_page') !== null;
    }

    /**
     * Unwrap a `{ data, meta }` envelope or a plain array into [items, meta|null].
     * Handy for controllers that compose multiple sources.
     *
     * @return array{0: array, 1: array|null}
     */
    protected function unwrapPaginated(mixed $decoded): array
    {
        if (is_array($decoded) && array_key_exists('data', $decoded) && array_key_exists('meta', $decoded)) {
            return [array_values($decoded['data']), $decoded['meta']];
        }

        return [array_values((array) $decoded), null];
    }
}
