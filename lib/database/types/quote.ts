import type { QuoteStatus, DiscountType } from "./common";

// Line item row
export interface QuoteLineItemRow {
  id: string;
  quote_id: string;
  description: string;
  quantity: number;
  unit_price: number;
  total: number;
  sort_order: number;
  created_at: string;
}

export type QuoteLineItemInsert = Omit<
  QuoteLineItemRow,
  "id" | "created_at"
> & {
  id?: string;
};

export type QuoteLineItemUpdate = Partial<
  Omit<QuoteLineItemRow, "id" | "quote_id" | "created_at">
>;

// Quote row
export interface QuoteRow {
  id: string;
  quote_number: string;
  request_id: string;
  company_id: string;
  created_by: string;
  status: QuoteStatus;
  pickup_date: string | null;
  pickup_time_window: string | null;
  valid_until: string;
  subtotal: number;
  discount: number;
  discount_type: DiscountType;
  total: number;
  terms: string | null;
  revision_message: string | null;
  decline_reason: string | null;
  accepted_at: string | null;
  accepted_by: string | null;
  signature_name: string | null;
  sent_at: string | null;
  created_at: string;
  updated_at: string;
}

export type QuoteInsert = Omit<
  QuoteRow,
  | "id"
  | "quote_number"
  | "created_at"
  | "updated_at"
  | "accepted_at"
  | "accepted_by"
  | "signature_name"
  | "sent_at"
> & {
  id?: string;
  quote_number?: string;
};

export type QuoteUpdate = Partial<
  Omit<
    QuoteRow,
    | "id"
    | "quote_number"
    | "created_at"
    | "company_id"
    | "request_id"
    | "created_by"
  >
>;

// Client response to a quote
export interface QuoteResponse {
  status: "accepted" | "declined" | "revision_requested";
  revision_message?: string;
  decline_reason?: string;
  signature_name?: string;
}

// Quote with all relations
export interface QuoteWithRelations extends QuoteRow {
  request: {
    id: string;
    request_number: string;
    address: string;
    city: string;
    state: string;
  };
  company: {
    id: string;
    name: string;
  };
  line_items: QuoteLineItemRow[];
  created_by_profile: {
    id: string;
    full_name: string | null;
    email: string;
  };
}

// List item for tables
export interface QuoteListItem {
  id: string;
  quote_number: string;
  request_id: string;
  request_number: string;
  company_id: string;
  company_name: string;
  status: QuoteStatus;
  pickup_date: string | null;
  total: number;
  valid_until: string;
  created_at: string;
  sent_at: string | null;
}

// Filters for querying
export interface QuoteFilters {
  status?: QuoteStatus | QuoteStatus[];
  company_id?: string;
  request_id?: string;
  search?: string;
  limit?: number;
  offset?: number;
}

// Service templates for creating quotes
export interface ServiceTemplate {
  id: string;
  label: string;
  defaultPrice: number;
}

export const serviceTemplates: ServiceTemplate[] = [
  { id: "pickup_transport", label: "Equipment Pickup & Transport", defaultPrice: 250 },
  { id: "laptop_recycling", label: "Laptop Recycling (per unit)", defaultPrice: 25 },
  { id: "desktop_recycling", label: "Desktop Recycling (per unit)", defaultPrice: 35 },
  { id: "server_recycling", label: "Server Recycling (per unit)", defaultPrice: 75 },
  { id: "hd_destruction", label: "Hard Drive Destruction (per unit)", defaultPrice: 15 },
  { id: "hd_serialization", label: "HD Serialization & Destruction (per unit)", defaultPrice: 25 },
  { id: "onsite_destruction", label: "On-Site HD Destruction (per unit)", defaultPrice: 35 },
  { id: "asset_serialization", label: "Asset Serialization (per unit)", defaultPrice: 10 },
  { id: "packing_service", label: "Packing Service (per hour)", defaultPrice: 85 },
  { id: "white_glove", label: "White Glove Service", defaultPrice: 500 },
  { id: "crt_disposal", label: "CRT Monitor Disposal (per unit)", defaultPrice: 45 },
  { id: "ups_battery", label: "UPS/Battery Disposal (per unit)", defaultPrice: 35 },
  { id: "rush_service", label: "Rush Service Fee", defaultPrice: 200 },
];

// Terms templates
export interface TermsTemplate {
  id: string;
  label: string;
  content: string;
}

export const termsTemplates: TermsTemplate[] = [
  {
    id: "standard",
    label: "Standard Terms (Net 30)",
    content:
      "Payment is due within 30 days of invoice date. Services will be performed in accordance with industry standards for IT asset disposition and data destruction.",
  },
  {
    id: "net15",
    label: "Net 15 Terms",
    content:
      "Payment is due within 15 days of invoice date. Services will be performed in accordance with industry standards for IT asset disposition and data destruction.",
  },
  {
    id: "prepaid",
    label: "Prepaid Terms",
    content:
      "Full payment is required prior to service delivery. Services will be performed in accordance with industry standards for IT asset disposition and data destruction.",
  },
];
