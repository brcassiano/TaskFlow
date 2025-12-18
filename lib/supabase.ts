import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Client para uso no servidor (API Routes)
export function createServerClient() {
  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false, // Server-side não precisa persistir
    },
  });
}

// Client para uso no cliente (Components, Pages)
export function createBrowserClient() {
  return createClient(supabaseUrl, supabaseAnonKey);
}