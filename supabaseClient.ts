import { createClient, SupabaseClient } from '@supabase/supabase-js';

// This variable will be exported and then initialized by the App component.
// It's a mutable export, which is acceptable for this singleton initialization pattern.
export let supabase: SupabaseClient;

/**
 * Initializes the Supabase client instance. This function must be called once
 * at application startup before any other Supabase functions are used.
 * @param {string} url - The Supabase project URL.
 * @param {string} key - The Supabase anon key.
 * @returns {boolean} - True if initialization was successful, false otherwise.
 */
export function initializeSupabase(url: string, key: string): boolean {
  try {
    // Throws an error if the URL or key is invalid.
    supabase = createClient(url, key);
    // Store credentials in local storage for subsequent sessions.
    localStorage.setItem('VITE_SUPABASE_URL', url);
    localStorage.setItem('VITE_SUPABASE_ANON_KEY', key);
    return true;
  } catch (error) {
    console.error("Failed to initialize Supabase client:", error);
    // Clear potentially invalid credentials
    localStorage.removeItem('VITE_SUPABASE_URL');
    localStorage.removeItem('VITE_SUPABASE_ANON_KEY');
    return false;
  }
}
