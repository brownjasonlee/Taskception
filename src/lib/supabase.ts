import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseKey);

// Simple connection test
export const isSupabaseConfigured = () => {
  return !!(supabaseUrl && supabaseKey);
};

// Basic database interface - derive your specific types from your current Todo interface
export interface DatabaseTodo {
  id: string;
  title: string;
  completed: boolean;
  expanded: boolean;
  parent_id: string | null;
  created_at: string;
  updated_at: string;
  order_index: number;
  [key: string]: any; // Allow for additional fields as needed
}