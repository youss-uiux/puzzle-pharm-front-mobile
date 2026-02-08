-- =============================================
-- SCRIPT POUR CRÉER UN AGENT
-- =============================================
-- Exécuter ce script dans l'éditeur SQL de Supabase
-- après vous être connecté avec le numéro de téléphone
-- que vous souhaitez définir comme AGENT
-- =============================================

-- Option 1: Passer un utilisateur existant en AGENT par son numéro de téléphone
-- Remplacez '+22790848424' par le numéro de téléphone de l'agent
UPDATE profiles
SET role = 'AGENT', updated_at = NOW()
WHERE phone = '+22790848424';

-- Option 2: Passer un utilisateur en AGENT par son ID
-- Remplacez 'USER_ID_HERE' par l'UUID de l'utilisateur
-- UPDATE profiles
-- SET role = 'AGENT', updated_at = NOW()
-- WHERE id = 'USER_ID_HERE';

-- =============================================
-- VÉRIFICATION
-- =============================================

-- Voir tous les utilisateurs et leurs rôles
SELECT id, phone, role, full_name, created_at
FROM profiles
ORDER BY created_at DESC;

-- Voir uniquement les agents
SELECT id, phone, role, full_name, created_at
FROM profiles
WHERE role = 'AGENT';

-- =============================================
-- COMMENT SE CONNECTER EN TANT QU'AGENT
-- =============================================
--
-- 1. D'abord, connectez-vous normalement avec un numéro de téléphone
--    (par exemple: 90848424)
--
-- 2. Ensuite, exécutez ce script SQL dans Supabase pour
--    changer le rôle de cet utilisateur en 'AGENT'
--
-- 3. Déconnectez-vous de l'application (dans Profil > Se déconnecter)
--
-- 4. Reconnectez-vous avec le même numéro
--
-- 5. Vous serez automatiquement redirigé vers le dashboard Agent !
--
-- =============================================

