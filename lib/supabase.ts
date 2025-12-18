import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

// Client para uso no servidor (API Routes)
export const supabaseServer = createClient(supabaseUrl, supabaseServiceKey!, {
  auth: {
    persistSession: false,
  },
});

// Client para uso no cliente (Components, Pages)
export const supabaseClient = createClient(supabaseUrl, supabaseAnonKey);

// Exportação padrão
export const supabase = supabaseClient;

// Funções auxiliares - agora com as variáveis garantidas como string
export function createServerClient() {
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing server environment variables');
  }
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      persistSession: false,
    },
  });
}

export function createBrowserClient() {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing client environment variables');
  }
  return createClient(supabaseUrl, supabaseAnonKey);
}