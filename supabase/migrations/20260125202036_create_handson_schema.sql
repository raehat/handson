/*
  # HandsOn Volunteer Platform Schema

  ## Overview
  Complete database schema for an AI-powered volunteer matching platform that connects
  volunteers with meaningful opportunities based on skills, availability, and interests.

  ## Tables Created

  ### 1. profiles
  Extended user profiles for volunteers with preferences and availability
  - `id` (uuid, FK to auth.users) - User identifier
  - `email` (text) - User email
  - `full_name` (text) - Full name
  - `bio` (text) - Personal bio
  - `location` (text) - Location/city
  - `availability` (text[]) - Available days/times
  - `interests` (text[]) - Areas of interest
  - `phone` (text) - Contact phone
  - `profile_image_url` (text) - Profile picture URL
  - `created_at` (timestamptz) - Account creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ### 2. skills
  Master list of skills that can be matched
  - `id` (uuid) - Skill identifier
  - `name` (text) - Skill name (unique)
  - `category` (text) - Skill category
  - `created_at` (timestamptz) - Creation timestamp

  ### 3. volunteer_skills
  Junction table connecting volunteers to their skills
  - `id` (uuid) - Record identifier
  - `profile_id` (uuid, FK) - Reference to profiles
  - `skill_id` (uuid, FK) - Reference to skills
  - `proficiency_level` (text) - beginner/intermediate/expert
  - `created_at` (timestamptz) - Creation timestamp

  ### 4. categories
  Categories for organizing opportunities
  - `id` (uuid) - Category identifier
  - `name` (text) - Category name
  - `description` (text) - Category description
  - `icon` (text) - Icon identifier
  - `color` (text) - Display color
  - `created_at` (timestamptz) - Creation timestamp

  ### 5. opportunities
  Volunteer opportunities and programs
  - `id` (uuid) - Opportunity identifier
  - `title` (text) - Opportunity title
  - `description` (text) - Detailed description
  - `organization` (text) - Host organization
  - `category_id` (uuid, FK) - Reference to categories
  - `location` (text) - Location
  - `is_remote` (boolean) - Remote opportunity flag
  - `time_commitment` (text) - Expected time commitment
  - `start_date` (date) - Start date
  - `end_date` (date) - End date
  - `recurring` (boolean) - Is recurring event
  - `schedule` (text) - Schedule details
  - `spots_available` (integer) - Available volunteer spots
  - `spots_filled` (integer) - Filled spots
  - `image_url` (text) - Opportunity image
  - `impact_area` (text) - Social/environmental impact area
  - `requirements` (text) - Special requirements
  - `active` (boolean) - Is opportunity active
  - `created_at` (timestamptz) - Creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ### 6. opportunity_skills
  Skills needed for opportunities
  - `id` (uuid) - Record identifier
  - `opportunity_id` (uuid, FK) - Reference to opportunities
  - `skill_id` (uuid, FK) - Reference to skills
  - `required` (boolean) - Is skill required vs preferred
  - `created_at` (timestamptz) - Creation timestamp

  ### 7. applications
  Volunteer applications to opportunities
  - `id` (uuid) - Application identifier
  - `opportunity_id` (uuid, FK) - Reference to opportunities
  - `profile_id` (uuid, FK) - Reference to profiles
  - `status` (text) - pending/accepted/rejected/completed
  - `message` (text) - Application message
  - `applied_at` (timestamptz) - Application timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ### 8. matches
  AI-generated matches between volunteers and opportunities
  - `id` (uuid) - Match identifier
  - `profile_id` (uuid, FK) - Reference to profiles
  - `opportunity_id` (uuid, FK) - Reference to opportunities
  - `match_score` (integer) - Match score (0-100)
  - `match_reasons` (text[]) - Reasons for match
  - `viewed` (boolean) - Has volunteer viewed this match
  - `dismissed` (boolean) - Has volunteer dismissed this match
  - `created_at` (timestamptz) - Match creation timestamp

  ## Security
  - RLS enabled on all tables
  - Authenticated users can view all active opportunities
  - Users can only modify their own profile data
  - Users can only view/manage their own applications and matches
  - Public read access to categories and skills
*/

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  full_name text NOT NULL,
  bio text DEFAULT '',
  location text DEFAULT '',
  availability text[] DEFAULT '{}',
  interests text[] DEFAULT '{}',
  phone text DEFAULT '',
  profile_image_url text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Create skills table
CREATE TABLE IF NOT EXISTS skills (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  category text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE skills ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view skills"
  ON skills FOR SELECT
  TO authenticated
  USING (true);

-- Create volunteer_skills junction table
CREATE TABLE IF NOT EXISTS volunteer_skills (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  skill_id uuid NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
  proficiency_level text DEFAULT 'intermediate',
  created_at timestamptz DEFAULT now(),
  UNIQUE(profile_id, skill_id)
);

ALTER TABLE volunteer_skills ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all volunteer skills"
  ON volunteer_skills FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert own skills"
  ON volunteer_skills FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = profile_id);

