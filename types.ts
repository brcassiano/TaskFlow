// types.ts

// Shape que vem direto do Supabase (tabela `tasks`)
export interface Task {
  id: string;
  user_id: string;
  title: string;
  description?: string | null;
  is_completed: boolean;
  created_at: string;
  updated_at: string;
}

// Shape usado na UI quando você já tem o userId
export interface TaskForClient extends Task {
  userId: string; // alias opcional se quiser propagar para components
}

// Resposta padrão da API
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}