<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Schema;

class SmokeTestSeeder extends Seeder
{
    private const PASSWORD = 'Smoke@123';

    private const ADMIN_EMAIL = 'smoke.admin@school.test';

    private const TEACHER_EMAIL = 'smoke.teacher@school.test';

    private const PARENT_EMAIL = 'smoke.parent@school.test';

    public function run(): void
    {
        $this->cleanup();
        $now = now();

        // ---------- Users / roles / profiles ----------
        $adminId = $this->user('Smoke Admin', self::ADMIN_EMAIL, 'admin');
        $teacherUserId = $this->user('Smoke Teacher', self::TEACHER_EMAIL, 'teacher');
        $parentUserId = $this->user('Smoke Parent', self::PARENT_EMAIL, 'parent');

        // ---------- Teachers ----------
        $teacherId = DB::table('teachers')->insertGetId([
            'user_id' => $teacherUserId,
            'teacher_id' => 'T-SMOKE-01',
            'subjects' => json_encode(['Smoke Mathematics', 'Smoke English']),
            'qualification' => 'MSc BEd',
            'status' => 'active',
            'joining_date' => '2024-06-01',
            'created_at' => $now,
            'updated_at' => $now,
        ]);

        // ---------- Classes ----------
        $classA = DB::table('classes')->insertGetId([
            'name' => 'Smoke 5', 'section' => 'A', 'class_teacher_id' => $teacherId,
            'academic_year' => '2026-2027', 'created_at' => $now, 'updated_at' => $now,
        ]);
        $classB = DB::table('classes')->insertGetId([
            'name' => 'Smoke 5', 'section' => 'B', 'class_teacher_id' => null,
            'academic_year' => '2026-2027', 'created_at' => $now, 'updated_at' => $now,
        ]);
        DB::table('teacher_classes')->insert([
            ['teacher_id' => $teacherId, 'class_id' => $classA, 'created_at' => $now, 'updated_at' => $now],
            ['teacher_id' => $teacherId, 'class_id' => $classB, 'created_at' => $now, 'updated_at' => $now],
        ]);

        // ---------- Subjects ----------
        $mathId = DB::table('subjects')->insertGetId([
            'name' => 'Smoke Mathematics', 'code' => 'SMOKE-MATH', 'created_at' => $now, 'updated_at' => $now,
        ]);
        if (Schema::hasColumn('subjects', 'category')) {
            DB::table('subjects')->where('id', $mathId)->update(['category' => 'academic']);
        }
        $engId = DB::table('subjects')->insertGetId([
            'name' => 'Smoke English', 'code' => 'SMOKE-ENG', 'created_at' => $now, 'updated_at' => $now,
        ]);
        if (Schema::hasColumn('subjects', 'category')) {
            DB::table('subjects')->where('id', $engId)->update(['category' => 'language']);
        }

        // ---------- Parent + students ----------
        $parentId = DB::table('parents')->insertGetId([
            'user_id' => $parentUserId, 'phone' => '9000000001',
            'created_at' => $now, 'updated_at' => $now,
        ]);
        $studentIds = [];
        for ($i = 1; $i <= 6; $i++) {
            $sid = DB::table('students')->insertGetId([
                'admission_number' => sprintf('SMOKE-%03d', $i),
                'full_name' => "Smoke Student $i",
                'class_id' => $i <= 4 ? $classA : $classB,
                'date_of_birth' => '2016-05-0'.(($i % 9) + 1),
                'blood_group' => 'O+',
                'parent_name' => 'Smoke Parent',
                'parent_phone' => '9000000001',
                'address' => '12 Smoke Street',
                'emergency_contact' => '9000000002',
                'emergency_contact_name' => 'Smoke Guardian',
                'status' => $i === 6 ? 'inactive' : 'active',
                'created_at' => $now,
                'updated_at' => $now,
            ]);
            $studentIds[] = $sid;
            DB::table('student_parents')->insert([
                'student_id' => $sid, 'parent_id' => $parentId, 'relationship' => 'parent',
                'created_at' => $now, 'updated_at' => $now,
            ]);
        }

        // ---------- Announcements ----------
        DB::table('announcements')->insert([
            ['title' => 'Smoke Day Assembly', 'content' => 'Assembly at 9am in the main hall.', 'target_audience' => json_encode(['all']), 'created_by' => $adminId, 'created_at' => $now, 'updated_at' => $now],
            ['title' => 'Smoke Sports Meet', 'content' => 'Annual sports meet next Friday.', 'target_audience' => json_encode(['all']), 'created_by' => $adminId, 'created_at' => $now, 'updated_at' => $now],
        ]);

        // ---------- Attendance (2 days) ----------
        foreach (['2026-09-07', '2026-09-08'] as $day) {
            foreach ($studentIds as $index => $sid) {
                DB::table('attendance')->insert([
                    'student_id' => $sid,
                    'class_id_snapshot' => $index < 4 ? $classA : $classB,
                    'date' => $day,
                    'status' => $sid === $studentIds[0] && $day === '2026-09-08' ? 'absent' : 'present',
                    'session' => 'forenoon',
                    'marked_by' => $teacherId,
                    'created_at' => $now,
                    'updated_at' => $now,
                ]);
            }
        }

        // ---------- Leave ----------
        DB::table('leave_requests')->insert([
            ['request_type' => 'student', 'student_id' => $studentIds[1], 'teacher_id' => null, 'from_date' => '2026-09-10', 'to_date' => '2026-09-11', 'reason' => 'Smoke family function', 'status' => 'pending', 'approved_by' => null, 'created_at' => $now, 'updated_at' => $now],
            ['request_type' => 'teacher', 'student_id' => null, 'teacher_id' => $teacherId, 'from_date' => '2026-09-12', 'to_date' => '2026-09-12', 'reason' => 'Smoke medical appointment', 'status' => 'approved', 'approved_by' => $adminId, 'created_at' => $now, 'updated_at' => $now],
        ]);

        // ---------- Certificates / complaints ----------
        DB::table('certificate_requests')->insert([
            'student_id' => $studentIds[0], 'certificate_type' => 'Bonafide',
            'requested_by' => $parentUserId, 'status' => 'pending',
            'created_at' => $now, 'updated_at' => $now,
        ]);
        DB::table('complaints')->insert([
            'subject' => 'Smoke bus delay', 'description' => 'The school bus arrived 20 minutes late.',
            'submitted_by' => $parentUserId, 'status' => 'open',
            'created_at' => $now, 'updated_at' => $now,
        ]);

        // ---------- Notifications ----------
        foreach ([$adminId, $teacherUserId, $parentUserId] as $uid) {
            DB::table('notifications')->insert([
                ['user_id' => $uid, 'type' => 'announcement', 'title' => 'Smoke notice', 'message' => 'A new announcement was published.', 'is_read' => false, 'created_at' => $now, 'updated_at' => $now],
                ['user_id' => $uid, 'type' => 'general', 'title' => 'Smoke reminder', 'message' => 'Remember the sports meet.', 'is_read' => true, 'created_at' => $now, 'updated_at' => $now],
            ]);
        }

        // ---------- Messages (teacher <-> parent) ----------
        DB::table('messages')->insert([
            ['sender_id' => $teacherUserId, 'recipient_id' => $parentUserId, 'student_id' => $studentIds[0], 'content' => 'Smoke Student 1 is doing well in mathematics.', 'is_read' => false, 'created_at' => $now, 'updated_at' => $now],
            ['sender_id' => $parentUserId, 'recipient_id' => $teacherUserId, 'student_id' => $studentIds[0], 'content' => 'Thank you for the update!', 'is_read' => false, 'created_at' => $now, 'updated_at' => $now],
        ]);

        // ---------- Leads ----------
        if (Schema::hasTable('leads')) {
            DB::table('leads')->insert([
                ['student_name' => 'Smoke Prospect 1', 'primary_mobile' => '9100000001', 'father_name' => 'Smoke Father 1', 'status' => 'new', 'class_applying_for' => 'Smoke 5-A', 'created_at' => $now, 'updated_at' => $now],
                ['student_name' => 'Smoke Prospect 2', 'primary_mobile' => '9100000002', 'father_name' => 'Smoke Father 2', 'status' => 'contacted', 'class_applying_for' => 'Smoke 5-B', 'created_at' => $now, 'updated_at' => $now],
                ['student_name' => 'Smoke Prospect 3', 'primary_mobile' => '9100000003', 'father_name' => 'Smoke Father 3', 'status' => 'admitted', 'class_applying_for' => 'Smoke 5-A', 'created_at' => $now, 'updated_at' => $now],
            ]);
        }

        // ---------- Exams + marks + weekly ----------
        $examPast = DB::table('exams')->insertGetId([
            'name' => 'Smoke Term 1 Math', 'class_id' => $classA, 'subject_id' => $mathId,
            'exam_date' => '2026-08-20', 'exam_time' => '09:00:00', 'max_marks' => 100,
            'created_at' => $now, 'updated_at' => $now,
        ]);
        $examFuture = DB::table('exams')->insertGetId([
            'name' => 'Smoke Term 2 English', 'class_id' => $classA, 'subject_id' => $engId,
            'exam_date' => '2026-10-15', 'exam_time' => '09:00:00', 'max_marks' => 100,
            'created_at' => $now, 'updated_at' => $now,
        ]);
        foreach (array_slice($studentIds, 0, 4) as $index => $sid) {
            DB::table('exam_marks')->insert([
                'exam_id' => $examPast, 'student_id' => $sid,
                'marks_obtained' => 70 + $index * 5, 'grade' => 'A',
                'created_at' => $now, 'updated_at' => $now,
            ]);
        }
        if (Schema::hasTable('weekly_exams')) {
            DB::table('weekly_exams')->insert([
                'class_id' => $classA, 'subject_id' => $mathId, 'syllabus_type' => 'general',
                'exam_title' => 'Smoke Weekly Math 1', 'exam_date' => date('Y-m-d', strtotime('+3 days')),
                'exam_time' => '10:00:00', 'duration_minutes' => 60, 'total_marks' => 50,
                'status' => 'scheduled', 'description' => 'Smoke weekly assessment',
                'created_by' => $teacherUserId, 'created_at' => $now, 'updated_at' => $now,
            ]);
        }

        // ---------- Fees ----------
        DB::table('fees')->insert([
            ['student_id' => $studentIds[0], 'assigned_class_id' => $classA, 'fee_type' => 'Tuition', 'amount' => 5000, 'discount' => 0, 'paid_amount' => 0, 'due_date' => '2026-10-01', 'payment_status' => 'unpaid', 'paid_at' => null, 'receipt_number' => null, 'created_at' => $now, 'updated_at' => $now],
            ['student_id' => $studentIds[1], 'assigned_class_id' => $classA, 'fee_type' => 'Tuition', 'amount' => 5000, 'discount' => 500, 'paid_amount' => 2000, 'due_date' => '2026-10-01', 'payment_status' => 'partial', 'paid_at' => null, 'receipt_number' => 'SMOKE-R-001', 'created_at' => $now, 'updated_at' => $now],
            ['student_id' => $studentIds[2], 'assigned_class_id' => $classA, 'fee_type' => 'Transport', 'amount' => 1500, 'discount' => 0, 'paid_amount' => 1500, 'due_date' => '2026-09-01', 'payment_status' => 'paid', 'paid_at' => $now, 'receipt_number' => 'SMOKE-R-002', 'created_at' => $now, 'updated_at' => $now],
        ]);

        // ---------- Homework + reports ----------
        DB::table('homework')->insert([
            ['title' => 'Smoke math homework', 'description' => 'Solve chapter 3 exercises.', 'due_date' => date('Y-m-d', strtotime('+5 days')), 'class_id' => $classA, 'subject_id' => $mathId, 'created_by' => $teacherUserId, 'created_at' => $now, 'updated_at' => $now],
            ['title' => 'Smoke english essay', 'description' => 'Write an essay on discipline.', 'due_date' => date('Y-m-d', strtotime('+7 days')), 'class_id' => $classA, 'subject_id' => $engId, 'created_by' => $teacherUserId, 'created_at' => $now, 'updated_at' => $now],
        ]);
        DB::table('student_reports')->insert([
            'student_id' => $studentIds[0], 'category' => 'academic',
            'description' => 'Excellent progress in smoke mathematics.',
            'severity' => 'info', 'parent_visible' => true,
            'created_by' => $teacherUserId, 'created_at' => $now, 'updated_at' => $now,
        ]);

        // ---------- Gallery ----------
        $folderId = DB::table('gallery_folders')->insertGetId([
            'title' => 'Smoke Gallery', 'created_by' => $adminId,
            'created_at' => $now, 'updated_at' => $now,
        ]);
        foreach (['Smoke annual day', 'Smoke sports', 'Smoke science fair'] as $i => $caption) {
            DB::table('gallery_images')->insert([
                'folder_id' => $folderId, 'image_url' => 'galleries/smoke-'.($i + 1).'.jpg',
                'caption' => $caption, 'created_by' => $adminId,
                'created_at' => $now, 'updated_at' => $now,
            ]);
        }

        // ---------- Calendar + holidays ----------
        DB::table('academic_calendar_entries')->insert([
            'title' => 'Smoke sports meet', 'category' => 'event', 'start_date' => date('Y-m-d', strtotime('+10 days')),
            'end_date' => date('Y-m-d', strtotime('+11 days')), 'all_day' => true,
            'description' => 'Annual smoke sports meet.', 'audience_type' => 'all',
            'status' => 'published', 'created_at' => $now, 'updated_at' => $now,
        ]);
        if (Schema::hasTable('holidays')) {
            DB::table('holidays')->insert([
                'name' => 'Smoke holiday', 'start_date' => date('Y-m-d', strtotime('+20 days')),
                'description' => 'Smoke local holiday.', 'created_at' => $now, 'updated_at' => $now,
            ]);
        }

        // ---------- Syllabus ----------
        $syllabusId = DB::table('syllabus')->insertGetId([
            'class_id' => $classA, 'subject_id' => $mathId, 'syllabus_type' => 'general',
            'chapter_name' => 'Smoke Chapter 1', 'topic_name' => 'Smoke Numbers',
            'start_date' => '2026-09-01', 'end_date' => '2026-09-15',
            'created_by' => $teacherUserId, 'created_at' => $now, 'updated_at' => $now,
        ]);
        DB::table('teacher_syllabus_map')->insert([
            'teacher_id' => $teacherId, 'syllabus_id' => $syllabusId, 'role_type' => 'lead',
            'created_at' => $now, 'updated_at' => $now,
        ]);

        // ---------- Settings ----------
        if (Schema::hasTable('app_settings')) {
            DB::table('app_settings')->updateOrInsert(
                ['setting_key' => 'school_name'],
                ['setting_value' => 'Smoke Test School', 'created_at' => $now, 'updated_at' => $now]
            );
        }

        $this->command->info('Smoke test data seeded: admin/teacher/parent logins with password '.self::PASSWORD);
    }

