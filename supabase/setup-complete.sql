-- =============================================
-- SCRIPT COMPLET DE CONFIGURATION - PUZZLEPHARM
-- =============================================
-- Exécuter ce script dans l'éditeur SQL de Supabase
-- =============================================

-- =============================================
-- 1. CRÉATION DES TYPES ENUM (si pas déjà créés)
-- =============================================

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE user_role AS ENUM ('CLIENT', 'AGENT');
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'demande_status') THEN
        CREATE TYPE demande_status AS ENUM ('en_attente', 'en_cours', 'traite');
    END IF;
END $$;

-- =============================================
-- 2. CRÉATION DES TABLES (si pas déjà créées)
-- =============================================

-- Table des profils utilisateurs
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    phone TEXT NOT NULL DEFAULT '',
    role user_role NOT NULL DEFAULT 'CLIENT',
    full_name TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table des pharmacies de garde
CREATE TABLE IF NOT EXISTS pharmacies_garde (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nom TEXT NOT NULL,
    adresse TEXT NOT NULL,
    quartier TEXT NOT NULL,
    telephone TEXT NOT NULL,
    date_debut DATE NOT NULL,
    date_fin DATE NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table des demandes de médicaments
CREATE TABLE IF NOT EXISTS demandes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    medicament_nom TEXT NOT NULL,
    description TEXT,
    status demande_status NOT NULL DEFAULT 'en_attente',
    agent_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table des propositions (réponses des agents)
CREATE TABLE IF NOT EXISTS propositions (
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

-- =============================================
-- 3. CRÉATION DES INDEX
-- =============================================

CREATE INDEX IF NOT EXISTS idx_profiles_phone ON profiles(phone);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_pharmacies_garde_dates ON pharmacies_garde(date_debut, date_fin);
CREATE INDEX IF NOT EXISTS idx_demandes_client ON demandes(client_id);
CREATE INDEX IF NOT EXISTS idx_demandes_agent ON demandes(agent_id);
CREATE INDEX IF NOT EXISTS idx_demandes_status ON demandes(status);
CREATE INDEX IF NOT EXISTS idx_propositions_demande ON propositions(demande_id);

-- =============================================
-- 4. FONCTION DE MISE À JOUR AUTOMATIQUE
-- =============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers pour updated_at
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_demandes_updated_at ON demandes;
CREATE TRIGGER update_demandes_updated_at
    BEFORE UPDATE ON demandes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- 5. FONCTION POUR CRÉER UN PROFIL AUTOMATIQUEMENT
-- =============================================

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user();

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    user_phone TEXT;
BEGIN
    user_phone := COALESCE(
        NEW.phone,
        NEW.raw_user_meta_data->>'phone',
        ''
    );

    INSERT INTO public.profiles (id, phone, role)
    VALUES (
        NEW.id,
        user_phone,
        COALESCE(
            (NEW.raw_user_meta_data->>'role')::user_role,
            'CLIENT'
        )
    )
    ON CONFLICT (id) DO UPDATE SET
        phone = EXCLUDED.phone,
        updated_at = NOW();

    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        RAISE WARNING 'Erreur lors de la création du profil: %', SQLERRM;
        RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION handle_new_user();

-- =============================================
-- 6. FONCTION POUR VÉRIFIER SI L'UTILISATEUR EST UN AGENT
-- =============================================

CREATE OR REPLACE FUNCTION is_agent(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM profiles
        WHERE id = user_id AND role = 'AGENT'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- 7. ACTIVER RLS SUR TOUTES LES TABLES
-- =============================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE pharmacies_garde ENABLE ROW LEVEL SECURITY;
ALTER TABLE demandes ENABLE ROW LEVEL SECURITY;
ALTER TABLE propositions ENABLE ROW LEVEL SECURITY;

-- =============================================
-- 8. POLITIQUES RLS POUR PROFILES
-- =============================================

DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
CREATE POLICY "Users can insert own profile"
    ON profiles FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
CREATE POLICY "Users can view own profile"
    ON profiles FOR SELECT
    TO authenticated
    USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile"
    ON profiles FOR UPDATE
    TO authenticated
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Agents can view all profiles" ON profiles;
CREATE POLICY "Agents can view all profiles"
    ON profiles FOR SELECT
    TO authenticated
    USING (is_agent(auth.uid()));

-- =============================================
-- 9. POLITIQUES RLS POUR PHARMACIES_GARDE
-- =============================================

DROP POLICY IF EXISTS "Anyone can view pharmacies garde" ON pharmacies_garde;
CREATE POLICY "Anyone can view pharmacies garde"
    ON pharmacies_garde FOR SELECT
    TO authenticated
    USING (true);

DROP POLICY IF EXISTS "Agents can insert pharmacies garde" ON pharmacies_garde;
CREATE POLICY "Agents can insert pharmacies garde"
    ON pharmacies_garde FOR INSERT
    TO authenticated
    WITH CHECK (is_agent(auth.uid()));

DROP POLICY IF EXISTS "Agents can update pharmacies garde" ON pharmacies_garde;
CREATE POLICY "Agents can update pharmacies garde"
    ON pharmacies_garde FOR UPDATE
    TO authenticated
    USING (is_agent(auth.uid()))
    WITH CHECK (is_agent(auth.uid()));

DROP POLICY IF EXISTS "Agents can delete pharmacies garde" ON pharmacies_garde;
CREATE POLICY "Agents can delete pharmacies garde"
    ON pharmacies_garde FOR DELETE
    TO authenticated
    USING (is_agent(auth.uid()));

-- =============================================
-- 10. POLITIQUES RLS POUR DEMANDES
-- =============================================

DROP POLICY IF EXISTS "Clients can view own demandes" ON demandes;
CREATE POLICY "Clients can view own demandes"
    ON demandes FOR SELECT
    TO authenticated
    USING (client_id = auth.uid());

DROP POLICY IF EXISTS "Agents can view all demandes" ON demandes;
CREATE POLICY "Agents can view all demandes"
    ON demandes FOR SELECT
    TO authenticated
    USING (is_agent(auth.uid()));

DROP POLICY IF EXISTS "Clients can create demandes" ON demandes;
CREATE POLICY "Clients can create demandes"
    ON demandes FOR INSERT
    TO authenticated
    WITH CHECK (client_id = auth.uid());

DROP POLICY IF EXISTS "Clients can update own pending demandes" ON demandes;
CREATE POLICY "Clients can update own pending demandes"
    ON demandes FOR UPDATE
    TO authenticated
    USING (client_id = auth.uid() AND status = 'en_attente')
    WITH CHECK (client_id = auth.uid());

DROP POLICY IF EXISTS "Agents can update demandes" ON demandes;
CREATE POLICY "Agents can update demandes"
    ON demandes FOR UPDATE
    TO authenticated
    USING (is_agent(auth.uid()))
    WITH CHECK (is_agent(auth.uid()));

-- =============================================
-- 11. POLITIQUES RLS POUR PROPOSITIONS
-- =============================================

DROP POLICY IF EXISTS "Clients can view propositions of own demandes" ON propositions;
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

DROP POLICY IF EXISTS "Agents can view all propositions" ON propositions;
CREATE POLICY "Agents can view all propositions"
    ON propositions FOR SELECT
    TO authenticated
    USING (is_agent(auth.uid()));

DROP POLICY IF EXISTS "Agents can create propositions" ON propositions;
CREATE POLICY "Agents can create propositions"
    ON propositions FOR INSERT
    TO authenticated
    WITH CHECK (is_agent(auth.uid()));

DROP POLICY IF EXISTS "Agents can update propositions" ON propositions;
CREATE POLICY "Agents can update propositions"
    ON propositions FOR UPDATE
    TO authenticated
    USING (is_agent(auth.uid()))
    WITH CHECK (is_agent(auth.uid()));

DROP POLICY IF EXISTS "Agents can delete propositions" ON propositions;
CREATE POLICY "Agents can delete propositions"
    ON propositions FOR DELETE
    TO authenticated
    USING (is_agent(auth.uid()));

-- =============================================
-- 12. CONFIGURATION REALTIME
-- =============================================

-- Ajouter les tables à la publication Realtime (ignorer si déjà présentes)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables
        WHERE pubname = 'supabase_realtime' AND tablename = 'demandes'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE demandes;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables
        WHERE pubname = 'supabase_realtime' AND tablename = 'propositions'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE propositions;
    END IF;
END $$;

-- =============================================
-- 13. DONNÉES DE TEST - PHARMACIES DE GARDE (NIGER)
-- =============================================

INSERT INTO pharmacies_garde (nom, adresse, quartier, telephone, date_debut, date_fin) VALUES
    ('Pharmacie Centrale', '123 Avenue de la République', 'Plateau', '+227 20 73 45 67', CURRENT_DATE, CURRENT_DATE + INTERVAL '7 days'),
    ('Pharmacie du Plateau', '45 Rue du Commerce', 'Plateau', '+227 20 73 56 78', CURRENT_DATE, CURRENT_DATE + INTERVAL '7 days'),
    ('Pharmacie Liberté', '78 Boulevard Mali Béro', 'Liberté', '+227 20 74 67 89', CURRENT_DATE, CURRENT_DATE + INTERVAL '7 days'),
    ('Pharmacie Yantala', '12 Rue de Yantala', 'Yantala', '+227 20 75 78 90', CURRENT_DATE, CURRENT_DATE + INTERVAL '7 days'),
    ('Pharmacie Gamkallé', '34 Avenue de Gamkallé', 'Gamkallé', '+227 20 76 89 01', CURRENT_DATE, CURRENT_DATE + INTERVAL '7 days')
ON CONFLICT DO NOTHING;

-- =============================================
-- 14. NETTOYAGE DES UTILISATEURS ORPHELINS
-- =============================================

-- Voir les utilisateurs sans profil (pour diagnostic)
SELECT
    au.id,
    au.phone,
    au.created_at,
    'Utilisateur sans profil' as status
FROM auth.users au
LEFT JOIN profiles p ON au.id = p.id
WHERE p.id IS NULL;

-- Pour supprimer les utilisateurs orphelins, décommenter la ligne suivante :
-- DELETE FROM auth.users WHERE id NOT IN (SELECT id FROM profiles);

-- =============================================
-- FIN DU SCRIPT COMPLET
-- =============================================
-- Après exécution, réessaie de te connecter avec ton numéro
-- =============================================

