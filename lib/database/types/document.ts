import type { DocumentType } from "./common";

// Document row
export interface DocumentRow {
  id: string;
  job_id: string;
  company_id: string;
  name: string;
  document_type: DocumentType;
  file_path: string;
  file_size: number | null;
  mime_type: string | null;
  uploaded_by: string;
  created_at: string;
}

export type DocumentInsert = Omit<DocumentRow, "id" | "created_at"> & {
  id?: string;
};

export type DocumentUpdate = Partial<
  Omit<DocumentRow, "id" | "job_id" | "company_id" | "uploaded_by" | "created_at">
>;

// Document with relations
export interface DocumentWithRelations extends DocumentRow {
  job: {
    id: string;
    job_number: string;
  };
  company: {
    id: string;
    name: string;
  };
  uploaded_by_profile: {
    id: string;
    full_name: string | null;
    email: string;
  };
}

// List item for tables
export interface DocumentListItem {
  id: string;
  name: string;
  document_type: DocumentType;
  job_id: string;
  job_number: string;
  company_id: string;
  company_name: string;
  file_path: string;
  file_size: number | null;
  uploaded_by_name: string;
  created_at: string;
}

// Filters for querying
export interface DocumentFilters {
  document_type?: DocumentType | DocumentType[];
  job_id?: string;
  company_id?: string;
  search?: string;
}

// Document type labels for display
export const documentTypeLabels: Record<DocumentType, string> = {
  certificate_of_destruction: "Certificate of Destruction",
  certificate_of_recycling: "Certificate of Recycling",
  hd_serialization: "HD Serialization Report",
  asset_serialization: "Asset Serialization Report",
  warehouse_report: "Warehouse Processing Report",
  pickup_document: "Pickup Document",
  miscellaneous: "Miscellaneous",
};

// Document type short labels
export const documentTypeShortLabels: Record<DocumentType, string> = {
  certificate_of_destruction: "COD",
  certificate_of_recycling: "COR",
  hd_serialization: "HD Serial",
  asset_serialization: "Asset Serial",
  warehouse_report: "Warehouse",
  pickup_document: "Pickup",
  miscellaneous: "Misc",
};
