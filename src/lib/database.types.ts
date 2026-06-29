export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      profiles: {
        Row: {
          created_at: string
          full_name: string | null
          id: string
          role: string
        }
        Insert: {
          created_at?: string
          full_name?: string | null
          id: string
          role?: string
        }
        Update: {
          created_at?: string
          full_name?: string | null
          id?: string
          role?: string
        }
        Relationships: []
      }
      service_entries: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          kind: string
          note: string | null
          place: string | null
          service_code: string
          serviced_on: string
          vehicle_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          kind: string
          note?: string | null
          place?: string | null
          service_code: string
          serviced_on?: string
          vehicle_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          kind?: string
          note?: string | null
          place?: string | null
          service_code?: string
          serviced_on?: string
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_entries_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      vehicles: {
        Row: {
          created_at: string
          id: string
          model: string | null
          owner_id: string | null
          plate: string
        }
        Insert: {
          created_at?: string
          id?: string
          model?: string | null
          owner_id?: string | null
          plate: string
        }
        Update: {
          created_at?: string
          id?: string
          model?: string | null
          owner_id?: string | null
          plate?: string
        }
        Relationships: []
      }
      workshops: {
        Row: {
          cert_path: string | null
          created_at: string
          id: string
          name: string
          owner_id: string
          serial: string
        }
        Insert: {
          cert_path?: string | null
          created_at?: string
          id?: string
          name: string
          owner_id: string
          serial: string
        }
        Update: {
          cert_path?: string | null
          created_at?: string
          id?: string
          name?: string
          owner_id?: string
          serial?: string
        }
        Relationships: []
      }
    }
    Views: { [_ in never]: never }
    Functions: {
      current_role_claim: { Args: Record<string, never>; Returns: string }
    }
    Enums: { [_ in never]: never }
    CompositeTypes: { [_ in never]: never }
  }
}
