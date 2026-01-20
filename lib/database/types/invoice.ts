import type { InvoiceStatus } from "./common";

// Invoice row from database
export interface InvoiceRow {
  id: string;
  invoice_number: string;
  company_id: string;
  job_id: string | null;
  amount: number;
  status: InvoiceStatus;
  invoice_date: string;
  due_date: string;
  quickbooks_id: string | null;
  quickbooks_synced_at: string | null;
  quickbooks_data: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

export type InvoiceInsert = Omit<
  InvoiceRow,
  "id" | "created_at" | "updated_at"
> & {
  id?: string;
};

export type InvoiceUpdate = Partial<
  Omit<InvoiceRow, "id" | "created_at" | "company_id" | "quickbooks_id">
>;

// Invoice with relations for detail views
export interface InvoiceWithRelations extends InvoiceRow {
  company: {
    id: string;
    name: string;
  };
  job: {
    id: string;
    job_number: string;
  } | null;
}

// Invoice list item for tables
export interface InvoiceListItem {
  id: string;
  invoice_number: string;
  company_id: string;
  company_name: string;
  job_id: string | null;
  job_number: string | null;
  amount: number;
  status: InvoiceStatus;
  invoice_date: string;
  due_date: string;
  quickbooks_id: string | null;
  quickbooks_synced_at: string | null;
  created_at: string;
}

// Filters for querying invoices
export interface InvoiceFilters {
  status?: InvoiceStatus | InvoiceStatus[];
  company_id?: string;
  job_id?: string;
  search?: string;
  from_date?: string;
  to_date?: string;
  has_job?: boolean;
  limit?: number;
  offset?: number;
}

// Status labels for display
export const invoiceStatusLabels: Record<InvoiceStatus, string> = {
  paid: "Paid",
  unpaid: "Unpaid",
  overdue: "Overdue",
};
