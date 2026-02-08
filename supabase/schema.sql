-- =============================================
-- PUZZLE PHARM - SCHEMA DE BASE DE DONNÉES
-- =============================================
-- À exécuter dans l'éditeur SQL de Supabase
-- =============================================

-- 1. CRÉATION DES TYPES ENUM
-- =============================================

-- Type pour les rôles utilisateurs
CREATE TYPE user_role AS ENUM ('CLIENT', 'AGENT');

-- Type pour le statut des demandes
CREATE TYPE demande_status AS ENUM ('en_attente', 'en_cours', 'traite');

-- 2. CRÉATION DES TABLES
-- =============================================

-- Table des profils utilisateurs
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    phone TEXT NOT NULL UNIQUE,
    role user_role NOT NULL DEFAULT 'CLIENT',
    full_name TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index pour recherche rapide par téléphone
CREATE INDEX idx_profiles_phone ON profiles(phone);
CREATE INDEX idx_profiles_role ON profiles(role);

-- Table des pharmacies de garde
CREATE TABLE pharmacies_garde (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nom TEXT NOT NULL,
    adresse TEXT NOT NULL,
    quartier TEXT NOT NULL,
    telephone TEXT NOT NULL,
    date_debut DATE NOT NULL,
    date_fin DATE NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Contrainte pour éviter les doublons de pharmacie sur la même période
    CONSTRAINT unique_pharmacie_periode UNIQUE (nom, date_debut, date_fin)
);

-- Index pour recherche par date
CREATE INDEX idx_pharmacies_garde_dates ON pharmacies_garde(date_debut, date_fin);
CREATE INDEX idx_pharmacies_garde_quartier ON pharmacies_garde(quartier);

-- Table des demandes de médicaments
CREATE TABLE demandes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    medicament_nom TEXT NOT NULL,
    description TEXT,
    status demande_status NOT NULL DEFAULT 'en_attente',
    agent_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index pour les requêtes fréquentes
CREATE INDEX idx_demandes_client ON demandes(client_id);
CREATE INDEX idx_demandes_agent ON demandes(agent_id);
CREATE INDEX idx_demandes_status ON demandes(status);
CREATE INDEX idx_demandes_created ON demandes(created_at DESC);

-- Table des propositions (réponses des agents)
CREATE TABLE propositions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    demande_id UUID NOT NULL REFERENCES demandes(id) ON DELETE CASCADE,
    pharmacie_nom TEXT NOT NULL,
    prix DECIMAL(10, 2) NOT NULL CHECK (prix >= 0),
    quartier TEXT NOT NULL,
    adresse TEXT,
    telephone TEXT,
    disponible BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index pour les requêtes de propositions
CREATE INDEX idx_propositions_demande ON propositions(demande_id);

-- 3. FONCTIONS UTILITAIRES
-- =============================================

-- Fonction pour mettre à jour automatiquement updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour profiles
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger pour demandes
CREATE TRIGGER update_demandes_updated_at
    BEFORE UPDATE ON demandes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Fonction pour créer automatiquement un profil lors de l'inscription
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    user_phone TEXT;
BEGIN
    -- Récupérer le numéro de téléphone (peut être dans phone ou raw_user_meta_data)
    user_phone := COALESCE(
        NEW.phone,
        NEW.raw_user_meta_data->>'phone',
        ''
    );

    -- Ne créer le profil que si on a un numéro de téléphone
    IF user_phone IS NOT NULL AND user_phone != '' THEN
        INSERT INTO public.profiles (id, phone, role)
        VALUES (
            NEW.id,
            user_phone,
            COALESCE(
                (NEW.raw_user_meta_data->>'role')::user_role,
                'CLIENT'
            )
        )
        ON CONFLICT (id) DO NOTHING;
    END IF;

    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        -- Log l'erreur mais ne bloque pas la création de l'utilisateur
        RAISE WARNING 'Erreur lors de la création du profil: %', SQLERRM;
        RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger pour créer le profil automatiquement
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION handle_new_user();

