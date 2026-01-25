import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  bio: string;
  location: string;
  availability: string[];
  interests: string[];
  phone: string;
  profile_image_url: string;
  created_at: string;
  updated_at: string;
}

export interface Skill {
  id: string;
  name: string;
  category: string;
}

export interface Category {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
}

export interface Opportunity {
  id: string;
  title: string;
  description: string;
  organization: string;
  category_id: string;
  location: string;
  is_remote: boolean;
  time_commitment: string;
  start_date: string;
  end_date: string | null;
  recurring: boolean;
  schedule: string;
  spots_available: number;
  spots_filled: number;
  image_url: string;
  impact_area: string;
  requirements: string;
  active: boolean;
}

export interface Match {
  id: string;
  profile_id: string;
  opportunity_id: string;
  match_score: number;
  match_reasons: string[];
  viewed: boolean;
  dismissed: boolean;
  created_at: string;
}

export interface Application {
  id: string;
  opportunity_id: string;
  profile_id: string;
  status: 'pending' | 'accepted' | 'rejected' | 'completed';
  message: string;
  applied_at: string;
  updated_at: string;
}
