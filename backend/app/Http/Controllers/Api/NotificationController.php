<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Support\PaginatesLists;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\StreamedResponse;
use Illuminate\Support\Facades\Schema;

class NotificationController extends Controller
{
    use PaginatesLists;

    public function index(Request $request): JsonResponse
    {
        if (! Schema::hasTable('notifications')) {
            return response()->json([]);
        }

        $map = function ($item) {
            // Convert created_at and updated_at to ISO 8601 format with timezone
            $item->created_at = \Carbon\Carbon::parse($item->created_at)->toIso8601String();
            if ($item->updated_at) {
                $item->updated_at = \Carbon\Carbon::parse($item->updated_at)->toIso8601String();
            }
            return $item;
        };

        $query = \DB::table('notifications')
            ->where('user_id', $request->user()->id)
            ->orderByDesc('created_at');

        if ($this->wantsPagination($request)) {
            return $this->paginatedListResponse(
                $request,
                $query,
                $map,
                [
                    'search' => ['title', 'message'],
                    'filters' => ['type' => 'type', 'is_read' => 'is_read'],
                    'date_column' => 'created_at',
                    'sortable' => ['created_at'],
                ]
            );
        }

        // Legacy mode: plain array capped by `limit` (default 20, max 200).
        $limit = (int) $request->query('limit', 20);
        $limit = max(1, min($limit, 200));

        return response()->json($query->limit($limit)->get()->map($map)->values());
    }

    public function stream(Request $request): StreamedResponse|JsonResponse
    {
        if (! Schema::hasTable('notifications')) {
            return response()->json(['message' => 'notifications table not found'], 422);
        }

        $userId = (int) $request->user()->id;

        return response()->stream(function () use ($userId): void {
            @set_time_limit(0);

            $lastState = $this->notificationStateForUser($userId);
            $startedAt = time();

            $this->sendSseEvent('connected', ['state' => $lastState]);

            while (! connection_aborted() && (time() - $startedAt) < 55) {
                $currentState = $this->notificationStateForUser($userId);

                if ($currentState !== $lastState) {
                    $lastState = $currentState;
                    $this->sendSseEvent('notifications-updated', ['state' => $currentState]);
                } else {
                    $this->sendSseEvent('ping', ['time' => now()->toIso8601String()]);
                }

                if (ob_get_level() > 0) {
                    @ob_flush();
                }
                flush();
                sleep(2);
            }
        }, 200, [
            'Content-Type' => 'text/event-stream',
            'Cache-Control' => 'no-cache, no-transform',
            'Connection' => 'keep-alive',
            'X-Accel-Buffering' => 'no',
        ]);
    }

    public function markRead(Request $request): JsonResponse
    {
        if (! Schema::hasTable('notifications')) {
            return response()->json(['message' => 'notifications table not found'], 422);
        }

        $validated = $request->validate([
            'id' => ['required', 'integer'],
        ]);

        \DB::table('notifications')
            ->where('id', $validated['id'])
            ->where('user_id', $request->user()->id)
            ->update(['is_read' => true, 'updated_at' => now()]);

        return response()->json(['message' => 'Marked as read']);
    }

    public function markAllRead(Request $request): JsonResponse
    {
        if (! Schema::hasTable('notifications')) {
            return response()->json(['message' => 'notifications table not found'], 422);
        }

        $validated = $request->validate([
            'ids' => ['required', 'array', 'min:1'],
            'ids.*' => ['integer'],
        ]);

        \DB::table('notifications')
            ->where('user_id', $request->user()->id)
            ->whereIn('id', $validated['ids'])
            ->update(['is_read' => true, 'updated_at' => now()]);

        return response()->json(['message' => 'All selected notifications marked as read']);
    }

    public function destroy(Request $request, int $id): JsonResponse
    {
        if (! Schema::hasTable('notifications')) {
            return response()->json(['message' => 'notifications table not found'], 422);
        }

        \DB::table('notifications')
            ->where('id', $id)
            ->where('user_id', $request->user()->id)
            ->delete();

        return response()->json(['message' => 'Deleted']);
    }

    public function deleteRead(Request $request): JsonResponse
    {
        if (! Schema::hasTable('notifications')) {
            return response()->json(['message' => 'notifications table not found'], 422);
        }

        $validated = $request->validate([
            'ids' => ['required', 'array', 'min:1'],
            'ids.*' => ['integer'],
        ]);

        \DB::table('notifications')
            ->where('user_id', $request->user()->id)
            ->where('is_read', true)
            ->whereIn('id', $validated['ids'])
            ->delete();

        return response()->json(['message' => 'Deleted read notifications']);
    }

    private function notificationStateForUser(int $userId): array
    {
        $row = \DB::table('notifications')
            ->where('user_id', $userId)
            ->selectRaw('COALESCE(MAX(id), 0) as latest_id')
            ->selectRaw('COALESCE(MAX(updated_at), MAX(created_at)) as latest_activity_at')
            ->selectRaw('SUM(CASE WHEN is_read = 0 THEN 1 ELSE 0 END) as unread_count')
            ->first();

        return [
            'latest_id' => (int) ($row->latest_id ?? 0),
            'latest_activity_at' => $row->latest_activity_at,
            'unread_count' => (int) ($row->unread_count ?? 0),
        ];
    }

    private function sendSseEvent(string $event, array $payload): void
    {
        echo "event: {$event}\n";
        echo 'data: '.json_encode($payload, JSON_UNESCAPED_UNICODE)."\n\n";
    }
}
