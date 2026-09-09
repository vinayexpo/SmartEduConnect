<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ApiToken;
use App\Models\Profile;
use App\Models\Student;
use App\Models\Teacher;
use App\Models\User;
use App\Models\UserRole;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;

class AuthController extends Controller
{
    public function adminExists(): JsonResponse
    {
        return response()->json([
            'exists' => UserRole::where('role', 'admin')->exists(),
        ]);
    }

    public function register(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'full_name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', 'unique:users,email'],
            'password' => ['required', 'string', 'min:8'],
            'role' => ['nullable', Rule::in(['admin', 'teacher', 'parent'])],
        ]);

        $role = $validated['role'] ?? 'parent';
        if (UserRole::where('role', 'admin')->count() === 0) {
            $role = 'admin';
        }

        $user = User::create([
            'name' => $validated['full_name'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
        ]);

        Profile::create([
            'user_id' => $user->id,
            'full_name' => $validated['full_name'],
            'email' => $validated['email'],
        ]);

        UserRole::create([
            'user_id' => $user->id,
            'role' => $role,
        ]);

        $plainToken = self::issueDeviceToken($user, $request->input('device_name'));

        return response()->json([
            'token' => $plainToken,
            'user' => $user->load(['profile', 'role']),
        ], 201);
    }

    public function login(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required', 'string'],
        ]);

        $user = User::where('email', $validated['email'])->first();

        if (! $user || ! Hash::check($validated['password'], $user->password)) {
            return response()->json(['message' => 'Invalid credentials'], 422);
        }

        $plainToken = self::issueDeviceToken($user, $request->input('device_name'));

        return response()->json([
            'token' => $plainToken,
            'user' => $user->load(['profile', 'role']),
        ]);
    }

    public function resolveTeacherEmail(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'teacher_id' => ['required', 'string'],
        ]);

        $teacherIdentifier = strtoupper(trim($validated['teacher_id']));

        $teacher = Teacher::whereRaw('UPPER(teacher_id) = ?', [$teacherIdentifier])->first();

        if (! $teacher || ! $teacher->user_id) {
            return response()->json(['message' => 'Teacher not found'], 404);
        }

        $email = User::where('id', $teacher->user_id)->value('email')
            ?: Profile::where('user_id', $teacher->user_id)->value('email');

        if (! $email) {
            return response()->json(['message' => 'Teacher email not found'], 404);
        }

        return response()->json(['email' => $email]);
    }

    public function resolveParentEmail(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'student_identifier' => ['required', 'string'],
        ]);

        $studentIdentifier = strtoupper(trim($validated['student_identifier']));

        $student = Student::whereRaw('UPPER(admission_number) = ?', [$studentIdentifier])
            ->orWhereRaw('UPPER(login_id) = ?', [$studentIdentifier])
            ->first();

        if (! $student) {
            return response()->json(['message' => 'Student not found'], 404);
        }

        $parentUserId = DB::table('student_parents')
            ->join('parents', 'parents.id', '=', 'student_parents.parent_id')
            ->where('student_parents.student_id', $student->id)
            ->value('parents.user_id');

        if (! $parentUserId) {
            return response()->json(['message' => 'Parent account not found'], 404);
        }

        $email = User::where('id', $parentUserId)->value('email')
            ?: Profile::where('user_id', $parentUserId)->value('email');

        if (! $email) {
            return response()->json(['message' => 'Parent email not found'], 404);
        }

        return response()->json(['email' => $email]);
    }

    public function me(Request $request): JsonResponse
    {
        return response()->json([
            'user' => $request->user()->load(['profile', 'role']),
        ]);
    }

    public function logout(Request $request): JsonResponse
    {
        $user = $request->user();
        $presented = $request->bearerToken() ?: $request->query('access_token');

        if ($presented) {
            // Revoke only this device's token; other devices stay signed in.
            ApiToken::where('user_id', $user->id)
                ->where('token', hash('sha256', $presented))
                ->delete();

            // Legacy single-token sessions stored on users.api_token.
            if ($user->api_token && hash_equals($user->api_token, hash('sha256', $presented))) {
                $user->api_token = null;
                $user->save();
            }
        }

        return response()->json(['message' => 'Logged out']);
    }

    /**
     * Log the user out of every device, including legacy sessions.
     */
    public function logoutEverywhere(Request $request): JsonResponse
    {
        $user = $request->user();
        ApiToken::where('user_id', $user->id)->delete();
        $user->api_token = null;
        $user->save();

        return response()->json(['message' => 'Logged out from all devices']);
    }

    /**
     * Create one token row per login so multiple devices stay signed in.
     * Each token carries an absolute expiry (AUTH_TOKEN_TTL_MINUTES, default
     * 12 hours). A value of 0 (or less) means a lifetime token that never
     * expires. Also prunes the user's expired rows and keeps at most 20
     * active tokens to bound table growth.
     */
    private static function issueDeviceToken(User $user, mixed $deviceName): string
    {
        $plainToken = bin2hex(random_bytes(40));
        $ttl = self::tokenTtlMinutes();

        ApiToken::create([
            'user_id' => $user->id,
            'token' => hash('sha256', $plainToken),
            'name' => is_string($deviceName) ? substr($deviceName, 0, 255) : null,
            'expires_at' => $ttl > 0 ? now()->addMinutes($ttl) : null,
        ]);

        ApiToken::where('user_id', $user->id)
            ->where('expires_at', '<', now())
            ->delete();

        $keep = ApiToken::where('user_id', $user->id)->orderByDesc('id')->take(20)->pluck('id');
        ApiToken::where('user_id', $user->id)->whereNotIn('id', $keep)->delete();

        return $plainToken;
    }

    public static function tokenTtlMinutes(): int
    {
        return (int) env('AUTH_TOKEN_TTL_MINUTES', 720);
    }
}
