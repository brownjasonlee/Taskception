import { TodoDB } from './database-framework';
import { isSupabaseConfigured } from './supabase';

/**
 * Development utilities for database framework testing
 * Only available in development mode
 */
export const dbDevUtils = {
  /**
   * Test database connection and basic operations
   */
  async testConnection(): Promise<void> {
    if (!import.meta.env.DEV) {
      console.warn('🚫 DB dev utils only available in development mode');
      return;
    }

    console.group('🧪 Database Framework Test');
    
    try {
      console.log('📡 Testing connection...');
      console.log('- Configured:', isSupabaseConfigured());
      
      await TodoDB.debugSchema();
      
      const todos = await TodoDB.fetchAll();
      console.log('📊 Fetched todos:', todos.length);
      
      console.log('✅ Connection test completed');
    } catch (error) {
      console.error('❌ Connection test failed:', error);
    } finally {
      console.groupEnd();
    }
  },

  /**
   * Clear all data (development only)
   */
  async clearAllData(): Promise<boolean> {
    if (!import.meta.env.DEV) {
      console.warn('🚫 Data clearing only available in development mode');
      return false;
    }

    if (!confirm('⚠️ This will delete ALL todos from the database. Continue?')) {
      return false;
    }

    try {
      const success = await TodoDB.saveAll([]);
      if (success) {
        console.log('🗑️ All data cleared from database');
      }
      return success;
    } catch (error) {
      console.error('❌ Failed to clear data:', error);
      return false;
    }
  },

  /**
   * Export current data structure for debugging
   */
  async exportData(): Promise<void> {
    if (!import.meta.env.DEV) return;

    try {
      const todos = await TodoDB.fetchAll();
      const exportData = {
        timestamp: new Date().toISOString(),
        count: todos.length,
        data: todos,
      };
      
      console.log('📤 Exported data:', exportData);
      
      // Copy to clipboard if available
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(JSON.stringify(exportData, null, 2));
        console.log('📋 Data copied to clipboard');
      }
    } catch (error) {
      console.error('❌ Export failed:', error);
    }
  },

  /**
   * Add development window helpers
   */
  addToWindow(): void {
    if (!import.meta.env.DEV) return;

    // Add utilities to window for console access
    (window as any).dbUtils = {
      test: this.testConnection,
      clear: this.clearAllData,
      export: this.exportData,
      db: TodoDB,
    };

    console.log('🛠️ DB utilities added to window.dbUtils');
    console.log('Available commands:');
    console.log('- window.dbUtils.test() - Test connection');
    console.log('- window.dbUtils.clear() - Clear all data');
    console.log('- window.dbUtils.export() - Export data');
    console.log('- window.dbUtils.db - Direct database access');
  }
};

// Auto-add to window in development
if (import.meta.env.DEV) {
  dbDevUtils.addToWindow();
} 