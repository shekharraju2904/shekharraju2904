import { createClient } from '@supabase/supabase-js';

// These variables are placeholders and should be replaced with your actual Supabase credentials.
// For local development, you can create a .env file and use a library like `dotenv` to load them.
// In a production environment, these should be set as environment variables.
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

export const isSupabaseConfigured = supabaseUrl && supabaseAnonKey;

// We only initialize the client if the credentials are provided.
// The app will show setup instructions if they are missing.
export const supabase = isSupabaseConfigured 
  ? createClient(supabaseUrl, supabaseAnonKey)
  // Provide a dummy client to avoid crashing the app if not configured.
  : {} as any; 
