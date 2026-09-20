export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: '14.5'
  }
  public: {
    Tables: {
      attendance: {
        Row: {
          created_at: string
          id: string
          is_billable: boolean
          lesson_id: string
          minutes_attended: number | null
          notes: string | null
          recorded_at: string
          recorded_by: string | null
          status: Database['public']['Enums']['attendance_status']
          student_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_billable?: boolean
          lesson_id: string
          minutes_attended?: number | null
          notes?: string | null
          recorded_at?: string
          recorded_by?: string | null
          status?: Database['public']['Enums']['attendance_status']
          student_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_billable?: boolean
          lesson_id?: string
          minutes_attended?: number | null
          notes?: string | null
          recorded_at?: string
          recorded_by?: string | null
          status?: Database['public']['Enums']['attendance_status']
          student_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'attendance_lesson_id_fkey'
            columns: ['lesson_id']
            isOneToOne: false
            referencedRelation: 'lessons'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'attendance_lesson_id_fkey'
            columns: ['lesson_id']
            isOneToOne: false
            referencedRelation: 'v_buoi_chan_luong'
            referencedColumns: ['lesson_id']
          },
          {
            foreignKeyName: 'attendance_lesson_id_fkey'
            columns: ['lesson_id']
            isOneToOne: false
            referencedRelation: 'v_doi_chieu_gio_day'
            referencedColumns: ['lesson_id']
          },
          {
            foreignKeyName: 'attendance_lesson_id_fkey'
            columns: ['lesson_id']
            isOneToOne: false
            referencedRelation: 'v_ho_so_buoi_hoc'
            referencedColumns: ['lesson_id']
          },
          {
            foreignKeyName: 'attendance_lesson_id_fkey'
            columns: ['lesson_id']
            isOneToOne: false
            referencedRelation: 'v_hoc_vien_cua_giao_vien'
            referencedColumns: ['lesson_id']
          },
          {
            foreignKeyName: 'attendance_lesson_id_fkey'
            columns: ['lesson_id']
            isOneToOne: false
            referencedRelation: 'v_lesson_reports'
            referencedColumns: ['lesson_id']
          },
          {
            foreignKeyName: 'attendance_lesson_id_fkey'
            columns: ['lesson_id']
            isOneToOne: false
            referencedRelation: 'v_portal_buoi_hoc'
            referencedColumns: ['lesson_id']
          },
          {
            foreignKeyName: 'attendance_recorded_by_fkey'
            columns: ['recorded_by']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'attendance_student_id_fkey'
            columns: ['student_id']
            isOneToOne: false
            referencedRelation: 'students'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'attendance_student_id_fkey'
            columns: ['student_id']
            isOneToOne: false
            referencedRelation: 'v_doi_soat_hoc_phi'
            referencedColumns: ['nguoi_dung_ten_id']
          },
          {
            foreignKeyName: 'attendance_student_id_fkey'
            columns: ['student_id']
            isOneToOne: false
            referencedRelation: 'v_hoc_vien_tam_ngung'
            referencedColumns: ['student_id']
          },
          {
            foreignKeyName: 'attendance_student_id_fkey'
            columns: ['student_id']
            isOneToOne: false
            referencedRelation: 'v_portal_hoc_vien'
            referencedColumns: ['student_id']
          },
          {
            foreignKeyName: 'attendance_student_id_fkey'
            columns: ['student_id']
            isOneToOne: false
            referencedRelation: 'v_student_finance'
            referencedColumns: ['student_id']
          },
          {
            foreignKeyName: 'attendance_student_id_fkey'
            columns: ['student_id']
            isOneToOne: false
            referencedRelation: 'v_student_overview'
            referencedColumns: ['id']
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string
          id: string
          new_data: Json | null
          old_data: Json | null
          record_id: string | null
          table_name: string
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string
          id?: string
          new_data?: Json | null
          old_data?: Json | null
          record_id?: string | null
          table_name: string
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string
          id?: string
          new_data?: Json | null
          old_data?: Json | null
          record_id?: string | null
          table_name?: string
        }
        Relationships: []
      }
      class_schedules: {
        Row: {
          class_id: string
          created_at: string
          created_by: string | null
          duration_minutes: number
          effective_from: string
          effective_to: string | null
          id: string
          start_time: string
          status: Database['public']['Enums']['record_status']
          timezone: string
          updated_at: string
          weekday: number
        }
        Insert: {
          class_id: string
          created_at?: string
          created_by?: string | null
          duration_minutes?: number
          effective_from?: string
          effective_to?: string | null
          id?: string
          start_time: string
          status?: Database['public']['Enums']['record_status']
          timezone?: string
          updated_at?: string
          weekday: number
        }
        Update: {
          class_id?: string
          created_at?: string
          created_by?: string | null
          duration_minutes?: number
          effective_from?: string
          effective_to?: string | null
          id?: string
          start_time?: string
          status?: Database['public']['Enums']['record_status']
          timezone?: string
          updated_at?: string
          weekday?: number
        }
        Relationships: [
          {
            foreignKeyName: 'class_schedules_class_id_fkey'
            columns: ['class_id']
            isOneToOne: false
            referencedRelation: 'classes'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'class_schedules_class_id_fkey'
            columns: ['class_id']
            isOneToOne: false
            referencedRelation: 'v_class_board'
            referencedColumns: ['class_id']
          },
          {
            foreignKeyName: 'class_schedules_class_id_fkey'
            columns: ['class_id']
            isOneToOne: false
            referencedRelation: 'v_doi_soat_hoc_phi'
            referencedColumns: ['class_id']
          },
          {
            foreignKeyName: 'class_schedules_class_id_fkey'
            columns: ['class_id']
            isOneToOne: false
            referencedRelation: 'v_hoc_vien_cua_giao_vien'
            referencedColumns: ['class_id']
          },
          {
            foreignKeyName: 'class_schedules_class_id_fkey'
            columns: ['class_id']
            isOneToOne: false
            referencedRelation: 'v_student_overview'
            referencedColumns: ['class_id']
          },
          {
            foreignKeyName: 'class_schedules_created_by_fkey'
            columns: ['created_by']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
        ]
      }
      class_students: {
        Row: {
          class_id: string
          created_at: string
          created_by: string | null
          id: string
          joined_at: string
          left_at: string | null
          notes: string | null
          status: Database['public']['Enums']['record_status']
          student_id: string
          updated_at: string
        }
        Insert: {
          class_id: string
          created_at?: string
          created_by?: string | null
          id?: string
          joined_at?: string
          left_at?: string | null
          notes?: string | null
          status?: Database['public']['Enums']['record_status']
          student_id: string
          updated_at?: string
        }
        Update: {
          class_id?: string
          created_at?: string
          created_by?: string | null
          id?: string
          joined_at?: string
          left_at?: string | null
          notes?: string | null
          status?: Database['public']['Enums']['record_status']
          student_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'class_students_class_id_fkey'
            columns: ['class_id']
            isOneToOne: false
            referencedRelation: 'classes'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'class_students_class_id_fkey'
            columns: ['class_id']
            isOneToOne: false
            referencedRelation: 'v_class_board'
            referencedColumns: ['class_id']
          },
          {
            foreignKeyName: 'class_students_class_id_fkey'
            columns: ['class_id']
            isOneToOne: false
            referencedRelation: 'v_doi_soat_hoc_phi'
            referencedColumns: ['class_id']
          },
          {
            foreignKeyName: 'class_students_class_id_fkey'
            columns: ['class_id']
            isOneToOne: false
            referencedRelation: 'v_hoc_vien_cua_giao_vien'
            referencedColumns: ['class_id']
          },
          {
            foreignKeyName: 'class_students_class_id_fkey'
            columns: ['class_id']
            isOneToOne: false
            referencedRelation: 'v_student_overview'
            referencedColumns: ['class_id']
          },
          {
            foreignKeyName: 'class_students_created_by_fkey'
            columns: ['created_by']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'class_students_student_id_fkey'
            columns: ['student_id']
            isOneToOne: false
            referencedRelation: 'students'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'class_students_student_id_fkey'
            columns: ['student_id']
            isOneToOne: false
            referencedRelation: 'v_doi_soat_hoc_phi'
            referencedColumns: ['nguoi_dung_ten_id']
          },
          {
            foreignKeyName: 'class_students_student_id_fkey'
            columns: ['student_id']
            isOneToOne: false
            referencedRelation: 'v_hoc_vien_tam_ngung'
            referencedColumns: ['student_id']
          },
          {
            foreignKeyName: 'class_students_student_id_fkey'
            columns: ['student_id']
            isOneToOne: false
            referencedRelation: 'v_portal_hoc_vien'
            referencedColumns: ['student_id']
          },
          {
            foreignKeyName: 'class_students_student_id_fkey'
            columns: ['student_id']
            isOneToOne: false
            referencedRelation: 'v_student_finance'
            referencedColumns: ['student_id']
          },
          {
            foreignKeyName: 'class_students_student_id_fkey'
            columns: ['student_id']
            isOneToOne: false
            referencedRelation: 'v_student_overview'
            referencedColumns: ['id']
          },
        ]
      }
      classes: {
        Row: {
          class_code: string | null
          class_type: Database['public']['Enums']['class_type']
          created_at: string
          created_by: string | null
          default_duration_minutes: number
          end_date: string | null
          id: string
          level_id: string | null
          max_students: number
          meeting_url: string | null
          name: string
          needs_review: boolean
          notes: string | null
          program_id: string | null
          review_note: string | null
          start_date: string | null
          status: Database['public']['Enums']['class_status']
          teacher_id: string | null
          updated_at: string
        }
        Insert: {
          class_code?: string | null
          class_type?: Database['public']['Enums']['class_type']
          created_at?: string
          created_by?: string | null
          default_duration_minutes?: number
          end_date?: string | null
          id?: string
          level_id?: string | null
          max_students?: number
          meeting_url?: string | null
          name: string
          needs_review?: boolean
          notes?: string | null
          program_id?: string | null
          review_note?: string | null
          start_date?: string | null
          status?: Database['public']['Enums']['class_status']
          teacher_id?: string | null
          updated_at?: string
        }
        Update: {
          class_code?: string | null
          class_type?: Database['public']['Enums']['class_type']
          created_at?: string
          created_by?: string | null
          default_duration_minutes?: number
          end_date?: string | null
          id?: string
          level_id?: string | null
          max_students?: number
          meeting_url?: string | null
          name?: string
          needs_review?: boolean
          notes?: string | null
          program_id?: string | null
          review_note?: string | null
          start_date?: string | null
          status?: Database['public']['Enums']['class_status']
          teacher_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'classes_created_by_fkey'
            columns: ['created_by']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'classes_level_id_fkey'
            columns: ['level_id']
            isOneToOne: false
            referencedRelation: 'levels'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'classes_level_id_fkey'
            columns: ['level_id']
            isOneToOne: false
            referencedRelation: 'v_student_overview'
            referencedColumns: ['level_id']
          },
          {
            foreignKeyName: 'classes_program_id_fkey'
            columns: ['program_id']
            isOneToOne: false
            referencedRelation: 'programs'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'classes_program_id_fkey'
            columns: ['program_id']
            isOneToOne: false
            referencedRelation: 'v_student_overview'
            referencedColumns: ['program_id']
          },
          {
            foreignKeyName: 'classes_teacher_id_fkey'
            columns: ['teacher_id']
            isOneToOne: false
            referencedRelation: 'teachers'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'classes_teacher_id_fkey'
            columns: ['teacher_id']
            isOneToOne: false
            referencedRelation: 'v_ho_so_giao_vien'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'classes_teacher_id_fkey'
            columns: ['teacher_id']
            isOneToOne: false
            referencedRelation: 'v_student_overview'
            referencedColumns: ['teacher_id']
          },
        ]
      }
      data_backups: {
        Row: {
          created_at: string
          du_lieu: Json
          ghi_chu: string | null
          id: string
          kich_thuoc_bytes: number
          loai: string
          so_dong: Json
        }
        Insert: {
          created_at?: string
          du_lieu: Json
          ghi_chu?: string | null
          id?: string
          kich_thuoc_bytes: number
          loai?: string
          so_dong: Json
        }
        Update: {
          created_at?: string
          du_lieu?: Json
          ghi_chu?: string | null
          id?: string
          kich_thuoc_bytes?: number
          loai?: string
          so_dong?: Json
        }
        Relationships: []
      }
      documents: {
        Row: {
          audiences: string[]
          category: Database['public']['Enums']['document_category']
          created_at: string
          created_by: string | null
          id: string
          notes: string | null
          sort_order: number
          stage: number | null
          status: Database['public']['Enums']['record_status']
          title: string
          updated_at: string
          url: string | null
        }
        Insert: {
          audiences?: string[]
          category?: Database['public']['Enums']['document_category']
          created_at?: string
          created_by?: string | null
          id?: string
          notes?: string | null
          sort_order?: number
          stage?: number | null
          status?: Database['public']['Enums']['record_status']
          title: string
          updated_at?: string
          url?: string | null
        }
        Update: {
          audiences?: string[]
          category?: Database['public']['Enums']['document_category']
          created_at?: string
          created_by?: string | null
          id?: string
          notes?: string | null
          sort_order?: number
          stage?: number | null
          status?: Database['public']['Enums']['record_status']
          title?: string
          updated_at?: string
          url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'documents_created_by_fkey'
            columns: ['created_by']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
        ]
      }
      expenses: {
        Row: {
          amount: number
          category: Database['public']['Enums']['expense_category']
          created_at: string
          created_by: string | null
          currency: string
          description: string
          expense_date: string
          id: string
          method: Database['public']['Enums']['payment_method']
          notes: string | null
          payroll_id: string | null
          receipt_url: string | null
          recorded_by: string | null
          updated_at: string
          vendor: string | null
        }
        Insert: {
          amount: number
          category?: Database['public']['Enums']['expense_category']
          created_at?: string
          created_by?: string | null
          currency?: string
          description: string
          expense_date?: string
          id?: string
          method?: Database['public']['Enums']['payment_method']
          notes?: string | null
          payroll_id?: string | null
          receipt_url?: string | null
          recorded_by?: string | null
          updated_at?: string
          vendor?: string | null
        }
        Update: {
          amount?: number
          category?: Database['public']['Enums']['expense_category']
          created_at?: string
          created_by?: string | null
          currency?: string
          description?: string
          expense_date?: string
          id?: string
          method?: Database['public']['Enums']['payment_method']
          notes?: string | null
          payroll_id?: string | null
          receipt_url?: string | null
          recorded_by?: string | null
          updated_at?: string
          vendor?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'expenses_created_by_fkey'
            columns: ['created_by']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'expenses_recorded_by_fkey'
            columns: ['recorded_by']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'fk_expenses_payroll'
            columns: ['payroll_id']
            isOneToOne: false
            referencedRelation: 'teacher_payroll'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'fk_expenses_payroll'
            columns: ['payroll_id']
            isOneToOne: false
            referencedRelation: 'v_teacher_payroll_summary'
            referencedColumns: ['payroll_id']
          },
        ]
      }
      homework: {
        Row: {
          assigned_by: string | null
          attachment_url: string | null
          class_id: string | null
          created_at: string
          created_by: string | null
          description: string | null
          due_date: string | null
          id: string
          lesson_id: string | null
          sentence_patterns: string | null
          status: Database['public']['Enums']['record_status']
          student_id: string | null
          title: string
          updated_at: string
        }
        Insert: {
          assigned_by?: string | null
          attachment_url?: string | null
          class_id?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          lesson_id?: string | null
          sentence_patterns?: string | null
          status?: Database['public']['Enums']['record_status']
          student_id?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          assigned_by?: string | null
          attachment_url?: string | null
          class_id?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          lesson_id?: string | null
          sentence_patterns?: string | null
          status?: Database['public']['Enums']['record_status']
          student_id?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'homework_assigned_by_fkey'
            columns: ['assigned_by']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'homework_class_id_fkey'
            columns: ['class_id']
            isOneToOne: false
            referencedRelation: 'classes'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'homework_class_id_fkey'
            columns: ['class_id']
            isOneToOne: false
            referencedRelation: 'v_class_board'
            referencedColumns: ['class_id']
          },
          {
            foreignKeyName: 'homework_class_id_fkey'
            columns: ['class_id']
            isOneToOne: false
            referencedRelation: 'v_doi_soat_hoc_phi'
            referencedColumns: ['class_id']
          },
          {
            foreignKeyName: 'homework_class_id_fkey'
            columns: ['class_id']
            isOneToOne: false
            referencedRelation: 'v_hoc_vien_cua_giao_vien'
            referencedColumns: ['class_id']
          },
          {
            foreignKeyName: 'homework_class_id_fkey'
            columns: ['class_id']
            isOneToOne: false
            referencedRelation: 'v_student_overview'
            referencedColumns: ['class_id']
          },
          {
            foreignKeyName: 'homework_created_by_fkey'
            columns: ['created_by']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'homework_lesson_id_fkey'
            columns: ['lesson_id']
            isOneToOne: false
            referencedRelation: 'lessons'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'homework_lesson_id_fkey'
            columns: ['lesson_id']
            isOneToOne: false
            referencedRelation: 'v_buoi_chan_luong'
            referencedColumns: ['lesson_id']
          },
          {
            foreignKeyName: 'homework_lesson_id_fkey'
            columns: ['lesson_id']
            isOneToOne: false
            referencedRelation: 'v_doi_chieu_gio_day'
            referencedColumns: ['lesson_id']
          },
          {
            foreignKeyName: 'homework_lesson_id_fkey'
            columns: ['lesson_id']
            isOneToOne: false
            referencedRelation: 'v_ho_so_buoi_hoc'
            referencedColumns: ['lesson_id']
          },
          {
            foreignKeyName: 'homework_lesson_id_fkey'
            columns: ['lesson_id']
            isOneToOne: false
            referencedRelation: 'v_hoc_vien_cua_giao_vien'
            referencedColumns: ['lesson_id']
          },
          {
            foreignKeyName: 'homework_lesson_id_fkey'
            columns: ['lesson_id']
            isOneToOne: false
            referencedRelation: 'v_lesson_reports'
            referencedColumns: ['lesson_id']
          },
          {
            foreignKeyName: 'homework_lesson_id_fkey'
            columns: ['lesson_id']
            isOneToOne: false
            referencedRelation: 'v_portal_buoi_hoc'
            referencedColumns: ['lesson_id']
          },
          {
            foreignKeyName: 'homework_student_id_fkey'
            columns: ['student_id']
            isOneToOne: false
            referencedRelation: 'students'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'homework_student_id_fkey'
            columns: ['student_id']
            isOneToOne: false
            referencedRelation: 'v_doi_soat_hoc_phi'
            referencedColumns: ['nguoi_dung_ten_id']
          },
          {
            foreignKeyName: 'homework_student_id_fkey'
            columns: ['student_id']
            isOneToOne: false
            referencedRelation: 'v_hoc_vien_tam_ngung'
            referencedColumns: ['student_id']
          },
          {
            foreignKeyName: 'homework_student_id_fkey'
            columns: ['student_id']
            isOneToOne: false
            referencedRelation: 'v_portal_hoc_vien'
            referencedColumns: ['student_id']
          },
          {
            foreignKeyName: 'homework_student_id_fkey'
            columns: ['student_id']
            isOneToOne: false
            referencedRelation: 'v_student_finance'
            referencedColumns: ['student_id']
          },
          {
            foreignKeyName: 'homework_student_id_fkey'
            columns: ['student_id']
            isOneToOne: false
            referencedRelation: 'v_student_overview'
            referencedColumns: ['id']
          },
        ]
      }
      lead_activities: {
        Row: {
          activity_type: string
          content: string | null
          created_at: string
          created_by: string | null
          id: string
          lead_id: string
          occurred_at: string
        }
        Insert: {
          activity_type: string
          content?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          lead_id: string
          occurred_at?: string
        }
        Update: {
          activity_type?: string
          content?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          lead_id?: string
          occurred_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'lead_activities_created_by_fkey'
            columns: ['created_by']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'lead_activities_lead_id_fkey'
            columns: ['lead_id']
            isOneToOne: false
            referencedRelation: 'leads'
            referencedColumns: ['id']
          },
        ]
      }
      leads: {
        Row: {
          age: number | null
          assigned_to: string | null
          converted_at: string | null
          converted_student_id: string | null
          created_at: string
          created_by: string | null
          current_level_id: string | null
          date_of_birth: string | null
          email: string | null
          full_name: string
          goal: string | null
          id: string
          lead_code: string | null
          lost_reason: string | null
          next_follow_up_at: string | null
          notes: string | null
          parent_name: string | null
          parent_phone: string | null
          phone: string | null
          program_interest_id: string | null
          source: string | null
          status: Database['public']['Enums']['lead_status']
          updated_at: string
        }
        Insert: {
          age?: number | null
          assigned_to?: string | null
          converted_at?: string | null
          converted_student_id?: string | null
          created_at?: string
          created_by?: string | null
          current_level_id?: string | null
          date_of_birth?: string | null
          email?: string | null
          full_name: string
          goal?: string | null
          id?: string
          lead_code?: string | null
          lost_reason?: string | null
          next_follow_up_at?: string | null
          notes?: string | null
          parent_name?: string | null
          parent_phone?: string | null
          phone?: string | null
          program_interest_id?: string | null
          source?: string | null
          status?: Database['public']['Enums']['lead_status']
          updated_at?: string
        }
        Update: {
          age?: number | null
          assigned_to?: string | null
          converted_at?: string | null
          converted_student_id?: string | null
          created_at?: string
          created_by?: string | null
          current_level_id?: string | null
          date_of_birth?: string | null
          email?: string | null
          full_name?: string
          goal?: string | null
          id?: string
          lead_code?: string | null
          lost_reason?: string | null
          next_follow_up_at?: string | null
          notes?: string | null
          parent_name?: string | null
          parent_phone?: string | null
          phone?: string | null
          program_interest_id?: string | null
          source?: string | null
          status?: Database['public']['Enums']['lead_status']
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'leads_assigned_to_fkey'
            columns: ['assigned_to']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'leads_converted_student_id_fkey'
            columns: ['converted_student_id']
            isOneToOne: false
            referencedRelation: 'students'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'leads_converted_student_id_fkey'
            columns: ['converted_student_id']
            isOneToOne: false
            referencedRelation: 'v_doi_soat_hoc_phi'
            referencedColumns: ['nguoi_dung_ten_id']
          },
          {
            foreignKeyName: 'leads_converted_student_id_fkey'
            columns: ['converted_student_id']
            isOneToOne: false
            referencedRelation: 'v_hoc_vien_tam_ngung'
            referencedColumns: ['student_id']
          },
          {
            foreignKeyName: 'leads_converted_student_id_fkey'
            columns: ['converted_student_id']
            isOneToOne: false
            referencedRelation: 'v_portal_hoc_vien'
            referencedColumns: ['student_id']
          },
          {
            foreignKeyName: 'leads_converted_student_id_fkey'
            columns: ['converted_student_id']
            isOneToOne: false
            referencedRelation: 'v_student_finance'
            referencedColumns: ['student_id']
          },
          {
            foreignKeyName: 'leads_converted_student_id_fkey'
            columns: ['converted_student_id']
            isOneToOne: false
            referencedRelation: 'v_student_overview'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'leads_created_by_fkey'
            columns: ['created_by']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'leads_current_level_id_fkey'
            columns: ['current_level_id']
            isOneToOne: false
            referencedRelation: 'levels'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'leads_current_level_id_fkey'
            columns: ['current_level_id']
            isOneToOne: false
            referencedRelation: 'v_student_overview'
            referencedColumns: ['level_id']
          },
          {
            foreignKeyName: 'leads_program_interest_id_fkey'
            columns: ['program_interest_id']
            isOneToOne: false
            referencedRelation: 'programs'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'leads_program_interest_id_fkey'
            columns: ['program_interest_id']
            isOneToOne: false
            referencedRelation: 'v_student_overview'
            referencedColumns: ['program_id']
          },
        ]
      }
      lesson_consumptions: {
        Row: {
          attendance_id: string | null
          created_at: string
          enrollment_id: string
          id: string
          lesson_id: string
          lessons_deducted: number
          notes: string | null
          price_per_lesson: number
          recognized_amount: number
          recognized_at: string
          student_id: string
        }
        Insert: {
          attendance_id?: string | null
          created_at?: string
          enrollment_id: string
          id?: string
          lesson_id: string
          lessons_deducted?: number
          notes?: string | null
          price_per_lesson: number
          recognized_amount: number
          recognized_at?: string
          student_id: string
        }
        Update: {
          attendance_id?: string | null
          created_at?: string
          enrollment_id?: string
          id?: string
          lesson_id?: string
          lessons_deducted?: number
          notes?: string | null
          price_per_lesson?: number
          recognized_amount?: number
          recognized_at?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'lesson_consumptions_attendance_id_fkey'
            columns: ['attendance_id']
            isOneToOne: false
            referencedRelation: 'attendance'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'lesson_consumptions_enrollment_id_fkey'
            columns: ['enrollment_id']
            isOneToOne: false
            referencedRelation: 'student_enrollments'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'lesson_consumptions_enrollment_id_fkey'
            columns: ['enrollment_id']
            isOneToOne: false
            referencedRelation: 'v_doi_soat_hoc_phi'
            referencedColumns: ['enrollment_id']
          },
          {
            foreignKeyName: 'lesson_consumptions_enrollment_id_fkey'
            columns: ['enrollment_id']
            isOneToOne: false
            referencedRelation: 'v_enrollment_balances'
            referencedColumns: ['enrollment_id']
          },
          {
            foreignKeyName: 'lesson_consumptions_lesson_id_fkey'
            columns: ['lesson_id']
            isOneToOne: false
            referencedRelation: 'lessons'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'lesson_consumptions_lesson_id_fkey'
            columns: ['lesson_id']
            isOneToOne: false
            referencedRelation: 'v_buoi_chan_luong'
            referencedColumns: ['lesson_id']
          },
          {
            foreignKeyName: 'lesson_consumptions_lesson_id_fkey'
            columns: ['lesson_id']
            isOneToOne: false
            referencedRelation: 'v_doi_chieu_gio_day'
            referencedColumns: ['lesson_id']
          },
          {
            foreignKeyName: 'lesson_consumptions_lesson_id_fkey'
            columns: ['lesson_id']
            isOneToOne: false
            referencedRelation: 'v_ho_so_buoi_hoc'
            referencedColumns: ['lesson_id']
          },
          {
            foreignKeyName: 'lesson_consumptions_lesson_id_fkey'
            columns: ['lesson_id']
            isOneToOne: false
            referencedRelation: 'v_hoc_vien_cua_giao_vien'
            referencedColumns: ['lesson_id']
          },
          {
            foreignKeyName: 'lesson_consumptions_lesson_id_fkey'
            columns: ['lesson_id']
            isOneToOne: false
            referencedRelation: 'v_lesson_reports'
            referencedColumns: ['lesson_id']
          },
          {
            foreignKeyName: 'lesson_consumptions_lesson_id_fkey'
            columns: ['lesson_id']
            isOneToOne: false
            referencedRelation: 'v_portal_buoi_hoc'
            referencedColumns: ['lesson_id']
          },
          {
            foreignKeyName: 'lesson_consumptions_student_id_fkey'
            columns: ['student_id']
            isOneToOne: false
            referencedRelation: 'students'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'lesson_consumptions_student_id_fkey'
            columns: ['student_id']
            isOneToOne: false
            referencedRelation: 'v_doi_soat_hoc_phi'
            referencedColumns: ['nguoi_dung_ten_id']
          },
          {
            foreignKeyName: 'lesson_consumptions_student_id_fkey'
            columns: ['student_id']
            isOneToOne: false
            referencedRelation: 'v_hoc_vien_tam_ngung'
            referencedColumns: ['student_id']
          },
          {
            foreignKeyName: 'lesson_consumptions_student_id_fkey'
            columns: ['student_id']
            isOneToOne: false
            referencedRelation: 'v_portal_hoc_vien'
            referencedColumns: ['student_id']
          },
          {
            foreignKeyName: 'lesson_consumptions_student_id_fkey'
            columns: ['student_id']
            isOneToOne: false
            referencedRelation: 'v_student_finance'
            referencedColumns: ['student_id']
          },
          {
            foreignKeyName: 'lesson_consumptions_student_id_fkey'
            columns: ['student_id']
            isOneToOne: false
            referencedRelation: 'v_student_overview'
            referencedColumns: ['id']
          },
        ]
      }
      lessons: {
        Row: {
          actual_end_at: string | null
          actual_start_at: string | null
          cancellation_reason: string | null
          class_id: string
          created_at: string
          created_by: string | null
          duration_minutes: number | null
          id: string
          is_makeup: boolean
          lesson_date: string
          notes: string | null
          report_due_at: string | null
          scheduled_end_at: string
          scheduled_start_at: string
          sequence_no: number | null
          status: Database['public']['Enums']['lesson_status']
          teacher_id: string | null
          topic: string | null
          updated_at: string
        }
        Insert: {
          actual_end_at?: string | null
          actual_start_at?: string | null
          cancellation_reason?: string | null
          class_id: string
          created_at?: string
          created_by?: string | null
          duration_minutes?: number | null
          id?: string
          is_makeup?: boolean
          lesson_date: string
          notes?: string | null
          report_due_at?: string | null
          scheduled_end_at: string
          scheduled_start_at: string
          sequence_no?: number | null
          status?: Database['public']['Enums']['lesson_status']
          teacher_id?: string | null
          topic?: string | null
          updated_at?: string
        }
        Update: {
          actual_end_at?: string | null
          actual_start_at?: string | null
          cancellation_reason?: string | null
          class_id?: string
          created_at?: string
          created_by?: string | null
          duration_minutes?: number | null
          id?: string
          is_makeup?: boolean
          lesson_date?: string
          notes?: string | null
          report_due_at?: string | null
          scheduled_end_at?: string
          scheduled_start_at?: string
          sequence_no?: number | null
          status?: Database['public']['Enums']['lesson_status']
          teacher_id?: string | null
          topic?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'lessons_class_id_fkey'
            columns: ['class_id']
            isOneToOne: false
            referencedRelation: 'classes'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'lessons_class_id_fkey'
            columns: ['class_id']
            isOneToOne: false
            referencedRelation: 'v_class_board'
            referencedColumns: ['class_id']
          },
          {
            foreignKeyName: 'lessons_class_id_fkey'
            columns: ['class_id']
            isOneToOne: false
            referencedRelation: 'v_doi_soat_hoc_phi'
            referencedColumns: ['class_id']
          },
          {
            foreignKeyName: 'lessons_class_id_fkey'
            columns: ['class_id']
            isOneToOne: false
            referencedRelation: 'v_hoc_vien_cua_giao_vien'
            referencedColumns: ['class_id']
          },
          {
            foreignKeyName: 'lessons_class_id_fkey'
            columns: ['class_id']
            isOneToOne: false
            referencedRelation: 'v_student_overview'
            referencedColumns: ['class_id']
          },
          {
            foreignKeyName: 'lessons_created_by_fkey'
            columns: ['created_by']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'lessons_teacher_id_fkey'
            columns: ['teacher_id']
            isOneToOne: false
            referencedRelation: 'teachers'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'lessons_teacher_id_fkey'
            columns: ['teacher_id']
            isOneToOne: false
            referencedRelation: 'v_ho_so_giao_vien'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'lessons_teacher_id_fkey'
            columns: ['teacher_id']
            isOneToOne: false
            referencedRelation: 'v_student_overview'
            referencedColumns: ['teacher_id']
          },
        ]
      }
      levels: {
        Row: {
          cefr_code: string | null
          code: string
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          name_en: string | null
          name_vi: string
          program_id: string | null
          sort_order: number
          status: Database['public']['Enums']['record_status']
          updated_at: string
        }
        Insert: {
          cefr_code?: string | null
          code: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          name_en?: string | null
          name_vi: string
          program_id?: string | null
          sort_order?: number
          status?: Database['public']['Enums']['record_status']
          updated_at?: string
        }
        Update: {
          cefr_code?: string | null
          code?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          name_en?: string | null
          name_vi?: string
          program_id?: string | null
          sort_order?: number
          status?: Database['public']['Enums']['record_status']
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'levels_created_by_fkey'
            columns: ['created_by']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'levels_program_id_fkey'
            columns: ['program_id']
            isOneToOne: false
            referencedRelation: 'programs'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'levels_program_id_fkey'
            columns: ['program_id']
            isOneToOne: false
            referencedRelation: 'v_student_overview'
            referencedColumns: ['program_id']
          },
        ]
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string
          due_at: string | null
          entity_id: string | null
          entity_type: string | null
          id: string
          payload: Json
          resolved_at: string | null
          resolved_by: string | null
          severity: Database['public']['Enums']['notification_severity']
          status: Database['public']['Enums']['notification_status']
          target_role: string | null
          target_user_id: string | null
          title: string
          type: string
          updated_at: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          due_at?: string | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          payload?: Json
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: Database['public']['Enums']['notification_severity']
          status?: Database['public']['Enums']['notification_status']
          target_role?: string | null
          target_user_id?: string | null
          title: string
          type: string
          updated_at?: string
        }
        Update: {
          body?: string | null
          created_at?: string
          due_at?: string | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          payload?: Json
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: Database['public']['Enums']['notification_severity']
          status?: Database['public']['Enums']['notification_status']
          target_role?: string | null
          target_user_id?: string | null
          title?: string
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'notifications_resolved_by_fkey'
            columns: ['resolved_by']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'notifications_target_role_fkey'
            columns: ['target_role']
            isOneToOne: false
            referencedRelation: 'roles'
            referencedColumns: ['code']
          },
          {
            foreignKeyName: 'notifications_target_user_id_fkey'
            columns: ['target_user_id']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
        ]
      }
      parents: {
        Row: {
          address: string | null
          created_at: string
          created_by: string | null
          email: string | null
          facebook: string | null
          full_name: string
          id: string
          notes: string | null
          occupation: string | null
          phone: string | null
          status: Database['public']['Enums']['record_status']
          updated_at: string
          user_id: string | null
          zalo: string | null
        }
        Insert: {
          address?: string | null
          created_at?: string
          created_by?: string | null
          email?: string | null
          facebook?: string | null
          full_name: string
          id?: string
          notes?: string | null
          occupation?: string | null
          phone?: string | null
          status?: Database['public']['Enums']['record_status']
          updated_at?: string
          user_id?: string | null
          zalo?: string | null
        }
        Update: {
          address?: string | null
          created_at?: string
          created_by?: string | null
          email?: string | null
          facebook?: string | null
          full_name?: string
          id?: string
          notes?: string | null
          occupation?: string | null
          phone?: string | null
          status?: Database['public']['Enums']['record_status']
          updated_at?: string
          user_id?: string | null
          zalo?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'parents_created_by_fkey'
            columns: ['created_by']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'parents_user_id_fkey'
            columns: ['user_id']
            isOneToOne: true
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          created_at: string
          created_by: string | null
          currency: string
          enrollment_id: string | null
          id: string
          method: Database['public']['Enums']['payment_method']
          needs_review: boolean
          notes: string | null
          payment_code: string | null
          payment_date: string
          recorded_by: string | null
          reference: string | null
          review_note: string | null
          statement_id: string | null
          status: Database['public']['Enums']['payment_status']
          student_id: string
          updated_at: string
        }
        Insert: {
          amount: number
          created_at?: string
          created_by?: string | null
          currency?: string
          enrollment_id?: string | null
          id?: string
          method?: Database['public']['Enums']['payment_method']
          needs_review?: boolean
          notes?: string | null
          payment_code?: string | null
          payment_date?: string
          recorded_by?: string | null
          reference?: string | null
          review_note?: string | null
          statement_id?: string | null
          status?: Database['public']['Enums']['payment_status']
          student_id: string
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          created_by?: string | null
          currency?: string
          enrollment_id?: string | null
          id?: string
          method?: Database['public']['Enums']['payment_method']
          needs_review?: boolean
          notes?: string | null
          payment_code?: string | null
          payment_date?: string
          recorded_by?: string | null
          reference?: string | null
          review_note?: string | null
          statement_id?: string | null
          status?: Database['public']['Enums']['payment_status']
          student_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'payments_created_by_fkey'
            columns: ['created_by']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'payments_enrollment_id_fkey'
            columns: ['enrollment_id']
            isOneToOne: false
            referencedRelation: 'student_enrollments'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'payments_enrollment_id_fkey'
            columns: ['enrollment_id']
            isOneToOne: false
            referencedRelation: 'v_doi_soat_hoc_phi'
            referencedColumns: ['enrollment_id']
          },
          {
            foreignKeyName: 'payments_enrollment_id_fkey'
            columns: ['enrollment_id']
            isOneToOne: false
            referencedRelation: 'v_enrollment_balances'
            referencedColumns: ['enrollment_id']
          },
          {
            foreignKeyName: 'payments_recorded_by_fkey'
            columns: ['recorded_by']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'payments_statement_id_fkey'
            columns: ['statement_id']
            isOneToOne: false
            referencedRelation: 'tuition_statements'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'payments_student_id_fkey'
            columns: ['student_id']
            isOneToOne: false
            referencedRelation: 'students'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'payments_student_id_fkey'
            columns: ['student_id']
            isOneToOne: false
            referencedRelation: 'v_doi_soat_hoc_phi'
            referencedColumns: ['nguoi_dung_ten_id']
          },
          {
            foreignKeyName: 'payments_student_id_fkey'
            columns: ['student_id']
            isOneToOne: false
            referencedRelation: 'v_hoc_vien_tam_ngung'
            referencedColumns: ['student_id']
          },
          {
            foreignKeyName: 'payments_student_id_fkey'
            columns: ['student_id']
            isOneToOne: false
            referencedRelation: 'v_portal_hoc_vien'
            referencedColumns: ['student_id']
          },
          {
            foreignKeyName: 'payments_student_id_fkey'
            columns: ['student_id']
            isOneToOne: false
            referencedRelation: 'v_student_finance'
            referencedColumns: ['student_id']
          },
          {
            foreignKeyName: 'payments_student_id_fkey'
            columns: ['student_id']
            isOneToOne: false
            referencedRelation: 'v_student_overview'
            referencedColumns: ['id']
          },
        ]
      }
      placement_tests: {
        Row: {
          conducted_at: string | null
          conducted_by: string | null
          created_at: string
          created_by: string | null
          id: string
          lead_id: string | null
          listening_score: number | null
          notes: string | null
          overall_score: number | null
          reading_score: number | null
          recommendation: string | null
          result_level_id: string | null
          scheduled_at: string | null
          speaking_score: number | null
          status: string
          student_id: string | null
          test_type: string | null
          updated_at: string
          writing_score: number | null
        }
        Insert: {
          conducted_at?: string | null
          conducted_by?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          lead_id?: string | null
          listening_score?: number | null
          notes?: string | null
          overall_score?: number | null
          reading_score?: number | null
          recommendation?: string | null
          result_level_id?: string | null
          scheduled_at?: string | null
          speaking_score?: number | null
          status?: string
          student_id?: string | null
          test_type?: string | null
          updated_at?: string
          writing_score?: number | null
        }
        Update: {
          conducted_at?: string | null
          conducted_by?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          lead_id?: string | null
          listening_score?: number | null
          notes?: string | null
          overall_score?: number | null
          reading_score?: number | null
          recommendation?: string | null
          result_level_id?: string | null
          scheduled_at?: string | null
          speaking_score?: number | null
          status?: string
          student_id?: string | null
          test_type?: string | null
          updated_at?: string
          writing_score?: number | null
        }
        Relationships: [
          {
            foreignKeyName: 'placement_tests_conducted_by_fkey'
            columns: ['conducted_by']
            isOneToOne: false
            referencedRelation: 'teachers'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'placement_tests_conducted_by_fkey'
            columns: ['conducted_by']
            isOneToOne: false
            referencedRelation: 'v_ho_so_giao_vien'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'placement_tests_conducted_by_fkey'
            columns: ['conducted_by']
            isOneToOne: false
            referencedRelation: 'v_student_overview'
            referencedColumns: ['teacher_id']
          },
          {
            foreignKeyName: 'placement_tests_created_by_fkey'
            columns: ['created_by']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'placement_tests_lead_id_fkey'
            columns: ['lead_id']
            isOneToOne: false
            referencedRelation: 'leads'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'placement_tests_result_level_id_fkey'
            columns: ['result_level_id']
            isOneToOne: false
            referencedRelation: 'levels'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'placement_tests_result_level_id_fkey'
            columns: ['result_level_id']
            isOneToOne: false
            referencedRelation: 'v_student_overview'
            referencedColumns: ['level_id']
          },
          {
            foreignKeyName: 'placement_tests_student_id_fkey'
            columns: ['student_id']
            isOneToOne: false
            referencedRelation: 'students'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'placement_tests_student_id_fkey'
            columns: ['student_id']
            isOneToOne: false
            referencedRelation: 'v_doi_soat_hoc_phi'
            referencedColumns: ['nguoi_dung_ten_id']
          },
          {
            foreignKeyName: 'placement_tests_student_id_fkey'
            columns: ['student_id']
            isOneToOne: false
            referencedRelation: 'v_hoc_vien_tam_ngung'
            referencedColumns: ['student_id']
          },
          {
            foreignKeyName: 'placement_tests_student_id_fkey'
            columns: ['student_id']
            isOneToOne: false
            referencedRelation: 'v_portal_hoc_vien'
            referencedColumns: ['student_id']
          },
          {
            foreignKeyName: 'placement_tests_student_id_fkey'
            columns: ['student_id']
            isOneToOne: false
            referencedRelation: 'v_student_finance'
            referencedColumns: ['student_id']
          },
          {
            foreignKeyName: 'placement_tests_student_id_fkey'
            columns: ['student_id']
            isOneToOne: false
            referencedRelation: 'v_student_overview'
            referencedColumns: ['id']
          },
        ]
      }
      programs: {
        Row: {
          code: string
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          name_en: string | null
          name_vi: string
          sort_order: number
          status: Database['public']['Enums']['record_status']
          target_audience: string | null
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          name_en?: string | null
          name_vi: string
          sort_order?: number
          status?: Database['public']['Enums']['record_status']
          target_audience?: string | null
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          name_en?: string | null
          name_vi?: string
          sort_order?: number
          status?: Database['public']['Enums']['record_status']
          target_audience?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'programs_created_by_fkey'
            columns: ['created_by']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
        ]
      }
      recordings: {
        Row: {
          class_id: string | null
          created_at: string
          duration_seconds: number | null
          id: string
          lesson_id: string | null
          link_checked_at: string | null
          mirrored_at: string | null
          mirrored_url: string | null
          provider: string | null
          status: Database['public']['Enums']['record_status']
          title: string | null
          updated_at: string
          uploaded_by: string | null
          url: string
          visible_to_parent: boolean
        }
        Insert: {
          class_id?: string | null
          created_at?: string
          duration_seconds?: number | null
          id?: string
          lesson_id?: string | null
          link_checked_at?: string | null
          mirrored_at?: string | null
          mirrored_url?: string | null
          provider?: string | null
          status?: Database['public']['Enums']['record_status']
          title?: string | null
          updated_at?: string
          uploaded_by?: string | null
          url: string
          visible_to_parent?: boolean
        }
        Update: {
          class_id?: string | null
          created_at?: string
          duration_seconds?: number | null
          id?: string
          lesson_id?: string | null
          link_checked_at?: string | null
          mirrored_at?: string | null
          mirrored_url?: string | null
          provider?: string | null
          status?: Database['public']['Enums']['record_status']
          title?: string | null
          updated_at?: string
          uploaded_by?: string | null
          url?: string
          visible_to_parent?: boolean
        }
        Relationships: [
          {
            foreignKeyName: 'recordings_class_id_fkey'
            columns: ['class_id']
            isOneToOne: false
            referencedRelation: 'classes'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'recordings_class_id_fkey'
            columns: ['class_id']
            isOneToOne: false
            referencedRelation: 'v_class_board'
            referencedColumns: ['class_id']
          },
          {
            foreignKeyName: 'recordings_class_id_fkey'
            columns: ['class_id']
            isOneToOne: false
            referencedRelation: 'v_doi_soat_hoc_phi'
            referencedColumns: ['class_id']
          },
          {
            foreignKeyName: 'recordings_class_id_fkey'
            columns: ['class_id']
            isOneToOne: false
            referencedRelation: 'v_hoc_vien_cua_giao_vien'
            referencedColumns: ['class_id']
          },
          {
            foreignKeyName: 'recordings_class_id_fkey'
            columns: ['class_id']
            isOneToOne: false
            referencedRelation: 'v_student_overview'
            referencedColumns: ['class_id']
          },
          {
            foreignKeyName: 'recordings_lesson_id_fkey'
            columns: ['lesson_id']
            isOneToOne: false
            referencedRelation: 'lessons'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'recordings_lesson_id_fkey'
            columns: ['lesson_id']
            isOneToOne: false
            referencedRelation: 'v_buoi_chan_luong'
            referencedColumns: ['lesson_id']
          },
          {
            foreignKeyName: 'recordings_lesson_id_fkey'
            columns: ['lesson_id']
            isOneToOne: false
            referencedRelation: 'v_doi_chieu_gio_day'
            referencedColumns: ['lesson_id']
          },
          {
            foreignKeyName: 'recordings_lesson_id_fkey'
            columns: ['lesson_id']
            isOneToOne: false
            referencedRelation: 'v_ho_so_buoi_hoc'
            referencedColumns: ['lesson_id']
          },
          {
            foreignKeyName: 'recordings_lesson_id_fkey'
            columns: ['lesson_id']
            isOneToOne: false
            referencedRelation: 'v_hoc_vien_cua_giao_vien'
            referencedColumns: ['lesson_id']
          },
          {
            foreignKeyName: 'recordings_lesson_id_fkey'
            columns: ['lesson_id']
            isOneToOne: false
            referencedRelation: 'v_lesson_reports'
            referencedColumns: ['lesson_id']
          },
          {
            foreignKeyName: 'recordings_lesson_id_fkey'
            columns: ['lesson_id']
            isOneToOne: false
            referencedRelation: 'v_portal_buoi_hoc'
            referencedColumns: ['lesson_id']
          },
          {
            foreignKeyName: 'recordings_uploaded_by_fkey'
            columns: ['uploaded_by']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
        ]
      }
      roles: {
        Row: {
          code: string
          description: string | null
          name_en: string
          name_vi: string
          sort_order: number
        }
        Insert: {
          code: string
          description?: string | null
          name_en: string
          name_vi: string
          sort_order?: number
        }
        Update: {
          code?: string
          description?: string | null
          name_en?: string
          name_vi?: string
          sort_order?: number
        }
        Relationships: []
      }
      settings: {
        Row: {
          description: string | null
          key: string
          updated_at: string
          updated_by: string | null
          value: Json
        }
        Insert: {
          description?: string | null
          key: string
          updated_at?: string
          updated_by?: string | null
          value: Json
        }
        Update: {
          description?: string | null
          key?: string
          updated_at?: string
          updated_by?: string | null
          value?: Json
        }
        Relationships: []
      }
      student_enrollments: {
        Row: {
          agreement_notes: string | null
          billing_mode: Database['public']['Enums']['billing_mode']
          class_id: string | null
          created_at: string
          created_by: string | null
          currency: string
          discount_amount: number
          discount_percent: number
          end_date: string | null
          enrollment_code: string | null
          expires_at: string | null
          gross_amount: number | null
          headcount: number
          id: string
          is_migrated_balance: boolean
          lessons_purchased: number | null
          monthly_discount_amount: number
          needs_review: boolean
          net_amount: number | null
          paid_in_full_until: string | null
          payer_note: string | null
          payer_parent_id: string | null
          payer_student_id: string | null
          price_per_lesson: number
          program_id: string | null
          review_note: string | null
          start_date: string
          status: Database['public']['Enums']['enrollment_status']
          student_id: string
          tuition_package_id: string | null
          updated_at: string
        }
        Insert: {
          agreement_notes?: string | null
          billing_mode?: Database['public']['Enums']['billing_mode']
          class_id?: string | null
          created_at?: string
          created_by?: string | null
          currency?: string
          discount_amount?: number
          discount_percent?: number
          end_date?: string | null
          enrollment_code?: string | null
          expires_at?: string | null
          gross_amount?: number | null
          headcount?: number
          id?: string
          is_migrated_balance?: boolean
          lessons_purchased?: number | null
          monthly_discount_amount?: number
          needs_review?: boolean
          net_amount?: number | null
          paid_in_full_until?: string | null
          payer_note?: string | null
          payer_parent_id?: string | null
          payer_student_id?: string | null
          price_per_lesson: number
          program_id?: string | null
          review_note?: string | null
          start_date?: string
          status?: Database['public']['Enums']['enrollment_status']
          student_id: string
          tuition_package_id?: string | null
          updated_at?: string
        }
        Update: {
          agreement_notes?: string | null
          billing_mode?: Database['public']['Enums']['billing_mode']
          class_id?: string | null
          created_at?: string
          created_by?: string | null
          currency?: string
          discount_amount?: number
          discount_percent?: number
          end_date?: string | null
          enrollment_code?: string | null
          expires_at?: string | null
          gross_amount?: number | null
          headcount?: number
          id?: string
          is_migrated_balance?: boolean
          lessons_purchased?: number | null
          monthly_discount_amount?: number
          needs_review?: boolean
          net_amount?: number | null
          paid_in_full_until?: string | null
          payer_note?: string | null
          payer_parent_id?: string | null
          payer_student_id?: string | null
          price_per_lesson?: number
          program_id?: string | null
          review_note?: string | null
          start_date?: string
          status?: Database['public']['Enums']['enrollment_status']
          student_id?: string
          tuition_package_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'student_enrollments_class_id_fkey'
            columns: ['class_id']
            isOneToOne: false
            referencedRelation: 'classes'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'student_enrollments_class_id_fkey'
            columns: ['class_id']
            isOneToOne: false
            referencedRelation: 'v_class_board'
            referencedColumns: ['class_id']
          },
          {
            foreignKeyName: 'student_enrollments_class_id_fkey'
            columns: ['class_id']
            isOneToOne: false
            referencedRelation: 'v_doi_soat_hoc_phi'
            referencedColumns: ['class_id']
          },
          {
            foreignKeyName: 'student_enrollments_class_id_fkey'
            columns: ['class_id']
            isOneToOne: false
            referencedRelation: 'v_hoc_vien_cua_giao_vien'
            referencedColumns: ['class_id']
          },
          {
            foreignKeyName: 'student_enrollments_class_id_fkey'
            columns: ['class_id']
            isOneToOne: false
            referencedRelation: 'v_student_overview'
            referencedColumns: ['class_id']
          },
          {
            foreignKeyName: 'student_enrollments_created_by_fkey'
            columns: ['created_by']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'student_enrollments_payer_parent_id_fkey'
            columns: ['payer_parent_id']
            isOneToOne: false
            referencedRelation: 'parents'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'student_enrollments_payer_parent_id_fkey'
            columns: ['payer_parent_id']
            isOneToOne: false
            referencedRelation: 'v_student_overview'
            referencedColumns: ['parent_id']
          },
          {
            foreignKeyName: 'student_enrollments_payer_student_id_fkey'
            columns: ['payer_student_id']
            isOneToOne: false
            referencedRelation: 'students'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'student_enrollments_payer_student_id_fkey'
            columns: ['payer_student_id']
            isOneToOne: false
            referencedRelation: 'v_doi_soat_hoc_phi'
            referencedColumns: ['nguoi_dung_ten_id']
          },
          {
            foreignKeyName: 'student_enrollments_payer_student_id_fkey'
            columns: ['payer_student_id']
            isOneToOne: false
            referencedRelation: 'v_hoc_vien_tam_ngung'
            referencedColumns: ['student_id']
          },
          {
            foreignKeyName: 'student_enrollments_payer_student_id_fkey'
            columns: ['payer_student_id']
            isOneToOne: false
            referencedRelation: 'v_portal_hoc_vien'
            referencedColumns: ['student_id']
          },
          {
            foreignKeyName: 'student_enrollments_payer_student_id_fkey'
            columns: ['payer_student_id']
            isOneToOne: false
            referencedRelation: 'v_student_finance'
            referencedColumns: ['student_id']
          },
          {
            foreignKeyName: 'student_enrollments_payer_student_id_fkey'
            columns: ['payer_student_id']
            isOneToOne: false
            referencedRelation: 'v_student_overview'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'student_enrollments_program_id_fkey'
            columns: ['program_id']
            isOneToOne: false
            referencedRelation: 'programs'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'student_enrollments_program_id_fkey'
            columns: ['program_id']
            isOneToOne: false
            referencedRelation: 'v_student_overview'
            referencedColumns: ['program_id']
          },
          {
            foreignKeyName: 'student_enrollments_student_id_fkey'
            columns: ['student_id']
            isOneToOne: false
            referencedRelation: 'students'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'student_enrollments_student_id_fkey'
            columns: ['student_id']
            isOneToOne: false
            referencedRelation: 'v_doi_soat_hoc_phi'
            referencedColumns: ['nguoi_dung_ten_id']
          },
          {
            foreignKeyName: 'student_enrollments_student_id_fkey'
            columns: ['student_id']
            isOneToOne: false
            referencedRelation: 'v_hoc_vien_tam_ngung'
            referencedColumns: ['student_id']
          },
          {
            foreignKeyName: 'student_enrollments_student_id_fkey'
            columns: ['student_id']
            isOneToOne: false
            referencedRelation: 'v_portal_hoc_vien'
            referencedColumns: ['student_id']
          },
          {
            foreignKeyName: 'student_enrollments_student_id_fkey'
            columns: ['student_id']
            isOneToOne: false
            referencedRelation: 'v_student_finance'
            referencedColumns: ['student_id']
          },
          {
            foreignKeyName: 'student_enrollments_student_id_fkey'
            columns: ['student_id']
            isOneToOne: false
            referencedRelation: 'v_student_overview'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'student_enrollments_tuition_package_id_fkey'
            columns: ['tuition_package_id']
            isOneToOne: false
            referencedRelation: 'tuition_packages'
            referencedColumns: ['id']
          },
        ]
      }
      student_parents: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          is_primary: boolean
          parent_id: string
          relationship: string
          student_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          is_primary?: boolean
          parent_id: string
          relationship?: string
          student_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          is_primary?: boolean
          parent_id?: string
          relationship?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'student_parents_created_by_fkey'
            columns: ['created_by']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'student_parents_parent_id_fkey'
            columns: ['parent_id']
            isOneToOne: false
            referencedRelation: 'parents'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'student_parents_parent_id_fkey'
            columns: ['parent_id']
            isOneToOne: false
            referencedRelation: 'v_student_overview'
            referencedColumns: ['parent_id']
          },
          {
            foreignKeyName: 'student_parents_student_id_fkey'
            columns: ['student_id']
            isOneToOne: false
            referencedRelation: 'students'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'student_parents_student_id_fkey'
            columns: ['student_id']
            isOneToOne: false
            referencedRelation: 'v_doi_soat_hoc_phi'
            referencedColumns: ['nguoi_dung_ten_id']
          },
          {
            foreignKeyName: 'student_parents_student_id_fkey'
            columns: ['student_id']
            isOneToOne: false
            referencedRelation: 'v_hoc_vien_tam_ngung'
            referencedColumns: ['student_id']
          },
          {
            foreignKeyName: 'student_parents_student_id_fkey'
            columns: ['student_id']
            isOneToOne: false
            referencedRelation: 'v_portal_hoc_vien'
            referencedColumns: ['student_id']
          },
          {
            foreignKeyName: 'student_parents_student_id_fkey'
            columns: ['student_id']
            isOneToOne: false
            referencedRelation: 'v_student_finance'
            referencedColumns: ['student_id']
          },
          {
            foreignKeyName: 'student_parents_student_id_fkey'
            columns: ['student_id']
            isOneToOne: false
            referencedRelation: 'v_student_overview'
            referencedColumns: ['id']
          },
        ]
      }
      students: {
        Row: {
          address: string | null
          created_at: string
          created_by: string | null
          current_level_id: string | null
          date_of_birth: string | null
          email: string | null
          enrollment_date: string | null
          full_name: string
          gender: string | null
          id: string
          internal_notes: string | null
          learning_goal: string | null
          learning_notes: string | null
          needs_review: boolean
          nickname: string | null
          phone: string | null
          program_id: string | null
          review_note: string | null
          source: string | null
          status: Database['public']['Enums']['student_status']
          student_code: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          address?: string | null
          created_at?: string
          created_by?: string | null
          current_level_id?: string | null
          date_of_birth?: string | null
          email?: string | null
          enrollment_date?: string | null
          full_name: string
          gender?: string | null
          id?: string
          internal_notes?: string | null
          learning_goal?: string | null
          learning_notes?: string | null
          needs_review?: boolean
          nickname?: string | null
          phone?: string | null
          program_id?: string | null
          review_note?: string | null
          source?: string | null
          status?: Database['public']['Enums']['student_status']
          student_code?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          address?: string | null
          created_at?: string
          created_by?: string | null
          current_level_id?: string | null
          date_of_birth?: string | null
          email?: string | null
          enrollment_date?: string | null
          full_name?: string
          gender?: string | null
          id?: string
          internal_notes?: string | null
          learning_goal?: string | null
          learning_notes?: string | null
          needs_review?: boolean
          nickname?: string | null
          phone?: string | null
          program_id?: string | null
          review_note?: string | null
          source?: string | null
          status?: Database['public']['Enums']['student_status']
          student_code?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'students_created_by_fkey'
            columns: ['created_by']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'students_current_level_id_fkey'
            columns: ['current_level_id']
            isOneToOne: false
            referencedRelation: 'levels'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'students_current_level_id_fkey'
            columns: ['current_level_id']
            isOneToOne: false
            referencedRelation: 'v_student_overview'
            referencedColumns: ['level_id']
          },
          {
            foreignKeyName: 'students_program_id_fkey'
            columns: ['program_id']
            isOneToOne: false
            referencedRelation: 'programs'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'students_program_id_fkey'
            columns: ['program_id']
            isOneToOne: false
            referencedRelation: 'v_student_overview'
            referencedColumns: ['program_id']
          },
          {
            foreignKeyName: 'students_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
        ]
      }
      teacher_availability: {
        Row: {
          created_at: string
          created_by: string | null
          end_time: string
          id: string
          note: string | null
          start_time: string
          status: Database['public']['Enums']['record_status']
          teacher_id: string
          updated_at: string
          weekday: number
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          end_time: string
          id?: string
          note?: string | null
          start_time: string
          status?: Database['public']['Enums']['record_status']
          teacher_id: string
          updated_at?: string
          weekday: number
        }
        Update: {
          created_at?: string
          created_by?: string | null
          end_time?: string
          id?: string
          note?: string | null
          start_time?: string
          status?: Database['public']['Enums']['record_status']
          teacher_id?: string
          updated_at?: string
          weekday?: number
        }
        Relationships: [
          {
            foreignKeyName: 'teacher_availability_created_by_fkey'
            columns: ['created_by']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'teacher_availability_teacher_id_fkey'
            columns: ['teacher_id']
            isOneToOne: false
            referencedRelation: 'teachers'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'teacher_availability_teacher_id_fkey'
            columns: ['teacher_id']
            isOneToOne: false
            referencedRelation: 'v_ho_so_giao_vien'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'teacher_availability_teacher_id_fkey'
            columns: ['teacher_id']
            isOneToOne: false
            referencedRelation: 'v_student_overview'
            referencedColumns: ['teacher_id']
          },
        ]
      }
      teacher_payable_lessons: {
        Row: {
          amount: number
          class_id: string | null
          created_at: string
          currency: string
          duration_minutes: number
          generated_at: string
          has_evidence: boolean
          has_video: boolean
          id: string
          lesson_date: string
          lesson_id: string
          notes: string | null
          payroll_id: string | null
          qc_score: number | null
          rate_amount: number
          rate_source: string | null
          sent_to_parent: boolean
          status: Database['public']['Enums']['payable_status']
          teacher_id: string
          updated_at: string
        }
        Insert: {
          amount: number
          class_id?: string | null
          created_at?: string
          currency?: string
          duration_minutes: number
          generated_at?: string
          has_evidence?: boolean
          has_video?: boolean
          id?: string
          lesson_date: string
          lesson_id: string
          notes?: string | null
          payroll_id?: string | null
          qc_score?: number | null
          rate_amount: number
          rate_source?: string | null
          sent_to_parent?: boolean
          status?: Database['public']['Enums']['payable_status']
          teacher_id: string
          updated_at?: string
        }
        Update: {
          amount?: number
          class_id?: string | null
          created_at?: string
          currency?: string
          duration_minutes?: number
          generated_at?: string
          has_evidence?: boolean
          has_video?: boolean
          id?: string
          lesson_date?: string
          lesson_id?: string
          notes?: string | null
          payroll_id?: string | null
          qc_score?: number | null
          rate_amount?: number
          rate_source?: string | null
          sent_to_parent?: boolean
          status?: Database['public']['Enums']['payable_status']
          teacher_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'fk_payable_payroll'
            columns: ['payroll_id']
            isOneToOne: false
            referencedRelation: 'teacher_payroll'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'fk_payable_payroll'
            columns: ['payroll_id']
            isOneToOne: false
            referencedRelation: 'v_teacher_payroll_summary'
            referencedColumns: ['payroll_id']
          },
          {
            foreignKeyName: 'teacher_payable_lessons_class_id_fkey'
            columns: ['class_id']
            isOneToOne: false
            referencedRelation: 'classes'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'teacher_payable_lessons_class_id_fkey'
            columns: ['class_id']
            isOneToOne: false
            referencedRelation: 'v_class_board'
            referencedColumns: ['class_id']
          },
          {
            foreignKeyName: 'teacher_payable_lessons_class_id_fkey'
            columns: ['class_id']
            isOneToOne: false
            referencedRelation: 'v_doi_soat_hoc_phi'
            referencedColumns: ['class_id']
          },
          {
            foreignKeyName: 'teacher_payable_lessons_class_id_fkey'
            columns: ['class_id']
            isOneToOne: false
            referencedRelation: 'v_hoc_vien_cua_giao_vien'
            referencedColumns: ['class_id']
          },
          {
            foreignKeyName: 'teacher_payable_lessons_class_id_fkey'
            columns: ['class_id']
            isOneToOne: false
            referencedRelation: 'v_student_overview'
            referencedColumns: ['class_id']
          },
          {
            foreignKeyName: 'teacher_payable_lessons_lesson_id_fkey'
            columns: ['lesson_id']
            isOneToOne: true
            referencedRelation: 'lessons'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'teacher_payable_lessons_lesson_id_fkey'
            columns: ['lesson_id']
            isOneToOne: true
            referencedRelation: 'v_buoi_chan_luong'
            referencedColumns: ['lesson_id']
          },
          {
            foreignKeyName: 'teacher_payable_lessons_lesson_id_fkey'
            columns: ['lesson_id']
            isOneToOne: true
            referencedRelation: 'v_doi_chieu_gio_day'
            referencedColumns: ['lesson_id']
          },
          {
            foreignKeyName: 'teacher_payable_lessons_lesson_id_fkey'
            columns: ['lesson_id']
            isOneToOne: true
            referencedRelation: 'v_ho_so_buoi_hoc'
            referencedColumns: ['lesson_id']
          },
          {
            foreignKeyName: 'teacher_payable_lessons_lesson_id_fkey'
            columns: ['lesson_id']
            isOneToOne: true
            referencedRelation: 'v_hoc_vien_cua_giao_vien'
            referencedColumns: ['lesson_id']
          },
          {
            foreignKeyName: 'teacher_payable_lessons_lesson_id_fkey'
            columns: ['lesson_id']
            isOneToOne: true
            referencedRelation: 'v_lesson_reports'
            referencedColumns: ['lesson_id']
          },
          {
            foreignKeyName: 'teacher_payable_lessons_lesson_id_fkey'
            columns: ['lesson_id']
            isOneToOne: true
            referencedRelation: 'v_portal_buoi_hoc'
            referencedColumns: ['lesson_id']
          },
          {
            foreignKeyName: 'teacher_payable_lessons_teacher_id_fkey'
            columns: ['teacher_id']
            isOneToOne: false
            referencedRelation: 'teachers'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'teacher_payable_lessons_teacher_id_fkey'
            columns: ['teacher_id']
            isOneToOne: false
            referencedRelation: 'v_ho_so_giao_vien'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'teacher_payable_lessons_teacher_id_fkey'
            columns: ['teacher_id']
            isOneToOne: false
            referencedRelation: 'v_student_overview'
            referencedColumns: ['teacher_id']
          },
        ]
      }
      teacher_payroll: {
        Row: {
          adjustments_amount: number
          approved_at: string | null
          approved_by: string | null
          avg_qc_score: number | null
          created_at: string
          created_by: string | null
          currency: string
          final_amount: number
          gross_amount: number
          id: string
          kpi_met: boolean | null
          kpi_target: number | null
          lessons_count: number
          lessons_missing_evidence: number
          lessons_missing_video: number
          notes: string | null
          paid_at: string | null
          paid_method: Database['public']['Enums']['payment_method'] | null
          period_end: string
          period_label: string | null
          period_start: string
          status: Database['public']['Enums']['payroll_status']
          teacher_id: string
          teaching_minutes: number
          updated_at: string
        }
        Insert: {
          adjustments_amount?: number
          approved_at?: string | null
          approved_by?: string | null
          avg_qc_score?: number | null
          created_at?: string
          created_by?: string | null
          currency?: string
          final_amount?: number
          gross_amount?: number
          id?: string
          kpi_met?: boolean | null
          kpi_target?: number | null
          lessons_count?: number
          lessons_missing_evidence?: number
          lessons_missing_video?: number
          notes?: string | null
          paid_at?: string | null
          paid_method?: Database['public']['Enums']['payment_method'] | null
          period_end: string
          period_label?: string | null
          period_start: string
          status?: Database['public']['Enums']['payroll_status']
          teacher_id: string
          teaching_minutes?: number
          updated_at?: string
        }
        Update: {
          adjustments_amount?: number
          approved_at?: string | null
          approved_by?: string | null
          avg_qc_score?: number | null
          created_at?: string
          created_by?: string | null
          currency?: string
          final_amount?: number
          gross_amount?: number
          id?: string
          kpi_met?: boolean | null
          kpi_target?: number | null
          lessons_count?: number
          lessons_missing_evidence?: number
          lessons_missing_video?: number
          notes?: string | null
          paid_at?: string | null
          paid_method?: Database['public']['Enums']['payment_method'] | null
          period_end?: string
          period_label?: string | null
          period_start?: string
          status?: Database['public']['Enums']['payroll_status']
          teacher_id?: string
          teaching_minutes?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'teacher_payroll_approved_by_fkey'
            columns: ['approved_by']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'teacher_payroll_created_by_fkey'
            columns: ['created_by']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'teacher_payroll_teacher_id_fkey'
            columns: ['teacher_id']
            isOneToOne: false
            referencedRelation: 'teachers'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'teacher_payroll_teacher_id_fkey'
            columns: ['teacher_id']
            isOneToOne: false
            referencedRelation: 'v_ho_so_giao_vien'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'teacher_payroll_teacher_id_fkey'
            columns: ['teacher_id']
            isOneToOne: false
            referencedRelation: 'v_student_overview'
            referencedColumns: ['teacher_id']
          },
        ]
      }
      teacher_payroll_adjustments: {
        Row: {
          amount: number
          created_at: string
          created_by: string | null
          description: string
          id: string
          kind: string
          payroll_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          created_by?: string | null
          description: string
          id?: string
          kind: string
          payroll_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          created_by?: string | null
          description?: string
          id?: string
          kind?: string
          payroll_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'teacher_payroll_adjustments_created_by_fkey'
            columns: ['created_by']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'teacher_payroll_adjustments_payroll_id_fkey'
            columns: ['payroll_id']
            isOneToOne: false
            referencedRelation: 'teacher_payroll'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'teacher_payroll_adjustments_payroll_id_fkey'
            columns: ['payroll_id']
            isOneToOne: false
            referencedRelation: 'v_teacher_payroll_summary'
            referencedColumns: ['payroll_id']
          },
        ]
      }
      teacher_rates: {
        Row: {
          class_id: string | null
          created_at: string
          created_by: string | null
          currency: string
          duration_minutes: number | null
          effective_from: string
          effective_to: string | null
          id: string
          notes: string | null
          rate_amount: number
          scope: string
          teacher_id: string
          updated_at: string
        }
        Insert: {
          class_id?: string | null
          created_at?: string
          created_by?: string | null
          currency?: string
          duration_minutes?: number | null
          effective_from?: string
          effective_to?: string | null
          id?: string
          notes?: string | null
          rate_amount: number
          scope: string
          teacher_id: string
          updated_at?: string
        }
        Update: {
          class_id?: string | null
          created_at?: string
          created_by?: string | null
          currency?: string
          duration_minutes?: number | null
          effective_from?: string
          effective_to?: string | null
          id?: string
          notes?: string | null
          rate_amount?: number
          scope?: string
          teacher_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'fk_teacher_rates_class'
            columns: ['class_id']
            isOneToOne: false
            referencedRelation: 'classes'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'fk_teacher_rates_class'
            columns: ['class_id']
            isOneToOne: false
            referencedRelation: 'v_class_board'
            referencedColumns: ['class_id']
          },
          {
            foreignKeyName: 'fk_teacher_rates_class'
            columns: ['class_id']
            isOneToOne: false
            referencedRelation: 'v_doi_soat_hoc_phi'
            referencedColumns: ['class_id']
          },
          {
            foreignKeyName: 'fk_teacher_rates_class'
            columns: ['class_id']
            isOneToOne: false
            referencedRelation: 'v_hoc_vien_cua_giao_vien'
            referencedColumns: ['class_id']
          },
          {
            foreignKeyName: 'fk_teacher_rates_class'
            columns: ['class_id']
            isOneToOne: false
            referencedRelation: 'v_student_overview'
            referencedColumns: ['class_id']
          },
          {
            foreignKeyName: 'teacher_rates_created_by_fkey'
            columns: ['created_by']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'teacher_rates_teacher_id_fkey'
            columns: ['teacher_id']
            isOneToOne: false
            referencedRelation: 'teachers'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'teacher_rates_teacher_id_fkey'
            columns: ['teacher_id']
            isOneToOne: false
            referencedRelation: 'v_ho_so_giao_vien'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'teacher_rates_teacher_id_fkey'
            columns: ['teacher_id']
            isOneToOne: false
            referencedRelation: 'v_student_overview'
            referencedColumns: ['teacher_id']
          },
        ]
      }
      teachers: {
        Row: {
          bio: string | null
          created_at: string
          created_by: string | null
          display_name: string | null
          email: string | null
          end_reason: string | null
          ended_date: string | null
          full_name: string
          hired_date: string | null
          id: string
          nationality: string | null
          needs_review: boolean
          notes: string | null
          phone: string | null
          review_note: string | null
          specialties: string[] | null
          status: Database['public']['Enums']['record_status']
          teacher_code: string | null
          teaching_role: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          bio?: string | null
          created_at?: string
          created_by?: string | null
          display_name?: string | null
          email?: string | null
          end_reason?: string | null
          ended_date?: string | null
          full_name: string
          hired_date?: string | null
          id?: string
          nationality?: string | null
          needs_review?: boolean
          notes?: string | null
          phone?: string | null
          review_note?: string | null
          specialties?: string[] | null
          status?: Database['public']['Enums']['record_status']
          teacher_code?: string | null
          teaching_role?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          bio?: string | null
          created_at?: string
          created_by?: string | null
          display_name?: string | null
          email?: string | null
          end_reason?: string | null
          ended_date?: string | null
          full_name?: string
          hired_date?: string | null
          id?: string
          nationality?: string | null
          needs_review?: boolean
          notes?: string | null
          phone?: string | null
          review_note?: string | null
          specialties?: string[] | null
          status?: Database['public']['Enums']['record_status']
          teacher_code?: string | null
          teaching_role?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'teachers_created_by_fkey'
            columns: ['created_by']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'teachers_user_id_fkey'
            columns: ['user_id']
            isOneToOne: true
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
        ]
      }
      teaching_report_students: {
        Row: {
          attitude: string | null
          comments: string | null
          created_at: string
          homework_completion: string | null
          id: string
          performance: string | null
          recommendation: string | null
          report_id: string
          student_id: string
          updated_at: string
        }
        Insert: {
          attitude?: string | null
          comments?: string | null
          created_at?: string
          homework_completion?: string | null
          id?: string
          performance?: string | null
          recommendation?: string | null
          report_id: string
          student_id: string
          updated_at?: string
        }
        Update: {
          attitude?: string | null
          comments?: string | null
          created_at?: string
          homework_completion?: string | null
          id?: string
          performance?: string | null
          recommendation?: string | null
          report_id?: string
          student_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'teaching_report_students_report_id_fkey'
            columns: ['report_id']
            isOneToOne: false
            referencedRelation: 'teaching_reports'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'teaching_report_students_report_id_fkey'
            columns: ['report_id']
            isOneToOne: false
            referencedRelation: 'v_lesson_reports'
            referencedColumns: ['report_id']
          },
          {
            foreignKeyName: 'teaching_report_students_student_id_fkey'
            columns: ['student_id']
            isOneToOne: false
            referencedRelation: 'students'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'teaching_report_students_student_id_fkey'
            columns: ['student_id']
            isOneToOne: false
            referencedRelation: 'v_doi_soat_hoc_phi'
            referencedColumns: ['nguoi_dung_ten_id']
          },
          {
            foreignKeyName: 'teaching_report_students_student_id_fkey'
            columns: ['student_id']
            isOneToOne: false
            referencedRelation: 'v_hoc_vien_tam_ngung'
            referencedColumns: ['student_id']
          },
          {
            foreignKeyName: 'teaching_report_students_student_id_fkey'
            columns: ['student_id']
            isOneToOne: false
            referencedRelation: 'v_portal_hoc_vien'
            referencedColumns: ['student_id']
          },
          {
            foreignKeyName: 'teaching_report_students_student_id_fkey'
            columns: ['student_id']
            isOneToOne: false
            referencedRelation: 'v_student_finance'
            referencedColumns: ['student_id']
          },
          {
            foreignKeyName: 'teaching_report_students_student_id_fkey'
            columns: ['student_id']
            isOneToOne: false
            referencedRelation: 'v_student_overview'
            referencedColumns: ['id']
          },
        ]
      }
      teaching_reports: {
        Row: {
          authored_by: Database['public']['Enums']['report_author']
          class_id: string
          completed_at: string | null
          created_at: string
          created_by: string | null
          duration_minutes: number | null
          end_time: string | null
          homework_summary: string | null
          id: string
          improvements: string | null
          is_late: boolean
          lesson_content: string | null
          lesson_id: string
          missing_fields: string[]
          next_lesson_recommendation: string | null
          qc_has_student_quote: boolean
          qc_has_timestamp: boolean
          qc_has_video: boolean
          qc_homework_has_pattern: boolean
          qc_improvements_deep: boolean | null
          qc_notes: string | null
          qc_score: number | null
          qc_scored_at: string | null
          qc_strengths_deep: boolean | null
          report_date: string
          review_notes: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          sent_to_parent_at: string | null
          sent_to_parent_by: string | null
          start_time: string | null
          status: Database['public']['Enums']['report_status']
          strengths: string | null
          student_quote: string | null
          submitted_at: string | null
          teacher_comments: string | null
          teacher_id: string | null
          updated_at: string
          video_timestamp: string | null
        }
        Insert: {
          authored_by?: Database['public']['Enums']['report_author']
          class_id: string
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          duration_minutes?: number | null
          end_time?: string | null
          homework_summary?: string | null
          id?: string
          improvements?: string | null
          is_late?: boolean
          lesson_content?: string | null
          lesson_id: string
          missing_fields?: string[]
          next_lesson_recommendation?: string | null
          qc_has_student_quote?: boolean
          qc_has_timestamp?: boolean
          qc_has_video?: boolean
          qc_homework_has_pattern?: boolean
          qc_improvements_deep?: boolean | null
          qc_notes?: string | null
          qc_score?: number | null
          qc_scored_at?: string | null
          qc_strengths_deep?: boolean | null
          report_date?: string
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          sent_to_parent_at?: string | null
          sent_to_parent_by?: string | null
          start_time?: string | null
          status?: Database['public']['Enums']['report_status']
          strengths?: string | null
          student_quote?: string | null
          submitted_at?: string | null
          teacher_comments?: string | null
          teacher_id?: string | null
          updated_at?: string
          video_timestamp?: string | null
        }
        Update: {
          authored_by?: Database['public']['Enums']['report_author']
          class_id?: string
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          duration_minutes?: number | null
          end_time?: string | null
          homework_summary?: string | null
          id?: string
          improvements?: string | null
          is_late?: boolean
          lesson_content?: string | null
          lesson_id?: string
          missing_fields?: string[]
          next_lesson_recommendation?: string | null
          qc_has_student_quote?: boolean
          qc_has_timestamp?: boolean
          qc_has_video?: boolean
          qc_homework_has_pattern?: boolean
          qc_improvements_deep?: boolean | null
          qc_notes?: string | null
          qc_score?: number | null
          qc_scored_at?: string | null
          qc_strengths_deep?: boolean | null
          report_date?: string
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          sent_to_parent_at?: string | null
          sent_to_parent_by?: string | null
          start_time?: string | null
          status?: Database['public']['Enums']['report_status']
          strengths?: string | null
          student_quote?: string | null
          submitted_at?: string | null
          teacher_comments?: string | null
          teacher_id?: string | null
          updated_at?: string
          video_timestamp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'teaching_reports_class_id_fkey'
            columns: ['class_id']
            isOneToOne: false
            referencedRelation: 'classes'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'teaching_reports_class_id_fkey'
            columns: ['class_id']
            isOneToOne: false
            referencedRelation: 'v_class_board'
            referencedColumns: ['class_id']
          },
          {
            foreignKeyName: 'teaching_reports_class_id_fkey'
            columns: ['class_id']
            isOneToOne: false
            referencedRelation: 'v_doi_soat_hoc_phi'
            referencedColumns: ['class_id']
          },
          {
            foreignKeyName: 'teaching_reports_class_id_fkey'
            columns: ['class_id']
            isOneToOne: false
            referencedRelation: 'v_hoc_vien_cua_giao_vien'
            referencedColumns: ['class_id']
          },
          {
            foreignKeyName: 'teaching_reports_class_id_fkey'
            columns: ['class_id']
            isOneToOne: false
            referencedRelation: 'v_student_overview'
            referencedColumns: ['class_id']
          },
          {
            foreignKeyName: 'teaching_reports_created_by_fkey'
            columns: ['created_by']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'teaching_reports_lesson_id_fkey'
            columns: ['lesson_id']
            isOneToOne: true
            referencedRelation: 'lessons'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'teaching_reports_lesson_id_fkey'
            columns: ['lesson_id']
            isOneToOne: true
            referencedRelation: 'v_buoi_chan_luong'
            referencedColumns: ['lesson_id']
          },
          {
            foreignKeyName: 'teaching_reports_lesson_id_fkey'
            columns: ['lesson_id']
            isOneToOne: true
            referencedRelation: 'v_doi_chieu_gio_day'
            referencedColumns: ['lesson_id']
          },
          {
            foreignKeyName: 'teaching_reports_lesson_id_fkey'
            columns: ['lesson_id']
            isOneToOne: true
            referencedRelation: 'v_ho_so_buoi_hoc'
            referencedColumns: ['lesson_id']
          },
          {
            foreignKeyName: 'teaching_reports_lesson_id_fkey'
            columns: ['lesson_id']
            isOneToOne: true
            referencedRelation: 'v_hoc_vien_cua_giao_vien'
            referencedColumns: ['lesson_id']
          },
          {
            foreignKeyName: 'teaching_reports_lesson_id_fkey'
            columns: ['lesson_id']
            isOneToOne: true
            referencedRelation: 'v_lesson_reports'
            referencedColumns: ['lesson_id']
          },
          {
            foreignKeyName: 'teaching_reports_lesson_id_fkey'
            columns: ['lesson_id']
            isOneToOne: true
            referencedRelation: 'v_portal_buoi_hoc'
            referencedColumns: ['lesson_id']
          },
          {
            foreignKeyName: 'teaching_reports_reviewed_by_fkey'
            columns: ['reviewed_by']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'teaching_reports_sent_to_parent_by_fkey'
            columns: ['sent_to_parent_by']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'teaching_reports_teacher_id_fkey'
            columns: ['teacher_id']
            isOneToOne: false
            referencedRelation: 'teachers'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'teaching_reports_teacher_id_fkey'
            columns: ['teacher_id']
            isOneToOne: false
            referencedRelation: 'v_ho_so_giao_vien'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'teaching_reports_teacher_id_fkey'
            columns: ['teacher_id']
            isOneToOne: false
            referencedRelation: 'v_student_overview'
            referencedColumns: ['teacher_id']
          },
        ]
      }
      trial_classes: {
        Row: {
          class_id: string | null
          created_at: string
          created_by: string | null
          duration_minutes: number
          id: string
          lead_id: string | null
          lesson_id: string | null
          notes: string | null
          outcome: string | null
          parent_feedback: string | null
          scheduled_at: string
          status: string
          student_id: string | null
          teacher_feedback: string | null
          teacher_id: string | null
          updated_at: string
        }
        Insert: {
          class_id?: string | null
          created_at?: string
          created_by?: string | null
          duration_minutes?: number
          id?: string
          lead_id?: string | null
          lesson_id?: string | null
          notes?: string | null
          outcome?: string | null
          parent_feedback?: string | null
          scheduled_at: string
          status?: string
          student_id?: string | null
          teacher_feedback?: string | null
          teacher_id?: string | null
          updated_at?: string
        }
        Update: {
          class_id?: string | null
          created_at?: string
          created_by?: string | null
          duration_minutes?: number
          id?: string
          lead_id?: string | null
          lesson_id?: string | null
          notes?: string | null
          outcome?: string | null
          parent_feedback?: string | null
          scheduled_at?: string
          status?: string
          student_id?: string | null
          teacher_feedback?: string | null
          teacher_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'trial_classes_class_id_fkey'
            columns: ['class_id']
            isOneToOne: false
            referencedRelation: 'classes'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'trial_classes_class_id_fkey'
            columns: ['class_id']
            isOneToOne: false
            referencedRelation: 'v_class_board'
            referencedColumns: ['class_id']
          },
          {
            foreignKeyName: 'trial_classes_class_id_fkey'
            columns: ['class_id']
            isOneToOne: false
            referencedRelation: 'v_doi_soat_hoc_phi'
            referencedColumns: ['class_id']
          },
          {
            foreignKeyName: 'trial_classes_class_id_fkey'
            columns: ['class_id']
            isOneToOne: false
            referencedRelation: 'v_hoc_vien_cua_giao_vien'
            referencedColumns: ['class_id']
          },
          {
            foreignKeyName: 'trial_classes_class_id_fkey'
            columns: ['class_id']
            isOneToOne: false
            referencedRelation: 'v_student_overview'
            referencedColumns: ['class_id']
          },
          {
            foreignKeyName: 'trial_classes_created_by_fkey'
            columns: ['created_by']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'trial_classes_lead_id_fkey'
            columns: ['lead_id']
            isOneToOne: false
            referencedRelation: 'leads'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'trial_classes_lesson_id_fkey'
            columns: ['lesson_id']
            isOneToOne: false
            referencedRelation: 'lessons'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'trial_classes_lesson_id_fkey'
            columns: ['lesson_id']
            isOneToOne: false
            referencedRelation: 'v_buoi_chan_luong'
            referencedColumns: ['lesson_id']
          },
          {
            foreignKeyName: 'trial_classes_lesson_id_fkey'
            columns: ['lesson_id']
            isOneToOne: false
            referencedRelation: 'v_doi_chieu_gio_day'
            referencedColumns: ['lesson_id']
          },
          {
            foreignKeyName: 'trial_classes_lesson_id_fkey'
            columns: ['lesson_id']
            isOneToOne: false
            referencedRelation: 'v_ho_so_buoi_hoc'
            referencedColumns: ['lesson_id']
          },
          {
            foreignKeyName: 'trial_classes_lesson_id_fkey'
            columns: ['lesson_id']
            isOneToOne: false
            referencedRelation: 'v_hoc_vien_cua_giao_vien'
            referencedColumns: ['lesson_id']
          },
          {
            foreignKeyName: 'trial_classes_lesson_id_fkey'
            columns: ['lesson_id']
            isOneToOne: false
            referencedRelation: 'v_lesson_reports'
            referencedColumns: ['lesson_id']
          },
          {
            foreignKeyName: 'trial_classes_lesson_id_fkey'
            columns: ['lesson_id']
            isOneToOne: false
            referencedRelation: 'v_portal_buoi_hoc'
            referencedColumns: ['lesson_id']
          },
          {
            foreignKeyName: 'trial_classes_student_id_fkey'
            columns: ['student_id']
            isOneToOne: false
            referencedRelation: 'students'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'trial_classes_student_id_fkey'
            columns: ['student_id']
            isOneToOne: false
            referencedRelation: 'v_doi_soat_hoc_phi'
            referencedColumns: ['nguoi_dung_ten_id']
          },
          {
            foreignKeyName: 'trial_classes_student_id_fkey'
            columns: ['student_id']
            isOneToOne: false
            referencedRelation: 'v_hoc_vien_tam_ngung'
            referencedColumns: ['student_id']
          },
          {
            foreignKeyName: 'trial_classes_student_id_fkey'
            columns: ['student_id']
            isOneToOne: false
            referencedRelation: 'v_portal_hoc_vien'
            referencedColumns: ['student_id']
          },
          {
            foreignKeyName: 'trial_classes_student_id_fkey'
            columns: ['student_id']
            isOneToOne: false
            referencedRelation: 'v_student_finance'
            referencedColumns: ['student_id']
          },
          {
            foreignKeyName: 'trial_classes_student_id_fkey'
            columns: ['student_id']
            isOneToOne: false
            referencedRelation: 'v_student_overview'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'trial_classes_teacher_id_fkey'
            columns: ['teacher_id']
            isOneToOne: false
            referencedRelation: 'teachers'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'trial_classes_teacher_id_fkey'
            columns: ['teacher_id']
            isOneToOne: false
            referencedRelation: 'v_ho_so_giao_vien'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'trial_classes_teacher_id_fkey'
            columns: ['teacher_id']
            isOneToOne: false
            referencedRelation: 'v_student_overview'
            referencedColumns: ['teacher_id']
          },
        ]
      }
      tuition_packages: {
        Row: {
          class_type: Database['public']['Enums']['class_type'] | null
          code: string
          created_at: string
          created_by: string | null
          default_price_per_lesson: number
          description: string | null
          duration_minutes: number | null
          id: string
          lesson_count: number
          name: string
          program_id: string | null
          status: Database['public']['Enums']['record_status']
          updated_at: string
          validity_days: number | null
        }
        Insert: {
          class_type?: Database['public']['Enums']['class_type'] | null
          code: string
          created_at?: string
          created_by?: string | null
          default_price_per_lesson: number
          description?: string | null
          duration_minutes?: number | null
          id?: string
          lesson_count: number
          name: string
          program_id?: string | null
          status?: Database['public']['Enums']['record_status']
          updated_at?: string
          validity_days?: number | null
        }
        Update: {
          class_type?: Database['public']['Enums']['class_type'] | null
          code?: string
          created_at?: string
          created_by?: string | null
          default_price_per_lesson?: number
          description?: string | null
          duration_minutes?: number | null
          id?: string
          lesson_count?: number
          name?: string
          program_id?: string | null
          status?: Database['public']['Enums']['record_status']
          updated_at?: string
          validity_days?: number | null
        }
        Relationships: [
          {
            foreignKeyName: 'tuition_packages_created_by_fkey'
            columns: ['created_by']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'tuition_packages_program_id_fkey'
            columns: ['program_id']
            isOneToOne: false
            referencedRelation: 'programs'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'tuition_packages_program_id_fkey'
            columns: ['program_id']
            isOneToOne: false
            referencedRelation: 'v_student_overview'
            referencedColumns: ['program_id']
          },
        ]
      }
      tuition_rates: {
        Row: {
          created_at: string
          created_by: string | null
          currency: string
          effective_from: string
          effective_to: string | null
          enrollment_id: string
          evidence_note: string | null
          id: string
          price_per_lesson: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          currency?: string
          effective_from?: string
          effective_to?: string | null
          enrollment_id: string
          evidence_note?: string | null
          id?: string
          price_per_lesson: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          currency?: string
          effective_from?: string
          effective_to?: string | null
          enrollment_id?: string
          evidence_note?: string | null
          id?: string
          price_per_lesson?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'tuition_rates_created_by_fkey'
            columns: ['created_by']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'tuition_rates_enrollment_id_fkey'
            columns: ['enrollment_id']
            isOneToOne: false
            referencedRelation: 'student_enrollments'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'tuition_rates_enrollment_id_fkey'
            columns: ['enrollment_id']
            isOneToOne: false
            referencedRelation: 'v_doi_soat_hoc_phi'
            referencedColumns: ['enrollment_id']
          },
          {
            foreignKeyName: 'tuition_rates_enrollment_id_fkey'
            columns: ['enrollment_id']
            isOneToOne: false
            referencedRelation: 'v_enrollment_balances'
            referencedColumns: ['enrollment_id']
          },
        ]
      }
      tuition_statements: {
        Row: {
          created_at: string
          created_by: string | null
          discount_amount: number
          due_date: string | null
          enrollment_id: string
          gross_amount: number
          id: string
          issued_at: string | null
          lessons_count: number
          net_amount: number
          notes: string | null
          paid_amount: number
          period_end: string
          period_label: string | null
          period_start: string
          status: string
          student_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          discount_amount?: number
          due_date?: string | null
          enrollment_id: string
          gross_amount?: number
          id?: string
          issued_at?: string | null
          lessons_count?: number
          net_amount?: number
          notes?: string | null
          paid_amount?: number
          period_end: string
          period_label?: string | null
          period_start: string
          status?: string
          student_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          discount_amount?: number
          due_date?: string | null
          enrollment_id?: string
          gross_amount?: number
          id?: string
          issued_at?: string | null
          lessons_count?: number
          net_amount?: number
          notes?: string | null
          paid_amount?: number
          period_end?: string
          period_label?: string | null
          period_start?: string
          status?: string
          student_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'tuition_statements_created_by_fkey'
            columns: ['created_by']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'tuition_statements_enrollment_id_fkey'
            columns: ['enrollment_id']
            isOneToOne: false
            referencedRelation: 'student_enrollments'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'tuition_statements_enrollment_id_fkey'
            columns: ['enrollment_id']
            isOneToOne: false
            referencedRelation: 'v_doi_soat_hoc_phi'
            referencedColumns: ['enrollment_id']
          },
          {
            foreignKeyName: 'tuition_statements_enrollment_id_fkey'
            columns: ['enrollment_id']
            isOneToOne: false
            referencedRelation: 'v_enrollment_balances'
            referencedColumns: ['enrollment_id']
          },
          {
            foreignKeyName: 'tuition_statements_student_id_fkey'
            columns: ['student_id']
            isOneToOne: false
            referencedRelation: 'students'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'tuition_statements_student_id_fkey'
            columns: ['student_id']
            isOneToOne: false
            referencedRelation: 'v_doi_soat_hoc_phi'
            referencedColumns: ['nguoi_dung_ten_id']
          },
          {
            foreignKeyName: 'tuition_statements_student_id_fkey'
            columns: ['student_id']
            isOneToOne: false
            referencedRelation: 'v_hoc_vien_tam_ngung'
            referencedColumns: ['student_id']
          },
          {
            foreignKeyName: 'tuition_statements_student_id_fkey'
            columns: ['student_id']
            isOneToOne: false
            referencedRelation: 'v_portal_hoc_vien'
            referencedColumns: ['student_id']
          },
          {
            foreignKeyName: 'tuition_statements_student_id_fkey'
            columns: ['student_id']
            isOneToOne: false
            referencedRelation: 'v_student_finance'
            referencedColumns: ['student_id']
          },
          {
            foreignKeyName: 'tuition_statements_student_id_fkey'
            columns: ['student_id']
            isOneToOne: false
            referencedRelation: 'v_student_overview'
            referencedColumns: ['id']
          },
        ]
      }
      users: {
        Row: {
          avatar_url: string | null
          created_at: string
          created_by: string | null
          email: string
          full_name: string
          id: string
          is_active: boolean
          last_seen_at: string | null
          locale: string
          phone: string | null
          role_code: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          created_by?: string | null
          email: string
          full_name: string
          id: string
          is_active?: boolean
          last_seen_at?: string | null
          locale?: string
          phone?: string | null
          role_code?: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          created_by?: string | null
          email?: string
          full_name?: string
          id?: string
          is_active?: boolean
          last_seen_at?: string | null
          locale?: string
          phone?: string | null
          role_code?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'users_created_by_fkey'
            columns: ['created_by']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'users_role_code_fkey'
            columns: ['role_code']
            isOneToOne: false
            referencedRelation: 'roles'
            referencedColumns: ['code']
          },
        ]
      }
    }
    Views: {
      v_buoi_chan_luong: {
        Row: {
          class_id: string | null
          lesson_date: string | null
          lesson_id: string | null
          ly_do: string | null
          moc_ap_dung: string | null
          report_due_at: string | null
          teacher_id: string | null
          teacher_user_id: string | null
          ten_giao_vien: string | null
          ten_lop: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'lessons_class_id_fkey'
            columns: ['class_id']
            isOneToOne: false
            referencedRelation: 'classes'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'lessons_class_id_fkey'
            columns: ['class_id']
            isOneToOne: false
            referencedRelation: 'v_class_board'
            referencedColumns: ['class_id']
          },
          {
            foreignKeyName: 'lessons_class_id_fkey'
            columns: ['class_id']
            isOneToOne: false
            referencedRelation: 'v_doi_soat_hoc_phi'
            referencedColumns: ['class_id']
          },
          {
            foreignKeyName: 'lessons_class_id_fkey'
            columns: ['class_id']
            isOneToOne: false
            referencedRelation: 'v_hoc_vien_cua_giao_vien'
            referencedColumns: ['class_id']
          },
          {
            foreignKeyName: 'lessons_class_id_fkey'
            columns: ['class_id']
            isOneToOne: false
            referencedRelation: 'v_student_overview'
            referencedColumns: ['class_id']
          },
          {
            foreignKeyName: 'lessons_teacher_id_fkey'
            columns: ['teacher_id']
            isOneToOne: false
            referencedRelation: 'teachers'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'lessons_teacher_id_fkey'
            columns: ['teacher_id']
            isOneToOne: false
            referencedRelation: 'v_ho_so_giao_vien'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'lessons_teacher_id_fkey'
            columns: ['teacher_id']
            isOneToOne: false
            referencedRelation: 'v_student_overview'
            referencedColumns: ['teacher_id']
          },
          {
            foreignKeyName: 'teachers_user_id_fkey'
            columns: ['teacher_user_id']
            isOneToOne: true
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
        ]
      }
      v_cash_received_daily: {
        Row: {
          cash_received: number | null
          day: string | null
          payment_count: number | null
        }
        Relationships: []
      }
      v_class_board: {
        Row: {
          buoi_gan_nhat: string | null
          buoi_thang_nay: number | null
          buoi_thieu_gio: number | null
          class_id: string | null
          con_thieu: number | null
          giao_vien: string | null
          ngay_im_lang: number | null
          si_so: number | null
          so_bao_cao: number | null
          so_lich: number | null
          so_video: number | null
          teacher_id: string | null
          ten_lop: string | null
          tong_buoi: number | null
          trang_thai_lop: Database['public']['Enums']['class_status'] | null
          video_dang_muon: number | null
        }
        Relationships: [
          {
            foreignKeyName: 'classes_teacher_id_fkey'
            columns: ['teacher_id']
            isOneToOne: false
            referencedRelation: 'teachers'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'classes_teacher_id_fkey'
            columns: ['teacher_id']
            isOneToOne: false
            referencedRelation: 'v_ho_so_giao_vien'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'classes_teacher_id_fkey'
            columns: ['teacher_id']
            isOneToOne: false
            referencedRelation: 'v_student_overview'
            referencedColumns: ['teacher_id']
          },
        ]
      }
      v_data_review: {
        Row: {
          code: string | null
          created_at: string | null
          entity_id: string | null
          entity_type: string | null
          label: string | null
          review_note: string | null
        }
        Relationships: []
      }
      v_doi_chieu_gio_day: {
        Row: {
          class_id: string | null
          giao_vien: string | null
          lech_phut: number | null
          lesson_date: string | null
          lesson_id: string | null
          phut_khai_bao: number | null
          phut_video: number | null
          so_doan_video: number | null
          ten_lop: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'lessons_class_id_fkey'
            columns: ['class_id']
            isOneToOne: false
            referencedRelation: 'classes'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'lessons_class_id_fkey'
            columns: ['class_id']
            isOneToOne: false
            referencedRelation: 'v_class_board'
            referencedColumns: ['class_id']
          },
          {
            foreignKeyName: 'lessons_class_id_fkey'
            columns: ['class_id']
            isOneToOne: false
            referencedRelation: 'v_doi_soat_hoc_phi'
            referencedColumns: ['class_id']
          },
          {
            foreignKeyName: 'lessons_class_id_fkey'
            columns: ['class_id']
            isOneToOne: false
            referencedRelation: 'v_hoc_vien_cua_giao_vien'
            referencedColumns: ['class_id']
          },
          {
            foreignKeyName: 'lessons_class_id_fkey'
            columns: ['class_id']
            isOneToOne: false
            referencedRelation: 'v_student_overview'
            referencedColumns: ['class_id']
          },
        ]
      }
      v_doi_soat_hoc_phi: {
        Row: {
          buoi_da_mua: number | null
          buoi_da_tru: number | null
          buoi_lop_da_day: number | null
          class_code: string | null
          class_id: string | null
          da_dong: number | null
          enrollment_code: string | null
          enrollment_id: string | null
          giao_vien: string | null
          hinh_thuc: string | null
          lech_buoi: number | null
          nguoi_dung_ten: string | null
          nguoi_dung_ten_id: string | null
          price_per_lesson: number | null
          si_so_hop_dong: number | null
          si_so_thuc_te: number | null
          ten_lop: string | null
          thanh_vien: string | null
          tien_hop_dong: number | null
          trang_thai_hop_dong: string | null
          trang_thai_lop: string | null
        }
        Relationships: []
      }
      v_enrollment_balances: {
        Row: {
          billing_mode: Database['public']['Enums']['billing_mode'] | null
          class_id: string | null
          deferred_revenue: number | null
          discount_amount: number | null
          end_date: string | null
          enrollment_code: string | null
          enrollment_id: string | null
          gross_amount: number | null
          headcount: number | null
          lessons_purchased: number | null
          lessons_remaining: number | null
          lessons_used: number | null
          monthly_discount_amount: number | null
          needs_review: boolean | null
          net_amount: number | null
          outstanding_amount: number | null
          paid_in_full_until: string | null
          payer_name: string | null
          payer_note: string | null
          price_per_lesson: number | null
          program_id: string | null
          revenue_recognized: number | null
          start_date: string | null
          status: Database['public']['Enums']['enrollment_status'] | null
          student_id: string | null
          total_paid: number | null
        }
        Relationships: [
          {
            foreignKeyName: 'student_enrollments_class_id_fkey'
            columns: ['class_id']
            isOneToOne: false
            referencedRelation: 'classes'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'student_enrollments_class_id_fkey'
            columns: ['class_id']
            isOneToOne: false
            referencedRelation: 'v_class_board'
            referencedColumns: ['class_id']
          },
          {
            foreignKeyName: 'student_enrollments_class_id_fkey'
            columns: ['class_id']
            isOneToOne: false
            referencedRelation: 'v_doi_soat_hoc_phi'
            referencedColumns: ['class_id']
          },
          {
            foreignKeyName: 'student_enrollments_class_id_fkey'
            columns: ['class_id']
            isOneToOne: false
            referencedRelation: 'v_hoc_vien_cua_giao_vien'
            referencedColumns: ['class_id']
          },
          {
            foreignKeyName: 'student_enrollments_class_id_fkey'
            columns: ['class_id']
            isOneToOne: false
            referencedRelation: 'v_student_overview'
            referencedColumns: ['class_id']
          },
          {
            foreignKeyName: 'student_enrollments_program_id_fkey'
            columns: ['program_id']
            isOneToOne: false
            referencedRelation: 'programs'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'student_enrollments_program_id_fkey'
            columns: ['program_id']
            isOneToOne: false
            referencedRelation: 'v_student_overview'
            referencedColumns: ['program_id']
          },
          {
            foreignKeyName: 'student_enrollments_student_id_fkey'
            columns: ['student_id']
            isOneToOne: false
            referencedRelation: 'students'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'student_enrollments_student_id_fkey'
            columns: ['student_id']
            isOneToOne: false
            referencedRelation: 'v_doi_soat_hoc_phi'
            referencedColumns: ['nguoi_dung_ten_id']
          },
          {
            foreignKeyName: 'student_enrollments_student_id_fkey'
            columns: ['student_id']
            isOneToOne: false
            referencedRelation: 'v_hoc_vien_tam_ngung'
            referencedColumns: ['student_id']
          },
          {
            foreignKeyName: 'student_enrollments_student_id_fkey'
            columns: ['student_id']
            isOneToOne: false
            referencedRelation: 'v_portal_hoc_vien'
            referencedColumns: ['student_id']
          },
          {
            foreignKeyName: 'student_enrollments_student_id_fkey'
            columns: ['student_id']
            isOneToOne: false
            referencedRelation: 'v_student_finance'
            referencedColumns: ['student_id']
          },
          {
            foreignKeyName: 'student_enrollments_student_id_fkey'
            columns: ['student_id']
            isOneToOne: false
            referencedRelation: 'v_student_overview'
            referencedColumns: ['id']
          },
        ]
      }
      v_expenses_daily: {
        Row: {
          category: Database['public']['Enums']['expense_category'] | null
          currency: string | null
          day: string | null
          total: number | null
        }
        Relationships: []
      }
      v_ho_so_buoi_hoc: {
        Row: {
          class_id: string | null
          co_gio: boolean | null
          co_nhan_xet: boolean | null
          co_noi_dung: boolean | null
          co_video: boolean | null
          giao_vien: string | null
          lesson_date: string | null
          lesson_id: string | null
          teacher_id: string | null
          ten_lop: string | null
          topic: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'lessons_class_id_fkey'
            columns: ['class_id']
            isOneToOne: false
            referencedRelation: 'classes'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'lessons_class_id_fkey'
            columns: ['class_id']
            isOneToOne: false
            referencedRelation: 'v_class_board'
            referencedColumns: ['class_id']
          },
          {
            foreignKeyName: 'lessons_class_id_fkey'
            columns: ['class_id']
            isOneToOne: false
            referencedRelation: 'v_doi_soat_hoc_phi'
            referencedColumns: ['class_id']
          },
          {
            foreignKeyName: 'lessons_class_id_fkey'
            columns: ['class_id']
            isOneToOne: false
            referencedRelation: 'v_hoc_vien_cua_giao_vien'
            referencedColumns: ['class_id']
          },
          {
            foreignKeyName: 'lessons_class_id_fkey'
            columns: ['class_id']
            isOneToOne: false
            referencedRelation: 'v_student_overview'
            referencedColumns: ['class_id']
          },
          {
            foreignKeyName: 'lessons_teacher_id_fkey'
            columns: ['teacher_id']
            isOneToOne: false
            referencedRelation: 'teachers'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'lessons_teacher_id_fkey'
            columns: ['teacher_id']
            isOneToOne: false
            referencedRelation: 'v_ho_so_giao_vien'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'lessons_teacher_id_fkey'
            columns: ['teacher_id']
            isOneToOne: false
            referencedRelation: 'v_student_overview'
            referencedColumns: ['teacher_id']
          },
        ]
      }
      v_ho_so_giao_vien: {
        Row: {
          bio: string | null
          buoi_gan_nhat: string | null
          display_name: string | null
          email: string | null
          end_reason: string | null
          ended_date: string | null
          full_name: string | null
          hired_date: string | null
          id: string | null
          lop_dang_day: number | null
          nationality: string | null
          phone: string | null
          phut_moi_tuan: number | null
          so_khung_lich: number | null
          so_khung_ranh: number | null
          teacher_code: string | null
          tong_buoi: number | null
          tong_luong: number | null
          trang_thai: string | null
          user_id: string | null
          vai_tro: string | null
        }
        Insert: {
          bio?: string | null
          buoi_gan_nhat?: never
          display_name?: string | null
          email?: string | null
          end_reason?: string | null
          ended_date?: string | null
          full_name?: string | null
          hired_date?: string | null
          id?: string | null
          lop_dang_day?: never
          nationality?: string | null
          phone?: string | null
          phut_moi_tuan?: never
          so_khung_lich?: never
          so_khung_ranh?: never
          teacher_code?: string | null
          tong_buoi?: never
          tong_luong?: never
          trang_thai?: never
          user_id?: string | null
          vai_tro?: string | null
        }
        Update: {
          bio?: string | null
          buoi_gan_nhat?: never
          display_name?: string | null
          email?: string | null
          end_reason?: string | null
          ended_date?: string | null
          full_name?: string | null
          hired_date?: string | null
          id?: string | null
          lop_dang_day?: never
          nationality?: string | null
          phone?: string | null
          phut_moi_tuan?: never
          so_khung_lich?: never
          so_khung_ranh?: never
          teacher_code?: string | null
          tong_buoi?: never
          tong_luong?: never
          trang_thai?: never
          user_id?: string | null
          vai_tro?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'teachers_user_id_fkey'
            columns: ['user_id']
            isOneToOne: true
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
        ]
      }
      v_hoc_vien_cua_giao_vien: {
        Row: {
          bai_tap: string | null
          buoi_gan_nhat: string | null
          can_cai_thien: string | null
          class_id: string | null
          diem_manh: string | null
          lesson_id: string | null
          ngay_ke_tu_buoi_cuoi: number | null
          noi_dung_buoi: string | null
          qc_score: number | null
          student_code: string | null
          student_id: string | null
          teacher_id: string | null
          ten_hoc_vien: string | null
          ten_lop: string | null
          tong_buoi_voi_gv: number | null
          trang_thai_hv: string | null
          trang_thai_lop: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'attendance_student_id_fkey'
            columns: ['student_id']
            isOneToOne: false
            referencedRelation: 'students'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'attendance_student_id_fkey'
            columns: ['student_id']
            isOneToOne: false
            referencedRelation: 'v_doi_soat_hoc_phi'
            referencedColumns: ['nguoi_dung_ten_id']
          },
          {
            foreignKeyName: 'attendance_student_id_fkey'
            columns: ['student_id']
            isOneToOne: false
            referencedRelation: 'v_hoc_vien_tam_ngung'
            referencedColumns: ['student_id']
          },
          {
            foreignKeyName: 'attendance_student_id_fkey'
            columns: ['student_id']
            isOneToOne: false
            referencedRelation: 'v_portal_hoc_vien'
            referencedColumns: ['student_id']
          },
          {
            foreignKeyName: 'attendance_student_id_fkey'
            columns: ['student_id']
            isOneToOne: false
            referencedRelation: 'v_student_finance'
            referencedColumns: ['student_id']
          },
          {
            foreignKeyName: 'attendance_student_id_fkey'
            columns: ['student_id']
            isOneToOne: false
            referencedRelation: 'v_student_overview'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'lessons_teacher_id_fkey'
            columns: ['teacher_id']
            isOneToOne: false
            referencedRelation: 'teachers'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'lessons_teacher_id_fkey'
            columns: ['teacher_id']
            isOneToOne: false
            referencedRelation: 'v_ho_so_giao_vien'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'lessons_teacher_id_fkey'
            columns: ['teacher_id']
            isOneToOne: false
            referencedRelation: 'v_student_overview'
            referencedColumns: ['teacher_id']
          },
        ]
      }
      v_hoc_vien_tam_ngung: {
        Row: {
          buoi_con_lai: number | null
          buoi_cuoi: string | null
          con_no_hop_dong: number | null
          da_dong: number | null
          email: string | null
          ghi_chu: string | null
          giao_vien_cuoi: string | null
          lien_he: string | null
          lop_cuoi: string | null
          phone: string | null
          student_code: string | null
          student_id: string | null
          ten_hoc_vien: string | null
          tien_buoi_vuot: number | null
          tong_buoi_da_hoc: number | null
          trang_thai: string | null
        }
        Insert: {
          buoi_con_lai?: never
          buoi_cuoi?: never
          con_no_hop_dong?: never
          da_dong?: never
          email?: string | null
          ghi_chu?: string | null
          giao_vien_cuoi?: never
          lien_he?: never
          lop_cuoi?: never
          phone?: string | null
          student_code?: string | null
          student_id?: string | null
          ten_hoc_vien?: string | null
          tien_buoi_vuot?: never
          tong_buoi_da_hoc?: never
          trang_thai?: never
        }
        Update: {
          buoi_con_lai?: never
          buoi_cuoi?: never
          con_no_hop_dong?: never
          da_dong?: never
          email?: string | null
          ghi_chu?: string | null
          giao_vien_cuoi?: never
          lien_he?: never
          lop_cuoi?: never
          phone?: string | null
          student_code?: string | null
          student_id?: string | null
          ten_hoc_vien?: string | null
          tien_buoi_vuot?: never
          tong_buoi_da_hoc?: never
          trang_thai?: never
        }
        Relationships: []
      }
      v_lesson_reports: {
        Row: {
          actual_end_at: string | null
          actual_start_at: string | null
          attendance_count: number | null
          authored_by: Database['public']['Enums']['report_author'] | null
          blocks_payroll: boolean | null
          class_code: string | null
          class_id: string | null
          class_name: string | null
          class_type: Database['public']['Enums']['class_type'] | null
          completed_at: string | null
          duration_minutes: number | null
          has_homework: boolean | null
          has_recording: boolean | null
          is_late: boolean | null
          is_overdue: boolean | null
          lesson_date: string | null
          lesson_id: string | null
          lesson_status: Database['public']['Enums']['lesson_status'] | null
          missing_fields: string[] | null
          qc_score: number | null
          report_due_at: string | null
          report_id: string | null
          report_status: Database['public']['Enums']['report_status'] | null
          scheduled_end_at: string | null
          scheduled_start_at: string | null
          sent_to_parent_at: string | null
          student_names: string | null
          submitted_at: string | null
          teacher_id: string | null
          teacher_name: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'lessons_class_id_fkey'
            columns: ['class_id']
            isOneToOne: false
            referencedRelation: 'classes'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'lessons_class_id_fkey'
            columns: ['class_id']
            isOneToOne: false
            referencedRelation: 'v_class_board'
            referencedColumns: ['class_id']
          },
          {
            foreignKeyName: 'lessons_class_id_fkey'
            columns: ['class_id']
            isOneToOne: false
            referencedRelation: 'v_doi_soat_hoc_phi'
            referencedColumns: ['class_id']
          },
          {
            foreignKeyName: 'lessons_class_id_fkey'
            columns: ['class_id']
            isOneToOne: false
            referencedRelation: 'v_hoc_vien_cua_giao_vien'
            referencedColumns: ['class_id']
          },
          {
            foreignKeyName: 'lessons_class_id_fkey'
            columns: ['class_id']
            isOneToOne: false
            referencedRelation: 'v_student_overview'
            referencedColumns: ['class_id']
          },
          {
            foreignKeyName: 'lessons_teacher_id_fkey'
            columns: ['teacher_id']
            isOneToOne: false
            referencedRelation: 'teachers'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'lessons_teacher_id_fkey'
            columns: ['teacher_id']
            isOneToOne: false
            referencedRelation: 'v_ho_so_giao_vien'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'lessons_teacher_id_fkey'
            columns: ['teacher_id']
            isOneToOne: false
            referencedRelation: 'v_student_overview'
            referencedColumns: ['teacher_id']
          },
        ]
      }
      v_xac_minh_buoi_hoc: {
        Row: {
          class_code: string | null
          gian_doan: Json | null
          giao_vien: string | null
          khong_khi_lop: string | null
          lech_phut: number | null
          lesson_date: string | null
          lesson_id: string | null
          nguon_xac_minh: string | null
          phut_khai: number | null
          phut_thuc_te: number | null
          so_video_youtube: number | null
          so_video_zoom: number | null
          ten_lop: string | null
          thoi_gian_hv_noi: number | null
          ty_le_hv_noi_phan_tram: number | null
          xac_minh_luc: string | null
        }
        Relationships: []
      }
      v_hieu_qua_gv_thang: {
        Row: {
          buoi_chua_tra: number | null
          buoi_co_video: number | null
          diem_qc: number | null
          doanh_thu: number | null
          doanh_thu_moi_gio: number | null
          loi_nhuan_gop: number | null
          so_buoi: number | null
          so_gio: number | null
          so_hoc_vien: number | null
          so_phut: number | null
          teacher_id: string | null
          teaching_role: string | null
          ten_giao_vien: string | null
          thang: string | null
          tra_giao_vien: number | null
          trang_thai_gv: string | null
          ty_suat_phan_tram: number | null
        }
        Relationships: []
      }
      v_luong_gv_thang: {
        Row: {
          buoi_chua_tra: number | null
          buoi_co_video: number | null
          buoi_da_tra: number | null
          diem_qc: number | null
          nam: string | null
          so_buoi: number | null
          so_phut: number | null
          teacher_id: string | null
          ten_giao_vien: string | null
          thang: string | null
          tien: number | null
          tien_chua_tra: number | null
          tien_te: string | null
          trang_thai_gv: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'teacher_payable_lessons_teacher_id_fkey'
            columns: ['teacher_id']
            isOneToOne: false
            referencedRelation: 'teachers'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'teacher_payable_lessons_teacher_id_fkey'
            columns: ['teacher_id']
            isOneToOne: false
            referencedRelation: 'v_ho_so_giao_vien'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'teacher_payable_lessons_teacher_id_fkey'
            columns: ['teacher_id']
            isOneToOne: false
            referencedRelation: 'v_student_overview'
            referencedColumns: ['teacher_id']
          },
        ]
      }
      v_portal_buoi_hoc: {
        Row: {
          bai_tap: string | null
          can_cai_thien: string | null
          de_xuat: string | null
          diem_danh: string | null
          diem_manh: string | null
          duration_minutes: number | null
          giao_vien: string | null
          lesson_date: string | null
          lesson_id: string | null
          noi_dung: string | null
          student_id: string | null
          ten_lop: string | null
          video: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'attendance_student_id_fkey'
            columns: ['student_id']
            isOneToOne: false
            referencedRelation: 'students'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'attendance_student_id_fkey'
            columns: ['student_id']
            isOneToOne: false
            referencedRelation: 'v_doi_soat_hoc_phi'
            referencedColumns: ['nguoi_dung_ten_id']
          },
          {
            foreignKeyName: 'attendance_student_id_fkey'
            columns: ['student_id']
            isOneToOne: false
            referencedRelation: 'v_hoc_vien_tam_ngung'
            referencedColumns: ['student_id']
          },
          {
            foreignKeyName: 'attendance_student_id_fkey'
            columns: ['student_id']
            isOneToOne: false
            referencedRelation: 'v_portal_hoc_vien'
            referencedColumns: ['student_id']
          },
          {
            foreignKeyName: 'attendance_student_id_fkey'
            columns: ['student_id']
            isOneToOne: false
            referencedRelation: 'v_student_finance'
            referencedColumns: ['student_id']
          },
          {
            foreignKeyName: 'attendance_student_id_fkey'
            columns: ['student_id']
            isOneToOne: false
            referencedRelation: 'v_student_overview'
            referencedColumns: ['id']
          },
        ]
      }
      v_portal_hoc_phi: {
        Row: {
          con_lai_phai_dong: number | null
          da_dong: number | null
          enrollment_code: string | null
          hinh_thuc: string | null
          lessons_purchased: number | null
          lessons_remaining: number | null
          lessons_used: number | null
          price_per_lesson: number | null
          start_date: string | null
          student_id: string | null
          tong_hoc_phi: number | null
          trang_thai: string | null
        }
        Insert: {
          con_lai_phai_dong?: never
          da_dong?: never
          enrollment_code?: string | null
          hinh_thuc?: never
          lessons_purchased?: number | null
          lessons_remaining?: never
          lessons_used?: never
          price_per_lesson?: number | null
          start_date?: string | null
          student_id?: string | null
          tong_hoc_phi?: number | null
          trang_thai?: never
        }
        Update: {
          con_lai_phai_dong?: never
          da_dong?: never
          enrollment_code?: string | null
          hinh_thuc?: never
          lessons_purchased?: number | null
          lessons_remaining?: never
          lessons_used?: never
          price_per_lesson?: number | null
          start_date?: string | null
          student_id?: string | null
          tong_hoc_phi?: number | null
          trang_thai?: never
        }
        Relationships: [
          {
            foreignKeyName: 'student_enrollments_student_id_fkey'
            columns: ['student_id']
            isOneToOne: false
            referencedRelation: 'students'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'student_enrollments_student_id_fkey'
            columns: ['student_id']
            isOneToOne: false
            referencedRelation: 'v_doi_soat_hoc_phi'
            referencedColumns: ['nguoi_dung_ten_id']
          },
          {
            foreignKeyName: 'student_enrollments_student_id_fkey'
            columns: ['student_id']
            isOneToOne: false
            referencedRelation: 'v_hoc_vien_tam_ngung'
            referencedColumns: ['student_id']
          },
          {
            foreignKeyName: 'student_enrollments_student_id_fkey'
            columns: ['student_id']
            isOneToOne: false
            referencedRelation: 'v_portal_hoc_vien'
            referencedColumns: ['student_id']
          },
          {
            foreignKeyName: 'student_enrollments_student_id_fkey'
            columns: ['student_id']
            isOneToOne: false
            referencedRelation: 'v_student_finance'
            referencedColumns: ['student_id']
          },
          {
            foreignKeyName: 'student_enrollments_student_id_fkey'
            columns: ['student_id']
            isOneToOne: false
            referencedRelation: 'v_student_overview'
            referencedColumns: ['id']
          },
        ]
      }
      v_portal_hoc_vien: {
        Row: {
          buoi_con_lai: number | null
          buoi_gan_nhat: string | null
          giao_vien: string | null
          kieu_hoc_phi: string | null
          student_code: string | null
          student_id: string | null
          ten_hoc_vien: string | null
          ten_lop: string | null
          tong_buoi_da_hoc: number | null
          trang_thai: string | null
        }
        Relationships: []
      }
      v_portal_hop_dong_nhom: {
        Row: {
          nguoi_dung_ten: string | null
          si_so: number | null
          student_id: string | null
          ten_lop: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'class_students_student_id_fkey'
            columns: ['student_id']
            isOneToOne: false
            referencedRelation: 'students'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'class_students_student_id_fkey'
            columns: ['student_id']
            isOneToOne: false
            referencedRelation: 'v_doi_soat_hoc_phi'
            referencedColumns: ['nguoi_dung_ten_id']
          },
          {
            foreignKeyName: 'class_students_student_id_fkey'
            columns: ['student_id']
            isOneToOne: false
            referencedRelation: 'v_hoc_vien_tam_ngung'
            referencedColumns: ['student_id']
          },
          {
            foreignKeyName: 'class_students_student_id_fkey'
            columns: ['student_id']
            isOneToOne: false
            referencedRelation: 'v_portal_hoc_vien'
            referencedColumns: ['student_id']
          },
          {
            foreignKeyName: 'class_students_student_id_fkey'
            columns: ['student_id']
            isOneToOne: false
            referencedRelation: 'v_student_finance'
            referencedColumns: ['student_id']
          },
          {
            foreignKeyName: 'class_students_student_id_fkey'
            columns: ['student_id']
            isOneToOne: false
            referencedRelation: 'v_student_overview'
            referencedColumns: ['id']
          },
        ]
      }
      v_quality_alerts: {
        Row: {
          body: string | null
          class_name: string | null
          created_at: string | null
          due_at: string | null
          id: string | null
          lesson_id: string | null
          missing_fields: Json | null
          payload: Json | null
          severity: Database['public']['Enums']['notification_severity'] | null
          status: Database['public']['Enums']['notification_status'] | null
          student_names: string | null
          teacher_name: string | null
          title: string | null
          type: string | null
        }
        Insert: {
          body?: string | null
          class_name?: never
          created_at?: string | null
          due_at?: string | null
          id?: string | null
          lesson_id?: string | null
          missing_fields?: never
          payload?: Json | null
          severity?: Database['public']['Enums']['notification_severity'] | null
          status?: Database['public']['Enums']['notification_status'] | null
          student_names?: never
          teacher_name?: never
          title?: string | null
          type?: string | null
        }
        Update: {
          body?: string | null
          class_name?: never
          created_at?: string | null
          due_at?: string | null
          id?: string | null
          lesson_id?: string | null
          missing_fields?: never
          payload?: Json | null
          severity?: Database['public']['Enums']['notification_severity'] | null
          status?: Database['public']['Enums']['notification_status'] | null
          student_names?: never
          teacher_name?: never
          title?: string | null
          type?: string | null
        }
        Relationships: []
      }
      v_revenue_recognized_daily: {
        Row: {
          day: string | null
          lessons_taught: number | null
          revenue_recognized: number | null
        }
        Relationships: []
      }
      v_student_finance: {
        Row: {
          lessons_completed: number | null
          lessons_purchased: number | null
          lessons_remaining: number | null
          needs_review: boolean | null
          outstanding_amount: number | null
          revenue_recognized: number | null
          student_id: string | null
          total_paid: number | null
          total_tuition: number | null
        }
        Relationships: []
      }
      v_student_overview: {
        Row: {
          age: number | null
          class_id: string | null
          class_name: string | null
          created_at: string | null
          date_of_birth: string | null
          email: string | null
          enrollment_date: string | null
          full_name: string | null
          gender: string | null
          id: string | null
          learning_goal: string | null
          learning_notes: string | null
          level_code: string | null
          level_id: string | null
          level_name: string | null
          nickname: string | null
          parent_email: string | null
          parent_id: string | null
          parent_name: string | null
          parent_phone: string | null
          phone: string | null
          program_id: string | null
          program_name: string | null
          source: string | null
          status: Database['public']['Enums']['student_status'] | null
          student_code: string | null
          teacher_id: string | null
          teacher_name: string | null
        }
        Relationships: []
      }
      v_tai_chinh_thang: {
        Row: {
          buoi_chua_gan_hoc_phi: number | null
          buoi_co_video: number | null
          buoi_day: number | null
          buoi_huy: number | null
          buoi_tinh_luong: number | null
          chi_khac: number | null
          diem_qc: number | null
          doanh_thu: number | null
          dong_ngoai_te: number | null
          luong_gv: number | null
          nam: string | null
          so_giao_vien: number | null
          so_hoc_vien: number | null
          so_lop: number | null
          thang: string | null
          thu_tien_mat: number | null
        }
        Relationships: []
      }
      v_teacher_payroll_summary: {
        Row: {
          adjustments_amount: number | null
          approved_at: string | null
          final_amount: number | null
          gross_amount: number | null
          lessons_count: number | null
          paid_at: string | null
          payroll_id: string | null
          period_end: string | null
          period_label: string | null
          period_start: string | null
          status: Database['public']['Enums']['payroll_status'] | null
          teacher_id: string | null
          teacher_name: string | null
          teaching_hours: number | null
          teaching_minutes: number | null
        }
        Relationships: [
          {
            foreignKeyName: 'teacher_payroll_teacher_id_fkey'
            columns: ['teacher_id']
            isOneToOne: false
            referencedRelation: 'teachers'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'teacher_payroll_teacher_id_fkey'
            columns: ['teacher_id']
            isOneToOne: false
            referencedRelation: 'v_ho_so_giao_vien'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'teacher_payroll_teacher_id_fkey'
            columns: ['teacher_id']
            isOneToOne: false
            referencedRelation: 'v_student_overview'
            referencedColumns: ['teacher_id']
          },
        ]
      }
      v_trung_lich_giao_vien: {
        Row: {
          gio_lop_1: string | null
          gio_lop_2: string | null
          lop_1: string | null
          lop_2: string | null
          phut_lop_1: number | null
          phut_lop_2: number | null
          teacher_id: string | null
          ten_giao_vien: string | null
          weekday: number | null
        }
        Relationships: [
          {
            foreignKeyName: 'classes_teacher_id_fkey'
            columns: ['teacher_id']
            isOneToOne: false
            referencedRelation: 'teachers'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'classes_teacher_id_fkey'
            columns: ['teacher_id']
            isOneToOne: false
            referencedRelation: 'v_ho_so_giao_vien'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'classes_teacher_id_fkey'
            columns: ['teacher_id']
            isOneToOne: false
            referencedRelation: 'v_student_overview'
            referencedColumns: ['teacher_id']
          },
        ]
      }
    }
    Functions: {
      current_role_code: { Args: never; Returns: string }
      current_teacher_id: { Args: never; Returns: string }
      fn_alert_lesson_balance: { Args: never; Returns: number }
      fn_alert_missing_lesson_time: { Args: never; Returns: number }
      fn_alert_not_sent_to_parent: { Args: never; Returns: number }
      fn_build_payroll: {
        Args: {
          p_period_end: string
          p_period_start: string
          p_teacher_id: string
        }
        Returns: string
      }
      fn_build_tuition_statement: {
        Args: {
          p_enrollment_id: string
          p_period_end: string
          p_period_start: string
        }
        Returns: string
      }
      fn_consume_lesson: {
        Args: { p_attendance_id: string }
        Returns: undefined
      }
      fn_enrollment_payer_name: {
        Args: { p_enrollment_id: string }
        Returns: string
      }
      fn_generate_payable_lesson: {
        Args: { p_lesson_id: string }
        Returns: undefined
      }
      fn_hoc_vien_cua_tai_khoan: { Args: never; Returns: string[] }
      fn_missing_field_label: { Args: { p_field: string }; Returns: string }
      fn_nhap_feedback: {
        Args: { p_du_lieu: Json; p_ten_lop: string }
        Returns: {
          bao_cao_moi: number
          buoi_ghep_duoc: number
          danh_gia_moi: number
          video_moi: number
        }[]
      }
      fn_pick_enrollment: {
        Args: { p_class_id: string; p_student_id: string }
        Returns: string
      }
      fn_qc_criterion_label: { Args: { p_key: string }; Returns: string }
      fn_recalc_payroll: { Args: { p_payroll_id: string }; Returns: undefined }
      fn_refresh_report_status: {
        Args: { p_report_id: string }
        Returns: {
          authored_by: Database['public']['Enums']['report_author']
          class_id: string
          completed_at: string | null
          created_at: string
          created_by: string | null
          duration_minutes: number | null
          end_time: string | null
          homework_summary: string | null
          id: string
          improvements: string | null
          is_late: boolean
          lesson_content: string | null
          lesson_id: string
          missing_fields: string[]
          next_lesson_recommendation: string | null
          qc_has_student_quote: boolean
          qc_has_timestamp: boolean
          qc_has_video: boolean
          qc_homework_has_pattern: boolean
          qc_improvements_deep: boolean | null
          qc_notes: string | null
          qc_score: number | null
          qc_scored_at: string | null
          qc_strengths_deep: boolean | null
          report_date: string
          review_notes: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          sent_to_parent_at: string | null
          sent_to_parent_by: string | null
          start_time: string | null
          status: Database['public']['Enums']['report_status']
          strengths: string | null
          student_quote: string | null
          submitted_at: string | null
          teacher_comments: string | null
          teacher_id: string | null
          updated_at: string
          video_timestamp: string | null
        }
        SetofOptions: {
          from: '*'
          to: 'teaching_reports'
          isOneToOne: true
          isSetofReturn: false
        }
      }
      fn_report_missing_fields: {
        Args: { p_report_id: string }
        Returns: string[]
      }
      fn_resolve_teacher_rate: {
        Args: {
          p_class_id: string
          p_duration_minutes: number
          p_on_date?: string
          p_teacher_id: string
        }
        Returns: number
      }
      fn_resolve_tuition_rate: {
        Args: { p_enrollment_id: string; p_on_date?: string }
        Returns: number
      }
      fn_sao_luu_thu_cong: { Args: never; Returns: string }
      fn_scan_overdue_reports: {
        Args: never
        Returns: {
          alert_created: boolean
          lesson_id: string
        }[]
      }
      fn_score_report_qc: { Args: { p_report_id: string }; Returns: number }
      fn_tao_ban_sao_luu: { Args: { p_loai?: string }; Returns: string }
      is_founder: { Args: never; Returns: boolean }
      is_staff: { Args: never; Returns: boolean }
      is_teacher: { Args: never; Returns: boolean }
      setting_int: {
        Args: { p_default: number; p_key: string }
        Returns: number
      }
      student_age: { Args: { p_dob: string }; Returns: number }
      student_in_lesson_class: {
        Args: { p_lesson_id: string; p_student_id: string }
        Returns: boolean
      }
      teaches_class: { Args: { p_class_id: string }; Returns: boolean }
      teaches_lesson: { Args: { p_lesson_id: string }; Returns: boolean }
      teaches_student: { Args: { p_student_id: string }; Returns: boolean }
    }
    Enums: {
      attendance_status: 'present' | 'late' | 'absent_excused' | 'absent_unexcused' | 'no_show'
      billing_mode: 'prepaid_package' | 'monthly_postpaid' | 'undetermined'
      class_status: 'draft' | 'active' | 'paused' | 'completed' | 'cancelled'
      class_type: 'one_to_one' | 'one_to_two' | 'small_group'
      document_category:
        | 'thoa_thuan'
        | 'hoc_phi_lo_trinh'
        | 'website'
        | 'chinh_sach'
        | 'bieu_mau'
        | 'khac'
      enrollment_status: 'draft' | 'active' | 'paused' | 'completed' | 'cancelled'
      expense_category:
        | 'teacher_salary'
        | 'software'
        | 'marketing'
        | 'advertising'
        | 'equipment'
        | 'office'
        | 'training'
        | 'other'
      lead_status:
        | 'new'
        | 'contacted'
        | 'consultation'
        | 'placement_test'
        | 'trial'
        | 'follow_up'
        | 'enrolled'
        | 'lost'
      lesson_status:
        | 'scheduled'
        | 'in_progress'
        | 'completed'
        | 'cancelled'
        | 'no_show'
        | 'rescheduled'
      notification_severity: 'info' | 'warning' | 'critical'
      notification_status: 'new' | 'acknowledged' | 'resolved' | 'dismissed'
      payable_status: 'pending' | 'included' | 'excluded' | 'paid'
      payment_method: 'cash' | 'bank_transfer' | 'other'
      payment_status: 'pending' | 'confirmed' | 'refunded' | 'cancelled'
      payroll_status: 'draft' | 'pending_review' | 'approved' | 'paid'
      record_status: 'active' | 'archived'
      report_author: 'teacher' | 'ai' | 'ai_edited_by_teacher'
      report_status: 'draft' | 'submitted' | 'incomplete' | 'needs_review' | 'approved'
      student_status:
        | 'lead'
        | 'placement'
        | 'trial'
        | 'active'
        | 'paused'
        | 'completed'
        | 'inactive'
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, 'public'>]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    ? (DefaultSchema['Tables'] & DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema['Enums']
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
    ? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema['CompositeTypes']
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes']
    ? DefaultSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      attendance_status: ['present', 'late', 'absent_excused', 'absent_unexcused', 'no_show'],
      billing_mode: ['prepaid_package', 'monthly_postpaid', 'undetermined'],
      class_status: ['draft', 'active', 'paused', 'completed', 'cancelled'],
      class_type: ['one_to_one', 'one_to_two', 'small_group'],
      document_category: [
        'thoa_thuan',
        'hoc_phi_lo_trinh',
        'website',
        'chinh_sach',
        'bieu_mau',
        'khac',
      ],
      enrollment_status: ['draft', 'active', 'paused', 'completed', 'cancelled'],
      expense_category: [
        'teacher_salary',
        'software',
        'marketing',
        'advertising',
        'equipment',
        'office',
        'training',
        'other',
      ],
      lead_status: [
        'new',
        'contacted',
        'consultation',
        'placement_test',
        'trial',
        'follow_up',
        'enrolled',
        'lost',
      ],
      lesson_status: [
        'scheduled',
        'in_progress',
        'completed',
        'cancelled',
        'no_show',
        'rescheduled',
      ],
      notification_severity: ['info', 'warning', 'critical'],
      notification_status: ['new', 'acknowledged', 'resolved', 'dismissed'],
      payable_status: ['pending', 'included', 'excluded', 'paid'],
      payment_method: ['cash', 'bank_transfer', 'other'],
      payment_status: ['pending', 'confirmed', 'refunded', 'cancelled'],
      payroll_status: ['draft', 'pending_review', 'approved', 'paid'],
      record_status: ['active', 'archived'],
      report_author: ['teacher', 'ai', 'ai_edited_by_teacher'],
      report_status: ['draft', 'submitted', 'incomplete', 'needs_review', 'approved'],
      student_status: ['lead', 'placement', 'trial', 'active', 'paused', 'completed', 'inactive'],
    },
  },
} as const

/**
 * Hàng của một view trong schema public.
 *
 * Bộ sinh kiểu của Supabase không xuất sẵn kiểu này, nhưng mã trong dự án có
 * dùng (ví dụ StudentForm đọc v_student_overview). Giữ lại ở đây để mỗi lần
 * sinh lại kiểu không làm hỏng chỗ khác.
 */
export type Views<T extends keyof Database['public']['Views']> =
  Database['public']['Views'][T]['Row']
