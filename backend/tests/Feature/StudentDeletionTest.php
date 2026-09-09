<?php

namespace Tests\Feature;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

class StudentDeletionTest extends TestCase
{
    public function test_admin_can_delete_a_student_and_their_dependent_records(): void
    {
        $now = now();
        $adminToken = 'student-delete-'.bin2hex(random_bytes(12));
        $adminId = DB::table('users')->insertGetId([
            'name' => 'Student Delete Admin',
            'email' => 'student-delete-'.bin2hex(random_bytes(8)).'@test.local',
            'password' => Hash::make('password123'),
            'api_token' => hash('sha256', $adminToken),
            'created_at' => $now,
            'updated_at' => $now,
        ]);
        DB::table('user_roles')->insert([
            'user_id' => $adminId,
            'role' => 'admin',
            'created_at' => $now,
            'updated_at' => $now,
        ]);

        $classId = DB::table('classes')->insertGetId([
            'name' => 'Delete Test',
            'section' => 'A',
            'academic_year' => '2099-2100',
            'created_at' => $now,
            'updated_at' => $now,
        ]);
        $studentId = DB::table('students')->insertGetId([
            'admission_number' => 'DELETE-'.bin2hex(random_bytes(6)),
            'full_name' => 'Delete Test Student',
            'class_id' => $classId,
            'status' => 'active',
            'created_at' => $now,
            'updated_at' => $now,
        ]);

        $parentEmail = 'delete-parent-'.bin2hex(random_bytes(8)).'@parent.local';
        $parentUserId = DB::table('users')->insertGetId([
            'name' => 'Delete Test Parent',
            'email' => $parentEmail,
            'password' => Hash::make('password123'),
            'created_at' => $now,
            'updated_at' => $now,
        ]);
        DB::table('user_roles')->insert([
            'user_id' => $parentUserId,
            'role' => 'parent',
            'created_at' => $now,
            'updated_at' => $now,
        ]);
        $parentId = DB::table('parents')->insertGetId([
            'user_id' => $parentUserId,
            'created_at' => $now,
            'updated_at' => $now,
        ]);
        DB::table('student_parents')->insert([
            'student_id' => $studentId,
            'parent_id' => $parentId,
            'relationship' => 'parent',
            'created_at' => $now,
            'updated_at' => $now,
        ]);

        DB::table('attendance')->insert([
            'student_id' => $studentId,
            'date' => '2099-01-01',
            'status' => 'present',
            'created_at' => $now,
            'updated_at' => $now,
        ]);
        if (Schema::hasTable('fees')) {
            $feeId = DB::table('fees')->insertGetId([
                'student_id' => $studentId,
                'fee_type' => 'Test fee',
                'amount' => 100,
                'discount' => 0,
                'paid_amount' => 0,
                'due_date' => '2099-01-01',
                'payment_status' => 'unpaid',
                'reminder_days_before' => 0,
                'created_at' => $now,
                'updated_at' => $now,
            ]);
            if (Schema::hasTable('fee_payments')) {
                DB::table('fee_payments')->insert([
                    'fee_id' => $feeId,
                    'student_id' => $studentId,
                    'amount' => 10,
                    'payment_method' => 'cash',
                    'created_at' => $now,
                    'updated_at' => $now,
                ]);
            }
        }

        $this->withHeaders(['Authorization' => 'Bearer '.$adminToken])
            ->deleteJson('/admin/students/'.$studentId)
            ->assertOk()
            ->assertJson(['message' => 'Deleted']);

        $this->assertDatabaseMissing('students', ['id' => $studentId]);
        $this->assertDatabaseMissing('attendance', ['student_id' => $studentId]);
        if (Schema::hasTable('fees')) {
            $this->assertDatabaseMissing('fees', ['student_id' => $studentId]);
        }
        if (Schema::hasTable('fee_payments')) {
            $this->assertDatabaseMissing('fee_payments', ['student_id' => $studentId]);
        }
        $this->assertDatabaseMissing('student_parents', ['student_id' => $studentId]);
        $this->assertDatabaseMissing('users', ['id' => $parentUserId]);
    }
}
