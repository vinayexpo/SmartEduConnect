# SmartEduConnect API Reference

## Base URL

Production API base URL:

```text
https://smarteduconnect.in:8443
```

Routes have no `/api` prefix. For example, the login endpoint is `POST https://smarteduconnect.in:8443/auth/login`.

## Authentication

Public endpoints are limited to the authentication routes listed below. All other endpoints require an opaque API token.

```http
Authorization: Bearer <token>
```

For the notifications Server-Sent Events endpoint only, a token may also be supplied as `?access_token=<token>`.

`POST /auth/login` and `POST /auth/register` return a token. Tokens are device-specific, expire after 12 hours by default, and are revoked by the logout endpoints.

Unauthenticated requests return:

```json
{"message":"Unauthenticated."}
```

Expired tokens return:

```json
{"message":"Session expired. Please log in again."}
```

## Conventions

- Send JSON request bodies unless an endpoint is marked `multipart/form-data`.
- Successful creates normally return `201` with an `id`; successful updates and deletes normally return `200` with a `message`.
- Validation failures return Laravel's `422` response with `message` and `errors`.
- List endpoints accept `page` and `per_page` where supported. When supplied, the result is `{data, meta}`; otherwise the endpoint returns a plain array.
- Bulk imports accept at most 500 rows and return `{imported, total, errors}`. Valid rows are processed even if some rows fail.
- `{id}`, `{classId}`, and `{teacherId}` are numeric resource IDs.

## Authorization Notes

Roles in the application are `admin`, `teacher`, and `parent`. Most routes are protected by a valid token only. In the tables below, **Admin** means the controller explicitly checks the user's role; **Authenticated** means a valid token is required but the current implementation does not enforce an additional role restriction.

## Public Authentication

| Method | Path | Request | Response |
|---|---|---|---|
| GET | `/auth/admin-exists` | None | `{exists: boolean}` |
| POST | `/auth/register` | `full_name`, `email`, `password` (min 8), optional `role`, `device_name` | `201 {token, user}` |
| POST | `/auth/login` | `email`, `password`, optional `device_name` | `{token, user}` |
| POST | `/auth/resolve-teacher-email` | `teacher_id` | `{email}` or `404` |
| POST | `/auth/resolve-parent-email` | `student_identifier` | `{email}` or `404` |

## Account and Profile

| Method | Path | Access | Request / response |
|---|---|---|---|
| GET | `/auth/me` | Authenticated | Current `{user}` profile and role |
| POST | `/auth/logout` | Authenticated | Revokes the current device token |
| POST | `/auth/logout-everywhere` | Authenticated | Revokes all current-user tokens |
| GET | `/profile` | Authenticated | Profile, role, and teacher/parent details |
| PUT | `/profile` | Authenticated | Optional `phone` |
| POST | `/profile/photo` | Authenticated | `multipart/form-data`: `photo` image, maximum 5 MB; returns `{photo_url}` |
| PUT | `/profile/password` | Authenticated | `password` (min 6) |

## Dashboard and Notifications

| Method | Path | Access | Request / response |
|---|---|---|---|
| GET | `/dashboard/stats` | Authenticated | Counts, attendance rate, pending items, and latest announcements |
| GET | `/notifications` | Authenticated | Current-user notifications; optional list filters and pagination |
| GET | `/notifications/stream` | Authenticated | SSE stream; emits `connected`, `notifications-updated`, and `ping` events |
| POST | `/notifications/mark-read` | Authenticated | `{id}` |
| POST | `/notifications/mark-all-read` | Authenticated | `{ids: number[]}` |
| POST | `/notifications/delete-read` | Authenticated | `{ids: number[]}`; removes only the caller's read notifications |
| DELETE | `/notifications/{id}` | Authenticated | Removes only the caller's notification |
| GET | `/notifications/push/vapid-key` | Authenticated | `{publicKey, configured}`; rate limit 60/minute |
| POST | `/notifications/push/subscribe` | Authenticated | `{endpoint, p256dh, auth, user_agent?}`; rate limit 30/minute |
| POST | `/notifications/push/unsubscribe` | Authenticated | `{endpoint}`; rate limit 30/minute |

## Messaging

