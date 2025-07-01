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
  syncToDatabase,
  autoSync,
  enableAutoSync,
  disableAutoSync,
  isSynced,
  lastSyncTime,
  debugDatabase
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

### Database Schema
The complete migration file is available at `supabase/migrations/20250701_create_todos_table.sql`

**Core table structure:**
```sql
CREATE TABLE todos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL CHECK (length(trim(title)) > 0),
  completed BOOLEAN NOT NULL DEFAULT false,
  expanded BOOLEAN NOT NULL DEFAULT false,
  parent_id UUID REFERENCES todos(id) ON DELETE CASCADE,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);
```

**Features included:**
- ✅ **Performance indexes** for parent_id, order, and full-text search
- ✅ **Auto-updating timestamps** with triggers
- ✅ **Order maintenance** triggers for consistent ordering
- ✅ **Row Level Security** enabled for future multi-user support
- ✅ **Recursive view** for advanced tree queries
- ✅ **Data validation** constraints

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
const { enableAutoSync, disableAutoSync, setSyncInterval } = useTodosWithDB();

// Enable/disable auto-sync
enableAutoSync();   // Enable if Supabase configured
disableAutoSync();  // Disable auto-sync

// Change sync frequency
setSyncInterval(60000); // 60 seconds (default: 30 seconds)
```

### Manual Control
```typescript
// Manual operations
await loadFromDatabase();     // Load from Supabase
await syncToDatabase();       // Save to Supabase

// Status checking
console.log('Synced:', isSynced);
console.log('Last sync:', lastSyncTime);
console.log('Auto-sync enabled:', autoSync);
```

## 🧪 Development Tools

### Debug Console Commands
```javascript
// Open browser console and try:
window.dbUtils.test();           // Test DB connection
window.dbUtils.export();         // Export current data (copies to clipboard)
window.dbUtils.clear();          // Clear all data (with confirmation)
window.dbUtils.db;               // Direct database access

// Or use the direct methods:
dbDevUtils.testConnection();     // Test connection
dbDevUtils.exportData();         // Export data
dbDevUtils.clearAllData();       // Clear data
```

### Development Mode Features
- ✅ **Schema validation** on every operation
- ✅ **Automatic migration suggestions**
- ✅ **Performance monitoring**
- ✅ **Data consistency checks**

## 🔄 Integration Steps

### ✅ Phase 1: COMPLETE - Framework Integration
- ✅ App now uses `useTodosWithDB()` 
- ✅ Framework is active with graceful fallback
- ✅ All existing functionality preserved

### Phase 2: Database Connection (Optional)
```bash
# Add Supabase credentials to .env.local
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
```

### Phase 3: Future Enhancements (When Ready)
- 🔄 **Real-time sync** (Supabase subscriptions)
- 👥 **Multi-user support** (Row Level Security)
- 🔍 **Search functionality** (full-text search)
- 📱 **Offline-first** improvements

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

✅ **Framework is active!** Your app now uses `useTodosWithDB()` with graceful fallback.

**To enable database persistence:**
1. Add Supabase credentials to `.env.local`
2. Run the migration in your Supabase dashboard
3. Enjoy automatic data persistence and sync! 🎉 