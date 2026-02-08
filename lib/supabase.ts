import { createClient } from '@supabase/supabase-js'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { Database } from './database.types'

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
})

// Types pour l'application
export type UserRole = 'CLIENT' | 'AGENT'

export type DemandeStatus = 'en_attente' | 'en_cours' | 'traite'

export interface Profile {
  id: string
  phone: string
  role: UserRole
  full_name: string | null
  created_at: string
  updated_at: string
}

export interface PharmacieGarde {
  id: string
  nom: string
  adresse: string
  quartier: string
  telephone: string
  date_debut: string
  date_fin: string
  created_at: string
}

export interface Demande {
  id: string
  client_id: string
  medicament_nom: string
  description: string | null
  status: DemandeStatus
  agent_id: string | null
  created_at: string
  updated_at: string
}

export interface Proposition {
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