| Method | Path | Access | Request / response |
|---|---|---|---|
| GET | `/messaging/classes` | Authenticated | Available classes |
| GET | `/messaging/teachers` | Authenticated | Active teachers excluding the caller |
| GET | `/messaging/admin-user` | Authenticated | First admin user or `null` |
| GET | `/messaging/students/class/{classId}` | Admin or assigned teacher | Students and parent contact IDs |
| GET | `/messaging/contacts` | Authenticated | Conversation contacts |
| GET | `/messaging/messages` | Authenticated | Required `contact_id`; optional `student_id`, `after_id`, `before_id`, `limit` (max 200) |
| POST | `/messaging/messages` | Authenticated | `recipient_id`, optional `student_id`, `content`, and/or `attachment` (max 10 MB); returns `201 {id}` |
| PUT | `/messaging/messages/{id}/read` | Recipient | Marks the message read |

## Classes, Subjects, and Students

| Method | Path | Access | Request / response |
|---|---|---|---|
| GET | `/classes` | Authenticated | Classes; supports `page`, `per_page`, `search`, `sort_by`, and `sort_dir` |
| GET | `/classes/management` | Authenticated | Classes with teacher and student counts |
| POST | `/classes` | Authenticated | `name`, optional `section`, `academic_year`, `class_teacher_id` |
| PUT / DELETE | `/classes/{id}` | Authenticated | Update uses class fields above / deletes class |
| GET | `/subjects` | Authenticated | Subjects; supports `page`, `per_page`, `search`, `category`, `sort_by`, and `sort_dir` |
| POST | `/subjects` | Authenticated | `name`, optional `code`, `category` |
| PUT / DELETE | `/subjects/{id}` | Authenticated | Update subject fields / delete subject |
| GET | `/students` | Authenticated | Student list with filters and pagination |
| GET | `/students/directory` | Authenticated | Student directory with class and contact detail |
| GET | `/students/{id}/attendance-summary` | Authenticated | Last 30-day attendance summary |
| GET | `/students/{id}/exam-marks` | Authenticated | Student marks and exam snapshots |
| GET | `/students/history` | Admin | Required `admission_number`; returns student, attendance, marks, fees, and promotion history |
| GET | `/attendance/report` | Authenticated | Required `start`, `end`; optional `class_id`, filters, and pagination |

## Teachers, Parents, and Announcements

| Method | Path | Access | Request / response |
|---|---|---|---|
| GET | `/teachers`, `/teachers/basic`, `/parents` | Authenticated | Teacher or parent lists |
| GET | `/teachers/management` | Authenticated | Management teacher list |
| POST | `/teachers` | Authenticated | `full_name`, `qualification`, `password`, `subjects`; `phone` must be exactly 10 digits; optional `email`, `class_teacher_of`, `photo`; returns `201 {id}` |
| PUT / DELETE | `/teachers/{id}` | Authenticated | Update / delete teacher |
| POST | `/teachers/management/import` | Authenticated | `{rows: [...]}` teacher import |
| POST | `/admin/students`, `/teacher/students` | Authenticated | Student creation: `full_name`, `class_id`, `password`; optional student, parent, emergency-contact, and `photo` fields |
| PUT / DELETE | `/admin/students/{id}`, `/teacher/students/{id}` | Authenticated | Student update / delete aliases |
| POST | `/admin/students/import` | Authenticated | `{rows: [...]}` student import |
| GET | `/announcements` | Authenticated | Announcements |
| POST | `/announcements` | Authenticated | `title`, `content`, optional `target_audience`; returns `201` announcement |
| DELETE | `/announcements/{id}` | Authenticated | Delete announcement |

## Requests and Administration

| Method | Path | Access | Request / response |
|---|---|---|---|
| GET | `/complaints/management` | Authenticated | Complaint list |
| PUT | `/complaints/{id}` | Authenticated | Optional `status`, `response` |
| GET | `/certificates/requests` | Authenticated | Certificate request list |
| PUT | `/certificates/requests/{id}` | Authenticated | `status` (`approved` or `rejected`), optional `approved_by`, `admin_remarks` |
| GET | `/leave/requests` | Authenticated | Leave request list |
| PUT | `/leave/requests/{id}` | Authenticated | `status` (`approved`, `rejected`, or `pending`) |
| GET / PUT | `/settings/receipt-template` | Authenticated | Read or save `{template?}` |
| POST | `/settings/receipt-template/logo` | Authenticated | `multipart/form-data` image upload |
| GET / PUT | `/settings/payment-gateway` | Admin | Read or set `razorpay_key_id`, `razorpay_key_secret` |
| POST | `/settings/invite-admin` | Admin | `email`, `full_name`, `password`; returns `201` |
| POST | `/settings/factory-reset`, `/settings/full-reset` | Admin | Destructive reset operations |