CREATE POLICY "Users can delete own skills"
  ON volunteer_skills FOR DELETE
  TO authenticated
  USING (auth.uid() = profile_id);

-- Create categories table
CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  description text DEFAULT '',
  icon text DEFAULT 'heart',
  color text DEFAULT 'blue',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view categories"
  ON categories FOR SELECT
  TO authenticated
  USING (true);

-- Create opportunities table
CREATE TABLE IF NOT EXISTS opportunities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL,
  organization text NOT NULL,
  category_id uuid REFERENCES categories(id) ON DELETE SET NULL,
  location text NOT NULL,
  is_remote boolean DEFAULT false,
  time_commitment text NOT NULL,
  start_date date NOT NULL,
  end_date date,
  recurring boolean DEFAULT false,
  schedule text DEFAULT '',
  spots_available integer DEFAULT 10,
  spots_filled integer DEFAULT 0,
  image_url text DEFAULT '',
  impact_area text NOT NULL,
  requirements text DEFAULT '',
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE opportunities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active opportunities"
  ON opportunities FOR SELECT
  TO authenticated
  USING (active = true);

-- Create opportunity_skills junction table
CREATE TABLE IF NOT EXISTS opportunity_skills (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  opportunity_id uuid NOT NULL REFERENCES opportunities(id) ON DELETE CASCADE,
  skill_id uuid NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
  required boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  UNIQUE(opportunity_id, skill_id)
);

ALTER TABLE opportunity_skills ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view opportunity skills"
  ON opportunity_skills FOR SELECT
  TO authenticated
  USING (true);

-- Create applications table
CREATE TABLE IF NOT EXISTS applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  opportunity_id uuid NOT NULL REFERENCES opportunities(id) ON DELETE CASCADE,
  profile_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status text DEFAULT 'pending',
  message text DEFAULT '',
  applied_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(opportunity_id, profile_id)
);

ALTER TABLE applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own applications"
  ON applications FOR SELECT
  TO authenticated
  USING (auth.uid() = profile_id);

CREATE POLICY "Users can insert own applications"
  ON applications FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = profile_id);

CREATE POLICY "Users can update own applications"
  ON applications FOR UPDATE
  TO authenticated
  USING (auth.uid() = profile_id)
  WITH CHECK (auth.uid() = profile_id);

-- Create matches table
CREATE TABLE IF NOT EXISTS matches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  opportunity_id uuid NOT NULL REFERENCES opportunities(id) ON DELETE CASCADE,
  match_score integer NOT NULL DEFAULT 50,
  match_reasons text[] DEFAULT '{}',
  viewed boolean DEFAULT false,
  dismissed boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  UNIQUE(profile_id, opportunity_id)
);

ALTER TABLE matches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own matches"
  ON matches FOR SELECT
  TO authenticated
  USING (auth.uid() = profile_id);

CREATE POLICY "Users can update own matches"
  ON matches FOR UPDATE
  TO authenticated
  USING (auth.uid() = profile_id)
  WITH CHECK (auth.uid() = profile_id);

-- Insert initial categories
INSERT INTO categories (name, description, icon, color) VALUES
  ('Environmental', 'Environmental conservation and sustainability projects', 'leaf', 'green'),
  ('Education', 'Teaching, tutoring, and educational programs', 'book-open', 'blue'),
  ('Healthcare', 'Medical support and health initiatives', 'heart-pulse', 'red'),
  ('Community', 'Community development and social programs', 'users', 'purple'),
  ('Animals', 'Animal welfare and rescue', 'paw-print', 'orange'),
  ('Arts & Culture', 'Arts, culture, and creative programs', 'palette', 'pink'),
  ('Technology', 'Tech education and digital literacy', 'laptop', 'indigo'),
  ('Senior Care', 'Support for elderly community members', 'heart-handshake', 'teal')
ON CONFLICT (name) DO NOTHING;

-- Insert initial skills
INSERT INTO skills (name, category) VALUES
  ('Teaching', 'Education'),
  ('Public Speaking', 'Communication'),
  ('Event Planning', 'Organization'),
  ('Social Media', 'Marketing'),
  ('Photography', 'Creative'),
  ('Graphic Design', 'Creative'),
  ('Web Development', 'Technology'),
  ('Fundraising', 'Finance'),
  ('Project Management', 'Management'),
  ('Writing', 'Communication'),
  ('Translation', 'Languages'),
  ('Cooking', 'Practical'),
  ('Carpentry', 'Practical'),
  ('Gardening', 'Environmental'),
  ('Animal Care', 'Animals'),
  ('First Aid', 'Healthcare'),
  ('Counseling', 'Healthcare'),
  ('Mentoring', 'Education'),
  ('Data Analysis', 'Technology'),
  ('Marketing', 'Marketing')
ON CONFLICT (name) DO NOTHING;