import { Redirect } from 'expo-router';

export default function Index() {
  // Rediriger vers l'authentification par défaut
  // Le useProtectedRoute dans _layout.tsx gérera la redirection appropriée
  return <Redirect href="/(auth)/login" />;
}

