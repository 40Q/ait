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
}
