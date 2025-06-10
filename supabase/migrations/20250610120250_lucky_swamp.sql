/*
  # Create Lighthouse Results Storage

  1. New Tables
    - `lighthouse_results`
      - `id` (uuid, primary key)
      - `domain` (text, extracted from URL)
      - `url` (text, full base URL)
      - `timestamp` (timestamptz)
      - `routes` (jsonb, array of route configurations)
      - `results` (jsonb, performance metrics for each route)
      - `avg_scores` (jsonb, calculated average scores)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `lighthouse_results` table
    - Add policy for public read access (since this is a public tool)
    - Add policy for public insert access

  3. Indexes
    - Index on domain for efficient domain-based queries
    - Index on timestamp for chronological sorting
*/

CREATE TABLE IF NOT EXISTS lighthouse_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  domain text NOT NULL,
  url text NOT NULL,
  timestamp timestamptz NOT NULL,
  routes jsonb NOT NULL DEFAULT '[]'::jsonb,
  results jsonb NOT NULL DEFAULT '{}'::jsonb,
  avg_scores jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE lighthouse_results ENABLE ROW LEVEL SECURITY;

-- Allow public read access
CREATE POLICY "Allow public read access"
  ON lighthouse_results
  FOR SELECT
  TO anon
  USING (true);

-- Allow public insert access
CREATE POLICY "Allow public insert access"
  ON lighthouse_results
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_lighthouse_results_domain 
  ON lighthouse_results(domain);

CREATE INDEX IF NOT EXISTS idx_lighthouse_results_timestamp 
  ON lighthouse_results(timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_lighthouse_results_created_at 
  ON lighthouse_results(created_at DESC);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to automatically update updated_at
CREATE TRIGGER update_lighthouse_results_updated_at
  BEFORE UPDATE ON lighthouse_results
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();