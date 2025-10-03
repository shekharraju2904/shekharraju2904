import { createClient } from '@supabase/supabase-js';

// Access environment variables from process.env, which is populated by the execution environment.
// These variables (VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY) must be configured in the project's secrets.
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = supabaseUrl && supabaseAnonKey;

// We only initialize the client if the credentials are provided.
// The app will show setup instructions if they are missing.
export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  // Provide a dummy client to avoid crashing the app if not configured.
  : {} as any;