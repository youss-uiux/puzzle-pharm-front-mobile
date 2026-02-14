/**
 * Realtime Demandes Hook
 * Centralized Supabase realtime subscription for demandes
 */
import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

export type DemandeStatus = 'en_attente' | 'en_cours' | 'traite' | 'all';

export interface DemandeWithRelations {
  id: string;
  client_id: string;
  agent_id?: string;
  medicament_nom: string;
  description?: string;
  quantity?: number;
  is_urgent?: boolean;
  status: string;
  created_at: string;
  updated_at?: string;
  profiles?: {
    phone: string;
    full_name: string | null;
  };
  propositions?: Array<{
    id: string;
    pharmacie_nom: string;
    prix: number;
    quartier: string;
    adresse: string | null;
    telephone: string | null;
    created_at: string;
  }>;
}

interface UseRealtimeDemandesOptions {
  filter?: DemandeStatus;
  userId?: string;
  role?: 'CLIENT' | 'AGENT';
  limit?: number;
  onNewDemande?: (demande: DemandeWithRelations) => void;
  onNewProposition?: (demandeId: string) => void;
  enableHaptics?: boolean;
}

interface UseRealtimeDemandesReturn {
  demandes: DemandeWithRelations[];
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  stats: {
    total: number;
    en_attente: number;
    en_cours: number;
    traite: number;
  };
}

export const useRealtimeDemandes = (
  options: UseRealtimeDemandesOptions = {}
): UseRealtimeDemandesReturn => {
  const {
    filter = 'all',
    userId,
    role = 'CLIENT',
    limit,
    onNewDemande,
    onNewProposition,
    enableHaptics = true,
  } = options;

  const [demandes, setDemandes] = useState<DemandeWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  const triggerHaptic = useCallback(async () => {
    if (enableHaptics && Platform.OS !== 'web') {
      try {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch (e) {
        // Haptics not available
      }
    }
  }, [enableHaptics]);

  const fetchDemandes = useCallback(async () => {
    try {
      setError(null);

      let query = supabase
        .from('demandes')
        .select(`
          *,
          profiles:client_id (phone, full_name),
          propositions (id, pharmacie_nom, prix, quartier, adresse, telephone, created_at)
        `)
        .order('created_at', { ascending: false });

      // Apply role-based filter
      if (role === 'CLIENT' && userId) {
        query = query.eq('client_id', userId);
      }

      // Apply status filter
      if (filter !== 'all') {
        query = query.eq('status', filter);
      }

      // Apply limit
      if (limit) {
        query = query.limit(limit);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;
      setDemandes(data || []);
    } catch (err: any) {
      console.error('Error fetching demandes:', err);
      setError(err.message || 'Erreur de chargement');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filter, userId, role, limit]);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    if (enableHaptics && Platform.OS !== 'web') {
      try {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch (e) {}
    }
    await fetchDemandes();
  }, [fetchDemandes, enableHaptics]);

  // Setup realtime subscription
  useEffect(() => {
    fetchDemandes();

    // Create unique channel name
    const channelName = `demandes-${role}-${userId || 'all'}-${Date.now()}`;

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'demandes',
          ...(role === 'CLIENT' && userId ? { filter: `client_id=eq.${userId}` } : {}),
        },
        async (payload) => {
          if (payload.eventType === 'INSERT' && onNewDemande) {
            triggerHaptic();
            onNewDemande(payload.new as DemandeWithRelations);
          }
          // Refetch to get complete data with relations
          fetchDemandes();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'propositions',
        },
        async (payload) => {
          triggerHaptic();
          if (onNewProposition) {
            onNewProposition((payload.new as any).demande_id);
          }
          fetchDemandes();
        }
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [fetchDemandes, userId, role, onNewDemande, onNewProposition, triggerHaptic]);

  // Compute stats
  const stats = {
    total: demandes.length,
    en_attente: demandes.filter(d => d.status === 'en_attente').length,
    en_cours: demandes.filter(d => d.status === 'en_cours').length,
    traite: demandes.filter(d => d.status === 'traite').length,
  };

  return {
    demandes,
    loading,
    refreshing,
    error,
    refresh,
    stats,
  };
};

export default useRealtimeDemandes;

