-- Create the todos table with optimal structure for hierarchical data
CREATE TABLE IF NOT EXISTS todos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL CHECK (length(trim(title)) > 0),
  completed BOOLEAN NOT NULL DEFAULT false,
  expanded BOOLEAN NOT NULL DEFAULT false,
  parent_id UUID REFERENCES todos(id) ON DELETE CASCADE,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create indexes for optimal performance
CREATE INDEX IF NOT EXISTS idx_todos_parent_id ON todos(parent_id);
CREATE INDEX IF NOT EXISTS idx_todos_order ON todos(parent_id, order_index);
CREATE INDEX IF NOT EXISTS idx_todos_created_at ON todos(created_at);
CREATE INDEX IF NOT EXISTS idx_todos_title_search ON todos USING gin(to_tsvector('english', title));

-- Create function to automatically update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-update updated_at
DROP TRIGGER IF EXISTS trigger_update_todos_updated_at ON todos;
CREATE TRIGGER trigger_update_todos_updated_at
  BEFORE UPDATE ON todos
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Create function to maintain order_index consistency
CREATE OR REPLACE FUNCTION maintain_todo_order()
RETURNS TRIGGER AS $$
BEGIN
  -- When inserting, set order_index to max + 1 for siblings
  IF TG_OP = 'INSERT' THEN
    IF NEW.order_index = 0 THEN
      SELECT COALESCE(MAX(order_index), -1) + 1 
      INTO NEW.order_index 
      FROM todos 
      WHERE parent_id IS NOT DISTINCT FROM NEW.parent_id;
    END IF;
    RETURN NEW;
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for order maintenance
DROP TRIGGER IF EXISTS trigger_maintain_todo_order ON todos;
CREATE TRIGGER trigger_maintain_todo_order
  BEFORE INSERT ON todos
  FOR EACH ROW
  EXECUTE FUNCTION maintain_todo_order();

-- Create view for easier tree queries (optional, for future use)
CREATE OR REPLACE VIEW todos_with_path AS
WITH RECURSIVE todo_tree AS (
  -- Base case: root todos
  SELECT 
    id, 
    title, 
    completed, 
    expanded,
    parent_id, 
    order_index,
    created_at, 
    updated_at,
    ARRAY[id] as path,
    0 as depth,
    title as full_path
  FROM todos 
  WHERE parent_id IS NULL
  
  UNION ALL
  
  -- Recursive case: child todos
  SELECT 
    t.id, 
    t.title, 
    t.completed, 
    t.expanded,
    t.parent_id, 
    t.order_index,
    t.created_at, 
    t.updated_at,
    tt.path || t.id,
    tt.depth + 1,
    tt.full_path || ' > ' || t.title
  FROM todos t
  JOIN todo_tree tt ON t.parent_id = tt.id
)
SELECT * FROM todo_tree;

-- Add comments for documentation
COMMENT ON TABLE todos IS 'Hierarchical todo items with parent-child relationships';
COMMENT ON COLUMN todos.id IS 'Unique identifier for the todo item';
COMMENT ON COLUMN todos.title IS 'Display text of the todo item (required, non-empty)';
COMMENT ON COLUMN todos.completed IS 'Whether the todo item is marked as done';
COMMENT ON COLUMN todos.expanded IS 'Whether the todo item children are visible in UI';
COMMENT ON COLUMN todos.parent_id IS 'Reference to parent todo (NULL for root items)';
COMMENT ON COLUMN todos.order_index IS 'Sort order among siblings';
COMMENT ON COLUMN todos.created_at IS 'When the todo was created';
COMMENT ON COLUMN todos.updated_at IS 'When the todo was last modified (auto-updated)';

-- Enable Row Level Security (RLS) for future multi-user support
ALTER TABLE todos ENABLE ROW LEVEL SECURITY;

-- Create default policy (allow all for now, customize later)
CREATE POLICY "Enable all operations for all users" ON todos
  FOR ALL USING (true); 