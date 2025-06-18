# 🚀 Lighthouse Performance Tool

A beautiful, production-ready web application for analyzing website performance using Google's Lighthouse locally. Built with React, TypeScript, Tailwind CSS, and a Node.js backend for running Lighthouse analyses.

![Lighthouse Performance Tool](https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1200&h=400&fit=crop&crop=center)

## ✨ Features

- **🔍 Local Lighthouse Analysis**: Run full Lighthouse audits locally for accurate results
- **📊 Core Web Vitals**: Detailed analysis of FCP, LCP, CLS, TBT, Speed Index, and FID
- **📱 Mobile & Desktop Testing**: Choose between mobile and desktop analysis strategies
- **� Performance Comparison**: Compare multiple URLs side-by-side
- **� Full JSON Export**: Download complete Lighthouse JSON reports for analysis
- **📈 Real-time Results**: View detailed metrics and scores in real-time
- **🎨 Modern UI**: Beautiful, responsive design with smooth animations
- **🚀 Fast & Reliable**: No rate limits or API restrictions

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Chrome browser (for Lighthouse analysis)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd lighthouse-performance-tool
   ```

2. **Install frontend dependencies**
   ```bash
   npm install
   ```

3. **Install backend dependencies**
   ```bash
   cd server
   npm install
   cd ..
   ```

4. **Start the backend server**
   ```bash
   cd server
   npm start
   ```
   The server will start on `http://localhost:3001`

5. **Start the frontend development server** (in a new terminal)
   ```bash
   npm run dev
   ```
   The frontend will start on `http://localhost:5173`

6. **Open your browser**
   Navigate to `http://localhost:5173`

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the root directory:

```env
# PageSpeed Insights API (Optional - enables real data)
VITE_PAGESPEED_API_KEY=your_api_key_here

# Supabase Configuration (Optional - enables cloud storage)
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Google PageSpeed Insights API Setup

1. **Go to Google Cloud Console**
   - Visit [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select an existing one

2. **Enable the PageSpeed Insights API**
   - Navigate to "APIs & Services" > "Library"
   - Search for "PageSpeed Insights API"
   - Click "Enable"

3. **Create API Credentials**
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "API Key"
   - Copy the generated API key
   - Add it to your `.env` file as `VITE_PAGESPEED_API_KEY`

4. **Secure your API Key (Recommended)**
   - Click on your API key to edit it
   - Under "API restrictions", select "Restrict key"
   - Choose "PageSpeed Insights API"
   - Under "Website restrictions", add your domain

## 🗄️ Supabase Setup

### Step 1: Create a Supabase Project

1. **Sign up for Supabase**
   - Go to [supabase.com](https://supabase.com)
   - Create a free account
   - Click "New Project"

2. **Get your project credentials**
   - Go to Settings > API
   - Copy your `Project URL` and `anon public` key
   - Add them to your `.env` file

### Step 2: Database Setup

1. **Run the migration**
   - Go to your Supabase dashboard
   - Navigate to "SQL Editor"
   - Create a new query and paste the following SQL:

```sql
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
```

2. **Run the query**
   - Click "Run" to execute the SQL
   - Verify the table was created in the "Table Editor"

### Step 3: Configure Row Level Security (Optional)

If you want to restrict access to results:

```sql
-- Example: Only allow users to see their own results
-- (You'll need to implement authentication first)

DROP POLICY IF EXISTS "Allow public read access" ON lighthouse_results;
DROP POLICY IF EXISTS "Allow public insert access" ON lighthouse_results;

-- Allow authenticated users to read their own results
CREATE POLICY "Users can read own results"
  ON lighthouse_results
  FOR SELECT
  TO authenticated
  USING (auth.uid()::text = user_id);

-- Allow authenticated users to insert their own results
CREATE POLICY "Users can insert own results"
  ON lighthouse_results
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid()::text = user_id);
```

## 📖 Usage

### Basic Usage

1. **Enter Website URL**: Start by entering the URL you want to analyze
2. **Choose Strategy**: Select between Mobile or Desktop testing
3. **Select Routes**: Choose to test just the homepage or add custom routes
4. **Run Analysis**: Click "Run Test" and wait for results
5. **View Results**: Analyze performance metrics and Core Web Vitals
6. **Download Results**: Export full JSON data for further analysis

### Advanced Features

- **Historical Comparison**: View past results and compare performance over time
- **Multi-Route Analysis**: Test multiple pages in a single run
- **Cloud Storage**: Store results in Supabase for team sharing
- **Export Data**: Download complete PageSpeed Insights JSON responses

## 🏗️ Architecture

### Tech Stack

- **Frontend**: React 18 + TypeScript
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Build Tool**: Vite
- **Database**: Supabase (PostgreSQL)
- **API**: Google PageSpeed Insights API

### Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── ComparisonView.tsx
│   ├── HistoryView.tsx
│   └── LoadingSpinner.tsx
├── lib/                # Utilities and configurations
│   └── supabase.ts     # Supabase client and storage logic
├── services/           # External API services
│   └── lighthouseService.ts
├── App.tsx             # Main application component
├── main.tsx           # Application entry point
└── index.css          # Global styles

supabase/
└── migrations/         # Database migrations
    └── 20250610120250_lucky_swamp.sql
```

## 🔒 Security Considerations

### API Key Security

- Never commit API keys to version control
- Use environment variables for all sensitive data
- Consider implementing API key restrictions in Google Cloud Console
- For production, implement proper authentication and rate limiting

### Database Security

- Row Level Security (RLS) is enabled by default
- Public access is allowed for demo purposes
- For production use, implement proper user authentication
- Consider data retention policies for stored results

## 🚀 Deployment

### Netlify Deployment

1. **Build the project**
   ```bash
   npm run build
   ```

2. **Deploy to Netlify**
   - Connect your repository to Netlify
   - Set environment variables in Netlify dashboard
   - Deploy from the `dist` folder

### Vercel Deployment

1. **Install Vercel CLI**
   ```bash
   npm i -g vercel
   ```

2. **Deploy**
   ```bash
   vercel --prod
   ```

### Environment Variables for Production

Make sure to set these in your deployment platform:

```env
VITE_PAGESPEED_API_KEY=your_production_api_key
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

If you encounter any issues:

1. Check the [Issues](../../issues) page for existing solutions
2. Create a new issue with detailed information
3. Include your environment details and error messages

## 🙏 Acknowledgments

- [Google PageSpeed Insights API](https://developers.google.com/speed/docs/insights/v5/get-started)
- [Supabase](https://supabase.com) for the amazing backend-as-a-service
- [Tailwind CSS](https://tailwindcss.com) for the utility-first CSS framework
- [Lucide](https://lucide.dev) for the beautiful icons

---

Made with ❤️ for better web performance