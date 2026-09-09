<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Support\ImportRowException;
use App\Support\ImportsRows;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

/**
 * Tabular bulk imports. The frontend parses the spreadsheet and POSTs
 * `{ rows: [...] }` with API-shaped fields; each row is validated and
 * created independently with per-row errors in the response.
 */
class BulkImportController extends Controller
{
    use ImportsRows;

    public function students(Request $request): JsonResponse
    {
        return $this->importRows(
            $request,
            'rows',
            [
                'full_name' => ['required', 'string', 'max:255'],
                'password' => ['required', 'string', 'min:4'],
                'class' => ['required', 'string'],
                'email' => ['nullable', 'email', 'max:255'],
                'date_of_birth' => ['nullable', 'date'],
                'address' => ['nullable', 'string'],
                'blood_group' => ['nullable', 'string', 'max:10'],
                'parent_name' => ['nullable', 'string', 'max:255'],
                'parent_phone' => ['nullable', 'string', 'max:30'],
                'emergency_contact' => ['nullable', 'string', 'max:30'],
                'emergency_contact_name' => ['nullable', 'string', 'max:255'],
            ],
            function (array $row): void {
                $classId = $this->resolveClassId($row['class']);
                if (! $classId) {
                    throw new ImportRowException("Unknown class '{$row['class']}'. Use the 'Name - Section' label from Classes.", 'class');
                }

                $payload = $row;
                $payload['class_id'] = $classId;
                unset($payload['class']);

                $subRequest = Request::create('/admin/students', 'POST', $payload);
                $response = app(TeacherPortalController::class)->createStudent($subRequest);

                if ($response->getStatusCode() !== 201) {
                    $message = (string) (json_decode($response->getContent(), true)['message'] ?? 'Failed to create student');
                    throw new ImportRowException($message, 'full_name');
                }
            }
        );
    }

    public function teachers(Request $request): JsonResponse
    {
        return $this->importRows(
            $request,
            'rows',
            [
                'full_name' => ['required', 'string', 'max:100'],
                'email' => ['nullable', 'email', 'max:255'],
                'phone' => ['required', 'string', 'min:10', 'max:30'],
                'qualification' => ['required', 'string', 'max:255'],
                'password' => ['required', 'string', 'min:6'],
                'subjects' => ['required', 'string'],
                'classes' => ['nullable', 'string'],
                'class_teacher_of' => ['nullable', 'string'],
            ],
            function (array $row): void {
                $classTeacherOf = null;
                if (! empty($row['class_teacher_of'])) {
                    $classTeacherOf = $this->resolveClassId($row['class_teacher_of']);
                    if (! $classTeacherOf) {
                        throw new ImportRowException("Unknown class '{$row['class_teacher_of']}'.", 'class_teacher_of');
                    }
                }

                $assignedClassIds = [];
                if (! empty($row['classes'])) {
                    foreach (preg_split('/[;,]/', $row['classes']) as $label) {
                        $label = trim($label);
                        if ($label === '') {
                            continue;
                        }
                        $classId = $this->resolveClassId($label);
                        if (! $classId) {
                            throw new ImportRowException("Unknown class '{$label}'.", 'classes');
                        }
                        $assignedClassIds[] = $classId;
                    }
                }

                $payload = [
                    'full_name' => $row['full_name'],
                    'email' => $row['email'] ?? null,
                    'phone' => $row['phone'],
                    'qualification' => $row['qualification'],
                    'password' => $row['password'],
                    'subjects' => str_replace(';', ',', $row['subjects']),
                    'class_teacher_of' => $classTeacherOf,
                ];

                $subRequest = Request::create('/teachers/management', 'POST', $payload);
                $response = app(TeacherManagementController::class)->store($subRequest);

                if ($response->getStatusCode() !== 201) {
                    $message = (string) (json_decode($response->getContent(), true)['message'] ?? 'Failed to create teacher');
                    throw new ImportRowException($message, 'full_name');
                }

                $teacherId = (int) (json_decode($response->getContent(), true)['id'] ?? 0);
                foreach (array_unique($assignedClassIds) as $classId) {
                    DB::table('teacher_classes')->updateOrInsert(
                        ['teacher_id' => $teacherId, 'class_id' => $classId],
                        ['updated_at' => now(), 'created_at' => now()]
                    );
                }
            }
        );
    }

    /**
     * Resolve a class label like "5 - A", "5-A" or "5" to its id.
     */
    private function resolveClassId(string $label): ?int
    {
        $label = trim($label);
        $classes = DB::table('classes')->select('id', 'name', 'section')->get();

        $normalized = strtolower(str_replace(' ', '', $label));
        foreach ($classes as $class) {
            $candidates = [
                strtolower(str_replace(' ', '', "{$class->name} - {$class->section}")),
                strtolower(str_replace(' ', '', "{$class->name}-{$class->section}")),
                strtolower(str_replace(' ', '', (string) $class->name)),
            ];
            if (in_array($normalized, $candidates, true)) {
                return (int) $class->id;
            }
        }

        return null;
    }
}
