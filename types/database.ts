export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type UserRole =
  | 'shadchan'
  | 'single'
  | 'parent'
  | 'advocate'
  | 'maschil'
  | 'org_admin'
  | 'platform_admin'

export type UserStatus = 'pending' | 'active' | 'suspended'

export type SingleStatus =
  | 'available'
  | 'draft'
  | 'on_hold'
  | 'engaged'
  | 'married'
  | 'inactive'

export type Gender = 'male' | 'female'

export type MatchStatus =
  | 'pending'
  | 'current'
  | 'going_out'
  | 'on_hold'
  | 'past'
  | 'engaged'
  | 'married'

export type TaskType = 'follow_up' | 'date_scheduled' | 'on_hold' | 'note' | 'other'
export type TaskStatus = 'pending' | 'in_progress' | 'on_hold' | 'completed'

export type RepresentationStatus = 'pending' | 'accepted' | 'declined'
export type AdvocateRequestStatus = 'pending' | 'active' | 'closed'
export type ParentProfileStatus = 'pending' | 'completed'
export type OrgMemberRole = 'admin' | 'member'
export type GroupVisibility = 'public' | 'private'
export type PaymentType = 'recurring' | 'one_time'

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string | null
          phone: string | null
          role: UserRole
          status: UserStatus
          email_notifications: boolean
          sms_notifications: boolean
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['users']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['users']['Insert']>
      }
      shadchan_profiles: {
        Row: {
          id: string
          user_id: string
          title: string | null
          full_name: string
          city: string | null
          state: string | null
          country: string | null
          street: string | null
          postal_code: string | null
          phone: string | null
          email: string | null
          languages: string[] | null
          availability: string | null
          best_contact_method: string | null
          second_best_contact_method: string | null
          best_day: string | null
          best_time: string | null
          years_experience: string | null
          shidduchim_made: string | null
          available_for_advocacy: boolean
          rates_for_services: string | null
          type_of_service: string | null
          hide_personal_info_from_profile: boolean
          reference_1: string | null
          reference_2: string | null
          is_approved: boolean
          approved_at: string | null
          approved_by: string | null
          organization_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['shadchan_profiles']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['shadchan_profiles']['Insert']>
      }
      import_batches: {
        Row: {
          id: string
          shadchan_id: string
          submitted_by_admin_id: string
          status: 'pending_review' | 'shadchan_approved' | 'admin_approved' | 'rejected'
          parsed_data: Json
          review_token: string
          shadchan_comments: string | null
          import_summary: Json | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['import_batches']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['import_batches']['Insert']>
      }
      shadchan_singles: {
        Row: {
          shadchan_id: string
          single_id: string
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['shadchan_singles']['Row'], 'created_at'>
        Update: Partial<Database['public']['Tables']['shadchan_singles']['Insert']>
      }
      singles: {
        Row: {
          id: string
          user_id: string | null
          created_by_shadchan_id: string
          parent_id: string | null
          first_name: string
          last_name: string
          full_hebrew_name: string | null
          gender: Gender
          dob: string | null
          age: number | null
          birth_month: string | null
          phone: string | null
          email: string | null
          address: string | null
          city: string | null
          state: string | null
          country: string | null
          postal_code: string | null
          height_inches: number | null
          about_bio: string | null
          current_education: string | null
          occupation: string | null
          high_schools: Json | null
          eretz_yisroel: string | null
          current_yeshiva_seminary: string | null
          family_background: string | null
          siblings: Json | null
          references: Json | null
          looking_for: string | null
          plans: string | null
          hashkafa: string | null
          photo_url: string | null
          resume_url: string | null
          privacy_settings: Json | null
          pledge_amount: number | null
          status: SingleStatus
          is_parent_verified: boolean
          parent_notification_sent_at: string | null
          ai_personality_data: Json | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['singles']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['singles']['Insert']>
      }
      parents: {
        Row: {
          id: string
          user_id: string
          title: string | null
          full_name: string
          phone: string | null
          email: string | null
          city: string | null
          child_id: string
          created_by: string | null
          pledge_amount: number | null
          pledge_confirmed_at: string | null
          profile_status: ParentProfileStatus
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['parents']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['parents']['Insert']>
      }
      advocates: {
        Row: {
          id: string
          user_id: string
          full_name: string
          phone: string | null
          email: string | null
          city: string | null
          bio: string | null
          languages: string[] | null
          is_approved: boolean
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['advocates']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['advocates']['Insert']>
      }
      maschils: {
        Row: {
          id: string
          user_id: string
          full_name: string
          phone: string | null
          email: string | null
          city: string | null
          is_approved: boolean
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['maschils']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['maschils']['Insert']>
      }
      organizations: {
        Row: {
          id: string
          name: string
          email: string | null
          city: string | null
          primary_contact_name: string | null
          is_approved: boolean
          approved_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['organizations']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['organizations']['Insert']>
      }
      org_members: {
        Row: {
          id: string
          org_id: string
          shadchan_id: string
          role: OrgMemberRole
          joined_at: string
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['org_members']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['org_members']['Insert']>
      }
      groups: {
        Row: {
          id: string
          name: string
          visibility: GroupVisibility
          created_by: string
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['groups']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['groups']['Insert']>
      }
      group_members: {
        Row: {
          id: string
          group_id: string
          shadchan_id: string | null
          advocate_id: string | null
          role: string
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['group_members']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['group_members']['Insert']>
      }
      matches: {
        Row: {
          id: string
          shadchan_id: string
          boy_id: string
          girl_id: string
          status: MatchStatus
          message: string | null
          suggested_by_name: string | null
          notified_boy: boolean
          notified_girl: boolean
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['matches']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['matches']['Insert']>
      }
      match_feedback: {
        Row: {
          id: string
          match_id: string
          submitted_by: string
          notes: string | null
          outcome: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['match_feedback']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['match_feedback']['Insert']>
      }
      labels: {
        Row: {
          id: string
          shadchan_id: string
          name: string
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['labels']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['labels']['Insert']>
      }
      single_labels: {
        Row: {
          id: string
          single_id: string
          label_id: string
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['single_labels']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['single_labels']['Insert']>
      }
      calendar_tasks: {
        Row: {
          id: string
          shadchan_id: string
          single_id: string | null
          match_id: string | null
          title: string
          type: TaskType
          due_date: string
          reminder_at: string | null
          status: TaskStatus
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['calendar_tasks']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['calendar_tasks']['Insert']>
      }
      messages: {
        Row: {
          id: string
          from_user_id: string
          to_user_id: string
          single_id: string | null
          body: string
          is_read: boolean
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['messages']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['messages']['Insert']>
      }
      representation_requests: {
        Row: {
          id: string
          single_id: string
          shadchan_id: string
          status: RepresentationStatus
          message: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['representation_requests']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['representation_requests']['Insert']>
      }
      advocate_requests: {
        Row: {
          id: string
          single_id: string
          advocate_id: string
          status: AdvocateRequestStatus
          message: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['advocate_requests']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['advocate_requests']['Insert']>
      }
      profile_questions: {
        Row: {
          id: string
          question: string
          created_by: string
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['profile_questions']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['profile_questions']['Insert']>
      }
      news: {
        Row: {
          id: string
          title: string
          body: string
          image_url: string | null
          release_date: string
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['news']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['news']['Insert']>
      }
      donate_payments: {
        Row: {
          id: string
          user_id: string
          type: PaymentType
          amount: number
          status: string
          payment_date: string
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['donate_payments']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['donate_payments']['Insert']>
      }
      contact_inquiries: {
        Row: {
          id: string
          name: string
          email: string
          message: string
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['contact_inquiries']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['contact_inquiries']['Insert']>
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          type: string
          payload: Json
          is_read: boolean
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['notifications']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['notifications']['Insert']>
      }
      admin_audit_log: {
        Row: {
          id: string
          admin_id: string
          action: string
          target_type: string
          target_id: string
          metadata: Json | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['admin_audit_log']['Row'], 'id' | 'created_at'>
        Update: never
      }
      resume_parse_logs: {
        Row: {
          id: string
          single_id: string | null
          shadchan_id: string
          file_name: string
          status: 'success' | 'failed' | 'partial'
          parsed_data: Json | null
          error_message: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['resume_parse_logs']['Row'], 'id' | 'created_at'>
        Update: never
      }
      ai_match_scores: {
        Row: {
          id: string
          single_a_id: string
          single_b_id: string
          score: number
          factors: Json | null
          generated_at: string
        }
        Insert: Omit<Database['public']['Tables']['ai_match_scores']['Row'], 'id'>
        Update: never
      }
      ai_insights: {
        Row: {
          id: string
          single_id: string
          insight_type: string
          content: Json
          generated_at: string
        }
        Insert: Omit<Database['public']['Tables']['ai_insights']['Row'], 'id'>
        Update: never
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
  }
}

export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row']

export interface ImportSummary {
  completed_at: string
  new_records: Array<{ name: string; gender: string | null; city: string | null; state: string | null; single_id: string }>
  duplicates_skipped: Array<{ name: string; reason: string; existing_single_id: string; existing_single_name: string }>
  existing_updated: Array<{ name: string; single_id: string; fields_added: string[]; fields_skipped: string[] }>
}
