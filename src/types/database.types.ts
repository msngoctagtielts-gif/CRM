// Sinh tự động từ schema PostgreSQL — KHÔNG sửa tay.
// Tạo lại: npm run db:types  (hoặc python3 scripts/gen-types.py <DB_URL>)

export type Json =
  | string | number | boolean | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      attendance: {
        Row: {
          id: string
          lesson_id: string
          student_id: string
          status: Database["public"]["Enums"]["attendance_status"]
          minutes_attended: number | null
          is_billable: boolean
          notes: string | null
          recorded_by: string | null
          recorded_at: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          lesson_id: string
          student_id: string
          status?: Database["public"]["Enums"]["attendance_status"]
          minutes_attended?: number | null
          is_billable?: boolean
          notes?: string | null
          recorded_by?: string | null
          recorded_at?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          lesson_id?: string
          student_id?: string
          status?: Database["public"]["Enums"]["attendance_status"]
          minutes_attended?: number | null
          is_billable?: boolean
          notes?: string | null
          recorded_by?: string | null
          recorded_at?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          { foreignKeyName: "attendance_lesson_id_fkey"; columns: ["lesson_id"]; isOneToOne: false; referencedRelation: "lessons"; referencedColumns: ["id"] },
          { foreignKeyName: "attendance_recorded_by_fkey"; columns: ["recorded_by"]; isOneToOne: false; referencedRelation: "users"; referencedColumns: ["id"] },
          { foreignKeyName: "attendance_student_id_fkey"; columns: ["student_id"]; isOneToOne: false; referencedRelation: "students"; referencedColumns: ["id"] },
        ]
      }
      audit_logs: {
        Row: {
          id: string
          table_name: string
          record_id: string | null
          action: string
          actor_id: string | null
          old_data: Json | null
          new_data: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          table_name: string
          record_id?: string | null
          action: string
          actor_id?: string | null
          old_data?: Json | null
          new_data?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          table_name?: string
          record_id?: string | null
          action?: string
          actor_id?: string | null
          old_data?: Json | null
          new_data?: Json | null
          created_at?: string
        }
        Relationships: []
      }
      class_schedules: {
        Row: {
          id: string
          class_id: string
          weekday: number
          start_time: string
          duration_minutes: number
          timezone: string
          effective_from: string
          effective_to: string | null
          status: Database["public"]["Enums"]["record_status"]
          created_at: string
          updated_at: string
          created_by: string | null
        }
        Insert: {
          id?: string
          class_id: string
          weekday: number
          start_time: string
          duration_minutes?: number
          timezone?: string
          effective_from?: string
          effective_to?: string | null
          status?: Database["public"]["Enums"]["record_status"]
          created_at?: string
          updated_at?: string
          created_by?: string | null
        }
        Update: {
          id?: string
          class_id?: string
          weekday?: number
          start_time?: string
          duration_minutes?: number
          timezone?: string
          effective_from?: string
          effective_to?: string | null
          status?: Database["public"]["Enums"]["record_status"]
          created_at?: string
          updated_at?: string
          created_by?: string | null
        }
        Relationships: [
          { foreignKeyName: "class_schedules_class_id_fkey"; columns: ["class_id"]; isOneToOne: false; referencedRelation: "classes"; referencedColumns: ["id"] },
          { foreignKeyName: "class_schedules_created_by_fkey"; columns: ["created_by"]; isOneToOne: false; referencedRelation: "users"; referencedColumns: ["id"] },
        ]
      }
      class_students: {
        Row: {
          id: string
          class_id: string
          student_id: string
          joined_at: string
          left_at: string | null
          status: Database["public"]["Enums"]["record_status"]
          notes: string | null
          created_at: string
          updated_at: string
          created_by: string | null
        }
        Insert: {
          id?: string
          class_id: string
          student_id: string
          joined_at?: string
          left_at?: string | null
          status?: Database["public"]["Enums"]["record_status"]
          notes?: string | null
          created_at?: string
          updated_at?: string
          created_by?: string | null
        }
        Update: {
          id?: string
          class_id?: string
          student_id?: string
          joined_at?: string
          left_at?: string | null
          status?: Database["public"]["Enums"]["record_status"]
          notes?: string | null
          created_at?: string
          updated_at?: string
          created_by?: string | null
        }
        Relationships: [
          { foreignKeyName: "class_students_class_id_fkey"; columns: ["class_id"]; isOneToOne: false; referencedRelation: "classes"; referencedColumns: ["id"] },
          { foreignKeyName: "class_students_created_by_fkey"; columns: ["created_by"]; isOneToOne: false; referencedRelation: "users"; referencedColumns: ["id"] },
          { foreignKeyName: "class_students_student_id_fkey"; columns: ["student_id"]; isOneToOne: false; referencedRelation: "students"; referencedColumns: ["id"] },
        ]
      }
      classes: {
        Row: {
          id: string
          class_code: string | null
          name: string
          program_id: string | null
          level_id: string | null
          teacher_id: string | null
          class_type: Database["public"]["Enums"]["class_type"]
          max_students: number
          default_duration_minutes: number
          start_date: string | null
          end_date: string | null
          status: Database["public"]["Enums"]["class_status"]
          meeting_url: string | null
          notes: string | null
          created_at: string
          updated_at: string
          created_by: string | null
          needs_review: boolean
          review_note: string | null
        }
        Insert: {
          id?: string
          class_code?: string | null
          name: string
          program_id?: string | null
          level_id?: string | null
          teacher_id?: string | null
          class_type?: Database["public"]["Enums"]["class_type"]
          max_students?: number
          default_duration_minutes?: number
          start_date?: string | null
          end_date?: string | null
          status?: Database["public"]["Enums"]["class_status"]
          meeting_url?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
          created_by?: string | null
          needs_review?: boolean
          review_note?: string | null
        }
        Update: {
          id?: string
          class_code?: string | null
          name?: string
          program_id?: string | null
          level_id?: string | null
          teacher_id?: string | null
          class_type?: Database["public"]["Enums"]["class_type"]
          max_students?: number
          default_duration_minutes?: number
          start_date?: string | null
          end_date?: string | null
          status?: Database["public"]["Enums"]["class_status"]
          meeting_url?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
          created_by?: string | null
          needs_review?: boolean
          review_note?: string | null
        }
        Relationships: [
          { foreignKeyName: "classes_created_by_fkey"; columns: ["created_by"]; isOneToOne: false; referencedRelation: "users"; referencedColumns: ["id"] },
          { foreignKeyName: "classes_level_id_fkey"; columns: ["level_id"]; isOneToOne: false; referencedRelation: "levels"; referencedColumns: ["id"] },
          { foreignKeyName: "classes_program_id_fkey"; columns: ["program_id"]; isOneToOne: false; referencedRelation: "programs"; referencedColumns: ["id"] },
          { foreignKeyName: "classes_teacher_id_fkey"; columns: ["teacher_id"]; isOneToOne: false; referencedRelation: "teachers"; referencedColumns: ["id"] },
        ]
      }
      expenses: {
        Row: {
          id: string
          expense_date: string
          category: Database["public"]["Enums"]["expense_category"]
          description: string
          amount: number
          currency: string
          method: Database["public"]["Enums"]["payment_method"]
          vendor: string | null
          receipt_url: string | null
          notes: string | null
          payroll_id: string | null
          recorded_by: string | null
          created_at: string
          updated_at: string
          created_by: string | null
        }
        Insert: {
          id?: string
          expense_date?: string
          category?: Database["public"]["Enums"]["expense_category"]
          description: string
          amount: number
          currency?: string
          method?: Database["public"]["Enums"]["payment_method"]
          vendor?: string | null
          receipt_url?: string | null
          notes?: string | null
          payroll_id?: string | null
          recorded_by?: string | null
          created_at?: string
          updated_at?: string
          created_by?: string | null
        }
        Update: {
          id?: string
          expense_date?: string
          category?: Database["public"]["Enums"]["expense_category"]
          description?: string
          amount?: number
          currency?: string
          method?: Database["public"]["Enums"]["payment_method"]
          vendor?: string | null
          receipt_url?: string | null
          notes?: string | null
          payroll_id?: string | null
          recorded_by?: string | null
          created_at?: string
          updated_at?: string
          created_by?: string | null
        }
        Relationships: [
          { foreignKeyName: "expenses_created_by_fkey"; columns: ["created_by"]; isOneToOne: false; referencedRelation: "users"; referencedColumns: ["id"] },
          { foreignKeyName: "expenses_recorded_by_fkey"; columns: ["recorded_by"]; isOneToOne: false; referencedRelation: "users"; referencedColumns: ["id"] },
          { foreignKeyName: "fk_expenses_payroll"; columns: ["payroll_id"]; isOneToOne: false; referencedRelation: "teacher_payroll"; referencedColumns: ["id"] },
        ]
      }
      homework: {
        Row: {
          id: string
          lesson_id: string | null
          class_id: string | null
          student_id: string | null
          title: string
          description: string | null
          due_date: string | null
          attachment_url: string | null
          assigned_by: string | null
          status: Database["public"]["Enums"]["record_status"]
          created_at: string
          updated_at: string
          created_by: string | null
          sentence_patterns: string | null
        }
        Insert: {
          id?: string
          lesson_id?: string | null
          class_id?: string | null
          student_id?: string | null
          title: string
          description?: string | null
          due_date?: string | null
          attachment_url?: string | null
          assigned_by?: string | null
          status?: Database["public"]["Enums"]["record_status"]
          created_at?: string
          updated_at?: string
          created_by?: string | null
          sentence_patterns?: string | null
        }
        Update: {
          id?: string
          lesson_id?: string | null
          class_id?: string | null
          student_id?: string | null
          title?: string
          description?: string | null
          due_date?: string | null
          attachment_url?: string | null
          assigned_by?: string | null
          status?: Database["public"]["Enums"]["record_status"]
          created_at?: string
          updated_at?: string
          created_by?: string | null
          sentence_patterns?: string | null
        }
        Relationships: [
          { foreignKeyName: "homework_assigned_by_fkey"; columns: ["assigned_by"]; isOneToOne: false; referencedRelation: "users"; referencedColumns: ["id"] },
          { foreignKeyName: "homework_class_id_fkey"; columns: ["class_id"]; isOneToOne: false; referencedRelation: "classes"; referencedColumns: ["id"] },
          { foreignKeyName: "homework_created_by_fkey"; columns: ["created_by"]; isOneToOne: false; referencedRelation: "users"; referencedColumns: ["id"] },
          { foreignKeyName: "homework_lesson_id_fkey"; columns: ["lesson_id"]; isOneToOne: false; referencedRelation: "lessons"; referencedColumns: ["id"] },
          { foreignKeyName: "homework_student_id_fkey"; columns: ["student_id"]; isOneToOne: false; referencedRelation: "students"; referencedColumns: ["id"] },
        ]
      }
      lead_activities: {
        Row: {
          id: string
          lead_id: string
          activity_type: string
          content: string | null
          occurred_at: string
          created_at: string
          created_by: string | null
        }
        Insert: {
          id?: string
          lead_id: string
          activity_type: string
          content?: string | null
          occurred_at?: string
          created_at?: string
          created_by?: string | null
        }
        Update: {
          id?: string
          lead_id?: string
          activity_type?: string
          content?: string | null
          occurred_at?: string
          created_at?: string
          created_by?: string | null
        }
        Relationships: [
          { foreignKeyName: "lead_activities_created_by_fkey"; columns: ["created_by"]; isOneToOne: false; referencedRelation: "users"; referencedColumns: ["id"] },
          { foreignKeyName: "lead_activities_lead_id_fkey"; columns: ["lead_id"]; isOneToOne: false; referencedRelation: "leads"; referencedColumns: ["id"] },
        ]
      }
      leads: {
        Row: {
          id: string
          lead_code: string | null
          full_name: string
          date_of_birth: string | null
          age: number | null
          phone: string | null
          email: string | null
          parent_name: string | null
          parent_phone: string | null
          source: string | null
          program_interest_id: string | null
          current_level_id: string | null
          goal: string | null
          assigned_to: string | null
          status: Database["public"]["Enums"]["lead_status"]
          next_follow_up_at: string | null
          notes: string | null
          converted_student_id: string | null
          converted_at: string | null
          lost_reason: string | null
          created_at: string
          updated_at: string
          created_by: string | null
        }
        Insert: {
          id?: string
          lead_code?: string | null
          full_name: string
          date_of_birth?: string | null
          age?: number | null
          phone?: string | null
          email?: string | null
          parent_name?: string | null
          parent_phone?: string | null
          source?: string | null
          program_interest_id?: string | null
          current_level_id?: string | null
          goal?: string | null
          assigned_to?: string | null
          status?: Database["public"]["Enums"]["lead_status"]
          next_follow_up_at?: string | null
          notes?: string | null
          converted_student_id?: string | null
          converted_at?: string | null
          lost_reason?: string | null
          created_at?: string
          updated_at?: string
          created_by?: string | null
        }
        Update: {
          id?: string
          lead_code?: string | null
          full_name?: string
          date_of_birth?: string | null
          age?: number | null
          phone?: string | null
          email?: string | null
          parent_name?: string | null
          parent_phone?: string | null
          source?: string | null
          program_interest_id?: string | null
          current_level_id?: string | null
          goal?: string | null
          assigned_to?: string | null
          status?: Database["public"]["Enums"]["lead_status"]
          next_follow_up_at?: string | null
          notes?: string | null
          converted_student_id?: string | null
          converted_at?: string | null
          lost_reason?: string | null
          created_at?: string
          updated_at?: string
          created_by?: string | null
        }
        Relationships: [
          { foreignKeyName: "leads_assigned_to_fkey"; columns: ["assigned_to"]; isOneToOne: false; referencedRelation: "users"; referencedColumns: ["id"] },
          { foreignKeyName: "leads_converted_student_id_fkey"; columns: ["converted_student_id"]; isOneToOne: false; referencedRelation: "students"; referencedColumns: ["id"] },
          { foreignKeyName: "leads_created_by_fkey"; columns: ["created_by"]; isOneToOne: false; referencedRelation: "users"; referencedColumns: ["id"] },
          { foreignKeyName: "leads_current_level_id_fkey"; columns: ["current_level_id"]; isOneToOne: false; referencedRelation: "levels"; referencedColumns: ["id"] },
          { foreignKeyName: "leads_program_interest_id_fkey"; columns: ["program_interest_id"]; isOneToOne: false; referencedRelation: "programs"; referencedColumns: ["id"] },
        ]
      }
      lesson_consumptions: {
        Row: {
          id: string
          enrollment_id: string
          lesson_id: string
          student_id: string
          attendance_id: string | null
          lessons_deducted: number
          price_per_lesson: number
          recognized_amount: number
          recognized_at: string
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          enrollment_id: string
          lesson_id: string
          student_id: string
          attendance_id?: string | null
          lessons_deducted?: number
          price_per_lesson: number
          recognized_amount: number
          recognized_at?: string
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          enrollment_id?: string
          lesson_id?: string
          student_id?: string
          attendance_id?: string | null
          lessons_deducted?: number
          price_per_lesson?: number
          recognized_amount?: number
          recognized_at?: string
          notes?: string | null
          created_at?: string
        }
        Relationships: [
          { foreignKeyName: "lesson_consumptions_attendance_id_fkey"; columns: ["attendance_id"]; isOneToOne: false; referencedRelation: "attendance"; referencedColumns: ["id"] },
          { foreignKeyName: "lesson_consumptions_enrollment_id_fkey"; columns: ["enrollment_id"]; isOneToOne: false; referencedRelation: "student_enrollments"; referencedColumns: ["id"] },
          { foreignKeyName: "lesson_consumptions_lesson_id_fkey"; columns: ["lesson_id"]; isOneToOne: false; referencedRelation: "lessons"; referencedColumns: ["id"] },
          { foreignKeyName: "lesson_consumptions_student_id_fkey"; columns: ["student_id"]; isOneToOne: false; referencedRelation: "students"; referencedColumns: ["id"] },
        ]
      }
      lessons: {
        Row: {
          id: string
          class_id: string
          teacher_id: string | null
          sequence_no: number | null
          lesson_date: string
          scheduled_start_at: string
          scheduled_end_at: string
          actual_start_at: string | null
          actual_end_at: string | null
          duration_minutes: number | null
          status: Database["public"]["Enums"]["lesson_status"]
          is_makeup: boolean
          topic: string | null
          cancellation_reason: string | null
          report_due_at: string | null
          notes: string | null
          created_at: string
          updated_at: string
          created_by: string | null
        }
        Insert: {
          id?: string
          class_id: string
          teacher_id?: string | null
          sequence_no?: number | null
          lesson_date: string
          scheduled_start_at: string
          scheduled_end_at: string
          actual_start_at?: string | null
          actual_end_at?: string | null
          duration_minutes?: number | null
          status?: Database["public"]["Enums"]["lesson_status"]
          is_makeup?: boolean
          topic?: string | null
          cancellation_reason?: string | null
          report_due_at?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
          created_by?: string | null
        }
        Update: {
          id?: string
          class_id?: string
          teacher_id?: string | null
          sequence_no?: number | null
          lesson_date?: string
          scheduled_start_at?: string
          scheduled_end_at?: string
          actual_start_at?: string | null
          actual_end_at?: string | null
          duration_minutes?: number | null
          status?: Database["public"]["Enums"]["lesson_status"]
          is_makeup?: boolean
          topic?: string | null
          cancellation_reason?: string | null
          report_due_at?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
          created_by?: string | null
        }
        Relationships: [
          { foreignKeyName: "lessons_class_id_fkey"; columns: ["class_id"]; isOneToOne: false; referencedRelation: "classes"; referencedColumns: ["id"] },
          { foreignKeyName: "lessons_created_by_fkey"; columns: ["created_by"]; isOneToOne: false; referencedRelation: "users"; referencedColumns: ["id"] },
          { foreignKeyName: "lessons_teacher_id_fkey"; columns: ["teacher_id"]; isOneToOne: false; referencedRelation: "teachers"; referencedColumns: ["id"] },
        ]
      }
      levels: {
        Row: {
          id: string
          code: string
          name_vi: string
          name_en: string | null
          cefr_code: string | null
          program_id: string | null
          description: string | null
          sort_order: number
          status: Database["public"]["Enums"]["record_status"]
          created_at: string
          updated_at: string
          created_by: string | null
        }
        Insert: {
          id?: string
          code: string
          name_vi: string
          name_en?: string | null
          cefr_code?: string | null
          program_id?: string | null
          description?: string | null
          sort_order?: number
          status?: Database["public"]["Enums"]["record_status"]
          created_at?: string
          updated_at?: string
          created_by?: string | null
        }
        Update: {
          id?: string
          code?: string
          name_vi?: string
          name_en?: string | null
          cefr_code?: string | null
          program_id?: string | null
          description?: string | null
          sort_order?: number
          status?: Database["public"]["Enums"]["record_status"]
          created_at?: string
          updated_at?: string
          created_by?: string | null
        }
        Relationships: [
          { foreignKeyName: "levels_created_by_fkey"; columns: ["created_by"]; isOneToOne: false; referencedRelation: "users"; referencedColumns: ["id"] },
          { foreignKeyName: "levels_program_id_fkey"; columns: ["program_id"]; isOneToOne: false; referencedRelation: "programs"; referencedColumns: ["id"] },
        ]
      }
      notifications: {
        Row: {
          id: string
          type: string
          severity: Database["public"]["Enums"]["notification_severity"]
          title: string
          body: string | null
          entity_type: string | null
          entity_id: string | null
          target_role: string | null
          target_user_id: string | null
          payload: Json
          status: Database["public"]["Enums"]["notification_status"]
          due_at: string | null
          resolved_by: string | null
          resolved_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          type: string
          severity?: Database["public"]["Enums"]["notification_severity"]
          title: string
          body?: string | null
          entity_type?: string | null
          entity_id?: string | null
          target_role?: string | null
          target_user_id?: string | null
          payload?: Json
          status?: Database["public"]["Enums"]["notification_status"]
          due_at?: string | null
          resolved_by?: string | null
          resolved_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          type?: string
          severity?: Database["public"]["Enums"]["notification_severity"]
          title?: string
          body?: string | null
          entity_type?: string | null
          entity_id?: string | null
          target_role?: string | null
          target_user_id?: string | null
          payload?: Json
          status?: Database["public"]["Enums"]["notification_status"]
          due_at?: string | null
          resolved_by?: string | null
          resolved_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          { foreignKeyName: "notifications_resolved_by_fkey"; columns: ["resolved_by"]; isOneToOne: false; referencedRelation: "users"; referencedColumns: ["id"] },
          { foreignKeyName: "notifications_target_role_fkey"; columns: ["target_role"]; isOneToOne: false; referencedRelation: "roles"; referencedColumns: ["code"] },
          { foreignKeyName: "notifications_target_user_id_fkey"; columns: ["target_user_id"]; isOneToOne: false; referencedRelation: "users"; referencedColumns: ["id"] },
        ]
      }
      parents: {
        Row: {
          id: string
          user_id: string | null
          full_name: string
          phone: string | null
          email: string | null
          zalo: string | null
          facebook: string | null
          address: string | null
          occupation: string | null
          notes: string | null
          status: Database["public"]["Enums"]["record_status"]
          created_at: string
          updated_at: string
          created_by: string | null
        }
        Insert: {
          id?: string
          user_id?: string | null
          full_name: string
          phone?: string | null
          email?: string | null
          zalo?: string | null
          facebook?: string | null
          address?: string | null
          occupation?: string | null
          notes?: string | null
          status?: Database["public"]["Enums"]["record_status"]
          created_at?: string
          updated_at?: string
          created_by?: string | null
        }
        Update: {
          id?: string
          user_id?: string | null
          full_name?: string
          phone?: string | null
          email?: string | null
          zalo?: string | null
          facebook?: string | null
          address?: string | null
          occupation?: string | null
          notes?: string | null
          status?: Database["public"]["Enums"]["record_status"]
          created_at?: string
          updated_at?: string
          created_by?: string | null
        }
        Relationships: [
          { foreignKeyName: "parents_created_by_fkey"; columns: ["created_by"]; isOneToOne: false; referencedRelation: "users"; referencedColumns: ["id"] },
          { foreignKeyName: "parents_user_id_fkey"; columns: ["user_id"]; isOneToOne: true; referencedRelation: "users"; referencedColumns: ["id"] },
        ]
      }
      payments: {
        Row: {
          id: string
          payment_code: string | null
          student_id: string
          enrollment_id: string | null
          amount: number
          currency: string
          payment_date: string
          method: Database["public"]["Enums"]["payment_method"]
          reference: string | null
          notes: string | null
          status: Database["public"]["Enums"]["payment_status"]
          recorded_by: string | null
          created_at: string
          updated_at: string
          created_by: string | null
          needs_review: boolean
          review_note: string | null
          statement_id: string | null
        }
        Insert: {
          id?: string
          payment_code?: string | null
          student_id: string
          enrollment_id?: string | null
          amount: number
          currency?: string
          payment_date?: string
          method?: Database["public"]["Enums"]["payment_method"]
          reference?: string | null
          notes?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
          recorded_by?: string | null
          created_at?: string
          updated_at?: string
          created_by?: string | null
          needs_review?: boolean
          review_note?: string | null
          statement_id?: string | null
        }
        Update: {
          id?: string
          payment_code?: string | null
          student_id?: string
          enrollment_id?: string | null
          amount?: number
          currency?: string
          payment_date?: string
          method?: Database["public"]["Enums"]["payment_method"]
          reference?: string | null
          notes?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
          recorded_by?: string | null
          created_at?: string
          updated_at?: string
          created_by?: string | null
          needs_review?: boolean
          review_note?: string | null
          statement_id?: string | null
        }
        Relationships: [
          { foreignKeyName: "payments_created_by_fkey"; columns: ["created_by"]; isOneToOne: false; referencedRelation: "users"; referencedColumns: ["id"] },
          { foreignKeyName: "payments_enrollment_id_fkey"; columns: ["enrollment_id"]; isOneToOne: false; referencedRelation: "student_enrollments"; referencedColumns: ["id"] },
          { foreignKeyName: "payments_recorded_by_fkey"; columns: ["recorded_by"]; isOneToOne: false; referencedRelation: "users"; referencedColumns: ["id"] },
          { foreignKeyName: "payments_statement_id_fkey"; columns: ["statement_id"]; isOneToOne: false; referencedRelation: "tuition_statements"; referencedColumns: ["id"] },
          { foreignKeyName: "payments_student_id_fkey"; columns: ["student_id"]; isOneToOne: false; referencedRelation: "students"; referencedColumns: ["id"] },
        ]
      }
      placement_tests: {
        Row: {
          id: string
          lead_id: string | null
          student_id: string | null
          scheduled_at: string | null
          conducted_at: string | null
          conducted_by: string | null
          test_type: string | null
          listening_score: number | null
          speaking_score: number | null
          reading_score: number | null
          writing_score: number | null
          overall_score: number | null
          result_level_id: string | null
          recommendation: string | null
          notes: string | null
          status: string
          created_at: string
          updated_at: string
          created_by: string | null
        }
        Insert: {
          id?: string
          lead_id?: string | null
          student_id?: string | null
          scheduled_at?: string | null
          conducted_at?: string | null
          conducted_by?: string | null
          test_type?: string | null
          listening_score?: number | null
          speaking_score?: number | null
          reading_score?: number | null
          writing_score?: number | null
          overall_score?: number | null
          result_level_id?: string | null
          recommendation?: string | null
          notes?: string | null
          status?: string
          created_at?: string
          updated_at?: string
          created_by?: string | null
        }
        Update: {
          id?: string
          lead_id?: string | null
          student_id?: string | null
          scheduled_at?: string | null
          conducted_at?: string | null
          conducted_by?: string | null
          test_type?: string | null
          listening_score?: number | null
          speaking_score?: number | null
          reading_score?: number | null
          writing_score?: number | null
          overall_score?: number | null
          result_level_id?: string | null
          recommendation?: string | null
          notes?: string | null
          status?: string
          created_at?: string
          updated_at?: string
          created_by?: string | null
        }
        Relationships: [
          { foreignKeyName: "placement_tests_conducted_by_fkey"; columns: ["conducted_by"]; isOneToOne: false; referencedRelation: "teachers"; referencedColumns: ["id"] },
          { foreignKeyName: "placement_tests_created_by_fkey"; columns: ["created_by"]; isOneToOne: false; referencedRelation: "users"; referencedColumns: ["id"] },
          { foreignKeyName: "placement_tests_lead_id_fkey"; columns: ["lead_id"]; isOneToOne: false; referencedRelation: "leads"; referencedColumns: ["id"] },
          { foreignKeyName: "placement_tests_result_level_id_fkey"; columns: ["result_level_id"]; isOneToOne: false; referencedRelation: "levels"; referencedColumns: ["id"] },
          { foreignKeyName: "placement_tests_student_id_fkey"; columns: ["student_id"]; isOneToOne: false; referencedRelation: "students"; referencedColumns: ["id"] },
        ]
      }
      programs: {
        Row: {
          id: string
          code: string
          name_vi: string
          name_en: string | null
          description: string | null
          target_audience: string | null
          sort_order: number
          status: Database["public"]["Enums"]["record_status"]
          created_at: string
          updated_at: string
          created_by: string | null
        }
        Insert: {
          id?: string
          code: string
          name_vi: string
          name_en?: string | null
          description?: string | null
          target_audience?: string | null
          sort_order?: number
          status?: Database["public"]["Enums"]["record_status"]
          created_at?: string
          updated_at?: string
          created_by?: string | null
        }
        Update: {
          id?: string
          code?: string
          name_vi?: string
          name_en?: string | null
          description?: string | null
          target_audience?: string | null
          sort_order?: number
          status?: Database["public"]["Enums"]["record_status"]
          created_at?: string
          updated_at?: string
          created_by?: string | null
        }
        Relationships: [
          { foreignKeyName: "programs_created_by_fkey"; columns: ["created_by"]; isOneToOne: false; referencedRelation: "users"; referencedColumns: ["id"] },
        ]
      }
      recordings: {
        Row: {
          id: string
          lesson_id: string | null
          class_id: string | null
          url: string
          provider: string | null
          title: string | null
          duration_seconds: number | null
          visible_to_parent: boolean
          uploaded_by: string | null
          status: Database["public"]["Enums"]["record_status"]
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          lesson_id?: string | null
          class_id?: string | null
          url: string
          provider?: string | null
          title?: string | null
          duration_seconds?: number | null
          visible_to_parent?: boolean
          uploaded_by?: string | null
          status?: Database["public"]["Enums"]["record_status"]
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          lesson_id?: string | null
          class_id?: string | null
          url?: string
          provider?: string | null
          title?: string | null
          duration_seconds?: number | null
          visible_to_parent?: boolean
          uploaded_by?: string | null
          status?: Database["public"]["Enums"]["record_status"]
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          { foreignKeyName: "recordings_class_id_fkey"; columns: ["class_id"]; isOneToOne: false; referencedRelation: "classes"; referencedColumns: ["id"] },
          { foreignKeyName: "recordings_lesson_id_fkey"; columns: ["lesson_id"]; isOneToOne: false; referencedRelation: "lessons"; referencedColumns: ["id"] },
          { foreignKeyName: "recordings_uploaded_by_fkey"; columns: ["uploaded_by"]; isOneToOne: false; referencedRelation: "users"; referencedColumns: ["id"] },
        ]
      }
      roles: {
        Row: {
          code: string
          name_vi: string
          name_en: string
          description: string | null
          sort_order: number
        }
        Insert: {
          code: string
          name_vi: string
          name_en: string
          description?: string | null
          sort_order?: number
        }
        Update: {
          code?: string
          name_vi?: string
          name_en?: string
          description?: string | null
          sort_order?: number
        }
        Relationships: []
      }
      settings: {
        Row: {
          key: string
          value: Json
          description: string | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          key: string
          value: Json
          description?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          key?: string
          value?: Json
          description?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      student_enrollments: {
        Row: {
          id: string
          enrollment_code: string | null
          student_id: string
          class_id: string | null
          program_id: string | null
          tuition_package_id: string | null
          lessons_purchased: number | null
          price_per_lesson: number
          discount_amount: number
          discount_percent: number
          gross_amount: number | null
          net_amount: number | null
          currency: string
          start_date: string
          end_date: string | null
          expires_at: string | null
          status: Database["public"]["Enums"]["enrollment_status"]
          agreement_notes: string | null
          is_migrated_balance: boolean
          created_at: string
          updated_at: string
          created_by: string | null
          needs_review: boolean
          review_note: string | null
          billing_mode: Database["public"]["Enums"]["billing_mode"]
          headcount: number
          monthly_discount_amount: number
          payer_student_id: string | null
          paid_in_full_until: string | null
          payer_parent_id: string | null
          payer_note: string | null
        }
        Insert: {
          id?: string
          enrollment_code?: string | null
          student_id: string
          class_id?: string | null
          program_id?: string | null
          tuition_package_id?: string | null
          lessons_purchased?: number | null
          price_per_lesson: number
          discount_amount?: number
          discount_percent?: number
          gross_amount?: number | null
          net_amount?: number | null
          currency?: string
          start_date?: string
          end_date?: string | null
          expires_at?: string | null
          status?: Database["public"]["Enums"]["enrollment_status"]
          agreement_notes?: string | null
          is_migrated_balance?: boolean
          created_at?: string
          updated_at?: string
          created_by?: string | null
          needs_review?: boolean
          review_note?: string | null
          billing_mode?: Database["public"]["Enums"]["billing_mode"]
          headcount?: number
          monthly_discount_amount?: number
          payer_student_id?: string | null
          paid_in_full_until?: string | null
          payer_parent_id?: string | null
          payer_note?: string | null
        }
        Update: {
          id?: string
          enrollment_code?: string | null
          student_id?: string
          class_id?: string | null
          program_id?: string | null
          tuition_package_id?: string | null
          lessons_purchased?: number | null
          price_per_lesson?: number
          discount_amount?: number
          discount_percent?: number
          gross_amount?: number | null
          net_amount?: number | null
          currency?: string
          start_date?: string
          end_date?: string | null
          expires_at?: string | null
          status?: Database["public"]["Enums"]["enrollment_status"]
          agreement_notes?: string | null
          is_migrated_balance?: boolean
          created_at?: string
          updated_at?: string
          created_by?: string | null
          needs_review?: boolean
          review_note?: string | null
          billing_mode?: Database["public"]["Enums"]["billing_mode"]
          headcount?: number
          monthly_discount_amount?: number
          payer_student_id?: string | null
          paid_in_full_until?: string | null
          payer_parent_id?: string | null
          payer_note?: string | null
        }
        Relationships: [
          { foreignKeyName: "student_enrollments_class_id_fkey"; columns: ["class_id"]; isOneToOne: false; referencedRelation: "classes"; referencedColumns: ["id"] },
          { foreignKeyName: "student_enrollments_created_by_fkey"; columns: ["created_by"]; isOneToOne: false; referencedRelation: "users"; referencedColumns: ["id"] },
          { foreignKeyName: "student_enrollments_payer_parent_id_fkey"; columns: ["payer_parent_id"]; isOneToOne: false; referencedRelation: "parents"; referencedColumns: ["id"] },
          { foreignKeyName: "student_enrollments_payer_student_id_fkey"; columns: ["payer_student_id"]; isOneToOne: false; referencedRelation: "students"; referencedColumns: ["id"] },
          { foreignKeyName: "student_enrollments_program_id_fkey"; columns: ["program_id"]; isOneToOne: false; referencedRelation: "programs"; referencedColumns: ["id"] },
          { foreignKeyName: "student_enrollments_student_id_fkey"; columns: ["student_id"]; isOneToOne: false; referencedRelation: "students"; referencedColumns: ["id"] },
          { foreignKeyName: "student_enrollments_tuition_package_id_fkey"; columns: ["tuition_package_id"]; isOneToOne: false; referencedRelation: "tuition_packages"; referencedColumns: ["id"] },
        ]
      }
      student_parents: {
        Row: {
          id: string
          student_id: string
          parent_id: string
          relationship: string
          is_primary: boolean
          created_at: string
          created_by: string | null
        }
        Insert: {
          id?: string
          student_id: string
          parent_id: string
          relationship?: string
          is_primary?: boolean
          created_at?: string
          created_by?: string | null
        }
        Update: {
          id?: string
          student_id?: string
          parent_id?: string
          relationship?: string
          is_primary?: boolean
          created_at?: string
          created_by?: string | null
        }
        Relationships: [
          { foreignKeyName: "student_parents_created_by_fkey"; columns: ["created_by"]; isOneToOne: false; referencedRelation: "users"; referencedColumns: ["id"] },
          { foreignKeyName: "student_parents_parent_id_fkey"; columns: ["parent_id"]; isOneToOne: false; referencedRelation: "parents"; referencedColumns: ["id"] },
          { foreignKeyName: "student_parents_student_id_fkey"; columns: ["student_id"]; isOneToOne: true; referencedRelation: "students"; referencedColumns: ["id"] },
        ]
      }
      students: {
        Row: {
          id: string
          student_code: string | null
          full_name: string
          nickname: string | null
          date_of_birth: string | null
          gender: string | null
          phone: string | null
          email: string | null
          address: string | null
          program_id: string | null
          current_level_id: string | null
          status: Database["public"]["Enums"]["student_status"]
          enrollment_date: string | null
          source: string | null
          learning_goal: string | null
          learning_notes: string | null
          internal_notes: string | null
          created_at: string
          updated_at: string
          created_by: string | null
          needs_review: boolean
          review_note: string | null
        }
        Insert: {
          id?: string
          student_code?: string | null
          full_name: string
          nickname?: string | null
          date_of_birth?: string | null
          gender?: string | null
          phone?: string | null
          email?: string | null
          address?: string | null
          program_id?: string | null
          current_level_id?: string | null
          status?: Database["public"]["Enums"]["student_status"]
          enrollment_date?: string | null
          source?: string | null
          learning_goal?: string | null
          learning_notes?: string | null
          internal_notes?: string | null
          created_at?: string
          updated_at?: string
          created_by?: string | null
          needs_review?: boolean
          review_note?: string | null
        }
        Update: {
          id?: string
          student_code?: string | null
          full_name?: string
          nickname?: string | null
          date_of_birth?: string | null
          gender?: string | null
          phone?: string | null
          email?: string | null
          address?: string | null
          program_id?: string | null
          current_level_id?: string | null
          status?: Database["public"]["Enums"]["student_status"]
          enrollment_date?: string | null
          source?: string | null
          learning_goal?: string | null
          learning_notes?: string | null
          internal_notes?: string | null
          created_at?: string
          updated_at?: string
          created_by?: string | null
          needs_review?: boolean
          review_note?: string | null
        }
        Relationships: [
          { foreignKeyName: "students_created_by_fkey"; columns: ["created_by"]; isOneToOne: false; referencedRelation: "users"; referencedColumns: ["id"] },
          { foreignKeyName: "students_current_level_id_fkey"; columns: ["current_level_id"]; isOneToOne: false; referencedRelation: "levels"; referencedColumns: ["id"] },
          { foreignKeyName: "students_program_id_fkey"; columns: ["program_id"]; isOneToOne: false; referencedRelation: "programs"; referencedColumns: ["id"] },
        ]
      }
      teacher_payable_lessons: {
        Row: {
          id: string
          teacher_id: string
          lesson_id: string
          class_id: string | null
          lesson_date: string
          duration_minutes: number
          rate_amount: number
          amount: number
          currency: string
          status: Database["public"]["Enums"]["payable_status"]
          payroll_id: string | null
          rate_source: string | null
          notes: string | null
          generated_at: string
          created_at: string
          updated_at: string
          has_evidence: boolean
          has_video: boolean
          qc_score: number | null
          sent_to_parent: boolean
        }
        Insert: {
          id?: string
          teacher_id: string
          lesson_id: string
          class_id?: string | null
          lesson_date: string
          duration_minutes: number
          rate_amount: number
          amount: number
          currency?: string
          status?: Database["public"]["Enums"]["payable_status"]
          payroll_id?: string | null
          rate_source?: string | null
          notes?: string | null
          generated_at?: string
          created_at?: string
          updated_at?: string
          has_evidence?: boolean
          has_video?: boolean
          qc_score?: number | null
          sent_to_parent?: boolean
        }
        Update: {
          id?: string
          teacher_id?: string
          lesson_id?: string
          class_id?: string | null
          lesson_date?: string
          duration_minutes?: number
          rate_amount?: number
          amount?: number
          currency?: string
          status?: Database["public"]["Enums"]["payable_status"]
          payroll_id?: string | null
          rate_source?: string | null
          notes?: string | null
          generated_at?: string
          created_at?: string
          updated_at?: string
          has_evidence?: boolean
          has_video?: boolean
          qc_score?: number | null
          sent_to_parent?: boolean
        }
        Relationships: [
          { foreignKeyName: "fk_payable_payroll"; columns: ["payroll_id"]; isOneToOne: false; referencedRelation: "teacher_payroll"; referencedColumns: ["id"] },
          { foreignKeyName: "teacher_payable_lessons_class_id_fkey"; columns: ["class_id"]; isOneToOne: false; referencedRelation: "classes"; referencedColumns: ["id"] },
          { foreignKeyName: "teacher_payable_lessons_lesson_id_fkey"; columns: ["lesson_id"]; isOneToOne: true; referencedRelation: "lessons"; referencedColumns: ["id"] },
          { foreignKeyName: "teacher_payable_lessons_teacher_id_fkey"; columns: ["teacher_id"]; isOneToOne: false; referencedRelation: "teachers"; referencedColumns: ["id"] },
        ]
      }
      teacher_payroll: {
        Row: {
          id: string
          teacher_id: string
          period_start: string
          period_end: string
          period_label: string | null
          lessons_count: number
          teaching_minutes: number
          gross_amount: number
          adjustments_amount: number
          final_amount: number
          currency: string
          status: Database["public"]["Enums"]["payroll_status"]
          notes: string | null
          approved_by: string | null
          approved_at: string | null
          paid_at: string | null
          paid_method: Database["public"]["Enums"]["payment_method"] | null
          created_at: string
          updated_at: string
          created_by: string | null
          lessons_missing_evidence: number
          lessons_missing_video: number
          avg_qc_score: number | null
          kpi_target: number | null
          kpi_met: boolean | null
        }
        Insert: {
          id?: string
          teacher_id: string
          period_start: string
          period_end: string
          period_label?: string | null
          lessons_count?: number
          teaching_minutes?: number
          gross_amount?: number
          adjustments_amount?: number
          final_amount?: number
          currency?: string
          status?: Database["public"]["Enums"]["payroll_status"]
          notes?: string | null
          approved_by?: string | null
          approved_at?: string | null
          paid_at?: string | null
          paid_method?: Database["public"]["Enums"]["payment_method"] | null
          created_at?: string
          updated_at?: string
          created_by?: string | null
          lessons_missing_evidence?: number
          lessons_missing_video?: number
          avg_qc_score?: number | null
          kpi_target?: number | null
          kpi_met?: boolean | null
        }
        Update: {
          id?: string
          teacher_id?: string
          period_start?: string
          period_end?: string
          period_label?: string | null
          lessons_count?: number
          teaching_minutes?: number
          gross_amount?: number
          adjustments_amount?: number
          final_amount?: number
          currency?: string
          status?: Database["public"]["Enums"]["payroll_status"]
          notes?: string | null
          approved_by?: string | null
          approved_at?: string | null
          paid_at?: string | null
          paid_method?: Database["public"]["Enums"]["payment_method"] | null
          created_at?: string
          updated_at?: string
          created_by?: string | null
          lessons_missing_evidence?: number
          lessons_missing_video?: number
          avg_qc_score?: number | null
          kpi_target?: number | null
          kpi_met?: boolean | null
        }
        Relationships: [
          { foreignKeyName: "teacher_payroll_approved_by_fkey"; columns: ["approved_by"]; isOneToOne: false; referencedRelation: "users"; referencedColumns: ["id"] },
          { foreignKeyName: "teacher_payroll_created_by_fkey"; columns: ["created_by"]; isOneToOne: false; referencedRelation: "users"; referencedColumns: ["id"] },
          { foreignKeyName: "teacher_payroll_teacher_id_fkey"; columns: ["teacher_id"]; isOneToOne: false; referencedRelation: "teachers"; referencedColumns: ["id"] },
        ]
      }
      teacher_payroll_adjustments: {
        Row: {
          id: string
          payroll_id: string
          kind: string
          description: string
          amount: number
          created_at: string
          created_by: string | null
        }
        Insert: {
          id?: string
          payroll_id: string
          kind: string
          description: string
          amount: number
          created_at?: string
          created_by?: string | null
        }
        Update: {
          id?: string
          payroll_id?: string
          kind?: string
          description?: string
          amount?: number
          created_at?: string
          created_by?: string | null
        }
        Relationships: [
          { foreignKeyName: "teacher_payroll_adjustments_created_by_fkey"; columns: ["created_by"]; isOneToOne: false; referencedRelation: "users"; referencedColumns: ["id"] },
          { foreignKeyName: "teacher_payroll_adjustments_payroll_id_fkey"; columns: ["payroll_id"]; isOneToOne: false; referencedRelation: "teacher_payroll"; referencedColumns: ["id"] },
        ]
      }
      teacher_rates: {
        Row: {
          id: string
          teacher_id: string
          scope: string
          duration_minutes: number | null
          class_id: string | null
          rate_amount: number
          currency: string
          effective_from: string
          effective_to: string | null
          notes: string | null
          created_at: string
          updated_at: string
          created_by: string | null
        }
        Insert: {
          id?: string
          teacher_id: string
          scope: string
          duration_minutes?: number | null
          class_id?: string | null
          rate_amount: number
          currency?: string
          effective_from?: string
          effective_to?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
          created_by?: string | null
        }
        Update: {
          id?: string
          teacher_id?: string
          scope?: string
          duration_minutes?: number | null
          class_id?: string | null
          rate_amount?: number
          currency?: string
          effective_from?: string
          effective_to?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
          created_by?: string | null
        }
        Relationships: [
          { foreignKeyName: "fk_teacher_rates_class"; columns: ["class_id"]; isOneToOne: false; referencedRelation: "classes"; referencedColumns: ["id"] },
          { foreignKeyName: "teacher_rates_created_by_fkey"; columns: ["created_by"]; isOneToOne: false; referencedRelation: "users"; referencedColumns: ["id"] },
          { foreignKeyName: "teacher_rates_teacher_id_fkey"; columns: ["teacher_id"]; isOneToOne: false; referencedRelation: "teachers"; referencedColumns: ["id"] },
        ]
      }
      teachers: {
        Row: {
          id: string
          user_id: string | null
          teacher_code: string | null
          full_name: string
          display_name: string | null
          email: string | null
          phone: string | null
          nationality: string | null
          bio: string | null
          specialties: string[] | null
          hired_date: string | null
          status: Database["public"]["Enums"]["record_status"]
          notes: string | null
          created_at: string
          updated_at: string
          created_by: string | null
          needs_review: boolean
          review_note: string | null
        }
        Insert: {
          id?: string
          user_id?: string | null
          teacher_code?: string | null
          full_name: string
          display_name?: string | null
          email?: string | null
          phone?: string | null
          nationality?: string | null
          bio?: string | null
          specialties?: string[] | null
          hired_date?: string | null
          status?: Database["public"]["Enums"]["record_status"]
          notes?: string | null
          created_at?: string
          updated_at?: string
          created_by?: string | null
          needs_review?: boolean
          review_note?: string | null
        }
        Update: {
          id?: string
          user_id?: string | null
          teacher_code?: string | null
          full_name?: string
          display_name?: string | null
          email?: string | null
          phone?: string | null
          nationality?: string | null
          bio?: string | null
          specialties?: string[] | null
          hired_date?: string | null
          status?: Database["public"]["Enums"]["record_status"]
          notes?: string | null
          created_at?: string
          updated_at?: string
          created_by?: string | null
          needs_review?: boolean
          review_note?: string | null
        }
        Relationships: [
          { foreignKeyName: "teachers_created_by_fkey"; columns: ["created_by"]; isOneToOne: false; referencedRelation: "users"; referencedColumns: ["id"] },
          { foreignKeyName: "teachers_user_id_fkey"; columns: ["user_id"]; isOneToOne: true; referencedRelation: "users"; referencedColumns: ["id"] },
        ]
      }
      teaching_report_students: {
        Row: {
          id: string
          report_id: string
          student_id: string
          attitude: string | null
          performance: string | null
          comments: string | null
          recommendation: string | null
          homework_completion: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          report_id: string
          student_id: string
          attitude?: string | null
          performance?: string | null
          comments?: string | null
          recommendation?: string | null
          homework_completion?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          report_id?: string
          student_id?: string
          attitude?: string | null
          performance?: string | null
          comments?: string | null
          recommendation?: string | null
          homework_completion?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          { foreignKeyName: "teaching_report_students_report_id_fkey"; columns: ["report_id"]; isOneToOne: false; referencedRelation: "teaching_reports"; referencedColumns: ["id"] },
          { foreignKeyName: "teaching_report_students_student_id_fkey"; columns: ["student_id"]; isOneToOne: false; referencedRelation: "students"; referencedColumns: ["id"] },
        ]
      }
      teaching_reports: {
        Row: {
          id: string
          lesson_id: string
          class_id: string
          teacher_id: string | null
          report_date: string
          start_time: string | null
          end_time: string | null
          duration_minutes: number | null
          lesson_content: string | null
          homework_summary: string | null
          teacher_comments: string | null
          next_lesson_recommendation: string | null
          status: Database["public"]["Enums"]["report_status"]
          missing_fields: string[]
          submitted_at: string | null
          completed_at: string | null
          is_late: boolean
          reviewed_by: string | null
          reviewed_at: string | null
          review_notes: string | null
          created_at: string
          updated_at: string
          created_by: string | null
          student_quote: string | null
          strengths: string | null
          improvements: string | null
          video_timestamp: string | null
          qc_has_video: boolean
          qc_has_timestamp: boolean
          qc_has_student_quote: boolean
          qc_homework_has_pattern: boolean
          qc_strengths_deep: boolean | null
          qc_improvements_deep: boolean | null
          qc_score: number | null
          qc_notes: string | null
          qc_scored_at: string | null
          sent_to_parent_at: string | null
          sent_to_parent_by: string | null
          authored_by: Database["public"]["Enums"]["report_author"]
        }
        Insert: {
          id?: string
          lesson_id: string
          class_id: string
          teacher_id?: string | null
          report_date?: string
          start_time?: string | null
          end_time?: string | null
          duration_minutes?: number | null
          lesson_content?: string | null
          homework_summary?: string | null
          teacher_comments?: string | null
          next_lesson_recommendation?: string | null
          status?: Database["public"]["Enums"]["report_status"]
          missing_fields?: string[]
          submitted_at?: string | null
          completed_at?: string | null
          is_late?: boolean
          reviewed_by?: string | null
          reviewed_at?: string | null
          review_notes?: string | null
          created_at?: string
          updated_at?: string
          created_by?: string | null
          student_quote?: string | null
          strengths?: string | null
          improvements?: string | null
          video_timestamp?: string | null
          qc_has_video?: boolean
          qc_has_timestamp?: boolean
          qc_has_student_quote?: boolean
          qc_homework_has_pattern?: boolean
          qc_strengths_deep?: boolean | null
          qc_improvements_deep?: boolean | null
          qc_score?: number | null
          qc_notes?: string | null
          qc_scored_at?: string | null
          sent_to_parent_at?: string | null
          sent_to_parent_by?: string | null
          authored_by?: Database["public"]["Enums"]["report_author"]
        }
        Update: {
          id?: string
          lesson_id?: string
          class_id?: string
          teacher_id?: string | null
          report_date?: string
          start_time?: string | null
          end_time?: string | null
          duration_minutes?: number | null
          lesson_content?: string | null
          homework_summary?: string | null
          teacher_comments?: string | null
          next_lesson_recommendation?: string | null
          status?: Database["public"]["Enums"]["report_status"]
          missing_fields?: string[]
          submitted_at?: string | null
          completed_at?: string | null
          is_late?: boolean
          reviewed_by?: string | null
          reviewed_at?: string | null
          review_notes?: string | null
          created_at?: string
          updated_at?: string
          created_by?: string | null
          student_quote?: string | null
          strengths?: string | null
          improvements?: string | null
          video_timestamp?: string | null
          qc_has_video?: boolean
          qc_has_timestamp?: boolean
          qc_has_student_quote?: boolean
          qc_homework_has_pattern?: boolean
          qc_strengths_deep?: boolean | null
          qc_improvements_deep?: boolean | null
          qc_score?: number | null
          qc_notes?: string | null
          qc_scored_at?: string | null
          sent_to_parent_at?: string | null
          sent_to_parent_by?: string | null
          authored_by?: Database["public"]["Enums"]["report_author"]
        }
        Relationships: [
          { foreignKeyName: "teaching_reports_class_id_fkey"; columns: ["class_id"]; isOneToOne: false; referencedRelation: "classes"; referencedColumns: ["id"] },
          { foreignKeyName: "teaching_reports_created_by_fkey"; columns: ["created_by"]; isOneToOne: false; referencedRelation: "users"; referencedColumns: ["id"] },
          { foreignKeyName: "teaching_reports_lesson_id_fkey"; columns: ["lesson_id"]; isOneToOne: true; referencedRelation: "lessons"; referencedColumns: ["id"] },
          { foreignKeyName: "teaching_reports_reviewed_by_fkey"; columns: ["reviewed_by"]; isOneToOne: false; referencedRelation: "users"; referencedColumns: ["id"] },
          { foreignKeyName: "teaching_reports_sent_to_parent_by_fkey"; columns: ["sent_to_parent_by"]; isOneToOne: false; referencedRelation: "users"; referencedColumns: ["id"] },
          { foreignKeyName: "teaching_reports_teacher_id_fkey"; columns: ["teacher_id"]; isOneToOne: false; referencedRelation: "teachers"; referencedColumns: ["id"] },
        ]
      }
      trial_classes: {
        Row: {
          id: string
          lead_id: string | null
          student_id: string | null
          class_id: string | null
          lesson_id: string | null
          teacher_id: string | null
          scheduled_at: string
          duration_minutes: number
          status: string
          outcome: string | null
          teacher_feedback: string | null
          parent_feedback: string | null
          notes: string | null
          created_at: string
          updated_at: string
          created_by: string | null
        }
        Insert: {
          id?: string
          lead_id?: string | null
          student_id?: string | null
          class_id?: string | null
          lesson_id?: string | null
          teacher_id?: string | null
          scheduled_at: string
          duration_minutes?: number
          status?: string
          outcome?: string | null
          teacher_feedback?: string | null
          parent_feedback?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
          created_by?: string | null
        }
        Update: {
          id?: string
          lead_id?: string | null
          student_id?: string | null
          class_id?: string | null
          lesson_id?: string | null
          teacher_id?: string | null
          scheduled_at?: string
          duration_minutes?: number
          status?: string
          outcome?: string | null
          teacher_feedback?: string | null
          parent_feedback?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
          created_by?: string | null
        }
        Relationships: [
          { foreignKeyName: "trial_classes_class_id_fkey"; columns: ["class_id"]; isOneToOne: false; referencedRelation: "classes"; referencedColumns: ["id"] },
          { foreignKeyName: "trial_classes_created_by_fkey"; columns: ["created_by"]; isOneToOne: false; referencedRelation: "users"; referencedColumns: ["id"] },
          { foreignKeyName: "trial_classes_lead_id_fkey"; columns: ["lead_id"]; isOneToOne: false; referencedRelation: "leads"; referencedColumns: ["id"] },
          { foreignKeyName: "trial_classes_lesson_id_fkey"; columns: ["lesson_id"]; isOneToOne: false; referencedRelation: "lessons"; referencedColumns: ["id"] },
          { foreignKeyName: "trial_classes_student_id_fkey"; columns: ["student_id"]; isOneToOne: false; referencedRelation: "students"; referencedColumns: ["id"] },
          { foreignKeyName: "trial_classes_teacher_id_fkey"; columns: ["teacher_id"]; isOneToOne: false; referencedRelation: "teachers"; referencedColumns: ["id"] },
        ]
      }
      tuition_packages: {
        Row: {
          id: string
          code: string
          name: string
          program_id: string | null
          class_type: Database["public"]["Enums"]["class_type"] | null
          duration_minutes: number | null
          lesson_count: number
          default_price_per_lesson: number
          validity_days: number | null
          description: string | null
          status: Database["public"]["Enums"]["record_status"]
          created_at: string
          updated_at: string
          created_by: string | null
        }
        Insert: {
          id?: string
          code: string
          name: string
          program_id?: string | null
          class_type?: Database["public"]["Enums"]["class_type"] | null
          duration_minutes?: number | null
          lesson_count: number
          default_price_per_lesson: number
          validity_days?: number | null
          description?: string | null
          status?: Database["public"]["Enums"]["record_status"]
          created_at?: string
          updated_at?: string
          created_by?: string | null
        }
        Update: {
          id?: string
          code?: string
          name?: string
          program_id?: string | null
          class_type?: Database["public"]["Enums"]["class_type"] | null
          duration_minutes?: number | null
          lesson_count?: number
          default_price_per_lesson?: number
          validity_days?: number | null
          description?: string | null
          status?: Database["public"]["Enums"]["record_status"]
          created_at?: string
          updated_at?: string
          created_by?: string | null
        }
        Relationships: [
          { foreignKeyName: "tuition_packages_created_by_fkey"; columns: ["created_by"]; isOneToOne: false; referencedRelation: "users"; referencedColumns: ["id"] },
          { foreignKeyName: "tuition_packages_program_id_fkey"; columns: ["program_id"]; isOneToOne: false; referencedRelation: "programs"; referencedColumns: ["id"] },
        ]
      }
      tuition_rates: {
        Row: {
          id: string
          enrollment_id: string
          price_per_lesson: number
          currency: string
          effective_from: string
          effective_to: string | null
          evidence_note: string | null
          created_at: string
          updated_at: string
          created_by: string | null
        }
        Insert: {
          id?: string
          enrollment_id: string
          price_per_lesson: number
          currency?: string
          effective_from?: string
          effective_to?: string | null
          evidence_note?: string | null
          created_at?: string
          updated_at?: string
          created_by?: string | null
        }
        Update: {
          id?: string
          enrollment_id?: string
          price_per_lesson?: number
          currency?: string
          effective_from?: string
          effective_to?: string | null
          evidence_note?: string | null
          created_at?: string
          updated_at?: string
          created_by?: string | null
        }
        Relationships: [
          { foreignKeyName: "tuition_rates_created_by_fkey"; columns: ["created_by"]; isOneToOne: false; referencedRelation: "users"; referencedColumns: ["id"] },
          { foreignKeyName: "tuition_rates_enrollment_id_fkey"; columns: ["enrollment_id"]; isOneToOne: false; referencedRelation: "student_enrollments"; referencedColumns: ["id"] },
        ]
      }
      tuition_statements: {
        Row: {
          id: string
          enrollment_id: string
          student_id: string
          period_start: string
          period_end: string
          period_label: string | null
          lessons_count: number
          gross_amount: number
          discount_amount: number
          net_amount: number
          paid_amount: number
          status: string
          issued_at: string | null
          due_date: string | null
          notes: string | null
          created_at: string
          updated_at: string
          created_by: string | null
        }
        Insert: {
          id?: string
          enrollment_id: string
          student_id: string
          period_start: string
          period_end: string
          period_label?: string | null
          lessons_count?: number
          gross_amount?: number
          discount_amount?: number
          net_amount?: number
          paid_amount?: number
          status?: string
          issued_at?: string | null
          due_date?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
          created_by?: string | null
        }
        Update: {
          id?: string
          enrollment_id?: string
          student_id?: string
          period_start?: string
          period_end?: string
          period_label?: string | null
          lessons_count?: number
          gross_amount?: number
          discount_amount?: number
          net_amount?: number
          paid_amount?: number
          status?: string
          issued_at?: string | null
          due_date?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
          created_by?: string | null
        }
        Relationships: [
          { foreignKeyName: "tuition_statements_created_by_fkey"; columns: ["created_by"]; isOneToOne: false; referencedRelation: "users"; referencedColumns: ["id"] },
          { foreignKeyName: "tuition_statements_enrollment_id_fkey"; columns: ["enrollment_id"]; isOneToOne: false; referencedRelation: "student_enrollments"; referencedColumns: ["id"] },
          { foreignKeyName: "tuition_statements_student_id_fkey"; columns: ["student_id"]; isOneToOne: false; referencedRelation: "students"; referencedColumns: ["id"] },
        ]
      }
      users: {
        Row: {
          id: string
          email: string
          full_name: string
          phone: string | null
          role_code: string
          avatar_url: string | null
          locale: string
          is_active: boolean
          last_seen_at: string | null
          created_at: string
          updated_at: string
          created_by: string | null
        }
        Insert: {
          id: string
          email: string
          full_name: string
          phone?: string | null
          role_code?: string
          avatar_url?: string | null
          locale?: string
          is_active?: boolean
          last_seen_at?: string | null
          created_at?: string
          updated_at?: string
          created_by?: string | null
        }
        Update: {
          id?: string
          email?: string
          full_name?: string
          phone?: string | null
          role_code?: string
          avatar_url?: string | null
          locale?: string
          is_active?: boolean
          last_seen_at?: string | null
          created_at?: string
          updated_at?: string
          created_by?: string | null
        }
        Relationships: [
          { foreignKeyName: "users_created_by_fkey"; columns: ["created_by"]; isOneToOne: false; referencedRelation: "users"; referencedColumns: ["id"] },
          { foreignKeyName: "users_id_fkey"; columns: ["id"]; isOneToOne: true; referencedRelation: "auth.users"; referencedColumns: ["id"] },
          { foreignKeyName: "users_role_code_fkey"; columns: ["role_code"]; isOneToOne: false; referencedRelation: "roles"; referencedColumns: ["code"] },
        ]
      }
    }
    Views: {
      v_cash_received_daily: {
        Row: {
          day: string | null
          cash_received: number | null
          payment_count: number | null
        }
        Relationships: []
      }
      v_data_review: {
        Row: {
          entity_type: string | null
          entity_id: string | null
          code: string | null
          label: string | null
          review_note: string | null
          created_at: string | null
        }
        Relationships: []
      }
      v_enrollment_balances: {
        Row: {
          enrollment_id: string | null
          enrollment_code: string | null
          student_id: string | null
          class_id: string | null
          program_id: string | null
          status: Database["public"]["Enums"]["enrollment_status"] | null
          billing_mode: Database["public"]["Enums"]["billing_mode"] | null
          headcount: number | null
          monthly_discount_amount: number | null
          needs_review: boolean | null
          start_date: string | null
          end_date: string | null
          paid_in_full_until: string | null
          price_per_lesson: number | null
          lessons_purchased: number | null
          lessons_used: number | null
          lessons_remaining: number | null
          gross_amount: number | null
          discount_amount: number | null
          net_amount: number | null
          total_paid: number | null
          outstanding_amount: number | null
          revenue_recognized: number | null
          deferred_revenue: number | null
          payer_name: string | null
          payer_note: string | null
        }
        Relationships: []
      }
      v_expenses_daily: {
        Row: {
          day: string | null
          category: Database["public"]["Enums"]["expense_category"] | null
          total: number | null
        }
        Relationships: []
      }
      v_lesson_reports: {
        Row: {
          lesson_id: string | null
          class_id: string | null
          class_code: string | null
          class_name: string | null
          class_type: Database["public"]["Enums"]["class_type"] | null
          teacher_id: string | null
          teacher_name: string | null
          lesson_date: string | null
          scheduled_start_at: string | null
          scheduled_end_at: string | null
          actual_start_at: string | null
          actual_end_at: string | null
          duration_minutes: number | null
          lesson_status: Database["public"]["Enums"]["lesson_status"] | null
          report_due_at: string | null
          report_id: string | null
          report_status: Database["public"]["Enums"]["report_status"] | null
          missing_fields: string[] | null
          submitted_at: string | null
          completed_at: string | null
          is_late: boolean | null
          qc_score: number | null
          authored_by: Database["public"]["Enums"]["report_author"] | null
          sent_to_parent_at: string | null
          blocks_payroll: boolean | null
          is_overdue: boolean | null
          has_recording: boolean | null
          has_homework: boolean | null
          attendance_count: number | null
          student_names: string | null
        }
        Relationships: []
      }
      v_quality_alerts: {
        Row: {
          id: string | null
          type: string | null
          severity: Database["public"]["Enums"]["notification_severity"] | null
          title: string | null
          body: string | null
          payload: Json | null
          status: Database["public"]["Enums"]["notification_status"] | null
          due_at: string | null
          created_at: string | null
          lesson_id: string | null
          teacher_name: string | null
          class_name: string | null
          student_names: string | null
          missing_fields: Json | null
        }
        Relationships: []
      }
      v_revenue_recognized_daily: {
        Row: {
          day: string | null
          revenue_recognized: number | null
          lessons_taught: number | null
        }
        Relationships: []
      }
      v_student_finance: {
        Row: {
          student_id: string | null
          lessons_purchased: number | null
          lessons_completed: number | null
          lessons_remaining: number | null
          total_tuition: number | null
          total_paid: number | null
          outstanding_amount: number | null
          revenue_recognized: number | null
          needs_review: boolean | null
        }
        Relationships: []
      }
      v_student_overview: {
        Row: {
          id: string | null
          student_code: string | null
          full_name: string | null
          nickname: string | null
          date_of_birth: string | null
          age: number | null
          gender: string | null
          phone: string | null
          email: string | null
          status: Database["public"]["Enums"]["student_status"] | null
          enrollment_date: string | null
          source: string | null
          learning_goal: string | null
          learning_notes: string | null
          created_at: string | null
          program_id: string | null
          program_name: string | null
          level_id: string | null
          level_code: string | null
          level_name: string | null
          parent_id: string | null
          parent_name: string | null
          parent_phone: string | null
          parent_email: string | null
          class_id: string | null
          class_name: string | null
          teacher_id: string | null
          teacher_name: string | null
        }
        Relationships: []
      }
      v_teacher_payroll_summary: {
        Row: {
          payroll_id: string | null
          teacher_id: string | null
          teacher_name: string | null
          period_start: string | null
          period_end: string | null
          period_label: string | null
          lessons_count: number | null
          teaching_minutes: number | null
          teaching_hours: number | null
          gross_amount: number | null
          adjustments_amount: number | null
          final_amount: number | null
          status: Database["public"]["Enums"]["payroll_status"] | null
          approved_at: string | null
          paid_at: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      fn_alert_lesson_balance: {
        Args: Record<string, never>
        Returns: number
      }
      fn_alert_missing_lesson_time: {
        Args: Record<string, never>
        Returns: number
      }
      fn_alert_not_sent_to_parent: {
        Args: Record<string, never>
        Returns: number
      }
      fn_build_payroll: {
        Args: { p_teacher_id: string; p_period_start: string; p_period_end: string }
        Returns: string
      }
      fn_build_tuition_statement: {
        Args: { p_enrollment_id: string; p_period_start: string; p_period_end: string }
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
      fn_missing_field_label: {
        Args: { p_field: string }
        Returns: string
      }
      fn_pick_enrollment: {
        Args: { p_student_id: string; p_class_id: string }
        Returns: string
      }
      fn_qc_criterion_label: {
        Args: { p_key: string }
        Returns: string
      }
      fn_recalc_payroll: {
        Args: { p_payroll_id: string }
        Returns: undefined
      }
      fn_refresh_report_status: {
        Args: { p_report_id: string }
        Returns: unknown
      }
      fn_report_missing_fields: {
        Args: { p_report_id: string }
        Returns: unknown
      }
      fn_resolve_teacher_rate: {
        Args: { p_teacher_id: string; p_duration_minutes: number; p_class_id: string; p_on_date?: string }
        Returns: number
      }
      fn_resolve_tuition_rate: {
        Args: { p_enrollment_id: string; p_on_date?: string }
        Returns: number
      }
      fn_scan_overdue_reports: {
        Args: Record<string, never>
        Returns: unknown[]
      }
      fn_score_report_qc: {
        Args: { p_report_id: string }
        Returns: number
      }
    }
    Enums: {
      attendance_status: "present" | "late" | "absent_excused" | "absent_unexcused" | "no_show"
      billing_mode: "prepaid_package" | "monthly_postpaid" | "undetermined"
      class_status: "draft" | "active" | "paused" | "completed" | "cancelled"
      class_type: "one_to_one" | "one_to_two" | "small_group"
      enrollment_status: "draft" | "active" | "paused" | "completed" | "cancelled"
      expense_category: "teacher_salary" | "software" | "marketing" | "advertising" | "equipment" | "office" | "training" | "other"
      lead_status: "new" | "contacted" | "consultation" | "placement_test" | "trial" | "follow_up" | "enrolled" | "lost"
      lesson_status: "scheduled" | "in_progress" | "completed" | "cancelled" | "no_show" | "rescheduled"
      notification_severity: "info" | "warning" | "critical"
      notification_status: "new" | "acknowledged" | "resolved" | "dismissed"
      payable_status: "pending" | "included" | "excluded" | "paid"
      payment_method: "cash" | "bank_transfer" | "other"
      payment_status: "pending" | "confirmed" | "refunded" | "cancelled"
      payroll_status: "draft" | "pending_review" | "approved" | "paid"
      record_status: "active" | "archived"
      report_author: "teacher" | "ai" | "ai_edited_by_teacher"
      report_status: "draft" | "submitted" | "incomplete" | "needs_review" | "approved"
      student_status: "lead" | "placement" | "trial" | "active" | "paused" | "completed" | "inactive"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

/** Hàng của một bảng trong schema public. */
export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"]

/** Hàng của một view trong schema public. */
export type Views<T extends keyof Database["public"]["Views"]> =
  Database["public"]["Views"][T]["Row"]

/** Giá trị của một enum trong schema public. */
export type Enums<T extends keyof Database["public"]["Enums"]> =
  Database["public"]["Enums"][T]

export type TablesInsert<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Insert"]

export type TablesUpdate<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Update"]

