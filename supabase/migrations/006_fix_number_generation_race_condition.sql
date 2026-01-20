-- ============================================
-- FIX RACE CONDITION IN REQUEST/QUOTE/JOB NUMBER GENERATION
-- ============================================
-- The previous implementation used MAX() queries which have race conditions
-- when multiple inserts happen concurrently. This migration switches to
-- using sequences which are atomic and handle concurrency properly.

-- Create sequences for each year (we'll use dynamic SQL in the trigger)
-- Starting with current year and a buffer

-- ============================================
-- REQUEST NUMBER SEQUENCES
-- ============================================

-- Get the current max request number to initialize the sequence
DO $$
DECLARE
  current_max INTEGER;
  current_year TEXT := TO_CHAR(NOW(), 'YYYY');
BEGIN
  -- Get max for current year
  SELECT COALESCE(MAX(
    CAST(SUBSTRING(request_number FROM 'REQ-\d{4}-(\d+)') AS INTEGER)
  ), 0)
  INTO current_max
  FROM public.requests
  WHERE request_number LIKE 'REQ-' || current_year || '-%';

  -- Create or replace the sequence starting after current max
  EXECUTE format('CREATE SEQUENCE IF NOT EXISTS public.request_number_seq_%s START WITH %s',
    current_year, current_max + 1);

  -- Update sequence to current max if it exists but is behind
  EXECUTE format('SELECT setval(''public.request_number_seq_%s'', GREATEST(nextval(''public.request_number_seq_%s'') - 1, %s))',
    current_year, current_year, current_max);
END $$;

-- Update the trigger function to use sequences
CREATE OR REPLACE FUNCTION public.generate_request_number()
RETURNS TRIGGER AS $$
DECLARE
  year_prefix TEXT;
  seq_name TEXT;
  next_num INTEGER;
BEGIN
  year_prefix := TO_CHAR(NOW(), 'YYYY');
  seq_name := 'public.request_number_seq_' || year_prefix;

  -- Create sequence for new year if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM pg_sequences WHERE schemaname = 'public' AND sequencename = 'request_number_seq_' || year_prefix) THEN
    EXECUTE format('CREATE SEQUENCE %I START WITH 1', seq_name);
  END IF;

  -- Get next value from sequence (atomic operation)
  EXECUTE format('SELECT nextval(%L)', seq_name) INTO next_num;

  NEW.request_number := 'REQ-' || year_prefix || '-' || LPAD(next_num::TEXT, 5, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql
SET search_path = '';

-- ============================================
-- QUOTE NUMBER SEQUENCES
-- ============================================

DO $$
DECLARE
  current_max INTEGER;
  current_year TEXT := TO_CHAR(NOW(), 'YYYY');
BEGIN
  SELECT COALESCE(MAX(
    CAST(SUBSTRING(quote_number FROM 'Q-\d{4}-(\d+)') AS INTEGER)
  ), 0)
  INTO current_max
  FROM public.quotes
  WHERE quote_number LIKE 'Q-' || current_year || '-%';

  EXECUTE format('CREATE SEQUENCE IF NOT EXISTS public.quote_number_seq_%s START WITH %s',
    current_year, current_max + 1);

  EXECUTE format('SELECT setval(''public.quote_number_seq_%s'', GREATEST(nextval(''public.quote_number_seq_%s'') - 1, %s))',
    current_year, current_year, current_max);
END $$;

CREATE OR REPLACE FUNCTION public.generate_quote_number()
RETURNS TRIGGER AS $$
DECLARE
  year_prefix TEXT;
  seq_name TEXT;
  next_num INTEGER;
BEGIN
  year_prefix := TO_CHAR(NOW(), 'YYYY');
  seq_name := 'public.quote_number_seq_' || year_prefix;

  IF NOT EXISTS (SELECT 1 FROM pg_sequences WHERE schemaname = 'public' AND sequencename = 'quote_number_seq_' || year_prefix) THEN
    EXECUTE format('CREATE SEQUENCE %I START WITH 1', seq_name);
  END IF;

  EXECUTE format('SELECT nextval(%L)', seq_name) INTO next_num;

  NEW.quote_number := 'Q-' || year_prefix || '-' || LPAD(next_num::TEXT, 5, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql
SET search_path = '';

-- ============================================
-- JOB NUMBER SEQUENCES
-- ============================================

DO $$
DECLARE
  current_max INTEGER;
  current_year_month TEXT := TO_CHAR(NOW(), 'YYMM');
BEGIN
  SELECT COALESCE(MAX(
    CAST(SUBSTRING(job_number FROM 'W\d{4}(\d+)') AS INTEGER)
  ), 0)
  INTO current_max
  FROM public.jobs
  WHERE job_number LIKE 'W' || current_year_month || '%';

  EXECUTE format('CREATE SEQUENCE IF NOT EXISTS public.job_number_seq_%s START WITH %s',
    current_year_month, current_max + 1);

  EXECUTE format('SELECT setval(''public.job_number_seq_%s'', GREATEST(nextval(''public.job_number_seq_%s'') - 1, %s))',
    current_year_month, current_year_month, current_max);
END $$;

CREATE OR REPLACE FUNCTION public.generate_job_number()
RETURNS TRIGGER AS $$
DECLARE
  year_month TEXT;
  seq_name TEXT;
  next_num INTEGER;
BEGIN
  year_month := TO_CHAR(NOW(), 'YYMM');
  seq_name := 'public.job_number_seq_' || year_month;

  IF NOT EXISTS (SELECT 1 FROM pg_sequences WHERE schemaname = 'public' AND sequencename = 'job_number_seq_' || year_month) THEN
    EXECUTE format('CREATE SEQUENCE %I START WITH 1', seq_name);
  END IF;

  EXECUTE format('SELECT nextval(%L)', seq_name) INTO next_num;

  NEW.job_number := 'W' || year_month || LPAD(next_num::TEXT, 3, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql
SET search_path = '';
