export type UserRole = "STUDENT" | "TUTOR" | "ADMIN";

export type ExamStatus =
  | "DRAFT"
  | "PENDING_APPROVAL"
  | "APPROVED"
  | "REJECTED"
  | "INACTIVE";

export type QuestionType = "SINGLE_CHOICE" | "MULTIPLE_CHOICE";

export type AttemptStatus = "IN_PROGRESS" | "SUBMITTED" | "AUTO_SUBMITTED";

export type ExamResult = "PASS" | "FAIL";

export interface UserProfile {
  id: string;
  auth_user_id: string;
  name: string;
  email: string;
  role: UserRole;
  created_at: string;
}

export interface Exam {
  id: string;
  exam_name: string;
  description: string | null;
  total_questions: number;
  total_time_minutes: number;
  passing_percentage: number;
  created_by_tutor_id: string;
  status: ExamStatus;
  admin_comment: string | null;
  created_at: string;
  approved_at: string | null;
}

export interface Question {
  id: string;
  exam_id: string;
  question_text: string;
  question_type: QuestionType;
  marks: number;
  explanation: string | null;
  created_at: string;
}

export interface QuestionOption {
  id: string;
  question_id: string;
  option_text: string;
  is_correct: boolean;
  option_order: number;
}

export interface PublicQuestionOption {
  id: string;
  question_id: string;
  option_text: string;
  option_order: number;
}

export interface PublicExamQuestion {
  id: string;
  exam_id: string;
  question_text: string;
  question_type: QuestionType;
  marks: number;
  options: PublicQuestionOption[];
}

export interface ExamAttempt {
  id: string;
  exam_id: string;
  student_id: string;
  started_at: string;
  expires_at: string;
  submitted_at: string | null;
  status: AttemptStatus;
  score: number | null;
  percentage: number | null;
  result: ExamResult | null;
  total_correct: number | null;
  total_wrong: number | null;
  total_unattempted: number | null;
  time_taken_seconds: number | null;
}

export interface StudentAnswer {
  id: string;
  attempt_id: string;
  question_id: string;
  selected_option_ids: string[];
  is_correct: boolean | null;
  marks_obtained: number | null;
}

export interface ReviewQuestion {
  question_id: string;
  question_text: string;
  question_type: QuestionType;
  marks: number;
  explanation: string | null;
  options: QuestionOption[];
  selected_option_ids: string[];
  is_correct: boolean;
  marks_obtained: number;
}

export interface AuthState {
  isLoading: boolean;
  profile: UserProfile | null;
}