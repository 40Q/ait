import type { RequestStatus, JobStatus, InvoiceStatus } from "@/components/ui/status-badge";

// Company
export interface Company {
  id: string;
  name: string;
  contactEmail: string;
  loginEmail: string;
  quickbooksCustomerId?: string;
  quickbooksStatus: "connected" | "error" | "not_connected";
  status: "active" | "inactive";
  createdAt: string;
  jobCount: number;
  invoiceCount: number;
}

// Quote Line Item
export interface QuoteLineItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

// Quote Status
export type AdminQuoteStatus = "draft" | "sent" | "accepted" | "declined" | "revision_requested";

// Admin Quote
export interface AdminQuote {
  id: string;
  requestId: string;
  companyId: string;
  companyName: string;
  status: AdminQuoteStatus;
  createdAt: string;
  sentAt?: string;
  validUntil: string;
  pickupDate: string;
  pickupTimeWindow: string;
  lineItems: QuoteLineItem[];
  subtotal: number;
  discount: number;
  discountType: "amount" | "percentage";
  total: number;
  terms: string;
  revisionMessage?: string;
}

// Location
export interface Location {
  address: string;
  city: string;
  state: string;
  zipCode: string;
  buildingInfo?: string;
  equipmentLocation?: string;
  accessInstructions?: string;
}

// Contact
export interface Contact {
  name: string;
  email: string;
  phone: string;
}

// Equipment Item
export interface EquipmentItem {
  type: string;
  quantity: number;
}

// Admin Request (full details for admin view)
export interface AdminRequest {
  id: string;
  companyId: string;
  companyName: string;
  submittedAt: string;
  status: RequestStatus;

  // Location
  location: Location;

  // Contacts
  onSiteContact: Contact;
  accountsPayableEmail: string;

  // Schedule
  preferredDate: string;
  preferredDateRangeEnd?: string;
  unavailableDates?: string;

  // Facility Info
  dockType: "none" | "ground_level" | "truck_level";
  dockHours?: string;
  hasFreightElevator: boolean;
  hasPassengerElevator: boolean;
  elevatorRestrictions?: string;
  canUseHandcarts: boolean;
  protectiveFloorCovering: boolean;
  maxTruckSize?: string;

  // COI
  coiRequired: boolean;
  coiSampleFile?: string;

  // Equipment
  equipment: EquipmentItem[];
  estimatedWeight?: string;
  hasHeavyEquipment: boolean;
  hasHazmatOrBatteries: boolean;
  equipmentFiles?: string[];

  // Services
  serviceType: "pickup" | "dropoff";
  dataDestructionService: string;
  packingService: string;
  whiteGloveService: boolean;

  // Additional
  additionalNotes?: string;
  poNumber?: string;

  // Quote reference (if exists)
  quoteId?: string;
  quoteAmount?: number;
}

// Job Document
export interface JobDocument {
  id: string;
  name: string;
  type: "certificate_of_destruction" | "certificate_of_recycling" | "hd_serialization" | "asset_serialization" | "warehouse_report" | "pickup_document";
  uploadedAt: string;
  uploadedBy: string;
  fileSize: string;
  url: string;
}

// Linked Invoice
export interface LinkedInvoice {
  id: string;
  invoiceNumber: string;
  amount: number;
  status: InvoiceStatus;
  date: string;
  dueDate: string;
}

// Admin Job
export interface AdminJob {
  id: string;
  companyId: string;
  companyName: string;
  quoteId: string;
  requestId: string;
  status: JobStatus;
  createdAt: string;
  pickupDate: string;
  pickupTime?: string;
  serviceType: "pickup" | "dropoff";

  // Location & Contact
  location: Location;
  contact: Contact;

  // Equipment & Services
  equipment: EquipmentItem[];
  services: string[];

  // Timeline
  timeline: {
    pickupScheduled?: string;
    pickupComplete?: string;
    processing?: string;
    complete?: string;
  };

  // Documents & Invoices
  documents: JobDocument[];
  invoices: LinkedInvoice[];
}

// Admin Invoice (from QuickBooks)
export interface AdminInvoice {
  id: string;
  invoiceNumber: string;
  companyId: string;
  companyName: string;
  jobId?: string;
  jobName?: string;
  date: string;
  dueDate: string;
  amount: number;
  status: InvoiceStatus;
  quickbooksSyncedAt: string;
  quickbooksId: string;
}

// Activity Item (for dashboard feed)
export interface ActivityItem {
  id: string;
  type: "request_submitted" | "quote_sent" | "quote_accepted" | "quote_declined" | "job_status_changed" | "document_uploaded" | "invoice_synced";
  description: string;
  companyName: string;
  timestamp: string;
  link?: string;
}

// Dashboard Stats
export interface DashboardStats {
  pendingRequests: number;
  quotesAwaitingResponse: number;
  jobsNeedingDocuments: number;
  totalCompanies: number;
  activeJobs: number;
  completedJobsThisMonth: number;
  outstandingInvoices: number;
  outstandingAmount: number;
}

// Service Templates for Quote Creation
export const serviceTemplates = [
  { id: "pickup_transport", label: "Equipment Pickup & Transport", defaultPrice: 250 },
  { id: "laptop_recycling", label: "Laptop Recycling (per unit)", defaultPrice: 25 },
  { id: "desktop_recycling", label: "Desktop Recycling (per unit)", defaultPrice: 35 },
  { id: "server_recycling", label: "Server Recycling (per unit)", defaultPrice: 75 },
  { id: "monitor_recycling", label: "Monitor Recycling (per unit)", defaultPrice: 15 },
  { id: "hd_destruction", label: "Hard Drive Destruction (per unit)", defaultPrice: 15 },
  { id: "hd_serialization", label: "HD Serialization (per unit)", defaultPrice: 5 },
  { id: "onsite_destruction", label: "On-Site HD Destruction", defaultPrice: 500 },
  { id: "data_tape_destruction", label: "Data Tape Destruction (per unit)", defaultPrice: 10 },
  { id: "certificate_destruction", label: "Certificate of Destruction", defaultPrice: 50 },
  { id: "certificate_recycling", label: "Certificate of Recycling", defaultPrice: 25 },
  { id: "white_glove", label: "White Glove Service", defaultPrice: 350 },
  { id: "palletizing", label: "Palletizing Service", defaultPrice: 150 },
  { id: "shrink_wrap", label: "Shrink Wrap Service", defaultPrice: 75 },
];

// Terms Templates
export const termsTemplates = [
  {
    id: "standard",
    label: "Standard Terms",
    content: "Payment due within 30 days of service completion. All equipment will be processed in accordance with NIST 800-88 and IEEE 2883-2022 standards. Certificate of Destruction will be provided within 5 business days of processing completion.",
  },
  {
    id: "net15",
    label: "Net 15 Terms",
    content: "Payment due within 15 days of service completion. All equipment will be processed in accordance with NIST 800-88 and IEEE 2883-2022 standards. Certificate of Destruction will be provided within 5 business days of processing completion.",
  },
  {
    id: "prepaid",
    label: "Prepaid Terms",
    content: "Payment required prior to service. All equipment will be processed in accordance with NIST 800-88 and IEEE 2883-2022 standards. Certificate of Destruction will be provided within 5 business days of processing completion.",
  },
];
