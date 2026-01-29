import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database types (you can generate these with `supabase gen types typescript --project-id YOUR_PROJECT_ID`)
export type Database = {
  public: {
    Tables: {
      // Add your table definitions here as you create them
      // Example:
      // fundraisers: {
      //   Row: {
      //     id: string
      //     title: string
      //     description: string
      //     goal: number
      //     created_at: string
      //     updated_at: string
      //   }
      //   Insert: {
      //     id?: string
      //     title: string
      //     description: string
      //     goal: number
      //     created_at?: string
      //     updated_at?: string
      //   }
      //   Update: {
      //     id?: string
      //     title?: string
      //     description?: string
      //     goal?: number
      //     created_at?: string
      //     updated_at?: string
      //   }
      // }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}