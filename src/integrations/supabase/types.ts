export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      asha_profiles: {
        Row: {
          created_at: string
          experience_years: number
          id: string
          is_verified: boolean
          location: string | null
          qualification: string | null
          specialization: string | null
          updated_at: string
          user_id: string
          worker_id: string
        }
        Insert: {
          created_at?: string
          experience_years?: number
          id?: string
          is_verified?: boolean
          location?: string | null
          qualification?: string | null
          specialization?: string | null
          updated_at?: string
          user_id: string
          worker_id: string
        }
        Update: {
          created_at?: string
          experience_years?: number
          id?: string
          is_verified?: boolean
          location?: string | null
          qualification?: string | null
          specialization?: string | null
          updated_at?: string
          user_id?: string
          worker_id?: string
        }
        Relationships: []
      }
      patient_requests: {
        Row: {
          asha_worker_id: string
          created_at: string
          description: string | null
          id: string
          patient_id: string
          request_type: string
          status: Database["public"]["Enums"]["request_status"]
          updated_at: string
        }
        Insert: {
          asha_worker_id: string
          created_at?: string
          description?: string | null
          id?: string
          patient_id: string
          request_type?: string
          status?: Database["public"]["Enums"]["request_status"]
          updated_at?: string
        }
        Update: {
          asha_worker_id?: string
          created_at?: string
          description?: string | null
          id?: string
          patient_id?: string
          request_type?: string
          status?: Database["public"]["Enums"]["request_status"]
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          full_name: string
          id: string
          phone: string | null
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email: string
          full_name: string
          id?: string
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      reminders: {
        Row: {
          category: Database["public"]["Enums"]["reminder_category"]
          created_at: string
          frequency: Database["public"]["Enums"]["reminder_frequency"]
          id: string
          is_active: boolean
          patient_id: string
          time: string
          title: string | null
        }
        Insert: {
          category: Database["public"]["Enums"]["reminder_category"]
          created_at?: string
          frequency?: Database["public"]["Enums"]["reminder_frequency"]
          id?: string
          is_active?: boolean
          patient_id: string
          time: string
          title?: string | null
        }
        Update: {
          category?: Database["public"]["Enums"]["reminder_category"]
          created_at?: string
          frequency?: Database["public"]["Enums"]["reminder_frequency"]
          id?: string
          is_active?: boolean
          patient_id?: string
          time?: string
          title?: string | null
        }
        Relationships: []
      }
      vitals: {
        Row: {
          bmi: number | null
          created_at: string
          diastolic_bp: number | null
          glucose: number | null
          id: string
          patient_id: string
          risk_level: Database["public"]["Enums"]["risk_level_type"] | null
          systolic_bp: number | null
          weight: number | null
        }
        Insert: {
          bmi?: number | null
          created_at?: string
          diastolic_bp?: number | null
          glucose?: number | null
          id?: string
          patient_id: string
          risk_level?: Database["public"]["Enums"]["risk_level_type"] | null
          systolic_bp?: number | null
          weight?: number | null
        }
        Update: {
          bmi?: number | null
          created_at?: string
          diastolic_bp?: number | null
          glucose?: number | null
          id?: string
          patient_id?: string
          risk_level?: Database["public"]["Enums"]["risk_level_type"] | null
          systolic_bp?: number | null
          weight?: number | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      user_role: "patient" | "asha_worker"
      request_status: "pending" | "accepted" | "rejected" | "completed"
      risk_level_type: "low" | "medium" | "moderate" | "high"
      reminder_category: "medication" | "checkup" | "exercise"
      reminder_frequency: "daily" | "weekly" | "monthly"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      user_role: ["patient", "asha_worker"],
      request_status: ["pending", "accepted", "rejected", "completed"],
      risk_level_type: ["low", "medium", "moderate", "high"],
      reminder_category: ["medication", "checkup", "exercise"],
      reminder_frequency: ["daily", "weekly", "monthly"],
    },
  },
} as const
