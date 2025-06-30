import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseKey);

export interface TodoRecord {
  id: string;
  title: string;
  completed: boolean;
  expanded: boolean;
  parent_id: string | null;
  start_date: string | null;
  end_date: string | null;
  created_at: string;
  updated_at: string;
  order_index: number;
}

export const todoApi = {
  async getAllTodos(): Promise<TodoRecord[]> {
    if (!supabaseUrl || !supabaseKey) {
      // Return mock data if Supabase is not configured
      return [];
    }
    
    const { data, error } = await supabase
      .from('todos')
      .select('*')
      .order('order_index');
    
    if (error) {
      console.error('Error fetching todos:', error);
      return [];
    }
    
    return data || [];
  },

  async createTodo(todo: Omit<TodoRecord, 'created_at' | 'updated_at'>): Promise<TodoRecord | null> {
    if (!supabaseUrl || !supabaseKey) {
      return null;
    }
    
    const { data, error } = await supabase
      .from('todos')
      .insert([{
        ...todo,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }])
      .select()
      .single();
    
    if (error) {
      console.error('Error creating todo:', error);
      return null;
    }
    
    return data;
  },

  async updateTodo(id: string, updates: Partial<TodoRecord>): Promise<TodoRecord | null> {
    if (!supabaseUrl || !supabaseKey) {
      return null;
    }
    
    const { data, error } = await supabase
      .from('todos')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating todo:', error);
      return null;
    }
    
    return data;
  },

  async deleteTodo(id: string): Promise<boolean> {
    if (!supabaseUrl || !supabaseKey) {
      return true;
    }
    
    const { error } = await supabase
      .from('todos')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('Error deleting todo:', error);
      return false;
    }
    
    return true;
  }
};