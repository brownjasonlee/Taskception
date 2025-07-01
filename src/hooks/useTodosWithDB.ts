import { useState, useEffect, useCallback } from 'react';
import { useTodos } from './useTodos';
import { TodoDB } from '../lib/database-framework';
import { isSupabaseConfigured } from '../lib/supabase';

/**
 * Enhanced useTodos hook with automatic database sync
 * Falls back gracefully to local state if database is unavailable
 */
export const useTodosWithDB = () => {
  const localTodos = useTodos();
  const [isLoading, setIsLoading] = useState(false);
  const [isSynced, setIsSynced] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);

  // Auto-sync settings
  const [autoSync, setAutoSync] = useState(isSupabaseConfigured());
  const [syncInterval, setSyncInterval] = useState(30000); // 30 seconds

  /**
   * Load data from database on mount
   */
  useEffect(() => {
    if (!autoSync) return;

    const loadFromDB = async () => {
      setIsLoading(true);
      try {
        const dbTodos = await TodoDB.fetchAll();
        if (dbTodos.length > 0) {
          // If we have data from DB, replace local state
          // This would need integration with your useTodos state setter
          console.log('📊 Loaded from database:', dbTodos.length, 'todos');
          setIsSynced(true);
          setLastSyncTime(new Date());
        }
      } catch (error) {
        console.warn('Failed to load from database:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadFromDB();
  }, [autoSync]);

  /**
   * Auto-sync to database periodically
   */
  useEffect(() => {
    if (!autoSync || !syncInterval) return;

    const interval = setInterval(async () => {
      try {
        const success = await TodoDB.saveAll(localTodos.todos);
        if (success) {
          setIsSynced(true);
          setLastSyncTime(new Date());
        }
      } catch (error) {
        console.warn('Auto-sync failed:', error);
        setIsSynced(false);
      }
    }, syncInterval);

    return () => clearInterval(interval);
  }, [autoSync, syncInterval, localTodos.todos]);

  /**
   * Manual sync functions
   */
  const syncToDatabase = useCallback(async (): Promise<boolean> => {
    if (!autoSync) return false;
    
    setIsLoading(true);
    try {
      const success = await TodoDB.saveAll(localTodos.todos);
      setIsSynced(success);
      if (success) {
        setLastSyncTime(new Date());
      }
      return success;
    } catch (error) {
      console.error('Sync to database failed:', error);
      setIsSynced(false);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [autoSync, localTodos.todos]);

  const loadFromDatabase = useCallback(async (): Promise<boolean> => {
    if (!autoSync) return false;
    
    setIsLoading(true);
    try {
      const dbTodos = await TodoDB.fetchAll();
      // Here you would integrate with your useTodos state management
      console.log('Would load:', dbTodos.length, 'todos from database');
      setIsSynced(true);
      setLastSyncTime(new Date());
      return true;
    } catch (error) {
      console.error('Load from database failed:', error);
      setIsSynced(false);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [autoSync]);

  /**
   * Configuration functions
   */
  const enableAutoSync = useCallback(() => {
    if (isSupabaseConfigured()) {
      setAutoSync(true);
    }
  }, []);

  const disableAutoSync = useCallback(() => {
    setAutoSync(false);
    setIsSynced(false);
  }, []);

  /**
   * Debug functions
   */
  const debugDatabase = useCallback(async () => {
    await TodoDB.debugSchema();
    console.log('🔄 Sync status:', {
      autoSync,
      isSynced,
      lastSyncTime,
      isConfigured: isSupabaseConfigured(),
    });
  }, [autoSync, isSynced, lastSyncTime]);

  return {
    // All existing useTodos functionality
    ...localTodos,
    
    // Database sync status
    isLoading,
    isSynced,
    lastSyncTime,
    autoSync,
    
    // Manual sync controls
    syncToDatabase,
    loadFromDatabase,
    
    // Configuration
    enableAutoSync,
    disableAutoSync,
    setSyncInterval,
    
    // Debug
    debugDatabase,
  };
}; 