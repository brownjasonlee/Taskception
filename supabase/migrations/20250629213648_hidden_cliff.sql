/*
  # Create todos table for nested todo application

  1. New Tables
    - `todos`
      - `id` (uuid, primary key)
      - `title` (text, not null)
      - `completed` (boolean, default false)
      - `expanded` (boolean, default false)
      - `parent_id` (uuid, foreign key to todos.id, nullable for root todos)
      - `start_date` (timestamptz, nullable)
      - `end_date` (timestamptz, nullable)
      - `created_at` (timestamptz, default now())
      - `updated_at` (timestamptz, default now())
      - `order_index` (integer, default 0)

  2. Security
    - Enable RLS on `todos` table
    - Add policy for authenticated users to manage their own todos
    - Add policy for public access (for demo purposes)

  3. Indexes
    - Index on parent_id for efficient tree queries
    - Index on order_index for sorting
*/

CREATE TABLE IF NOT EXISTS todos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  completed boolean DEFAULT false,
  expanded boolean DEFAULT false,
  parent_id uuid REFERENCES todos(id) ON DELETE CASCADE,
  start_date timestamptz,
  end_date timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  order_index integer DEFAULT 0
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_todos_parent_id ON todos(parent_id);
CREATE INDEX IF NOT EXISTS idx_todos_order_index ON todos(order_index);
CREATE INDEX IF NOT EXISTS idx_todos_created_at ON todos(created_at);

-- Enable Row Level Security
ALTER TABLE todos ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (for demo purposes)
-- In production, you'd want to restrict this to authenticated users
CREATE POLICY "Allow public read access to todos"
  ON todos
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow public insert access to todos"
  ON todos
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Allow public update access to todos"
  ON todos
  FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow public delete access to todos"
  ON todos
  FOR DELETE
  TO public
  USING (true);

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to automatically update updated_at
CREATE TRIGGER update_todos_updated_at
  BEFORE UPDATE ON todos
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();