## Promotion and Fees

| Method | Path | Access | Request / response |
|---|---|---|---|
| POST | `/promotion/execute` | Admin | `source_class_id`, `target_class_id`, `academic_year` |
| POST | `/promotion/execute-single` | Admin | `student_id`, `target_class_id`, `academic_year` |
| GET | `/promotion/history` | Admin | Promotion history with pagination |
| POST | `/promotion/rollback` | Admin | `batch_academic_year`, `source_class_id`, `target_class_id` |
| POST | `/promotion/rollback-single` | Admin | `promotion_history_id` |
| GET | `/fees/management-data` | Authenticated | Fees and classes; the `fees` value supports `page`, `per_page`, `search`, `payment_status`, `fee_type`, `class_id`, `student_id`, `date_from`, `date_to`, `sort_by`, and `sort_dir` |
| POST | `/fees/class-students` | Authenticated | `{class_ids: number[]}` |
| POST | `/fees/bulk-create` | Authenticated | `{records: [{student_id, fee_type, amount, discount?, due_date, reminder_days_before?}]}` |
| POST | `/fees/import` | Authenticated | `{rows: [...]}`; fee rows use `fee_type`, `amount`, `due_date` and class/admission lookup fields |
| PUT | `/fees/{id}` | Authenticated | Fee fields |
| POST | `/fees/delete-batch` | Authenticated | `{fee_ids: number[]}` |
| POST | `/fees/{id}/record-payment` | Authenticated | `{amount, payment_method?}`; returns receipt number and status |
| POST | `/fees/payments` | Authenticated | `{fee_ids: number[]}` |

## Gallery

| Method | Path | Access | Request / response |
|---|---|---|---|
| GET | `/gallery/folders` | Authenticated | Gallery folders |
| POST | `/gallery/folders` | Admin | `title`; returns `201 {id}` |
| PUT / DELETE | `/gallery/folders/{id}` | Admin | Update `{title}` / delete folder |
| GET | `/gallery/folders/{id}/images` | Authenticated | Folder images |
| POST | `/gallery/folders/{id}/images` | Admin | `multipart/form-data`: `image` (max 10 MB), optional `caption`; returns `201 {id, image_url}` |
| PUT / DELETE | `/gallery/images/{id}` | Admin | Update `{caption?}` / delete image |

## Timetable

| Method | Path | Access | Request / response |
|---|---|---|---|
| GET | `/timetable/schedule-config` | Authenticated | Optional `class_id`; schedule slots |
| POST | `/admin/timetable/schedule-config` | Admin | Optional `class_id`; `schedule: [{number, startTime, endTime, isBreak, breakName?}]` |
| POST | `/admin/timetable/schedule-config/reset` | Admin | Optional `class_id` |
| GET | `/admin/timetable/management-data` | Admin | Management reference data |
| GET | `/admin/timetable/class/{classId}` | Admin | Class timetable |
| GET | `/admin/timetable/teacher/{teacherId}` | Admin | Teacher timetable |
| GET / POST | `/admin/timetable/periods` | Admin | GET optional `class_id`; POST `class_id?`, `period_number`, `label`, `start_time`, `end_time`, `type?` |
| PUT / DELETE | `/admin/timetable/periods/{id}` | Admin | Update period / delete period |
| POST | `/admin/timetable` | Admin | `class_id`, `day_of_week`, `period_id`, optional `subject_id`, `teacher_id`, `is_published` |
| PUT / DELETE | `/admin/timetable/{id}` | Admin | Update / delete timetable entry |
| PUT | `/admin/timetable/publish-class` | Admin | `{class_id}` |
| PUT | `/admin/timetable/{id}/publish` | Admin | `{is_published}` |

## Syllabus, Question Papers, and Exam Cycles

