# 🏗️ Database Framework Documentation

## Overview

The Database Framework is an auto-scaling overlay that bridges your nested Todo structure with Supabase's relational database. It automatically handles tree ↔ flat conversion, schema evolution, and provides seamless integration without disrupting your existing code.

## 🚀 Quick Start

### 1. Current Usage (Existing Code)
```typescript
// Your existing hook continues to work as-is
const { todos, addTodo, toggleTodo, ... } = useTodos();
```

### 2. Enhanced Usage (With Database Sync)
```typescript
// Drop-in replacement with automatic database sync
const { 
  todos, 
  addTodo, 
  toggleTodo, 
  loadFromDatabase,
  saveToDatabase,
  autoSync,
  setAutoSync,
  isSynced,
  lastSyncTime 
} = useTodosWithDB();
```

## 🔧 How It Works

### Data Flow Architecture
```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Your Todos    │◄──►│ Database Framework│◄──►│   Supabase DB   │
│ (Tree Structure)│    │   (Converter)     │    │ (Flat Structure)│
└─────────────────┘    └──────────────────┘    └─────────────────┘
      Nested               Auto Conversion           Relational
```

### Tree ↔ Flat Conversion
**Your Data (Tree):**
```typescript
{
  id: "1",
  title: "Project",
  children: [
    { id: "2", title: "Task 1", children: [] },
    { id: "3", title: "Task 2", children: [] }
  ]
}
```

**Database Storage (Flat):**
```sql
┌────┬───────────┬───────────┬─────────────┬─────────────┐
│ id │   title   │ parent_id │ order_index │ created_at  │
├────┼───────────┼───────────┼─────────────┼─────────────┤
│ 1  │ Project   │   NULL    │      0      │ 2024-01-01  │
│ 2  │ Task 1    │     1     │      0      │ 2024-01-01  │
│ 3  │ Task 2    │     1     │      1      │ 2024-01-01  │
└────┴───────────┴───────────┴─────────────┴─────────────┘
```

## 🗄️ Database Schema

### Required Table Structure
```sql
CREATE TABLE todos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  completed BOOLEAN DEFAULT false,
  expanded BOOLEAN DEFAULT false,
  parent_id UUID REFERENCES todos(id) ON DELETE CASCADE,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Indexes for performance
  INDEX idx_todos_parent_id (parent_id),
  INDEX idx_todos_order (parent_id, order_index)
);

-- Auto-update timestamp trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_todos_updated_at
  BEFORE UPDATE ON todos
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();
```

## 🔌 Supabase Connection

### Environment Setup
```bash
# .env.local
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
```

### Connection Flow
1. **Framework** checks `isSupabaseConfigured()`
2. **If connected**: Auto-sync every 30 seconds
3. **If offline**: Graceful fallback to local state
4. **Schema evolution**: Automatically handled in dev mode

## 🎛️ Configuration Options

### Auto-Sync Settings
```typescript
const { setAutoSync, setSyncInterval } = useTodosWithDB();

// Enable/disable auto-sync
setAutoSync(true); // Default: true if Supabase configured

// Change sync frequency
setSyncInterval(60000); // 60 seconds (default: 30 seconds)
```

### Manual Control
```typescript
// Manual operations
await loadFromDatabase();     // Load from Supabase
await saveToDatabase();       // Save to Supabase
await syncWithDatabase();     // Bi-directional sync

// Status checking
console.log('Synced:', isSynced);
console.log('Last sync:', lastSyncTime);
```

## 🧪 Development Tools

### Debug Console Commands
```javascript
// Open browser console and try:
dbDevUtils.testConnection();     // Test DB connection
dbDevUtils.compareSchemas();     // Check local vs DB schema
dbDevUtils.exportData();         // Export current data
dbDevUtils.clearCache();         // Clear local cache
```

### Development Mode Features
- ✅ **Schema validation** on every operation
- ✅ **Automatic migration suggestions**
- ✅ **Performance monitoring**
- ✅ **Data consistency checks**

## 🔄 Integration Steps

### Phase 1: Current State (No Changes Needed)
- ✅ Keep using `useTodos()` as normal
- ✅ Framework is ready but not active
- ✅ All existing functionality preserved

### Phase 2: Gradual Integration
```typescript
// Replace one component at a time
import { useTodosWithDB } from './hooks/useTodosWithDB';

function TodoApp() {
  // Simple swap - everything else stays the same
  const todos = useTodosWithDB();
  
  // All your existing code works unchanged
  return <TodoList {...todos} />;
}
```

### Phase 3: Full Database Sync
- ✅ Auto-sync enabled by default
- ✅ Real-time updates
- ✅ Offline support
- ✅ Conflict resolution

## 🚀 Scaling Features

### Automatic Adaptations
1. **Schema Evolution**: Adds new fields automatically in dev mode
2. **Performance Optimization**: Batches operations, caches queries
3. **Error Recovery**: Handles network issues, database conflicts
4. **Data Migration**: Seamlessly migrates data structure changes

### Future Enhancements Ready
- 🔄 **Real-time sync** (Supabase subscriptions)
- 👥 **Multi-user support** (Row Level Security)
- 📱 **Offline-first** (local-first architecture)
- 🔍 **Search indexing** (full-text search)

## 🎯 Benefits

### For Development
- ✅ **Zero disruption** to existing code
- ✅ **Gradual adoption** at your own pace
- ✅ **Auto-scaling** as features grow
- ✅ **Type-safe** throughout

### For Production
- ✅ **Offline support** with graceful fallback
- ✅ **Performance optimized** with caching
- ✅ **Conflict resolution** for concurrent edits
- ✅ **Data consistency** guarantees

---

## 🤔 Next Steps

The framework is ready to use! Simply replace `useTodos()` with `useTodosWithDB()` when you're ready to enable database sync. 