-- ============================================
-- BUSINESS ENTITIES: Requests, Quotes, Jobs, Documents, Invoices
-- ============================================

-- ============================================
-- FORM TYPE ENUM
-- ============================================
CREATE TYPE form_type AS ENUM ('standard', 'logistics', 'materials');

-- ============================================
-- COMPANY LOCATIONS TABLE
-- Allows multiple addresses per company
-- ============================================
CREATE TABLE company_locations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,

  -- Location details
  name TEXT NOT NULL,  -- e.g., "Main Office", "Warehouse", "Data Center"
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  zip_code TEXT NOT NULL,

  -- Additional location info (commonly used in pickups)
  building_info TEXT,
  equipment_location TEXT,
  access_instructions TEXT,

  -- Dock info
  dock_type TEXT DEFAULT 'none' CHECK (dock_type IN ('none', 'ground_level', 'truck_level')),
  dock_hours_start TEXT,
  dock_hours_end TEXT,

  -- Elevator info
  has_freight_elevator BOOLEAN DEFAULT FALSE,
  has_passenger_elevator BOOLEAN DEFAULT FALSE,
  elevator_restrictions TEXT,

  -- Access info
  can_use_handcarts BOOLEAN DEFAULT TRUE,
  protective_floor_covering BOOLEAN DEFAULT FALSE,
  max_truck_size TEXT CHECK (max_truck_size IS NULL OR max_truck_size IN ('cargo_van', '16ft_box', '24ft_box', '26ft_box', '48ft_trailer', '53ft_trailer')),

  -- Contact for this location
  contact_name TEXT,
  contact_email TEXT,
  contact_phone TEXT,

  -- Flags
  is_primary BOOLEAN DEFAULT FALSE,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_company_locations_company_id ON company_locations(company_id);
CREATE INDEX idx_company_locations_is_primary ON company_locations(company_id, is_primary);

-- ============================================
-- REQUESTS TABLE
-- Pickup requests submitted by clients
-- ============================================
CREATE TABLE requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  request_number TEXT NOT NULL UNIQUE,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  submitted_by UUID NOT NULL REFERENCES profiles(id),
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'quote_ready', 'revision_requested', 'accepted', 'declined')),

  -- Form type (standard, logistics, materials)
  form_type form_type NOT NULL DEFAULT 'standard',
  form_data JSONB DEFAULT '{}',

  -- Saved location reference (optional - allows selecting from past pickups)
  location_id UUID REFERENCES company_locations(id) ON DELETE SET NULL,

  -- Location
  address TEXT NOT NULL,
  city TEXT,
  state TEXT,
  zip_code TEXT,
  building_info TEXT,
  location_name TEXT,
  equipment_location TEXT,
  access_instructions TEXT,
  po_number TEXT,

  -- On-Site Contact
  on_site_contact_name TEXT,
  on_site_contact_email TEXT,
  on_site_contact_phone TEXT,
  pre_pickup_call TEXT DEFAULT 'none' CHECK (pre_pickup_call IS NULL OR pre_pickup_call IN ('none', '30_min', '1_hour')),

  -- Accounts Payable
  accounts_payable_email TEXT,

  -- Facility Info - Dock
  dock_type TEXT DEFAULT 'none' CHECK (dock_type IS NULL OR dock_type IN ('none', 'ground_level', 'truck_level')),
  dock_hours_start TEXT,
  dock_hours_end TEXT,
  dock_time_limit TEXT,

  -- Facility Info - Elevators
  has_freight_elevator BOOLEAN DEFAULT FALSE,
  has_passenger_elevator BOOLEAN DEFAULT FALSE,
  elevator_restrictions TEXT,

  -- Facility Info - Access
  can_use_handcarts BOOLEAN DEFAULT TRUE,
  protective_floor_covering BOOLEAN DEFAULT FALSE,
  protective_floor_covering_details TEXT,
  max_truck_size TEXT CHECK (max_truck_size IS NULL OR max_truck_size IN ('cargo_van', '16ft_box', '24ft_box', '26ft_box', '48ft_trailer', '53ft_trailer')),

  -- COI (Certificate of Insurance)
  coi_required BOOLEAN DEFAULT FALSE,
  coi_sample_path TEXT,

  -- Equipment Confirmation
  equipment_unplugged_confirmed BOOLEAN DEFAULT FALSE,

  -- Schedule
  preferred_date DATE,
  preferred_date_range_end DATE,
  unavailable_dates TEXT,

  -- Equipment (JSONB array of {type, quantity, details})
  equipment JSONB DEFAULT '[]',
  estimated_weight TEXT,
  equipment_file_paths JSONB DEFAULT '{}',

  -- General Questions
  has_heavy_equipment BOOLEAN DEFAULT FALSE,
  has_hazmat_or_batteries BOOLEAN DEFAULT FALSE,

  -- Services
  service_type TEXT DEFAULT 'pickup' CHECK (service_type IS NULL OR service_type IN ('pickup', 'dropoff')),
  data_destruction_service TEXT DEFAULT 'none'
    CHECK (data_destruction_service IS NULL OR data_destruction_service IN ('none', 'hd_destruction_cod', 'hd_serialization_cod', 'onsite_hd_serialization_cod', 'asset_serialization_cor')),
  packing_service TEXT DEFAULT 'none'
    CHECK (packing_service IS NULL OR packing_service IN ('none', 'shrink_wrap_only', 'palletize_wrap', 'full_pack')),
  white_glove_service BOOLEAN DEFAULT FALSE,

  -- Material Preparation
  material_prepared BOOLEAN,
  material_not_prepared_details TEXT,
  packing_services_required BOOLEAN DEFAULT FALSE,

  -- Notes
  additional_notes TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Comment explaining form_data structure
