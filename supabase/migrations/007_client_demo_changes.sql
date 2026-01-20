-- ============================================
-- CLIENT DEMO CHANGES
-- 1. Add 'miscellaneous' document type
-- 2. Add 'needs_scheduling' job status (new default)
-- 3. Make pickup_date nullable on jobs (scheduling is now done after job creation)
-- 4. Update job creation trigger to use 'needs_scheduling' status
-- 5. Remove pickup_date and pickup_time_window from quotes (moved to jobs)
-- ============================================

-- ============================================
-- 0. FIX create_timeline_event TO USE SCHEMA-QUALIFIED TABLE
-- ============================================

CREATE OR REPLACE FUNCTION public.create_timeline_event(
  p_entity_type TEXT,
  p_entity_id UUID,
  p_event_type TEXT,
  p_previous_value TEXT DEFAULT NULL,
  p_new_value TEXT DEFAULT NULL,
  p_actor_id UUID DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  v_event_id UUID;
BEGIN
  INSERT INTO public.timeline_events (entity_type, entity_id, event_type, previous_value, new_value, actor_id)
  VALUES (p_entity_type, p_entity_id, p_event_type, p_previous_value, p_new_value, COALESCE(p_actor_id, auth.uid()))
  RETURNING id INTO v_event_id;
  RETURN v_event_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 1. ADD 'miscellaneous' DOCUMENT TYPE
-- ============================================

-- Drop and recreate the CHECK constraint for document_type
ALTER TABLE documents DROP CONSTRAINT IF EXISTS documents_document_type_check;
ALTER TABLE documents ADD CONSTRAINT documents_document_type_check
  CHECK (document_type IN (
    'certificate_of_destruction',
    'certificate_of_recycling',
    'hd_serialization',
    'asset_serialization',
    'warehouse_report',
    'pickup_document',
    'miscellaneous'
  ));

-- ============================================
-- 2. ADD 'needs_scheduling' JOB STATUS
-- ============================================

-- Drop and recreate the CHECK constraint for job status
ALTER TABLE jobs DROP CONSTRAINT IF EXISTS jobs_status_check;
ALTER TABLE jobs ADD CONSTRAINT jobs_status_check
  CHECK (status IN (
    'needs_scheduling',
    'pickup_scheduled',
    'pickup_complete',
    'processing',
    'complete'
  ));

-- Update the default status for jobs
ALTER TABLE jobs ALTER COLUMN status SET DEFAULT 'needs_scheduling';

-- ============================================
-- 3. MAKE pickup_date NULLABLE ON JOBS
-- ============================================

-- Make pickup_date nullable (it was NOT NULL before)
ALTER TABLE jobs ALTER COLUMN pickup_date DROP NOT NULL;

-- ============================================
-- 4. UPDATE JOB CREATION TRIGGER
-- Jobs now start with 'needs_scheduling' status and no pickup_date
-- ============================================

CREATE OR REPLACE FUNCTION handle_quote_status_change()
RETURNS TRIGGER AS $$
DECLARE
  v_request RECORD;
  v_job_id UUID;
BEGIN
  -- Only proceed if status actually changed
  IF OLD.status IS NOT DISTINCT FROM NEW.status THEN
    RETURN NEW;
  END IF;

  -- QUOTE SENT (draft/revision_requested -> sent)
  IF NEW.status = 'sent' AND OLD.status IN ('draft', 'revision_requested') THEN
    PERFORM public.create_timeline_event(
      'quote',
      NEW.id,
      'sent',
      OLD.status,
      'Quote sent to client',
      auth.uid()
    );
  END IF;

  -- QUOTE ACCEPTED (sent -> accepted)
  IF NEW.status = 'accepted' AND OLD.status = 'sent' THEN
    -- Update request status to accepted
    UPDATE public.requests SET status = 'accepted' WHERE id = NEW.request_id;

    -- Get request data for job creation
    SELECT * INTO v_request FROM public.requests WHERE id = NEW.request_id;

    -- Create job with 'needs_scheduling' status (no pickup_date yet)
    INSERT INTO public.jobs (
      quote_id,
      request_id,
      company_id,
      status,
      pickup_date,
      pickup_time_window,
      location,
      contact,
      equipment,
      services
    ) VALUES (
      NEW.id,
      NEW.request_id,
      NEW.company_id,
      'needs_scheduling',
      NULL,
      NULL,
      jsonb_build_object(
        'address', v_request.address,
        'city', COALESCE(v_request.city, ''),
        'state', COALESCE(v_request.state, ''),
        'zip_code', COALESCE(v_request.zip_code, ''),
        'building_info', v_request.building_info,
        'equipment_location', v_request.equipment_location,
        'access_instructions', v_request.access_instructions
      ),
      jsonb_build_object(
        'name', COALESCE(v_request.on_site_contact_name, ''),
        'email', COALESCE(v_request.on_site_contact_email, ''),
        'phone', COALESCE(v_request.on_site_contact_phone, '')
      ),
      COALESCE(v_request.equipment, '[]'::jsonb),
      (SELECT COALESCE(jsonb_agg(description ORDER BY sort_order), '[]'::jsonb) FROM public.quote_line_items WHERE quote_id = NEW.id)
    )
    RETURNING id INTO v_job_id;

    -- Create timeline events
    PERFORM public.create_timeline_event(
      'quote',
      NEW.id,
      'accepted',
      OLD.status,
      'Quote accepted by client',
      NEW.accepted_by
    );

    PERFORM public.create_timeline_event(
      'job',
      v_job_id,
      'created',
      NULL,
      'Job created from accepted quote',
      NEW.accepted_by
    );
  END IF;

  -- QUOTE DECLINED (sent -> declined)
  IF NEW.status = 'declined' AND OLD.status = 'sent' THEN
    -- Update request status to declined
    UPDATE public.requests SET status = 'declined' WHERE id = NEW.request_id;

    PERFORM public.create_timeline_event(
      'quote',
      NEW.id,
      'declined',
      OLD.status,
      COALESCE('Quote declined: ' || NEW.decline_reason, 'Quote declined by client'),
      auth.uid()
    );
  END IF;

  -- REVISION REQUESTED (sent -> revision_requested)
  IF NEW.status = 'revision_requested' AND OLD.status = 'sent' THEN
    -- Update request status to revision_requested
    UPDATE public.requests SET status = 'revision_requested' WHERE id = NEW.request_id;

    PERFORM public.create_timeline_event(
      'quote',
      NEW.id,
      'revision_requested',
      OLD.status,
      COALESCE('Revision requested: ' || NEW.revision_message, 'Client requested a revision'),
      auth.uid()
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 5. UPDATE JOB STATUS CHANGE TRIGGER
-- Handle transition from needs_scheduling to pickup_scheduled
-- ============================================

CREATE OR REPLACE FUNCTION handle_job_status_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Only proceed if status actually changed
  IF OLD.status IS NOT DISTINCT FROM NEW.status THEN
    RETURN NEW;
  END IF;

  -- Set timestamp for the new status
  CASE NEW.status
    WHEN 'pickup_scheduled' THEN
      NEW.pickup_scheduled_at := COALESCE(NEW.pickup_scheduled_at, NOW());
    WHEN 'pickup_complete' THEN
      NEW.pickup_complete_at := COALESCE(NEW.pickup_complete_at, NOW());
    WHEN 'processing' THEN
      NEW.processing_started_at := COALESCE(NEW.processing_started_at, NOW());
    WHEN 'complete' THEN
      NEW.completed_at := COALESCE(NEW.completed_at, NOW());
    ELSE
      -- needs_scheduling doesn't need a timestamp
      NULL;
  END CASE;

  -- Create timeline event
  PERFORM public.create_timeline_event(
    'job',
    NEW.id,
    'status_change',
    OLD.status,
    'Job status changed to ' || NEW.status,
    auth.uid()
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 6. REMOVE PICKUP COLUMNS FROM QUOTES
-- Pickup scheduling is now done on jobs, not quotes
-- ============================================

ALTER TABLE quotes DROP COLUMN IF EXISTS pickup_date;
ALTER TABLE quotes DROP COLUMN IF EXISTS pickup_time_window;
