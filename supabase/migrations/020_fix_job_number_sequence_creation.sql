-- Fix generate_job_number to use %s instead of %I for sequence creation.
-- %I quotes the entire 'public.job_number_seq_YYMM' string as a single identifier,
-- which fails with SET search_path = '' because PostgreSQL can't infer the schema.
-- %s keeps the name unquoted so 'public.job_number_seq_YYMM' is parsed as schema.name.
CREATE OR REPLACE FUNCTION public.generate_job_number()
RETURNS TRIGGER AS $$
DECLARE
  year_month TEXT;
  seq_name TEXT;
  next_num INTEGER;
BEGIN
  IF NEW.job_number IS NOT NULL AND NEW.job_number != '' THEN
    RETURN NEW;
  END IF;

  year_month := TO_CHAR(NOW(), 'YYMM');
  seq_name := 'public.job_number_seq_' || year_month;

  IF NOT EXISTS (SELECT 1 FROM pg_sequences WHERE schemaname = 'public' AND sequencename = 'job_number_seq_' || year_month) THEN
    EXECUTE format('CREATE SEQUENCE public.job_number_seq_%s START WITH 1', year_month);
  END IF;

  EXECUTE format('SELECT nextval(%L)', seq_name) INTO next_num;

  NEW.job_number := 'W' || year_month || LPAD(next_num::TEXT, 3, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql
SET search_path = '';

-- Ensure the current month's sequence exists (backfill for the running month).
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
END $$;
