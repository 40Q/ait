// Common types shared across entities

export type RequestStatus = "pending" | "quote_ready" | "revision_requested" | "accepted" | "declined";

export type QuoteStatus =
  | "draft"
  | "sent"
  | "accepted"
  | "declined"
  | "revision_requested";

export type JobStatus =
  | "pickup_scheduled"
  | "pickup_complete"
  | "processing"
  | "pending_cod"
  | "complete";

export type InvoiceStatus = "paid" | "unpaid" | "overdue";

export type DocumentType =
  | "certificate_of_destruction"
  | "certificate_of_recycling"
  | "hd_serialization"
  | "asset_serialization"
  | "warehouse_report"
  | "pickup_document";

export type DockType = "none" | "ground_level" | "truck_level";

export type PrePickupCall = "none" | "30_min" | "1_hour";

export type TruckSize =
  | "cargo_van"
  | "16ft_box"
  | "24ft_box"
  | "26ft_box"
  | "48ft_trailer"
  | "53ft_trailer";

export type DataDestructionService =
  | "none"
  | "hd_destruction_cod"
  | "hd_serialization_cod"
  | "onsite_hd_serialization_cod"
  | "asset_serialization_cor";

export type PackingService =
  | "none"
  | "shrink_wrap_only"
  | "palletize_wrap"
  | "full_pack";

export type ServiceType = "pickup" | "dropoff";

export type DiscountType = "amount" | "percentage";

export type FormType = "standard" | "logistics" | "materials";

// Form-specific data structures stored in form_data JSONB
export interface LogisticsFormData {
  destination_address: string;
  preferred_contact_method: "phone" | "email";
  material_fits_on_pallets: string;
  number_of_pallets: string;
  size_of_pallets: string;
  height_of_palletized_material: string;
  estimated_weight_per_pallet: string;
  needs_palletizing: boolean;
  needs_shrink_wrap: boolean;
  needs_pallet_strap: boolean;
}

export interface MaterialsFormData {
  has_wood: boolean;
  has_metal: boolean;
  has_electronics: boolean;
  materials_description: string;
}

// Shared JSON structures
export interface EquipmentItem {
  type: string;
  quantity: number;
  details?: string;
}

export interface Location {
  address: string;
  city: string;
  state: string;
  zip_code: string;
  building_info?: string;
  equipment_location?: string;
  access_instructions?: string;
}

export interface Contact {
  name: string;
  email: string;
  phone: string;
}

// Pagination
export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Query keys for TanStack Query
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type FilterObject = Record<string, any>;

export const queryKeys = {
  requests: {
    all: ["requests"] as const,
    lists: () => [...queryKeys.requests.all, "list"] as const,
    list: (filters?: FilterObject) =>
      [...queryKeys.requests.lists(), filters] as const,
    details: () => [...queryKeys.requests.all, "detail"] as const,
    detail: (id: string) => [...queryKeys.requests.details(), id] as const,
  },
  quotes: {
    all: ["quotes"] as const,
    lists: () => [...queryKeys.quotes.all, "list"] as const,
    list: (filters?: FilterObject) =>
      [...queryKeys.quotes.lists(), filters] as const,
    details: () => [...queryKeys.quotes.all, "detail"] as const,
    detail: (id: string) => [...queryKeys.quotes.details(), id] as const,
  },
  jobs: {
    all: ["jobs"] as const,
    lists: () => [...queryKeys.jobs.all, "list"] as const,
    list: (filters?: FilterObject) =>
      [...queryKeys.jobs.lists(), filters] as const,
    details: () => [...queryKeys.jobs.all, "detail"] as const,
    detail: (id: string) => [...queryKeys.jobs.details(), id] as const,
  },
  documents: {
    all: ["documents"] as const,
    lists: () => [...queryKeys.documents.all, "list"] as const,
    list: (filters?: FilterObject) =>
      [...queryKeys.documents.lists(), filters] as const,
    byJob: (jobId: string) =>
      [...queryKeys.documents.all, "job", jobId] as const,
  },
  invoices: {
    all: ["invoices"] as const,
    lists: () => [...queryKeys.invoices.all, "list"] as const,
    list: (filters?: FilterObject) =>
      [...queryKeys.invoices.lists(), filters] as const,
    details: () => [...queryKeys.invoices.all, "detail"] as const,
    detail: (id: string) => [...queryKeys.invoices.details(), id] as const,
  },
  companies: {
    all: ["companies"] as const,
    lists: () => [...queryKeys.companies.all, "list"] as const,
    list: (filters?: FilterObject) =>
      [...queryKeys.companies.lists(), filters] as const,
    details: () => [...queryKeys.companies.all, "detail"] as const,
    detail: (id: string) => [...queryKeys.companies.details(), id] as const,
  },
  dashboard: {
    stats: (role: "admin" | "client") => ["dashboard", "stats", role] as const,
    activity: () => ["dashboard", "activity"] as const,
  },
} as const;