    private function user(string $name, string $email, string $role): int
    {
        $user = User::updateOrCreate(
            ['email' => $email],
            ['name' => $name, 'password' => Hash::make(self::PASSWORD)]
        );
        DB::table('user_roles')->updateOrInsert(
            ['user_id' => $user->id],
            ['role' => $role, 'created_at' => now(), 'updated_at' => now()]
        );
        DB::table('profiles')->updateOrInsert(
            ['user_id' => $user->id],
            ['full_name' => $name, 'email' => $email, 'created_at' => now(), 'updated_at' => now()]
        );

        return $user->id;
    }

    private function cleanup(): void
    {
        $userIds = DB::table('users')
            ->whereIn('email', [self::ADMIN_EMAIL, self::TEACHER_EMAIL, self::PARENT_EMAIL])
            ->pluck('id');

        DB::table('messages')->whereIn('sender_id', $userIds)->orWhereIn('recipient_id', $userIds)->delete();
        DB::table('api_tokens')->whereIn('user_id', $userIds)->delete();
        DB::table('notifications')->where('title', 'like', 'Smoke%')->delete();
        DB::table('announcements')->where('title', 'like', 'Smoke%')->delete();
        DB::table('homework')->where('title', 'like', 'Smoke%')->delete();
        DB::table('student_reports')->where('description', 'like', '%smoke%')->delete();
        DB::table('complaints')->where('subject', 'like', 'Smoke%')->delete();
        DB::table('certificate_requests')->whereIn('student_id', function ($q): void {
            $q->select('id')->from('students')->where('admission_number', 'like', 'SMOKE-%');
        })->delete();
        DB::table('leave_requests')->where('reason', 'like', 'Smoke%')->delete();
        DB::table('attendance')->whereIn('student_id', function ($q): void {
            $q->select('id')->from('students')->where('admission_number', 'like', 'SMOKE-%');
        })->delete();
        DB::table('exam_marks')->whereIn('student_id', function ($q): void {
            $q->select('id')->from('students')->where('admission_number', 'like', 'SMOKE-%');
        })->delete();
        DB::table('student_parents')->whereIn('student_id', function ($q): void {
            $q->select('id')->from('students')->where('admission_number', 'like', 'SMOKE-%');
        })->delete();
        DB::table('fees')->whereIn('student_id', function ($q): void {
            $q->select('id')->from('students')->where('admission_number', 'like', 'SMOKE-%');
        })->delete();
        DB::table('students')->where('admission_number', 'like', 'SMOKE-%')->delete();
        DB::table('teacher_classes')->whereIn('teacher_id', function ($q): void {
            $q->select('id')->from('teachers')->where('teacher_id', 'T-SMOKE-01');
        })->delete();
        DB::table('teacher_syllabus_map')->whereIn('teacher_id', function ($q): void {
            $q->select('id')->from('teachers')->where('teacher_id', 'T-SMOKE-01');
        })->delete();
        DB::table('classes')->where('name', 'like', 'Smoke%')->delete();
        DB::table('teachers')->where('teacher_id', 'T-SMOKE-01')->delete();
        DB::table('parents')->whereIn('user_id', $userIds)->delete();
        DB::table('subjects')->where('code', 'like', 'SMOKE-%')->delete();
        DB::table('exams')->where('name', 'like', 'Smoke%')->delete();
        if (Schema::hasTable('weekly_exams')) {
            DB::table('weekly_exams')->where('exam_title', 'like', 'Smoke%')->delete();
        }
        if (Schema::hasTable('leads')) {
            DB::table('leads')->where('student_name', 'like', 'Smoke Prospect%')->delete();
        }
        DB::table('gallery_images')->where('caption', 'like', 'Smoke%')->delete();
        DB::table('gallery_folders')->where('title', 'like', 'Smoke%')->delete();
        DB::table('academic_calendar_entries')->where('title', 'like', 'Smoke%')->delete();
        if (Schema::hasTable('holidays')) {
            DB::table('holidays')->where('name', 'like', 'Smoke%')->delete();
        }
        DB::table('syllabus')->where('chapter_name', 'like', 'Smoke%')->delete();
        DB::table('user_roles')->whereIn('user_id', $userIds)->delete();
        DB::table('profiles')->whereIn('user_id', $userIds)->delete();
        DB::table('users')->whereIn('id', $userIds)->delete();
    }
}
