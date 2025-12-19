// lib/supabase.ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

// Client genérico (pode ser usado tanto no server quanto no client)
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Helper para criar client no browser, se precisar em components client-side
export function createBrowserClient() {
  return createClient(supabaseUrl, supabaseAnonKey);
}