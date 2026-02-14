/**
 * Supabase Error Handling Utility
 * Consistent French error messages for user-facing errors
 */

export interface SupabaseError {
  message: string;
  code?: string;
  details?: string;
  hint?: string;
}

export const ERROR_MESSAGES: Record<string, string> = {
  // Auth errors
  'Invalid login credentials': 'Identifiants incorrects. Vérifiez votre numéro.',
  'User already registered': 'Ce numéro est déjà enregistré.',
  'Phone not confirmed': 'Numéro non vérifié. Veuillez vérifier votre code.',
  'Token has expired or is invalid': 'Code expiré ou invalide. Demandez un nouveau code.',
  'OTP expired': 'Le code a expiré. Demandez un nouveau code.',
  'Invalid OTP': 'Code invalide. Vérifiez et réessayez.',

  // Database errors
  'duplicate key value': 'Cette entrée existe déjà.',
  'violates foreign key constraint': 'Données liées introuvables.',
  'null value in column': 'Informations manquantes requises.',

  // Network errors
  'Failed to fetch': 'Erreur de connexion. Vérifiez votre réseau.',
  'Network request failed': 'Impossible de se connecter. Vérifiez votre connexion.',
  'TypeError: Network request failed': 'Erreur réseau. Réessayez.',

  // Generic
  'default': 'Une erreur est survenue. Réessayez.',
};

/**
 * Convert Supabase error to user-friendly French message
 */
export const getErrorMessage = (error: SupabaseError | Error | unknown): string => {
  if (!error) return ERROR_MESSAGES.default;

  const errorMessage = error instanceof Error
    ? error.message
    : (error as SupabaseError)?.message || String(error);

  // Check for exact matches
  if (ERROR_MESSAGES[errorMessage]) {
    return ERROR_MESSAGES[errorMessage];
  }

  // Check for partial matches
  for (const [key, value] of Object.entries(ERROR_MESSAGES)) {
    if (errorMessage.toLowerCase().includes(key.toLowerCase())) {
      return value;
    }
  }

  // Return original message if it's in French (likely already user-friendly)
  if (/[àâäéèêëïîôùûüç]/i.test(errorMessage)) {
    return errorMessage;
  }

  return ERROR_MESSAGES.default;
};

/**
 * Handle Supabase error and return structured result
 */
export const handleSupabaseError = (error: unknown): {
  message: string;
  isNetworkError: boolean;
  isAuthError: boolean;
} => {
  const message = getErrorMessage(error);
  const errorStr = String(error).toLowerCase();

  return {
    message,
    isNetworkError: errorStr.includes('network') || errorStr.includes('fetch'),
    isAuthError: errorStr.includes('auth') || errorStr.includes('login') || errorStr.includes('otp'),
  };
};

export default {
  getErrorMessage,
  handleSupabaseError,
  ERROR_MESSAGES,
};

