// Hand-written types mirroring docs/rasd-supabase-migration.sql.
// If the schema changes, regenerate with: npx supabase gen types typescript

export type UserRole = "owner" | "contractor" | "consultant";
export type ProjectStatus = "active" | "completed" | "on_hold";
export type PriorityLevel = "urgent" | "normal";
export type NoteStatus = "open" | "pending_review" | "closed" | "rejected";
export type ConsultationStatus = "submitted" | "answered" | "converted";
export type EntityType = "note" | "consultation";
export type NotificationType =
  | "note_assigned"
  | "note_pending_review"
  | "note_closed"
  | "note_rejected"
  | "consultation_submitted"
  | "consultation_answered"
  | "consultation_converted";

export interface Profile {
  id: string;
  name: string;
  role: UserRole;
  phone: string | null;
  created_at: string;
}

export interface Project {
  id: string;
  name: string;
  location: string | null;
  owner_id: string;
  contractor_id: string;
  consultant_id: string;
  start_date: string | null;
  end_date: string | null;
  contract_value: number | null;
  status: ProjectStatus;
  created_at: string;
}

export interface ContractorUpdate {
  id: string;
  project_id: string;
  contractor_id: string;
  phase: string | null;
  completion_pct: number | null;
  obstacles: string | null;
  requirements: string | null;
  created_at: string;
}

export interface ConsultantVisit {
  id: string;
  project_id: string;
  consultant_id: string;
  visit_date: string;
  verified_pct: number | null;
  technical_notes: string | null;
  created_at: string;
}

export interface Note {
  id: string;
  project_id: string;
  visit_id: string | null;
  source_consultation_id: string | null;
  created_by: string;
  assigned_to: string;
  priority: PriorityLevel;
  status: NoteStatus;
  note_text: string;
  photo_url: string | null;
  closed_by: string | null;
  closed_at: string | null;
  approved_by: string | null;
  approved_at: string | null;
  rejection_reason: string | null;
  created_at: string;
  updated_at: string;
}

export interface Consultation {
  id: string;
  project_id: string;
  raised_by: string;
  priority: PriorityLevel;
  status: ConsultationStatus;
  question_text: string;
  answer_text: string | null;
  answered_by: string | null;
  converted_note_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface StatusHistory {
  id: string;
  entity_type: EntityType;
  entity_id: string;
  old_status: string | null;
  new_status: string;
  changed_by: string;
  comment: string | null;
  created_at: string;
}

export interface AppNotification {
  id: string;
  user_id: string;
  project_id: string | null;
  type: NotificationType;
  related_entity_type: string | null;
  related_entity_id: string | null;
  message: string | null;
  is_read: boolean;
  created_at: string;
}

// Minimal Supabase Database generic — enough for the typed client to compile
// and for table()/from() calls used in this app. Extend as needed.
export interface Database {
  public: {
    Tables: {
      profiles: { Row: Profile; Insert: Partial<Profile> & { id: string; name: string; role: UserRole }; Update: Partial<Profile> };
      projects: { Row: Project; Insert: Partial<Project> & { name: string; owner_id: string; contractor_id: string; consultant_id: string }; Update: Partial<Project> };
      contractor_updates: { Row: ContractorUpdate; Insert: Partial<ContractorUpdate> & { project_id: string; contractor_id: string }; Update: Partial<ContractorUpdate> };
      consultant_visits: { Row: ConsultantVisit; Insert: Partial<ConsultantVisit> & { project_id: string; consultant_id: string }; Update: Partial<ConsultantVisit> };
      notes: { Row: Note; Insert: Partial<Note> & { project_id: string; created_by: string; assigned_to: string; note_text: string }; Update: Partial<Note> };
      consultations: { Row: Consultation; Insert: Partial<Consultation> & { project_id: string; raised_by: string; question_text: string }; Update: Partial<Consultation> };
      status_history: { Row: StatusHistory; Insert: Partial<StatusHistory> & { entity_type: EntityType; entity_id: string; new_status: string; changed_by: string }; Update: Partial<StatusHistory> };
      notifications: { Row: AppNotification; Insert: Partial<AppNotification> & { user_id: string; type: NotificationType }; Update: Partial<AppNotification> };
    };
  };
}
