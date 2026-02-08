# PuzzlePharm - Application Mobile

Application mobile de recherche de médicaments avec Call Center intégré, développée avec Expo (React Native), Tamagui et Supabase.

## 🚀 Fonctionnalités

- **Authentification OTP par SMS** : Connexion sécurisée par numéro de téléphone
- **Deux rôles distincts** : CLIENT et AGENT
- **Pharmacies de garde** : Liste des pharmacies de garde du jour
- **Recherche de médicaments** : Les clients peuvent demander un médicament
- **Call Center temps réel** : Les agents reçoivent les demandes en temps réel via Supabase Realtime
- **Propositions de prix** : Les agents répondent avec plusieurs options (pharmacie, prix, quartier)

## 📋 Prérequis

- Node.js 18+
- Expo CLI (`npm install -g expo-cli`)
- Un projet Supabase configuré
- Un émulateur Android/iOS ou Expo Go sur votre téléphone

## 🛠️ Installation

### 1. Cloner et installer les dépendances

```bash
npm install
```

### 2. Configurer Supabase

1. Créez un projet sur [Supabase](https://supabase.com)
2. Allez dans **Settings > API** et copiez :
   - `Project URL`
   - `anon public key`
3. Mettez à jour le fichier `.env` :

```env
EXPO_PUBLIC_SUPABASE_URL=https://votre-projet.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=votre-clé-anon
```

### 3. Configurer la base de données

1. Dans Supabase, allez dans **SQL Editor**
2. Copiez et exécutez le contenu du fichier `supabase/schema.sql`

### 4. Activer l'authentification par téléphone

1. Dans Supabase, allez dans **Authentication > Providers**
2. Activez **Phone**
3. Configurez un fournisseur SMS (Twilio, etc.) ou utilisez le mode développement

### 5. Lancer l'application

```bash
npm start
```

Puis scannez le QR code avec Expo Go ou lancez sur un émulateur.

## 📁 Structure du projet

```
app/
├── (auth)/           # Écrans d'authentification
│   ├── login.tsx     # Connexion par téléphone
│   └── verify.tsx    # Vérification OTP
├── (client)/         # Écrans pour les clients
│   ├── home.tsx      # Accueil + Pharmacies de garde
│   ├── search.tsx    # Recherche de médicament
│   ├── history.tsx   # Historique des demandes
│   └── profile.tsx   # Profil client
├── (agent)/          # Écrans pour les agents
│   ├── dashboard.tsx # Tableau de bord
│   ├── demandes.tsx  # Liste des demandes + Réponses
│   └── profile.tsx   # Profil agent
├── _layout.tsx       # Layout principal + Auth Context
└── index.tsx         # Redirection initiale

lib/
├── supabase.ts       # Client Supabase + Types
└── database.types.ts # Types TypeScript pour la BDD

supabase/
└── schema.sql        # Script SQL complet
```

## 🔐 Rôles utilisateurs

### CLIENT
- Voir les pharmacies de garde
- Envoyer des demandes de médicaments
- Consulter l'historique et les propositions reçues

### AGENT
- Dashboard avec statistiques
- Réception des demandes en temps réel
- Répondre avec plusieurs propositions (pharmacie, prix, quartier)

## 🎨 Technologies utilisées

- **Expo** (SDK 54) - Framework React Native
- **Expo Router** - Navigation file-based
- **Tamagui** - UI Kit et système de design
- **Supabase** - Backend (PostgreSQL, Auth, Realtime)
- **Lucide React Native** - Icônes

## 📱 Captures d'écran

_À venir_

## 🤝 Contribution

Les contributions sont les bienvenues ! N'hésitez pas à ouvrir une issue ou une pull request.

## 📄 Licence

MIT