-- Fonction pour vérifier si l'utilisateur est un agent
CREATE OR REPLACE FUNCTION is_agent(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM profiles
        WHERE id = user_id AND role = 'AGENT'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour obtenir les pharmacies de garde actives
CREATE OR REPLACE FUNCTION get_pharmacies_garde_actives()
RETURNS SETOF pharmacies_garde AS $$
BEGIN
    RETURN QUERY
    SELECT * FROM pharmacies_garde
    WHERE CURRENT_DATE BETWEEN date_debut AND date_fin
    ORDER BY quartier, nom;
END;
$$ LANGUAGE plpgsql;

-- 4. POLITIQUES RLS (Row Level Security)
-- =============================================

-- Activer RLS sur toutes les tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE pharmacies_garde ENABLE ROW LEVEL SECURITY;
ALTER TABLE demandes ENABLE ROW LEVEL SECURITY;
ALTER TABLE propositions ENABLE ROW LEVEL SECURITY;

-- ============= POLITIQUES POUR PROFILES =============

-- Lecture : Chaque utilisateur peut voir son propre profil
CREATE POLICY "Users can view own profile"
    ON profiles FOR SELECT
    USING (auth.uid() = id);

-- Les agents peuvent voir tous les profils (pour voir les infos clients)
CREATE POLICY "Agents can view all profiles"
    ON profiles FOR SELECT
    USING (is_agent(auth.uid()));

-- Mise à jour : Chaque utilisateur peut modifier son propre profil
CREATE POLICY "Users can update own profile"
    ON profiles FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- ============= POLITIQUES POUR PHARMACIES_GARDE =============

-- Lecture : Tout le monde peut voir les pharmacies de garde
CREATE POLICY "Anyone can view pharmacies garde"
    ON pharmacies_garde FOR SELECT
    TO authenticated
    USING (true);

-- Insertion/Modification : Seuls les agents peuvent gérer les pharmacies
CREATE POLICY "Agents can insert pharmacies garde"
    ON pharmacies_garde FOR INSERT
    TO authenticated
    WITH CHECK (is_agent(auth.uid()));

CREATE POLICY "Agents can update pharmacies garde"
    ON pharmacies_garde FOR UPDATE
    TO authenticated
    USING (is_agent(auth.uid()))
    WITH CHECK (is_agent(auth.uid()));

CREATE POLICY "Agents can delete pharmacies garde"
    ON pharmacies_garde FOR DELETE
    TO authenticated
    USING (is_agent(auth.uid()));

-- ============= POLITIQUES POUR DEMANDES =============

-- Les clients peuvent voir leurs propres demandes
CREATE POLICY "Clients can view own demandes"
    ON demandes FOR SELECT
    TO authenticated
    USING (client_id = auth.uid());

-- Les agents peuvent voir toutes les demandes
CREATE POLICY "Agents can view all demandes"
    ON demandes FOR SELECT
    TO authenticated
    USING (is_agent(auth.uid()));

-- Les clients peuvent créer des demandes
CREATE POLICY "Clients can create demandes"
    ON demandes FOR INSERT
    TO authenticated
    WITH CHECK (
        client_id = auth.uid() AND
        NOT is_agent(auth.uid())
    );

-- Les clients peuvent annuler leurs demandes en attente
CREATE POLICY "Clients can update own pending demandes"
    ON demandes FOR UPDATE
    TO authenticated
    USING (
        client_id = auth.uid() AND
        status = 'en_attente'
    )
    WITH CHECK (client_id = auth.uid());

-- Les agents peuvent mettre à jour les demandes
CREATE POLICY "Agents can update demandes"
    ON demandes FOR UPDATE
    TO authenticated
    USING (is_agent(auth.uid()))
    WITH CHECK (is_agent(auth.uid()));

-- ============= POLITIQUES POUR PROPOSITIONS =============

-- Les clients peuvent voir les propositions de leurs demandes
CREATE POLICY "Clients can view propositions of own demandes"
    ON propositions FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM demandes
            WHERE demandes.id = propositions.demande_id
            AND demandes.client_id = auth.uid()
        )
    );

-- Les agents peuvent voir toutes les propositions
CREATE POLICY "Agents can view all propositions"
    ON propositions FOR SELECT
    TO authenticated
    USING (is_agent(auth.uid()));

-- Seuls les agents peuvent créer des propositions
CREATE POLICY "Agents can create propositions"
    ON propositions FOR INSERT
    TO authenticated
    WITH CHECK (is_agent(auth.uid()));

-- Les agents peuvent modifier leurs propositions
CREATE POLICY "Agents can update propositions"
    ON propositions FOR UPDATE
    TO authenticated
    USING (is_agent(auth.uid()))
    WITH CHECK (is_agent(auth.uid()));

-- Les agents peuvent supprimer des propositions
CREATE POLICY "Agents can delete propositions"
    ON propositions FOR DELETE
    TO authenticated
    USING (is_agent(auth.uid()));

-- 5. CONFIGURATION REALTIME
-- =============================================

-- Activer Realtime pour les tables nécessaires
ALTER PUBLICATION supabase_realtime ADD TABLE demandes;
ALTER PUBLICATION supabase_realtime ADD TABLE propositions;

-- 6. DONNÉES DE TEST (OPTIONNEL)
-- =============================================

-- Insérer quelques pharmacies de garde pour tester
INSERT INTO pharmacies_garde (nom, adresse, quartier, telephone, date_debut, date_fin) VALUES
    ('Pharmacie Centrale', '123 Avenue de la République', 'Plateau', '+227 20 73 45 67', CURRENT_DATE, CURRENT_DATE + INTERVAL '7 days'),
    ('Pharmacie du Plateau', '45 Rue du Commerce', 'Plateau', '+227 20 73 56 78', CURRENT_DATE, CURRENT_DATE + INTERVAL '7 days'),
    ('Pharmacie Liberté', '78 Boulevard Mali Béro', 'Liberté', '+227 20 74 67 89', CURRENT_DATE, CURRENT_DATE + INTERVAL '7 days'),
    ('Pharmacie Yantala', '12 Rue de Yantala', 'Yantala', '+227 20 75 78 90', CURRENT_DATE, CURRENT_DATE + INTERVAL '7 days'),
    ('Pharmacie Gamkallé', '34 Avenue de Gamkallé', 'Gamkallé', '+227 20 76 89 01', CURRENT_DATE, CURRENT_DATE + INTERVAL '7 days');

-- =============================================
-- FIN DU SCRIPT
-- =============================================
-- Notes :
-- 1. Exécutez ce script dans l'éditeur SQL de votre projet Supabase
-- 2. Assurez-vous d'activer l'authentification par téléphone dans les paramètres Auth
-- 3. Les triggers Realtime permettront aux agents de recevoir les demandes en temps réel
-- =============================================

