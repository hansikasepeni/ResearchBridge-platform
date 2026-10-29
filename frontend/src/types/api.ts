export type UserRole = "student" | "professor" | "admin";
export type AccountStatus = "pending" | "active" | "rejected" | "suspended";
export type VerificationStatus = "pending" | "approved" | "rejected";
export type PublicationVisibility = "public" | "institution" | "private";
export type ProjectStatus = "draft" | "open" | "active" | "closed" | "archived";
export type ProjectArrangement = "on_site" | "remote" | "hybrid";
export type CompensationType = "unpaid" | "stipend" | "hourly" | "credit";
export type RequestStatus =
  | "submitted"
  | "under_review"
  | "accepted"
  | "rejected"
  | "needs_information"
  | "withdrawn";
export type DocumentScope = "private" | "shared_request" | "institution" | "public";

export interface UserProfile {
  id: string;
  email: string;
  role: UserRole;
  full_name: string;
  avatar_url?: string;
  institution_id?: string;
  department_id?: string;
  bio?: string;
  account_status?: AccountStatus;
  is_active: boolean;
  institution_name?: string;
  department_name?: string;
}

export interface Institution {
  id: string;
  name: string;
  domain: string;
  country: string;
}

export interface Department {
  id: string;
  institution_id: string;
  name: string;
  code?: string;
}

export interface ResearchInterest {
  id: string;
  name: string;
  category?: string;
}

export interface ProfessorProfile {
  id: string;
  academic_title: string;
  office_location?: string;
  lab_name?: string;
  lab_website?: string;
  google_scholar_url?: string;
  open_to_applications: boolean;
  max_capacity: number;
  current_supervision_count: number;
  preferred_weekly_hours?: number;
  profiles: UserProfile;
  research_interests: ResearchInterest[];
  publications_count?: number;
  open_projects_count?: number;
  full_name?: string;
  title?: string;
  bio?: string;
}

export interface Publication {
  id: string;
  professor_id: string;
  title: string;
  abstract?: string;
  venue?: string;
  year?: number;
  doi?: string;
  url?: string;
  visibility: PublicationVisibility;
  created_at: string;
}

export interface ResearchProject {
  id: string;
  professor_id: string;
  title: string;
  summary: string;
  description: string;
  prerequisites?: string[];
  required_skills?: string[];
  preferred_disciplines?: string[];
  weekly_hours: number;
  openings_count: number;
  status: ProjectStatus;
  work_arrangement: ProjectArrangement;
  arrangement?: ProjectArrangement;
  compensation_type: CompensationType;
  created_at: string;
  professor_name?: string;
  professor_title?: string;
  institution_name?: string;
  department_name?: string;
}

export interface ResearchRequest {
  id: string;
  student_id: string;
  professor_id: string;
  project_id?: string;
  subject: string;
  motivation_statement: string;
  student_skills: string[];
  proposed_availability_hours: number;
  status: RequestStatus;
  created_at: string;
  professor_name?: string;
  student_name?: string;
  project_title?: string;
}

export interface RequestMessage {
  id: string;
  request_id: string;
  sender_id: string;
  sender_role: UserRole;
  message_body: string;
  is_internal_note: boolean;
  created_at: string;
}

export interface DocumentRecord {
  id: string;
  owner_id: string;
  file_name: string;
  title: string;
  mime_type: string;
  byte_size: number;
  access_scope: DocumentScope;
  summary_cached?: boolean;
  created_at: string;
}

export interface TerminologyItem {
  term: string;
  definition: string;
}

export interface PaperSummary {
  id?: string;
  document_id?: string;
  title?: string;
  plain_language_overview?: string;
  research_problem?: string;
  research_question?: string;
  motivation_significance?: string;
  methodology?: string;
  findings_contributions?: string;
  techniques_models?: string;
  limitations_author?: string;
  limitations_assumptions?: string;
  key_terminology?: TerminologyItem[];
  prerequisite_knowledge?: string[];
  open_questions?: string[];
  next_steps?: string[];
  discussion_questions?: string[];

  // Legacy/alias fields for backwards compatibility
  one_sentence_takeaway?: string;
  executive_summary?: string;
  problem_statement?: string;
  methodology_breakdown?: string[];
  key_findings?: string[];
  discussion_prompts?: string[];
}

export interface NotificationItem {
  id: string;
  user_id: string;
  notification_type: string;
  title: string;
  body: string;
  metadata?: Record<string, any>;
  is_read: boolean;
  created_at: string;
}

export interface AiChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
  timestamp?: string;
}

export interface SkillPassport {
  id: string;
  student_id: string;
  skill_name: string;
  proficiency_level: "beginner" | "intermediate" | "advanced" | "expert";
  verification_tier: "self_reported" | "project_supported" | "course_certified" | "faculty_endorsed";
  evidence_url?: string;
  endorsement_notes?: string;
  endorsed_by?: string;
  endorser_name?: string;
  created_at: string;
}

export interface ResearchIdea {
  id: string;
  professor_id: string;
  title: string;
  problem_statement: string;
  vision_description: string;
  tags?: string[];
  status: "open_for_proposals" | "under_review" | "staffed" | "archived";
  created_at: string;
  proposals_count?: number;
}

export interface IdeaProposal {
  id: string;
  idea_id: string;
  student_id: string;
  proposal_title: string;
  proposed_approach: string;
  contributor_role: string;
  status: "submitted" | "shortlisted" | "accepted" | "declined";
  created_at: string;
  student_name?: string;
}

export interface StudentContribution {
  id: string;
  student_id: string;
  project_id: string;
  task_name: string;
  deliverable_summary: string;
  deliverable_url?: string;
  hours_logged: number;
  status?: string;
  verified_by_professor: boolean;
  created_at: string;
  project_title?: string;
}

export interface OpportunityRadarAlert {
  project_id: string;
  project_title: string;
  professor_name: string;
  radar_score: number;
  potential_explanation: string;
  is_beginner_friendly: boolean;
  matched_strengths: string[];
}

export interface OpportunityRadarResponse {
  student_id: string;
  radar_opportunities: OpportunityRadarAlert[];
}

