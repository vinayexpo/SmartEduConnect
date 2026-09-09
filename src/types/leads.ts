/** Shared shape for admission-lead list rows returned by `GET /leads`. */
export interface LeadListItem {
  id: string | number;
  student_name?: string | null;
  gender?: string | null;
  date_of_birth?: string | null;
  current_class?: string | null;
  education_board?: string | null;
  primary_mobile?: string | null;
  alternate_mobile?: string | null;
  father_name?: string | null;
  mother_name?: string | null;
  email?: string | null;
  address?: string | null;
  area_city?: string | null;
  previous_school?: string | null;
  status?: string | null;
  class_applying_for?: string | null;
  academic_year?: string | null;
  next_followup_date?: string | null;
  created_by?: string | number | null;
  assigned_teacher_id?: string | number | null;
  created_at?: string | null;
  status_updated_at?: string | null;
  remarks?: string | null;
}
