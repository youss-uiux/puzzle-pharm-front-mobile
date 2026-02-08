-- =============================================
-- CORRECTION DU TRIGGER handle_new_user
-- =============================================
-- Exécuter ce script dans l'éditeur SQL de Supabase
-- =============================================

-- 1. Supprimer l'ancien trigger et la fonction
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user();

-- 2. Créer la nouvelle fonction corrigée
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    user_phone TEXT;
BEGIN
    -- Récupérer le numéro de téléphone (peut être dans phone, email ou raw_user_meta_data)
    user_phone := COALESCE(
        NEW.phone,
        NEW.raw_user_meta_data->>'phone',
        NEW.email, -- Fallback sur email si utilisé
        ''
    );

    -- Ne créer le profil que si on a un identifiant
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
        ON CONFLICT (id) DO UPDATE SET
            phone = EXCLUDED.phone,
            updated_at = NOW();
    END IF;

    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        -- Log l'erreur mais ne bloque pas la création de l'utilisateur
        RAISE WARNING 'Erreur lors de la création du profil: %', SQLERRM;
        RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Recréer le trigger
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION handle_new_user();

-- 4. Politiques RLS pour profiles
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

-- 5. Permettre la contrainte unique sur phone d'accepter les doublons vides
-- Supprimer l'ancienne contrainte si elle existe
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_phone_key;

-- Créer un index unique partiel (ignore les valeurs vides)
DROP INDEX IF EXISTS profiles_phone_unique;
CREATE UNIQUE INDEX profiles_phone_unique ON profiles(phone) WHERE phone != '';

-- =============================================
-- FIN DU SCRIPT
-- =============================================
