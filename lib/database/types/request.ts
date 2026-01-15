import type {
  RequestStatus,
  DockType,
  PrePickupCall,
  TruckSize,
  DataDestructionService,
  PackingService,
  ServiceType,
  EquipmentItem,
  FormType,
  LogisticsFormData,
  MaterialsFormData,
} from "./common";

// Database row type (matches Supabase table)
export interface RequestRow {
  id: string;
  request_number: string;
  company_id: string;
  submitted_by: string;
  status: RequestStatus;
  form_type: FormType;
  form_data: LogisticsFormData | MaterialsFormData | Record<string, never>;

  // Common fields (used by all form types)
  address: string;
  on_site_contact_name: string | null;
  on_site_contact_email: string | null;
  on_site_contact_phone: string | null;
  preferred_date: string | null;
  additional_notes: string | null;

  // Standard form fields (nullable for other form types)
  city: string | null;
  state: string | null;
  zip_code: string | null;
  building_info: string | null;
  location_name: string | null;
  equipment_location: string | null;
  access_instructions: string | null;
  po_number: string | null;
  pre_pickup_call: PrePickupCall | null;
  accounts_payable_email: string | null;
  dock_type: DockType | null;
  dock_hours_start: string | null;
  dock_hours_end: string | null;
  dock_time_limit: string | null;
  has_freight_elevator: boolean | null;
  has_passenger_elevator: boolean | null;
  elevator_restrictions: string | null;
  can_use_handcarts: boolean | null;
  protective_floor_covering: boolean | null;
  protective_floor_covering_details: string | null;
  max_truck_size: TruckSize | null;
  coi_required: boolean | null;
  coi_sample_path: string | null;
  equipment_unplugged_confirmed: boolean | null;
  preferred_date_range_end: string | null;
  unavailable_dates: string | null;
  equipment: EquipmentItem[] | null;
  estimated_weight: string | null;
  equipment_file_paths: string[] | null;
  has_heavy_equipment: boolean | null;
  has_hazmat_or_batteries: boolean | null;
  service_type: ServiceType | null;
  data_destruction_service: DataDestructionService | null;
  packing_service: PackingService | null;
  white_glove_service: boolean | null;
  material_prepared: boolean | null;
  material_not_prepared_details: string | null;
  packing_services_required: boolean | null;

  created_at: string;
  updated_at: string;
}

// Insert type (for creating new requests)
// Only required fields: company_id, submitted_by, status, form_type, form_data, address
export type RequestInsert = {
  company_id: string;
  submitted_by: string;
  status: RequestStatus;
  form_type: FormType;
  form_data: LogisticsFormData | MaterialsFormData | Record<string, never>;
  address: string;
  id?: string;
  request_number?: string;
} & Partial<
  Omit<
    RequestRow,
    | "id"
    | "request_number"
    | "company_id"
    | "submitted_by"
    | "status"
    | "form_type"
    | "form_data"
    | "address"
    | "created_at"
    | "updated_at"
  >
>;

// Update type (for updating requests)
export type RequestUpdate = Partial<
  Omit<
    RequestRow,
    "id" | "request_number" | "created_at" | "company_id" | "submitted_by"
  >
>;

// Extended type with joined data
export interface RequestWithRelations extends RequestRow {
  company: {
    id: string;
    name: string;
  };
  submitted_by_profile: {
    id: string;
    full_name: string | null;
    email: string;
  };
  quote?: {
    id: string;
    quote_number: string;
    status: string;
    total: number;
  } | null;
}

// List item for tables/cards
export interface RequestListItem {
  id: string;
  request_number: string;
  company_id: string;
  company_name: string;
  status: RequestStatus;
  form_type: FormType;
  preferred_date: string | null;
  location_summary: string;
  equipment_summary: string;
  equipment_count: number;
  has_data_destruction: boolean;
  has_serialization: boolean;
  has_white_glove: boolean;
  quote_id?: string;
  quote_total?: number;
  created_at: string;
}

// Filters for querying
export interface RequestFilters {
  status?: RequestStatus | RequestStatus[];
  company_id?: string;
  search?: string;
  from_date?: string;
  to_date?: string;
}
