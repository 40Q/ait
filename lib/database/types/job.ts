import type { JobStatus, Location, Contact, EquipmentItem, DocumentType } from "./common";

// Job row
export interface JobRow {
  id: string;
  job_number: string;
  quote_id: string;
  request_id: string;
  company_id: string;
  status: JobStatus;
  pickup_date: string;
  pickup_time_window: string | null;
  location: Location;
  contact: Contact;
  equipment: EquipmentItem[];
  services: string[];
  pickup_scheduled_at: string | null;
  pickup_complete_at: string | null;
  processing_started_at: string | null;
  completed_at: string | null;
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
}

export type JobInsert = Omit<
  JobRow,
  "id" | "job_number" | "created_at" | "updated_at"
> & {
  id?: string;
  job_number?: string;
};

export type JobUpdate = Partial<
  Omit<
    JobRow,
    | "id"
    | "job_number"
    | "created_at"
    | "company_id"
    | "quote_id"
    | "request_id"
  >
>;

// Job with all relations
export interface JobWithRelations extends JobRow {
  quote: {
    id: string;
    quote_number: string;
    total: number;
  };
  request: {
    id: string;
    request_number: string;
  };
  company: {
    id: string;
    name: string;
  };
  documents: DocumentSummary[];
  invoices: InvoiceSummary[];
}

// Summary types for nested relations
interface DocumentSummary {
  id: string;
  name: string;
  document_type: DocumentType;
  file_url: string;
  created_at: string;
}

interface InvoiceSummary {
  id: string;
  invoice_number: string;
  amount: number;
  status: string;
  due_date: string;
}

// List item for tables
export interface JobListItem {
  id: string;
  job_number: string;
  company_id: string;
  company_name: string;
  status: JobStatus;
  pickup_date: string;
  location_summary: string;
  equipment_summary: string;
  equipment_count: number;
  document_count: number;
  invoice_total: number | null;
  invoice_status: string | null;
  created_at: string;
}

// Filters for querying
export interface JobFilters {
  status?: JobStatus | JobStatus[];
  company_id?: string;
  search?: string;
  from_date?: string;
  to_date?: string;
  has_invoice?: boolean;
}

// Job timeline for display
export interface JobTimeline {
  pickup_scheduled_at: string | null;
  pickup_complete_at: string | null;
  processing_started_at: string | null;
  completed_at: string | null;
}

// Status transition rules
export const jobStatusTransitions: Record<JobStatus, JobStatus[]> = {
  pickup_scheduled: ["pickup_complete"],
  pickup_complete: ["processing"],
  processing: ["complete"],
  complete: [],
};

export const jobStatusLabels: Record<JobStatus, string> = {
  pickup_scheduled: "Pickup Scheduled",
  pickup_complete: "Pickup Complete",
  processing: "Processing",
  complete: "Complete",
};
