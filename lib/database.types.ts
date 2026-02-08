export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          phone: string
          role: 'CLIENT' | 'AGENT'
          full_name: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          phone: string
          role?: 'CLIENT' | 'AGENT'
          full_name?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          phone?: string
          role?: 'CLIENT' | 'AGENT'
          full_name?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      pharmacies_garde: {
        Row: {
          id: string
          nom: string
          adresse: string
          quartier: string
          telephone: string
          date_debut: string
          date_fin: string
          created_at: string
        }
        Insert: {
          id?: string
          nom: string
          adresse: string
          quartier: string
          telephone: string
          date_debut: string
          date_fin: string
          created_at?: string
        }
        Update: {
          id?: string
          nom?: string
          adresse?: string
          quartier?: string
          telephone?: string
          date_debut?: string
          date_fin?: string
          created_at?: string
        }
      }
      demandes: {
        Row: {
          id: string
          client_id: string
          medicament_nom: string
          description: string | null
          status: 'en_attente' | 'en_cours' | 'traite'
          agent_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          client_id: string
          medicament_nom: string
          description?: string | null
          status?: 'en_attente' | 'en_cours' | 'traite'
          agent_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          client_id?: string
          medicament_nom?: string
          description?: string | null
          status?: 'en_attente' | 'en_cours' | 'traite'
          agent_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      propositions: {
        Row: {
          id: string
          demande_id: string
          pharmacie_nom: string
          prix: number
          quartier: string
          adresse: string | null
          telephone: string | null
          disponible: boolean
          created_at: string
        }
        Insert: {
          id?: string
          demande_id: string
          pharmacie_nom: string
          prix: number
          quartier: string
          adresse?: string | null
          telephone?: string | null
          disponible?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          demande_id?: string
          pharmacie_nom?: string
          prix?: number
          quartier?: string
          adresse?: string | null
          telephone?: string | null
          disponible?: boolean
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      user_role: 'CLIENT' | 'AGENT'
      demande_status: 'en_attente' | 'en_cours' | 'traite'
    }
  }
}

