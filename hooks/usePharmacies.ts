/**
 * usePharmacies Hook
 * Récupère la liste des pharmacies depuis Supabase
 * Pour les agents: Utilisé pour sélectionner une pharmacie lors d'une proposition
 */
import { useState, useEffect, useCallback } from 'react';
import { supabase, Pharmacie, PharmaciePublic } from '../lib/supabase';

interface UsePharmaciesOptions {
  onlyActive?: boolean;
  includePrivateData?: boolean; // Pour les agents uniquement
}

interface UsePharmaciesReturn {
  pharmacies: PharmaciePublic[];
  pharmaciesWithDetails: Pharmacie[]; // Pour les agents
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  searchPharmacies: (query: string) => PharmaciePublic[];
  getPharmacieById: (id: string) => PharmaciePublic | undefined;
  getPharmacieByMatricule: (matricule: string) => PharmaciePublic | undefined;
  quartiers: string[];
}

export function usePharmacies(options: UsePharmaciesOptions = {}): UsePharmaciesReturn {
  const { onlyActive = true, includePrivateData = false } = options;

  const [pharmacies, setPharmacies] = useState<PharmaciePublic[]>([]);
  const [pharmaciesWithDetails, setPharmaciesWithDetails] = useState<Pharmacie[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPharmacies = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Récupérer les pharmacies publiques (sans téléphones)
      let query = supabase
        .from('pharmacies')
        .select('id, matricule, nom, quartier, is_active, created_at')
        .order('nom');

      if (onlyActive) {
        query = query.eq('is_active', true);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      setPharmacies(data || []);

      // Si on a besoin des données privées (pour les agents)
      if (includePrivateData) {
        const { data: fullData, error: fullError } = await supabase
          .from('pharmacies')
          .select('*')
          .order('nom');

        if (!fullError && fullData) {
          setPharmaciesWithDetails(fullData as Pharmacie[]);
        }
      }
    } catch (err: any) {
      console.error('Erreur chargement pharmacies:', err);
      setError(err.message || 'Erreur lors du chargement des pharmacies');
    } finally {
      setLoading(false);
    }
  }, [onlyActive, includePrivateData]);

  useEffect(() => {
    fetchPharmacies();
  }, [fetchPharmacies]);

  // Recherche de pharmacies par nom ou quartier
  const searchPharmacies = useCallback((query: string): PharmaciePublic[] => {
    if (!query.trim()) return pharmacies;

    const searchTerm = query.toLowerCase().trim();
    return pharmacies.filter(p =>
      p.nom.toLowerCase().includes(searchTerm) ||
      p.quartier.toLowerCase().includes(searchTerm) ||
      p.matricule.includes(searchTerm)
    );
  }, [pharmacies]);

  // Récupérer une pharmacie par ID
  const getPharmacieById = useCallback((id: string): PharmaciePublic | undefined => {
    return pharmacies.find(p => p.id === id);
  }, [pharmacies]);

  // Récupérer une pharmacie par matricule
  const getPharmacieByMatricule = useCallback((matricule: string): PharmaciePublic | undefined => {
    return pharmacies.find(p => p.matricule === matricule);
  }, [pharmacies]);

  // Liste unique des quartiers
  const quartiers = [...new Set(pharmacies.map(p => p.quartier))].sort();

  return {
    pharmacies,
    pharmaciesWithDetails,
    loading,
    error,
    refresh: fetchPharmacies,
    searchPharmacies,
    getPharmacieById,
    getPharmacieByMatricule,
    quartiers,
  };
}

export default usePharmacies;