COMMENT ON COLUMN requests.form_data IS 'Type-specific form data.
For logistics: { destination_address, preferred_contact_method, material_fits_on_pallets, number_of_pallets, size_of_pallets, height_of_palletized_material, estimated_weight_per_pallet, needs_palletizing, needs_shrink_wrap, needs_pallet_strap }
For materials: { has_wood, has_metal, has_electronics, materials_description }';

CREATE INDEX idx_requests_company_id ON requests(company_id);
CREATE INDEX idx_requests_status ON requests(status);
CREATE INDEX idx_requests_submitted_by ON requests(submitted_by);
CREATE INDEX idx_requests_request_number ON requests(request_number);
CREATE INDEX idx_requests_created_at ON requests(created_at DESC);
CREATE INDEX idx_requests_form_type ON requests(form_type);
CREATE INDEX idx_requests_location_id ON requests(location_id);

-- ============================================
-- QUOTES TABLE
-- Quotes created by admin for requests
-- ============================================
CREATE TABLE quotes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  quote_number TEXT NOT NULL UNIQUE,
  request_id UUID NOT NULL REFERENCES requests(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES profiles(id),

  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'sent', 'accepted', 'declined', 'revision_requested')),

  -- Schedule
  pickup_date DATE,
  pickup_time_window TEXT,
  valid_until DATE NOT NULL,

  -- Pricing
  subtotal DECIMAL(10, 2) NOT NULL DEFAULT 0,
  discount DECIMAL(10, 2) DEFAULT 0,
  discount_type TEXT DEFAULT 'amount' CHECK (discount_type IN ('amount', 'percentage')),
  total DECIMAL(10, 2) NOT NULL DEFAULT 0,

  -- Terms
  terms TEXT,

  -- Client response
  revision_message TEXT,
  decline_reason TEXT,

  -- Acceptance
  accepted_at TIMESTAMPTZ,
  accepted_by UUID REFERENCES profiles(id),
  signature_name TEXT,

  -- Timestamps
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_quotes_request_id ON quotes(request_id);
CREATE INDEX idx_quotes_company_id ON quotes(company_id);
CREATE INDEX idx_quotes_status ON quotes(status);
CREATE INDEX idx_quotes_quote_number ON quotes(quote_number);
CREATE INDEX idx_quotes_created_by ON quotes(created_by);
CREATE INDEX idx_quotes_accepted_by ON quotes(accepted_by);
CREATE INDEX idx_quotes_created_at ON quotes(created_at DESC);

