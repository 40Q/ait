// Company types (extends existing companies table)

export type CompanyStatus = "active" | "inactive";

export type QuickBooksStatus = "connected" | "error" | "not_connected";

// Company row (matches existing table + computed fields)
export interface CompanyRow {
  id: string;
  name: string;
  contact_email: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  quickbooks_customer_id: string | null;
  status: CompanyStatus;
  // Accounts Payable contact
  accounts_payable_email: string | null;
  accounts_payable_phone: string | null;
  created_at: string;
  updated_at: string;
}

export type CompanyInsert = Omit<
  CompanyRow,
  "id" | "created_at" | "updated_at"
> & {
  id?: string;
};

export type CompanyUpdate = Partial<
  Omit<CompanyRow, "id" | "created_at">
>;

// Company with computed stats
export interface CompanyWithStats extends CompanyRow {
  job_count: number;
  active_job_count: number;
  request_count: number;
  pending_request_count: number;
  invoice_count: number;
  outstanding_amount: number;
  quickbooks_status: QuickBooksStatus;
}

// List item for tables
export interface CompanyListItem {
  id: string;
  name: string;
  contact_email: string | null;
  status: CompanyStatus;
  job_count: number;
  pending_request_count: number;
  quickbooks_status: QuickBooksStatus;
  created_at: string;
}

// Filters for querying
export interface CompanyFilters {
  status?: CompanyStatus;
  quickbooks_status?: QuickBooksStatus;
  search?: string;
  limit?: number;
  offset?: number;
}

// ============================================
// COMPANY LOCATIONS
// ============================================

export interface CompanyLocationRow {
  id: string;
  company_id: string;
  name: string;  // e.g., "Main Office", "Warehouse"
  address: string;
  city: string;
  state: string;
  zip_code: string;
  building_info: string | null;
  equipment_location: string | null;
  access_instructions: string | null;
  dock_type: "none" | "ground_level" | "truck_level";
  dock_hours_start: string | null;
  dock_hours_end: string | null;
  has_freight_elevator: boolean;
  has_passenger_elevator: boolean;
  elevator_restrictions: string | null;
  can_use_handcarts: boolean;
  protective_floor_covering: boolean;
  max_truck_size: string | null;
  contact_name: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  is_primary: boolean;
  created_at: string;
  updated_at: string;
}

export type CompanyLocationInsert = Omit<
  CompanyLocationRow,
  | "id"
  | "created_at"
  | "updated_at"
  | "building_info"
  | "equipment_location"
  | "access_instructions"
  | "dock_hours_start"
  | "dock_hours_end"
  | "elevator_restrictions"
  | "max_truck_size"
  | "contact_name"
  | "contact_email"
  | "contact_phone"
> & {
  id?: string;
  building_info?: string | null;
  equipment_location?: string | null;
  access_instructions?: string | null;
  dock_hours_start?: string | null;
  dock_hours_end?: string | null;
  elevator_restrictions?: string | null;
  max_truck_size?: string | null;
  contact_name?: string | null;
  contact_email?: string | null;
  contact_phone?: string | null;
};

export type CompanyLocationUpdate = Partial<
  Omit<CompanyLocationRow, "id" | "company_id" | "created_at">
>;

// List item for location dropdown
export interface CompanyLocationListItem {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  is_primary: boolean;
}