| Method | Path | Access | Request / response |
|---|---|---|---|
| GET | `/admin/syllabus/data` | Admin | Syllabus, classes, subjects, teachers, and mappings |
| POST | `/admin/syllabus`, `/admin/syllabus/bulk` | Admin | Syllabus fields including `class_id`, `subject_id`, `syllabus_type`, and `topic_name` |
| POST | `/admin/syllabus/import` | Admin | Bulk import with class and subject labels |
| PUT / DELETE | `/admin/syllabus/{id}` | Admin | Update / delete syllabus item |
| POST | `/admin/syllabus/{id}/teachers` | Admin | `{teacher_id, role_type}` |
| DELETE | `/admin/syllabus/teachers/{id}` | Admin | Remove teacher mapping |
| GET | `/admin/question-papers/data` | Admin | Exams, classes, papers, and questions |
| GET | `/admin/question-papers/{id}/questions` | Admin | Paper questions |
| POST / DELETE | `/admin/question-papers`, `/admin/question-papers/{id}` | Admin | Create `{exam_id, class_id}` / delete paper |
| POST | `/admin/question-papers/{id}/questions` | Admin | `question_number`, `question_text`, `question_type`, optional options, answer, explanation, and marks |
| PUT / DELETE | `/admin/questions/{id}` | Admin | Update / delete question |
| GET / POST | `/admin/exam-cycles` | Admin | List / create `exam_type`, `cycle_number`, `start_date`, `end_date` |
| PUT | `/admin/exam-cycles/{id}/toggle-active` | Admin | Toggles active state |
| DELETE | `/admin/exam-cycles/{id}` | Admin | Delete cycle |

## Exams and Weekly Exams

| Method | Path | Access | Request / response |
|---|---|---|---|
| GET | `/exams/data`, `/exams/results-data` | Authenticated | Exams, results, classes, and subjects data bundles |
| POST | `/exams/bulk` | Authenticated | `{records: [{name, exam_date?, exam_time?, max_marks?, class_id?, subject_id?}]}`. Only one standard or weekly exam is permitted for each class/date/time slot. |
| DELETE | `/exams/{id}` | Authenticated | Delete exam |
| GET | `/exams/{id}/marks-data` | Authenticated | Students and marks |
| PUT | `/exams/{id}/marks` | Authenticated | `{records: [{student_id, marks_obtained?, grade?, remarks?}]}` |
| POST | `/exams/{id}/marks/import` | Authenticated | `{rows: [{admission_number, marks_obtained?, grade?, remarks?}]}` |
| GET / POST | `/weekly-exams/data`, `/weekly-exams` | Authenticated | List data / create weekly exam. A class cannot have another standard or weekly exam at the same date and time. |
| PUT / DELETE | `/weekly-exams/{id}` | Authenticated | Update / delete weekly exam |
| PUT | `/weekly-exams/{id}/status` | Authenticated | `{status}` |
| PUT | `/weekly-exams/{id}/syllabus-links` | Authenticated | `{syllabus_ids?: number[]}` |
| GET | `/weekly-exams/{id}/marks-data` | Authenticated | Students, marks, and total marks |
| PUT | `/weekly-exams/{id}/marks` | Authenticated | `{records: [{student_id, obtained_marks?, percentage?, total_marks?}]}` |

## Teacher Portal

| Method | Path | Access | Request / response |
|---|---|---|---|
| GET | `/teacher/classes`, `/teacher/dashboard` | Authenticated | Assigned classes and dashboard data |
| GET / PUT | `/teacher/attendance-data`, `/teacher/attendance` | Authenticated | GET optional `class_id`, `date`; PUT `{date, records: [{student_id, status}]}` where status is `present`, `absent`, or `late` |
| GET | `/teacher/students-data`, `/teacher/timetable-data` | Authenticated | Optional `class_id` |
| GET / POST | `/teacher/leave-requests` | Authenticated | POST `from_date`, `to_date`, `reason`, optional `attachment`. Overlapping leave dates for the same teacher are rejected with `422`. |
| GET / POST / DELETE | `/teacher/homework-data`, `/teacher/homework`, `/teacher/homework/{id}` | Authenticated | POST `title`, `due_date`, `class_id`, optional `description`, `subject_id`, `attachment` |
| GET | `/teacher/weekly-exams-data`, `/teacher/exams-data` | Authenticated | Exam data |
| GET | `/teacher/reports-data`, `/teacher/class-students` | Authenticated | Reports supports `page`, `per_page`, `search`, `category`, `severity`, `date_from`, `date_to`, `sort_by`, and `sort_dir`; class students request needs `class_id` |
| POST | `/teacher/reports` | Authenticated | `student_id`, `category`, `description`, optional `severity`, `parent_visible` |
| PUT | `/teacher/complaints/{id}` | Authenticated | `status` (`open`, `in_progress`, `resolved`), optional `response` |
| GET / PUT | `/teacher/syllabus-data`, `/teacher/syllabus/{id}/complete` | Authenticated | Syllabus data / mark item completed |

