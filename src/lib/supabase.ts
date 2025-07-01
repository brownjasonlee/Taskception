import { createClient } from '@supabase/supabase-js';

// Read environment variables injected at build time. They will be undefined/empty when
// the user hasn't configured Supabase credentials (e.g. when running from a fork or
// a public GitHub Pages deployment).
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

/**
 * Lazily create the Supabase client only when the user has actually provided
 * BOTH the URL and the anon key. When those values are missing we export a
 * `null` placeholder so that the rest of the codebase can gracefully fall
 * back to local-only storage without crashing at runtime.
 */
// We deliberately type as `any` to keep downstream code simple. When the
// credentials are missing we return `null`, but TypeScript consumers can still
// call supabase.* safely after checking `isSupabaseConfigured()`.
export const supabase: any =
  supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

// Helper to let the rest of the codebase know whether the Supabase integration
// is available for the current build/runtime.
export const isSupabaseConfigured = (): boolean => !!supabase;

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