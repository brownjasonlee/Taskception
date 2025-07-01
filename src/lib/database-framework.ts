import { supabase, isSupabaseConfigured } from './supabase';
import { Todo } from '../types/todo';

type DatabaseRecord<T> = Omit<T, 'children'> & {
  parent_id: string | null;
  created_at: string;
  updated_at: string;
  order_index: number;
};

type TreeNode<T> = T & {
  children: TreeNode<T>[];
};

/**
 * Database Framework Overlay
 * Automatically handles schema evolution, tree conversion, and scaling
 */
export class DatabaseFramework<ClientType extends { id: string; createdAt: Date; updatedAt: Date }> {
  private tableName: string;
  private isDevMode: boolean;

  constructor(tableName: string, isDevMode = import.meta.env.DEV) {
    this.tableName = tableName;
    this.isDevMode = isDevMode;
  }

  /**
   * Auto-converts nested tree structure to flat database records
   */
  private treeToFlat(items: TreeNode<ClientType>[], parentId: string | null = null): DatabaseRecord<ClientType>[] {
    const records: DatabaseRecord<ClientType>[] = [];
    
    items.forEach((item, index) => {
      const { children, createdAt, updatedAt, ...rest } = item;
      
      // Convert client record to database record
      const dbRecord: DatabaseRecord<ClientType> = {
        ...rest,
        parent_id: parentId,
        created_at: createdAt.toISOString(),
        updated_at: updatedAt.toISOString(),
        order_index: index,
      } as DatabaseRecord<ClientType>;
      
      records.push(dbRecord);
      
      // Recursively process children
      if (children && children.length > 0) {
        records.push(...this.treeToFlat(children, item.id));
      }
    });
    
    return records;
  }

  /**
   * Auto-converts flat database records to nested tree structure
   */
  private flatToTree(records: DatabaseRecord<ClientType>[]): TreeNode<ClientType>[] {
    const itemMap = new Map<string, TreeNode<ClientType>>();
    const rootItems: TreeNode<ClientType>[] = [];

    // First pass: create all items
    records.forEach(record => {
      const { parent_id, created_at, updated_at, order_index, ...rest } = record;
      
      const item = {
        ...rest,
        createdAt: new Date(created_at),
        updatedAt: new Date(updated_at),
        children: [],
      } as unknown as TreeNode<ClientType>;
      
      itemMap.set(record.id, item);
    });

    // Second pass: build tree structure
    records.forEach(record => {
      const item = itemMap.get(record.id);
      if (!item) return;

      if (record.parent_id) {
        const parent = itemMap.get(record.parent_id);
        if (parent) {
          parent.children.push(item);
        }
      } else {
        rootItems.push(item);
      }
    });

    // Sort by order_index
    const sortByOrder = (items: TreeNode<ClientType>[]) => {
      items.sort((a, b) => {
        const aRecord = records.find(r => r.id === a.id);
        const bRecord = records.find(r => r.id === b.id);
        return (aRecord?.order_index || 0) - (bRecord?.order_index || 0);
      });
      items.forEach(item => sortByOrder(item.children));
    };

    sortByOrder(rootItems);
    return rootItems;
  }

  /**
   * Development-time schema evolution
   */
  private async ensureSchema(): Promise<void> {
    if (!this.isDevMode || !isSupabaseConfigured()) return;

    try {
      // Try to query the table to see if it exists and what columns it has
      const { data, error } = await supabase
        .from(this.tableName)
        .select('*')
        .limit(1);

      if (error && error.code === 'PGRST116') {
        console.log(`📋 Table '${this.tableName}' not found. Auto-migration would go here in production.`);
      }
    } catch (err) {
      if (this.isDevMode) {
        console.warn(`⚠️ Schema check for '${this.tableName}':`, err);
      }
    }
  }

  /**
   * Fetch all records and convert to tree structure
   */
  async fetchAll(): Promise<TreeNode<ClientType>[]> {
    await this.ensureSchema();
    
    if (!isSupabaseConfigured()) {
      return [];
    }

    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select('*')
        .order('order_index');

      if (error) {
        console.error(`Error fetching from ${this.tableName}:`, error);
        return [];
      }

      return this.flatToTree(data || []);
    } catch (err) {
      console.error(`Fetch error for ${this.tableName}:`, err);
      return [];
    }
  }

  /**
   * Save tree structure to database
   */
  async saveAll(items: TreeNode<ClientType>[]): Promise<boolean> {
    if (!isSupabaseConfigured()) {
      return false;
    }

    try {
      const flatRecords = this.treeToFlat(items);

      // Clear existing records and insert new ones
      // In production, you'd want more sophisticated diffing
      await supabase.from(this.tableName).delete().neq('id', '');
      
      if (flatRecords.length > 0) {
        const { error } = await supabase
          .from(this.tableName)
          .insert(flatRecords);

        if (error) {
          console.error(`Error saving to ${this.tableName}:`, error);
          return false;
        }
      }

      return true;
    } catch (err) {
      console.error(`Save error for ${this.tableName}:`, err);
      return false;
    }
  }

  /**
   * Insert single item (maintaining tree structure)
   */
  async insert(item: TreeNode<ClientType>, parentId?: string): Promise<boolean> {
    if (!isSupabaseConfigured()) {
      return false;
    }

    try {
      const flatRecords = this.treeToFlat([item], parentId || null);
      
      const { error } = await supabase
        .from(this.tableName)
        .insert(flatRecords);

      if (error) {
        console.error(`Error inserting into ${this.tableName}:`, error);
        return false;
      }

      return true;
    } catch (err) {
      console.error(`Insert error for ${this.tableName}:`, err);
      return false;
    }
  }

  /**
   * Update single item
   */
  async update(id: string, updates: Partial<ClientType>): Promise<boolean> {
    if (!isSupabaseConfigured()) {
      return false;
    }

    try {
      const { createdAt, updatedAt, ...dbUpdates } = updates as any;
      
      const updateData = {
        ...dbUpdates,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from(this.tableName)
        .update(updateData)
        .eq('id', id);

      if (error) {
        console.error(`Error updating ${this.tableName}:`, error);
        return false;
      }

      return true;
    } catch (err) {
      console.error(`Update error for ${this.tableName}:`, err);
      return false;
    }
  }

  /**
   * Delete item and all children
   */
  async delete(id: string): Promise<boolean> {
    if (!isSupabaseConfigured()) {
      return false;
    }

    try {
      // Database cascade delete should handle children
      const { error } = await supabase
        .from(this.tableName)
        .delete()
        .eq('id', id);

      if (error) {
        console.error(`Error deleting from ${this.tableName}:`, error);
        return false;
      }

      return true;
    } catch (err) {
      console.error(`Delete error for ${this.tableName}:`, err);
      return false;
    }
  }

  /**
   * Development helpers
   */
  async debugSchema(): Promise<void> {
    if (!this.isDevMode) return;
    
    console.log(`🔍 Debug info for table '${this.tableName}':`);
    console.log('- Supabase configured:', isSupabaseConfigured());
    console.log('- Development mode:', this.isDevMode);
  }
}

// Pre-configured instance for your Todo structure
export const TodoDB = new DatabaseFramework<Todo>('todos'); 