## Parent Portal

| Method | Path | Access | Request / response |
|---|---|---|---|
| GET | `/parent/dashboard`, `/parent/children-data` | Authenticated | Child, dashboard, announcements, exam, homework, and fee data |
| GET | `/parent/exams-data`, `/parent/attendance-data`, `/parent/homework-data`, `/parent/progress-data`, `/parent/timetable-data`, `/parent/syllabus-data`, `/parent/fees-data` | Authenticated | Child-scoped data; attendance accepts optional `start_date`, `end_date` |
| GET | `/parent/fees/payment-gateway-config` | Authenticated | `{provider, configured, key_id}` |
| POST | `/parent/fees/{id}/create-order` | Authenticated | `{amount}`; creates Razorpay order |
| POST | `/parent/fees/{id}/verify-payment` | Authenticated | `razorpay_order_id`, `razorpay_payment_id`, `razorpay_signature` |
| POST | `/parent/fees/{id}/pay` | Authenticated | `{amount}` fallback payment path when Razorpay is unavailable |
| GET / POST | `/parent/complaints` | Authenticated | POST `subject`, `description`, `visible_to` (`admin` or `teacher`) |
| GET / POST | `/parent/leave-requests` | Authenticated | POST `from_date`, `to_date`, `reason`, optional `attachment`. Overlapping leave dates for the same student are rejected with `422`. |
| GET / POST | `/parent/certificate-requests` | Authenticated | POST `certificate_type`, optional `description`, `attachment` |

## Leads and Academic Calendar

| Method | Path | Access | Request / response |
|---|---|---|---|
| GET / POST | `/leads` | Authenticated | List supports filters/pagination; create accepts lead fields |
| POST | `/leads/import` | Authenticated | `{leads: [...]}` |
| GET | `/leads/teachers`, `/leads/module-status`, `/leads/settings` | Authenticated | Lead reference, module, and settings data |
| PUT | `/leads/settings/module`, `/leads/settings/mode`, `/leads/settings/teacher/{teacherId}` | Admin | `{enabled}`, `{mode: "all"|"selected"}`, or `{enabled}` |
| GET | `/leads/{id}/details` | Authenticated | Lead with call logs and status history |
| POST | `/leads/{id}/call-logs` | Authenticated | `call_outcome`, optional `notes` |
| PUT | `/leads/{id}/status` | Authenticated | `status`, optional `remarks`, `next_followup_date` |
| PUT / DELETE | `/leads/{id}` | Authenticated | Update / delete lead |
| GET | `/academic-calendar` | Authenticated | Optional `year`, `category`, `status`; non-admins receive visible entries only |
| GET | `/academic-calendar/audience-users` | Admin | Optional `role`, `search`, `limit`, `ids` |
| GET | `/academic-calendar/{id}` | Authenticated | Calendar entry |
| POST / PUT / DELETE | `/academic-calendar`, `/academic-calendar/{id}` | Admin | Create/update calendar entry or delete it. Required core fields: `title`, `category`, `start_date`, `all_day`, `audience_type`, `notify_enabled`, `status` |
| GET / POST / PUT / DELETE | `/holidays`, `/holidays/{id}` | Same as calendar | Holiday compatibility alias; `name` maps to `title` |

## Example Login

```bash
curl -X POST https://smarteduconnect.in:8443/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"your-password","device_name":"web"}'
```

Use the returned token for subsequent requests:

```bash
curl https://smarteduconnect.in:8443/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Source of Truth

This reference is generated from `backend/routes/api.php` and its controllers. Update this document whenever API routes or request validation rules change.
