<?php

namespace App\Http\Controllers\Api;

use App\Support\HandlesUploadStorage;
use App\Support\ImportRowException;
use App\Support\ImportsRows;
use App\Support\PaginatesLists;
use App\Http\Controllers\Controller;
use App\Services\NotificationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class FeesController extends Controller
{
    use HandlesUploadStorage;
    use ImportsRows;
    use PaginatesLists;

    /** @var array<int> */
    private array $importNotifyStudentIds = [];

    public function managementData(Request $request): JsonResponse
    {
        $mapFee = fn($row) => [
            "id" => (string) $row->id,
            "student_id" => (string) $row->student_id,
            "fee_type" => $row->fee_type,
            "amount" => (float) $row->amount,
            "discount" =>
                $row->discount !== null
                    ? (float) $row->discount
                    : null,
            "paid_amount" =>
                $row->paid_amount !== null
                    ? (float) $row->paid_amount
                    : null,
            "due_date" => $row->due_date,
            "payment_status" => $row->payment_status,
            "paid_at" => $row->paid_at,
            "receipt_number" => $row->receipt_number,
            "assigned_class_id" => $row->assigned_class_id !== null ? (string) $row->assigned_class_id : null,
            "students" => $row->student_name
                ? [
                    "full_name" => $row->student_name,
                    "admission_number" => $row->admission_number,
                    "login_id" => $row->login_id,
                    "classes" => $row->assigned_class_name
                        ? [
                            "id" => (string) $row->assigned_class_id_ref,
                            "name" => $row->assigned_class_name,
                            "section" => $row->assigned_class_section,
                        ]
                        : null,
                    "current_class" => $row->current_class_name
                        ? [
                            "id" => (string) $row->current_class_id_ref,
                            "name" => $row->current_class_name,
                            "section" => $row->current_class_section,
                        ]
                        : null,
                ]
                : null,
        ];

        $feeOptions = [
            "search" => ["students.full_name", "students.admission_number", "fees.fee_type", "fees.receipt_number"],
            "filters" => ["payment_status" => "fees.payment_status", "fee_type" => "fees.fee_type", "class_id" => "fees.assigned_class_id", "student_id" => "fees.student_id"],
            "date_column" => "fees.due_date",
            "sortable" => ["fees.due_date", "fees.created_at", "fees.amount"],
        ];

        $fees = collect();
        if (Schema::hasTable("fees")) {
            $query = DB::table("fees")
                ->leftJoin("students", "students.id", "=", "fees.student_id")
                ->leftJoin("classes as assigned_classes", "assigned_classes.id", "=", "fees.assigned_class_id")
                ->leftJoin("classes as current_classes", "current_classes.id", "=", "students.class_id")
                ->select(
                    "fees.*",
                    "students.full_name as student_name",
                    "students.admission_number",
                    "students.login_id",
                    "assigned_classes.id as assigned_class_id_ref",
                    "assigned_classes.name as assigned_class_name",
                    "assigned_classes.section as assigned_class_section",
                    "current_classes.id as current_class_id_ref",
                    "current_classes.name as current_class_name",
                    "current_classes.section as current_class_section",
                )
                ->orderByDesc("fees.due_date");

            $query = $this->applyListOptions($request, $query, $feeOptions);

            $fees = $this->wantsPagination($request)
                ? $this->presentPaginated($request, $query, $mapFee, $feeOptions)
                : $query->get()->map($mapFee)->values();
        }

        $classes = Schema::hasTable("classes")
            ? DB::table("classes")
                ->select("id", "name", "section")
                ->orderBy("name")
                ->get()
                ->map(
                    fn($row) => [
                        "id" => (string) $row->id,
                        "name" => $row->name,
                        "section" => $row->section,
                    ],
                )
            : collect();

        return response()->json([
            "fees" => $fees,
            "classes" => $classes,
        ]);
    }

    public function classStudents(Request $request): JsonResponse
    {
        if (!Schema::hasTable("students")) {
            return response()->json(["students" => []]);
        }

        $validated = $request->validate([
            "class_ids" => ["required", "array", "min:1"],
        ]);

        $students = DB::table("students")
            ->whereIn("class_id", $validated["class_ids"])
            ->where("status", "active")
            ->select("id", "full_name", "admission_number")
            ->orderBy("full_name")
            ->get()
            ->map(
                fn($row) => [
                    "id" => (string) $row->id,
                    "full_name" => $row->full_name,
                    "admission_number" => $row->admission_number,
                ],
            );

        return response()->json(["students" => $students]);
    }

    public function createBulk(Request $request): JsonResponse
    {
        if (!Schema::hasTable("fees")) {
            return response()->json(["message" => "fees table not found"], 422);
        }

        $validated = $request->validate([
            "records" => ["required", "array", "min:1"],
            "records.*.student_id" => ["required"],
            "records.*.fee_type" => ["required", "string", "max:255"],
            "records.*.amount" => ["required", "numeric", "min:0"],
            "records.*.discount" => ["nullable", "numeric", "min:0"],
            "records.*.due_date" => ["required", "date"],
            "records.*.reminder_days_before" => [
                "nullable",
                "integer",
                "min:0",
            ],
        ]);

        $studentClassMap = DB::table('students')
            ->whereIn('id', collect($validated['records'])->pluck('student_id')->all())
            ->pluck('class_id', 'id');

        $rows = collect($validated["records"])
            ->map(
                fn($row) => [
                    "student_id" => $row["student_id"],
                    "assigned_class_id" => $studentClassMap[$row['student_id']] ?? null,
                    "fee_type" => $row["fee_type"],
                    "amount" => $row["amount"],
                    "discount" => $row["discount"] ?? 0,
                    "paid_amount" => 0,
                    "due_date" => $row["due_date"],
                    "payment_status" => "unpaid",
                    "reminder_days_before" => $row["reminder_days_before"] ?? 0,
                    "created_at" => now(),
                    "updated_at" => now(),
                ],
            )
            ->all();

        DB::table("fees")->insert($rows);

        $studentIds = collect($validated["records"])
            ->pluck("student_id")
            ->unique()
            ->values()
            ->all();
        if (
            !empty($studentIds) &&
            Schema::hasTable("student_parents") &&
            Schema::hasTable("parents")
        ) {
            $parentUserIds = DB::table("student_parents")
                ->join(
                    "parents",
                    "parents.id",
                    "=",
                    "student_parents.parent_id",
                )
                ->whereIn("student_parents.student_id", $studentIds)
                ->pluck("parents.user_id")
                ->map(fn($v) => (int) $v)
                ->all();

            app(NotificationService::class)->notifyUsers(
                $parentUserIds,
                "New fee assigned",
                "A new fee has been assigned. Please review due dates in Fees.",
                [
                    "type" => "fee",
                    "link" => "/parent/fees",
                    "entity_type" => "fee",
                    "priority" => "high",
                    "channel" => "both",
                ],
            );
        }

        return response()->json(["count" => count($rows)], 201);
    }

    /**
     * Bulk fee assignment import. Each row carries either `class`
     * (a "Name - Section" label, applied to every active student in it)
     * or `admission_number` (single student).
     */
    public function importFees(Request $request): JsonResponse
    {
        if (! Schema::hasTable('fees')) {
            return response()->json(['message' => 'fees table not found'], 422);
        }

        $this->importNotifyStudentIds = [];

        $response = $this->importRows(
            $request,
            'rows',
            [
                'fee_type' => ['required', 'string', 'max:255'],
                'amount' => ['required', 'numeric', 'min:0'],
                'discount' => ['nullable', 'numeric', 'min:0'],
                'due_date' => ['required', 'date'],
                'class' => ['nullable', 'string'],
                'admission_number' => ['nullable', 'string'],
            ],
            function (array $row): void {
                $studentIds = $this->resolveFeeScope($row);

                $students = DB::table('students')->whereIn('id', $studentIds)->pluck('class_id', 'id');
                if ($students->isEmpty()) {
                    throw new ImportRowException('Scope resolved to no students.', 'class');
                }

                $rows = [];
                foreach ($students as $studentId => $classId) {
                    $rows[] = [
                        'student_id' => $studentId,
                        'assigned_class_id' => $classId,
                        'fee_type' => $row['fee_type'],
                        'amount' => $row['amount'],
                        'discount' => $row['discount'] ?? 0,
                        'paid_amount' => 0,
                        'due_date' => $row['due_date'],
                        'payment_status' => 'unpaid',
                        'reminder_days_before' => 0,
                        'created_at' => now(),
                        'updated_at' => now(),
                    ];
                    $this->importNotifyStudentIds[] = (int) $studentId;
                }
                DB::table('fees')->insert($rows);
            }
        );

        $studentIds = array_values(array_unique($this->importNotifyStudentIds));
        if (! empty($studentIds) && Schema::hasTable('student_parents') && Schema::hasTable('parents')) {
            $parentUserIds = DB::table('student_parents')
                ->join('parents', 'parents.id', '=', 'student_parents.parent_id')
                ->whereIn('student_parents.student_id', $studentIds)
                ->pluck('parents.user_id')
                ->map(fn ($v) => (int) $v)
                ->all();

            app(NotificationService::class)->notifyUsers(
                $parentUserIds,
                'New fee assigned',
                'A new fee has been assigned. Please review due dates in Fees.',
                [
                    'type' => 'fee',
                    'link' => '/parent/fees',
                    'entity_type' => 'fee',
                    'priority' => 'high',
                    'channel' => 'both',
                ]
            );
        }

        return $response;
    }

    /**
     * @param array<string, mixed> $row
     * @return array<int>
     */
    private function resolveFeeScope(array $row): array
    {
        if (! empty($row['admission_number'])) {
            $student = DB::table('students')->where('admission_number', $row['admission_number'])->first();
            if (! $student) {
                throw new ImportRowException("Unknown admission number '{$row['admission_number']}'.", 'admission_number');
            }

            return [(int) $student->id];
        }

        if (! empty($row['class'])) {
            $classId = $this->resolveClassId((string) $row['class']);
            if (! $classId) {
                throw new ImportRowException("Unknown class '{$row['class']}'.", 'class');
            }

            return DB::table('students')
                ->where('class_id', $classId)
                ->where('status', 'active')
                ->pluck('id')
                ->map(fn ($v) => (int) $v)
                ->all();
        }

        throw new ImportRowException("Provide either 'class' or 'admission_number'.", 'class');
    }

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

    public function update(Request $request, int $id): JsonResponse
    {
        if (!Schema::hasTable("fees")) {
            return response()->json(["message" => "fees table not found"], 422);
        }

        $validated = $request->validate([
            "fee_type" => ["nullable", "string", "max:255"],
            "amount" => ["nullable", "numeric", "min:0"],
            "discount" => ["nullable", "numeric", "min:0"],
            "due_date" => ["nullable", "date"],
        ]);

        $update = $validated;
        $update["updated_at"] = now();

        DB::table("fees")->where("id", $id)->update($update);

        return response()->json(["message" => "Updated"]);
    }

    public function deleteBatch(Request $request): JsonResponse
    {
        if (!Schema::hasTable("fees")) {
            return response()->json(["message" => "fees table not found"], 422);
        }

        $validated = $request->validate([
            "fee_ids" => ["required", "array", "min:1"],
        ]);

        if (Schema::hasTable("fee_payments")) {
            DB::table("fee_payments")
                ->whereIn("fee_id", $validated["fee_ids"])
                ->delete();
        }
        DB::table("fees")->whereIn("id", $validated["fee_ids"])->delete();

        return response()->json(["message" => "Deleted"]);
    }

    public function recordPayment(Request $request, int $id): JsonResponse
    {
        if (!Schema::hasTable("fees")) {
            return response()->json(["message" => "fees table not found"], 422);
        }

        $validated = $request->validate([
            "amount" => ["required", "numeric", "min:0.01"],
            "payment_method" => ["nullable", "string", "max:50"],
        ]);

        $fee = DB::table("fees")->where("id", $id)->first();
        if (!$fee) {
            return response()->json(["message" => "Fee not found"], 404);
        }

        $netAmount = (float) $fee->amount - (float) ($fee->discount ?? 0);
        $alreadyPaid = (float) ($fee->paid_amount ?? 0);
        $remaining = max(0, $netAmount - $alreadyPaid);
        $enteredAmount = (float) $validated["amount"];

        if ($enteredAmount > $remaining) {
            return response()->json(
                ["message" => "Amount exceeds remaining balance"],
                422,
            );
        }

        $newTotalPaid = $alreadyPaid + $enteredAmount;
        $newStatus = $newTotalPaid >= $netAmount ? "paid" : "partial";
        $receiptNumber = "RCP" . substr((string) now()->timestamp, -8);
        $paidAt = now();

        DB::table("fees")
            ->where("id", $id)
            ->update([
                "paid_amount" => $newTotalPaid,
                "payment_status" => $newStatus,
                "paid_at" => $paidAt,
                "receipt_number" => $receiptNumber,
                "updated_at" => now(),
            ]);

        if (Schema::hasTable("fee_payments")) {
            DB::table("fee_payments")->insert([
                "fee_id" => $id,
                "student_id" => $fee->student_id,
                "amount" => $enteredAmount,
                "payment_method" => $validated["payment_method"] ?? "cash",
                "receipt_number" => $receiptNumber,
                "paid_at" => $paidAt,
                "recorded_by" => $request->user()->id,
                "created_at" => now(),
                "updated_at" => now(),
            ]);
        }

        if (
            Schema::hasTable("student_parents") &&
            Schema::hasTable("parents")
        ) {
            $parentUserIds = DB::table("student_parents")
                ->join(
                    "parents",
                    "parents.id",
                    "=",
                    "student_parents.parent_id",
                )
                ->where("student_parents.student_id", $fee->student_id)
                ->pluck("parents.user_id")
                ->map(fn($v) => (int) $v)
                ->all();

            app(NotificationService::class)->notifyUsers(
                $parentUserIds,
                "Fee payment updated",
                "A payment of " .
                    $enteredAmount .
                    " has been recorded. Receipt: " .
                    $receiptNumber,
                [
                    "type" => "fee",
                    "link" => "/parent/fees",
                    "entity_type" => "fee_payment",
                    "entity_id" => $id,
                    "priority" => "normal",
                    "channel" => "both",
                ],
            );
        }

        return response()->json([
            "receipt_number" => $receiptNumber,
            "status" => $newStatus,
        ]);
    }

    public function payments(Request $request): JsonResponse
    {
        $validated = $request->validate([
            "fee_ids" => ["required", "array", "min:1"],
        ]);

        $rows = Schema::hasTable("fee_payments")
            ? DB::table("fee_payments")
                ->whereIn("fee_id", $validated["fee_ids"])
                ->select(
                    "id",
                    "amount",
                    "payment_method",
                    "receipt_number",
                    "paid_at",
                )
                ->orderByDesc("paid_at")
                ->get()
                ->map(
                    fn($row) => [
                        "id" => (string) $row->id,
                        "amount" => (float) $row->amount,
                        "payment_method" => $row->payment_method,
                        "receipt_number" => $row->receipt_number,
                        "paid_at" => $row->paid_at,
                    ],
                )
            : collect();

        return response()->json(["payments" => $rows]);
    }

    public function getReceiptTemplate(): JsonResponse
    {
        $setting = Schema::hasTable("app_settings")
            ? DB::table("app_settings")
                ->where("setting_key", "receipt_template")
                ->value("setting_value")
            : null;

        $template = $setting ? json_decode($setting, true) : [];
        if (!is_array($template)) {
            $template = [];
        }

        $template = $this->normalizeReceiptTemplate($template);

        // Encode the logo as base64 directly in the API response so the
        // frontend never has to make a separate cross-origin request to S3.
        if (!empty($template["logoUrl"])) {
            try {
                $path = $this->extractUploadPathFromUrl($template["logoUrl"]);
                if ($path) {
                    $disk = $this->uploadDisk();
                    $contents = Storage::disk($disk)->get($path);
                    if ($contents) {
                        $mime =
                            Storage::disk($disk)->mimeType($path) ?:
                            "image/jpeg";
                        $template["logoBase64"] =
                            "data:" .
                            $mime .
                            ";base64," .
                            base64_encode($contents);
                    }
                }
            } catch (\Throwable $e) {
                Log::warning(
                    "Receipt template: could not encode logo as base64",
                    [
                        "error" => $e->getMessage(),
                    ],
                );
            }
        }

        return response()->json(["template" => $template ?: (object) []]);
    }

    public function saveReceiptTemplate(Request $request): JsonResponse
    {
        $validated = $request->validate([
            "template" => ["nullable", "array"],
        ]);

        $template = $this->normalizeReceiptTemplate(
            $validated["template"] ?? [],
        );

        DB::table("app_settings")->updateOrInsert(
            ["setting_key" => "receipt_template"],
            [
                "setting_value" => json_encode(
                    $template,
                    JSON_UNESCAPED_UNICODE,
                ),
                "updated_at" => now(),
                "updated_by" => $request->user()->id,
            ],
        );

        return response()->json(["message" => "Saved"]);
    }

    public function uploadReceiptLogo(Request $request): JsonResponse
    {
        $validated = $request->validate([
            "logo" => ["required", "image", "max:5120"],
        ]);

        $path = $request
            ->file("logo")
            ->store("receipt-logos", $this->uploadDisk());
        $url = $this->buildPublicUploadUrl($path);

        return response()->json(["logo_url" => $url]);
    }

    private function normalizeReceiptLogoUrl(string $logoUrl): string
    {
        if ($logoUrl === "") {
            return $logoUrl;
        }

        if (Str::startsWith($logoUrl, ["http://", "https://"])) {
            return $logoUrl;
        }

        if (Str::startsWith($logoUrl, "/storage/")) {
            return $this->buildPublicUploadUrl(
                Str::after($logoUrl, "/storage/"),
            );
        }

        if (Str::startsWith($logoUrl, "/backend/public/uploads/")) {
            return $this->buildPublicUploadUrl(
                Str::after($logoUrl, "/backend/public/uploads/"),
            );
        }

        if (Str::startsWith($logoUrl, "/uploads/")) {
            return $this->buildPublicUploadUrl(
                Str::after($logoUrl, "/uploads/"),
            );
        }

        return $this->buildPublicUploadUrl(ltrim($logoUrl, "/"));
    }

    private function buildPublicUploadUrl(string $path): string
    {
        return $this->buildUploadUrl($path);
    }

    private function normalizeReceiptTemplate(array $template): array
    {
        $normalized = [
            "schoolName" => $this->stringValue($template["schoolName"] ?? ""),
            "schoolAddress" => $this->stringValue(
                $template["schoolAddress"] ?? "",
            ),
            "schoolPhone" => $this->stringValue($template["schoolPhone"] ?? ""),
            "headerTitle" => $this->stringValue(
                $template["headerTitle"] ?? "FEE RECEIPT",
            ),
            "footerText" => $this->stringValue(
                $template["footerText"] ??
                    "This is a computer-generated receipt.",
            ),
            "showAdmissionNumber" =>
                (bool) ($template["showAdmissionNumber"] ?? true),
            "showClass" => (bool) ($template["showClass"] ?? true),
            "showDiscount" => (bool) ($template["showDiscount"] ?? true),
            "showLogo" => (bool) ($template["showLogo"] ?? false),
            "logoUrl" => $this->stringValue($template["logoUrl"] ?? ""),
        ];

        if ($normalized["logoUrl"] !== "") {
            $normalized["logoUrl"] = $this->normalizeReceiptLogoUrl(
                $normalized["logoUrl"],
            );
        }

        return $normalized;
    }

    private function stringValue(mixed $value): string
    {
        if (is_string($value)) {
            return $value;
        }

        if (is_numeric($value)) {
            return (string) $value;
        }

        return "";
    }
}
