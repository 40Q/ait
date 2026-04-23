-- Allow manually specified job numbers by only auto-generating when job_number is not provided
CREATE OR REPLACE FUNCTION public.generate_job_number()
RETURNS TRIGGER AS $$
DECLARE
  year_month TEXT;
  seq_name TEXT;
  next_num INTEGER;
BEGIN
  -- Skip auto-generation if a job_number was explicitly provided
  IF NEW.job_number IS NOT NULL AND NEW.job_number != '' THEN
    RETURN NEW;
  END IF;

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
