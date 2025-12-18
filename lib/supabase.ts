import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Client para uso no servidor (API Routes)
export const supabaseServer = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    persistSession: false,
  },
});

// Client para uso no cliente (Components, Pages)
export const supabaseClient = createClient(supabaseUrl, supabaseAnonKey);

// Funções auxiliares para compatibilidade
export function createServerClient() {
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      persistSession: false,
    },
  });
}

export function createBrowserClient() {
  return createClient(supabaseUrl, supabaseAnonKey);
}