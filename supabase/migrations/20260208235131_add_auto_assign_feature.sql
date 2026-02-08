/*
  # Add Auto-Assign Feature

  1. Schema Changes
    - Add `auto_assign_enabled` column to profiles table
    - Add `auto_assigned` column to applications table to track auto-created applications
    - Add `last_auto_assign_run` column to profiles to track when last auto-assign ran
  
  2. Security
    - No changes needed to existing RLS policies
*/

-- Add auto_assign_enabled column to profiles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'auto_assign_enabled'
  ) THEN
    ALTER TABLE profiles ADD COLUMN auto_assign_enabled boolean DEFAULT false;
  END IF;
END $$;

-- Add last_auto_assign_run column to profiles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'last_auto_assign_run'
  ) THEN
    ALTER TABLE profiles ADD COLUMN last_auto_assign_run timestamptz;
  END IF;
END $$;

-- Add auto_assigned column to applications
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'applications' AND column_name = 'auto_assigned'
  ) THEN
    ALTER TABLE applications ADD COLUMN auto_assigned boolean DEFAULT false;
  END IF;
END $$;