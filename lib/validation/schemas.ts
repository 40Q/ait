import { z } from "zod";
import {
  NOTIFICATION_TYPES,
  NOTIFICATION_PRIORITIES,
} from "@/lib/database/types";

// ============================================
// Common Schemas
// ============================================

export const uuidSchema = z.string().uuid("Invalid UUID format");

export const emailSchema = z
  .string()
  .min(1, "Email is required")
  .email("Invalid email format")
  .max(255, "Email must be less than 255 characters")
  .transform((val) => val.toLowerCase().trim());

export const nameSchema = z
  .string()
  .min(1, "Name is required")
  .max(100, "Name must be less than 100 characters")
  .transform((val) => val.trim());

export const phoneSchema = z
  .string()
  .max(20, "Phone must be less than 20 characters");

export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters");

// ============================================
// Admin API Schemas
// ============================================

export const inviteUserSchema = z.object({
  email: emailSchema,
  fullName: nameSchema.optional().default(""),
  companyId: uuidSchema,
  role: z.enum(["client", "admin"]).optional().default("client"),
});

export const linkInvoiceSchema = z.object({
  job_id: uuidSchema.nullable(),
});

// ============================================
// Form Schemas
// ============================================

export const loginFormSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Password is required"),
});

export const companyFormSchema = z.object({
  name: z.string().min(1, "Company name is required").max(100),
  contactEmail: z.union([z.string().email("Invalid email"), z.literal("")]),
  phone: phoneSchema,
  address: z.string().max(200),
  city: z.string().max(100),
  state: z.string().max(50),
  zip: z.string().max(10),
  quickbooksCustomerId: z.string(),
  accountsPayableEmail: z.union([z.string().email("Invalid email"), z.literal("")]).default(""),
  accountsPayablePhone: phoneSchema.default(""),
});

export const locationFormSchema = z.object({
  name: z.string().min(1, "Location name is required").max(100),
  address: z.string().min(1, "Address is required").max(200),
  city: z.string().max(100),
  state: z.string().max(50),
  zip_code: z.string().max(10),
});

export const jobFormSchema = z.object({
  company_id: z.string().min(1, "Company is required"),
  pickup_date: z.string().min(1, "Pickup date is required"),
  pickup_time_window: z.string(),
  logistics_person_name: z.string(),
  address: z.string().min(1, "Address is required"),
  city: z.string(),
  state: z.string(),
  zip_code: z.string(),
  building_info: z.string(),
  contact_name: z.string().min(1, "Contact name is required"),
  contact_email: z.union([z.string().email("Invalid email"), z.literal("")]),
  contact_phone: z.string(),
});

export const materialsFormSchema = z.object({
  hasWood: z.boolean(),
  hasMetal: z.boolean(),
  hasElectronics: z.boolean(),
  pickupLocation: z.string().min(1, "Pickup location is required"),
  siteContactName: z.string().min(1, "Site contact name is required"),
  siteContactPhone: z.string().min(1, "Site contact phone is required"),
  siteContactEmail: z.union([z.string().email("Invalid email"), z.literal("")]),
  materialsDescription: z.string(),
}).refine(
  (data) => data.hasWood || data.hasMetal || data.hasElectronics,
  { message: "Please select at least one material type", path: ["hasWood"] }
);

export const logisticsFormSchema = z.object({
  authorizedPersonName: z.string().min(1, "Authorized person name is required"),
  contactPhone: z.string().min(1, "Contact phone is required"),
  contactEmail: z.string().min(1, "Contact email is required").email("Invalid email"),
  preferredContactMethod: z.enum(["phone", "email"]),
  pickupDateRequested: z.date().nullable(),
  pickupAddress: z.string().min(1, "Pickup address is required"),
  destinationAddress: z.string().min(1, "Destination address is required"),
  coiRequired: z.boolean().nullable(),
  isMaterialPrepared: z.boolean().nullable(),
  materialFitsOnPallets: z.string(),
  numberOfPallets: z.string(),
  sizeOfPallets: z.string(),
  heightOfPalletizedMaterial: z.string(),
  estimatedWeightPerPallet: z.string(),
  needsPalletizing: z.boolean(),
  needsShrinkWrap: z.boolean(),
  needsPalletStrap: z.boolean(),
  whiteGloveService: z.boolean(),
  additionalComments: z.string(),
}).refine(
  (data) => data.isMaterialPrepared !== null,
  { message: "Please indicate if material is prepared", path: ["isMaterialPrepared"] }
);

// ============================================
// Notification Schemas
// ============================================

export const notificationPrioritySchema = z.enum(NOTIFICATION_PRIORITIES);
export const notificationTypeSchema = z.enum(NOTIFICATION_TYPES);
export const userRoleSchema = z.enum(["admin", "client"]);

export const sendExternalNotificationSchema = z.object({
  userId: uuidSchema.optional(),
  role: userRoleSchema.optional(),
  companyId: uuidSchema.optional(),
  notificationId: uuidSchema.optional(),
  title: z.string().min(1, "Title is required").max(200, "Title too long"),
  message: z.string().min(1, "Message is required").max(1000, "Message too long"),
  actionUrl: z.string().max(500).optional(),
  entityType: z.string().max(50).optional(),
  entityId: uuidSchema.optional(),
  priority: notificationPrioritySchema,
}).refine(
  (data) => data.userId || data.role || data.companyId,
  { message: "At least one target (userId, role, or companyId) is required" }
);

export const notificationPreferencesUpdateSchema = z.object({
  email_enabled: z.boolean().optional(),
  push_enabled: z.boolean().optional(),
  type_preferences: z.record(notificationTypeSchema, z.boolean()).optional(),
});

export const onesignalRegisterSchema = z.object({
  playerId: z.string().min(1, "Player ID is required").max(100, "Player ID too long"),
});

// ============================================
// Type exports
// ============================================

export type InviteUserInput = z.infer<typeof inviteUserSchema>;
export type LinkInvoiceInput = z.infer<typeof linkInvoiceSchema>;
export type LoginFormInput = z.infer<typeof loginFormSchema>;
export type CompanyFormInput = z.infer<typeof companyFormSchema>;
export type LocationFormInput = z.infer<typeof locationFormSchema>;
export type JobFormInput = z.infer<typeof jobFormSchema>;
export type MaterialsFormInput = z.infer<typeof materialsFormSchema>;
export type LogisticsFormInput = z.infer<typeof logisticsFormSchema>;
export type SendExternalNotificationInput = z.infer<typeof sendExternalNotificationSchema>;
export type NotificationPreferencesUpdateInput = z.infer<typeof notificationPreferencesUpdateSchema>;
export type OneSignalRegisterInput = z.infer<typeof onesignalRegisterSchema>;