-- ============================================
-- QUOTE_LINE_ITEMS TABLE
-- Individual line items for quotes
-- ============================================
CREATE TABLE quote_line_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  quote_id UUID NOT NULL REFERENCES quotes(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price DECIMAL(10, 2) NOT NULL,
  total DECIMAL(10, 2) NOT NULL,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_quote_line_items_quote_id ON quote_line_items(quote_id);
CREATE INDEX idx_quote_line_items_sort_order ON quote_line_items(quote_id, sort_order);

-- ============================================
-- JOBS TABLE
-- Jobs created when quote is accepted OR created directly by admin
-- ============================================
CREATE TABLE jobs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  job_number TEXT NOT NULL UNIQUE,
  quote_id UUID REFERENCES quotes(id),  -- Nullable for jobs created without quotes
  request_id UUID REFERENCES requests(id),  -- Nullable for jobs created directly
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,

  status TEXT NOT NULL DEFAULT 'pickup_scheduled'
    CHECK (status IN ('pickup_scheduled', 'pickup_complete', 'processing', 'complete')),

  -- Schedule
  pickup_date DATE NOT NULL,
  pickup_time_window TEXT,

  -- Logistics person performing the pickup
  logistics_person_name TEXT,

  -- Location & Contact (snapshot from request or entered directly)
  location JSONB NOT NULL,
  contact JSONB NOT NULL,

  -- Equipment & Services (snapshot from request/quote)
  equipment JSONB NOT NULL DEFAULT '[]',
  services JSONB NOT NULL DEFAULT '[]',

  -- Timeline tracking
  pickup_scheduled_at TIMESTAMPTZ,
  pickup_complete_at TIMESTAMPTZ,
  processing_started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,

  -- Notes
  admin_notes TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_jobs_quote_id ON jobs(quote_id);
CREATE INDEX idx_jobs_request_id ON jobs(request_id);
CREATE INDEX idx_jobs_company_id ON jobs(company_id);
CREATE INDEX idx_jobs_status ON jobs(status);
CREATE INDEX idx_jobs_job_number ON jobs(job_number);
CREATE INDEX idx_jobs_pickup_date ON jobs(pickup_date);
CREATE INDEX idx_jobs_created_at ON jobs(created_at DESC);

-- ============================================
-- DOCUMENTS TABLE
-- Documents uploaded for jobs
-- ============================================
CREATE TABLE documents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,

  name TEXT NOT NULL,
  document_type TEXT NOT NULL
    CHECK (document_type IN ('certificate_of_destruction', 'certificate_of_recycling', 'hd_serialization', 'asset_serialization', 'warehouse_report', 'pickup_document')),

  file_path TEXT NOT NULL,
  file_size INTEGER,
  mime_type TEXT,

  uploaded_by UUID NOT NULL REFERENCES profiles(id),

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_documents_job_id ON documents(job_id);
CREATE INDEX idx_documents_company_id ON documents(company_id);
CREATE INDEX idx_documents_document_type ON documents(document_type);
CREATE INDEX idx_documents_uploaded_by ON documents(uploaded_by);

-- ============================================
-- INVOICES TABLE
-- Invoices (synced from QuickBooks)
-- ============================================
CREATE TABLE invoices (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  invoice_number TEXT NOT NULL,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  job_id UUID REFERENCES jobs(id) ON DELETE SET NULL,

  status TEXT NOT NULL DEFAULT 'unpaid'
    CHECK (status IN ('paid', 'unpaid', 'overdue')),

  amount DECIMAL(10, 2) NOT NULL,
  invoice_date DATE NOT NULL,
  due_date DATE NOT NULL,

  -- QuickBooks sync data
  quickbooks_id TEXT UNIQUE,
  quickbooks_synced_at TIMESTAMPTZ,
  quickbooks_data JSONB,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_invoices_company_id ON invoices(company_id);
CREATE INDEX idx_invoices_job_id ON invoices(job_id);
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_invoices_quickbooks_id ON invoices(quickbooks_id);
CREATE INDEX idx_invoices_due_date ON invoices(due_date);

-- ============================================
-- ENABLE ROW LEVEL SECURITY
-- ============================================
ALTER TABLE company_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE quote_line_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

-- ============================================
-- AUTO-GENERATE HUMAN-READABLE IDs
-- ============================================
CREATE OR REPLACE FUNCTION public.generate_request_number()
RETURNS TRIGGER AS $$
DECLARE
  year_prefix TEXT;
  next_num INTEGER;
BEGIN
  year_prefix := TO_CHAR(NOW(), 'YYYY');
  SELECT COALESCE(MAX(
    CAST(SUBSTRING(request_number FROM 'REQ-\d{4}-(\d+)') AS INTEGER)
  ), 0) + 1
  INTO next_num
  FROM public.requests
  WHERE request_number LIKE 'REQ-' || year_prefix || '-%';
  NEW.request_number := 'REQ-' || year_prefix || '-' || LPAD(next_num::TEXT, 5, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql
SET search_path = '';

CREATE OR REPLACE FUNCTION public.generate_quote_number()
RETURNS TRIGGER AS $$
DECLARE
  year_prefix TEXT;
  next_num INTEGER;
BEGIN
  year_prefix := TO_CHAR(NOW(), 'YYYY');
  SELECT COALESCE(MAX(
    CAST(SUBSTRING(quote_number FROM 'Q-\d{4}-(\d+)') AS INTEGER)
  ), 0) + 1
  INTO next_num
  FROM public.quotes
  WHERE quote_number LIKE 'Q-' || year_prefix || '-%';
  NEW.quote_number := 'Q-' || year_prefix || '-' || LPAD(next_num::TEXT, 5, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql
SET search_path = '';

CREATE OR REPLACE FUNCTION public.generate_job_number()
RETURNS TRIGGER AS $$
DECLARE
  year_month TEXT;
  next_num INTEGER;
BEGIN
  year_month := TO_CHAR(NOW(), 'YYMM');
  SELECT COALESCE(MAX(
    CAST(SUBSTRING(job_number FROM 'W\d{4}(\d+)') AS INTEGER)
  ), 0) + 1
  INTO next_num
  FROM public.jobs
  WHERE job_number LIKE 'W' || year_month || '%';
  NEW.job_number := 'W' || year_month || LPAD(next_num::TEXT, 5, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql
SET search_path = '';

CREATE TRIGGER set_request_number
  BEFORE INSERT ON requests
  FOR EACH ROW
  EXECUTE FUNCTION generate_request_number();

CREATE TRIGGER set_quote_number
  BEFORE INSERT ON quotes
  FOR EACH ROW
  EXECUTE FUNCTION generate_quote_number();

CREATE TRIGGER set_job_number
  BEFORE INSERT ON jobs
  FOR EACH ROW
  EXECUTE FUNCTION generate_job_number();

-- ============================================
-- UPDATED_AT TRIGGERS
-- ============================================
CREATE TRIGGER update_requests_updated_at
  BEFORE UPDATE ON requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_quotes_updated_at
  BEFORE UPDATE ON quotes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_jobs_updated_at
  BEFORE UPDATE ON jobs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_invoices_updated_at
  BEFORE UPDATE ON invoices
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_company_locations_updated_at
  BEFORE UPDATE ON company_locations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================
-- ENSURE ONLY ONE PRIMARY LOCATION PER COMPANY
-- When setting a location as primary, unset others
-- ============================================
CREATE OR REPLACE FUNCTION ensure_single_primary_location()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_primary = TRUE THEN
    UPDATE company_locations
    SET is_primary = FALSE
    WHERE company_id = NEW.company_id
      AND id != NEW.id
      AND is_primary = TRUE;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER ensure_single_primary_location_trigger
  BEFORE INSERT OR UPDATE ON company_locations
  FOR EACH ROW
  WHEN (NEW.is_primary = TRUE)
  EXECUTE FUNCTION ensure_single_primary_location();

-- ============================================
-- TIMELINE EVENTS TABLE
-- Audit trail for status changes and notes
-- ============================================
CREATE TABLE timeline_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Polymorphic reference to the entity
  entity_type TEXT NOT NULL CHECK (entity_type IN ('request', 'quote', 'job')),
  entity_id UUID NOT NULL,

  -- Event details
  event_type TEXT NOT NULL CHECK (event_type IN ('status_change', 'created', 'declined', 'revision_requested', 'accepted', 'note', 'sent')),
  previous_value TEXT,
  new_value TEXT,

  -- Actor info
  actor_id UUID REFERENCES profiles(id),

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_timeline_events_entity ON timeline_events(entity_type, entity_id);
CREATE INDEX idx_timeline_events_actor ON timeline_events(actor_id);

ALTER TABLE timeline_events ENABLE ROW LEVEL SECURITY;

-- ============================================
-- TIMELINE EVENT HELPER FUNCTION
-- ============================================
CREATE OR REPLACE FUNCTION create_timeline_event(
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
  INSERT INTO timeline_events (entity_type, entity_id, event_type, previous_value, new_value, actor_id)
  VALUES (p_entity_type, p_entity_id, p_event_type, p_previous_value, p_new_value, COALESCE(p_actor_id, auth.uid()))
  RETURNING id INTO v_event_id;
  RETURN v_event_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- REQUEST TIMELINE TRIGGERS
-- ============================================
CREATE OR REPLACE FUNCTION on_request_created()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM create_timeline_event('request', NEW.id, 'created', NULL, NULL, NEW.submitted_by);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER request_created_trigger
  AFTER INSERT ON requests
  FOR EACH ROW
  EXECUTE FUNCTION on_request_created();

CREATE OR REPLACE FUNCTION on_request_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    PERFORM create_timeline_event('request', NEW.id, 'status_change', OLD.status, NEW.status, auth.uid());
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER request_status_change_trigger
  AFTER UPDATE ON requests
  FOR EACH ROW
  EXECUTE FUNCTION on_request_status_change();

-- ============================================
-- QUOTE STATUS CHANGE TRIGGER
-- Handles quote sent, acceptance, decline, revision
-- Also creates jobs when quotes are accepted
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
    PERFORM create_timeline_event(
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
    UPDATE requests SET status = 'accepted' WHERE id = NEW.request_id;

    -- Get request data for job creation
    SELECT * INTO v_request FROM requests WHERE id = NEW.request_id;

    -- Create job
    INSERT INTO jobs (
      quote_id,
      request_id,
      company_id,
      status,
      pickup_date,
      pickup_time_window,
      location,
      contact,
      equipment,
      services,
      pickup_scheduled_at
    ) VALUES (
      NEW.id,
      NEW.request_id,
      NEW.company_id,
      'pickup_scheduled',
      NEW.pickup_date,
      NEW.pickup_time_window,
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
      (SELECT COALESCE(jsonb_agg(description ORDER BY sort_order), '[]'::jsonb) FROM quote_line_items WHERE quote_id = NEW.id),
      NOW()
    )
    RETURNING id INTO v_job_id;

    -- Create timeline events
    PERFORM create_timeline_event(
      'quote',
      NEW.id,
      'accepted',
      OLD.status,
      CASE WHEN NEW.signature_name IS NOT NULL
        THEN 'Signed by: ' || NEW.signature_name
        ELSE 'Quote accepted'
      END,
      NEW.accepted_by
    );

    PERFORM create_timeline_event(
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
    UPDATE requests SET status = 'declined' WHERE id = NEW.request_id;

    PERFORM create_timeline_event(
      'quote',
      NEW.id,
      'declined',
      OLD.status,
      COALESCE(NEW.decline_reason, 'Quote declined'),
      auth.uid()
    );
  END IF;

  -- REVISION REQUESTED (sent -> revision_requested)
  IF NEW.status = 'revision_requested' AND OLD.status = 'sent' THEN
    UPDATE requests SET status = 'revision_requested' WHERE id = NEW.request_id;

    PERFORM create_timeline_event(
      'quote',
      NEW.id,
      'revision_requested',
      OLD.status,
      COALESCE(NEW.revision_message, 'Revision requested'),
      auth.uid()
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER quote_status_change_trigger
  AFTER UPDATE ON quotes
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION handle_quote_status_change();

-- ============================================
-- JOB STATUS CHANGE TRIGGER
-- ============================================
CREATE OR REPLACE FUNCTION on_job_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    PERFORM create_timeline_event(
      'job',
      NEW.id,
      'status_change',
      OLD.status,
      NEW.status,
      auth.uid()
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER job_status_change_trigger
  AFTER UPDATE ON jobs
  FOR EACH ROW
  EXECUTE FUNCTION on_job_status_change();
