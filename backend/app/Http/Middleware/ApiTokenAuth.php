<?php

namespace App\Http\Middleware;

use App\Models\ApiToken;
use App\Models\User;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class ApiTokenAuth
{
    public function handle(Request $request, Closure $next): Response
    {
        $token = $request->bearerToken() ?: $request->query('access_token');

        if (! $token) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }

        $hashed = hash('sha256', $token);

        // Per-device tokens (multiple simultaneous sessions).
        $tokenRow = ApiToken::with('user.profile', 'user.role')
            ->where('token', $hashed)
            ->first();

        if ($tokenRow) {
            if ($tokenRow->isExpired() || ! $tokenRow->user) {
                $tokenRow->delete();

                return response()->json(['message' => 'Session expired. Please log in again.'], 401);
            }

            auth()->setUser($tokenRow->user);

            return $next($request);
        }

        // Legacy single token stored on users.api_token.
        $user = User::with(['profile', 'role'])->where('api_token', $hashed)->first();

        if (! $user) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }

        auth()->setUser($user);

        return $next($request);
    }
}
