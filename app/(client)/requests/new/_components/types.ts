export type DataDestructionService =
  | "none"
  | "hd_destruction_cod" // Hard Drive Destruction with Certificate of Destruction
  | "hd_serialization_cod" // Hard Drive Serialization and Destruction with COD
  | "onsite_hd_serialization_cod" // On-Site Hard Drive Serialization and Destruction with COD
  | "asset_serialization_cor"; // Asset Serialization with Certificate of Recycling

export type PrePickupCallPreference = "none" | "30_min" | "1_hour";

export type PackingService =
  | "none" // Customer packed/wrapped - ready to go
  | "shrink_wrap_only" // Equipment packed/palletized, just wrap
  | "palletize_wrap" // Equipment in boxes, palletize and wrap
  | "full_pack" // All equipment loose, full pack/palletize/wrap

export type TruckSize =
  | "cargo_van"
  | "16ft_box"
  | "24ft_box"
  | "26ft_box"
  | "48ft_trailer"
  | "53ft_trailer";

export type DockType = "none" | "ground_level" | "truck_level";

export interface PickupRequestFormData {
  // Location
  address: string;
  city: string;
  state: string;
  zipCode: string;
  buildingInfo: string;
  locationName: string; // Location name if different from client name
  equipmentLocation: string; // Where in building (floor, telco closet, warehouse, etc.)
  accessInstructions: string;
  poNumber: string;
  saveLocationForFuture: boolean; // Save this location for future requests

  // On-Site Contact (person who meets team on day of services)
  onSiteContactName: string;
  onSiteContactEmail: string;
  onSiteContactPhone: string;
  prePickupCall: PrePickupCallPreference;

  // Accounts Payable
  accountsPayableEmail: string;

  // Facility Info - Dock
  dockType: DockType;
  dockHoursStart: string;
  dockHoursEnd: string;
  dockTimeLimit: string; // Any time limits for dock usage

  // Facility Info - Elevators
  hasFreightElevator: boolean;
  hasPassengerElevator: boolean;
  elevatorRestrictions: string; // Time limits, padding requirements, etc.

  // Facility Info - Access
  canUseHandcarts: boolean; // Can handcarts/pallet jacks be used in building
  protectiveFloorCovering: boolean; // Is protective floor covering required
  protectiveFloorCoveringDetails: string;
  maxTruckSize: TruckSize | "";

  // COI (Certificate of Insurance)
  coiRequired: boolean;
  coiSampleFile: File | null; // Actual file object for upload
  coiSamplePath: string | null; // Storage path after upload (used in DB)

  // Equipment Confirmation
  equipmentUnpluggedConfirmed: boolean;

  // Schedule
  preferredDate: Date | null;
  preferredDateRangeEnd: Date | null; // For date ranges
  unavailableDates: string; // Dates/times POC will NOT be available

  // Equipment
  equipmentTypes: string[];
  quantities: Record<string, number>;
  equipmentDetails: Record<string, string>; // Additional details per equipment type
  estimatedWeight: string;
  equipmentFiles: File[]; // Photo or inventory list uploads (local)
  equipmentFilePaths: string[]; // Storage paths after upload (used in DB)

  // General Questions
  hasHeavyEquipment: boolean; // Equipment too large/heavy for one person
  hasHazmatOrBatteries: boolean; // Batteries or hazardous materials

  // Services
  serviceType: "pickup" | "dropoff";
  dataDestructionService: DataDestructionService;
  packingService: PackingService;
  whiteGloveService: boolean;

  // Material Preparation
  materialPrepared: boolean | null; // Is material prepared for pickup? (palletized, wrapped, secured)
  materialNotPreparedDetails: string; // Explanation if not prepared
  packingServicesRequired: boolean; // Do they need packing/palletizing services?

  // Legacy fields (keeping for backward compatibility, to be removed later)
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  hdDestruction: boolean;
  hdDestructionType: "onsite" | "offsite" | null;
  dataTapesDestruction: boolean;
  serialization: boolean;
  certificateOfDestruction: boolean;
  certificateOfRecycling: boolean;
  hasDock: boolean;

  // Notes
  additionalNotes: string;
}

export const initialFormData: PickupRequestFormData = {
  // Location
  address: "",
  city: "",
  state: "",
  zipCode: "",
  buildingInfo: "",
  locationName: "",
  equipmentLocation: "",
  accessInstructions: "",
  poNumber: "",
  saveLocationForFuture: false,

  // On-Site Contact
  onSiteContactName: "",
  onSiteContactEmail: "",
  onSiteContactPhone: "",
  prePickupCall: "none",

  // Accounts Payable
  accountsPayableEmail: "",

  // Facility Info - Dock
  dockType: "none",
  dockHoursStart: "",
  dockHoursEnd: "",
  dockTimeLimit: "",

  // Facility Info - Elevators
  hasFreightElevator: false,
  hasPassengerElevator: false,
  elevatorRestrictions: "",

  // Facility Info - Access
  canUseHandcarts: true,
  protectiveFloorCovering: false,
  protectiveFloorCoveringDetails: "",
  maxTruckSize: "",

  // COI
  coiRequired: false,
  coiSampleFile: null,
  coiSamplePath: null,

  // Equipment Confirmation
  equipmentUnpluggedConfirmed: false,

  // Schedule
  preferredDate: null,
  preferredDateRangeEnd: null,
  unavailableDates: "",

  // Equipment
  equipmentTypes: [],
  quantities: {},
  equipmentDetails: {},
  estimatedWeight: "",
  equipmentFiles: [],
  equipmentFilePaths: [],

  // General Questions
  hasHeavyEquipment: false,
  hasHazmatOrBatteries: false,

  // Services
  serviceType: "pickup",
  dataDestructionService: "none",
  packingService: "none",
  whiteGloveService: false,

  // Material Preparation
  materialPrepared: null,
  materialNotPreparedDetails: "",
  packingServicesRequired: false,

  // Legacy fields
  contactName: "",
  contactEmail: "",
  contactPhone: "",
  hdDestruction: false,
  hdDestructionType: null,
  dataTapesDestruction: false,
  serialization: false,
  certificateOfDestruction: false,
  certificateOfRecycling: false,
  hasDock: false,

  // Notes
  additionalNotes: "",
};

export const equipmentTypeOptions = [
  { id: "desktops", label: "PC/MAC Desktops" },
  { id: "laptops", label: "Laptops" },
  { id: "servers", label: "Servers & Data Center Equipment" },
  { id: "hard_drives", label: "Hard Drives (itemized/loose)" },
  { id: "data_tapes", label: "Data Tapes" },
  { id: "lcd_monitors", label: "LCD Monitors" },
  { id: "crt_monitors", label: "CRT Monitors" },
  { id: "networking", label: "Networking Equipment" },
  { id: "cellphones", label: "Cell Phones / PDAs" },
  { id: "telephones", label: "Telephones" },
  { id: "tvs", label: "TVs" },
  { id: "printers", label: "Printers / Fax / Scanners" },
  { id: "copiers_plotters", label: "Copiers / Plotters / Large Printers" },
  { id: "ups", label: "UPS (Uninterruptible Power Supply)" },
  { id: "racks", label: "Racks" },
  { id: "vcr_dvd", label: "VCR / DVD Players" },
  { id: "misc_box", label: "Box of Miscellaneous Assets" },
  { id: "misc_gaylord", label: "Misc. Gaylord of Equipment" },
  { id: "misc_assets", label: "Miscellaneous Assets" },
];

export const dataDestructionOptions = [
  {
    value: "none",
    label: "No Data Destruction Services",
    description: "Standard recycling without data destruction",
  },
  {
    value: "hd_destruction_cod",
    label: "Hard Drive Destruction with COD",
    description:
      "Physical destruction of hard drives with Certificate of Destruction",
  },
  {
    value: "hd_serialization_cod",
    label: "Hard Drive Serialization and Destruction with COD",
    description:
      "Serial numbers recorded before destruction with Certificate of Destruction",
  },
  {
    value: "onsite_hd_serialization_cod",
    label: "On-Site Hard Drive Serialization and Destruction with COD",
    description:
      "Destruction performed at your location with serialization and Certificate of Destruction",
  },
  {
    value: "asset_serialization_cor",
    label: "Asset Serialization with Certificate of Recycling",
    description:
      "For non-data-storing devices that require serialization for tracking and security",
  },
];

export const packingServiceOptions = [
  {
    value: "none",
    label: "Customer Packed/Wrapped",
    description: "Equipment is already packed, palletized, and wrapped - ready to go",
  },
  {
    value: "shrink_wrap_only",
    label: "Shrink Wrap Only",
    description: "Equipment is packed/palletized by client - crew will wrap pallets",
  },
  {
    value: "palletize_wrap",
    label: "Palletize and Wrap",
    description: "Equipment is in boxes or large enough to palletize - crew will palletize and wrap",
  },
  {
    value: "full_pack",
    label: "Full Pack/Palletize/Wrap",
    description: "All equipment is loose - crew will pack, palletize, and wrap",
  },
];

export const truckSizeOptions = [
  { value: "cargo_van", label: "Cargo Van" },
  { value: "16ft_box", label: "16ft Box Truck" },
  { value: "24ft_box", label: "24ft Box Truck" },
  { value: "26ft_box", label: "26ft Box Truck" },
  { value: "48ft_trailer", label: "48ft Trailer" },
  { value: "53ft_trailer", label: "53ft Trailer" },
];

export const prePickupCallOptions = [
  { value: "none", label: "No pre-pickup call needed" },
  { value: "30_min", label: "Call 30 minutes prior to arrival" },
  { value: "1_hour", label: "Call 1 hour prior to arrival" },
];

export const dockTypeOptions = [
  { value: "none", label: "No dock available (liftgate required)" },
  { value: "ground_level", label: "Ground level dock (liftgate required)" },
  { value: "truck_level", label: "Standard height / truck level dock" },
];

export const steps = [
  { id: "location", title: "Location", description: "Service address" },
  { id: "schedule", title: "Schedule", description: "Preferred date" },
  { id: "equipment", title: "Equipment", description: "What to recycle" },
  { id: "services", title: "Services", description: "Additional options" },
  { id: "review", title: "Review", description: "Confirm details" },
];

/**
 * Maps form data to the database insert format
 */
export function mapFormDataToRequestInsert(
  formData: PickupRequestFormData,
  companyId: string,
  userId: string
) {
  // Convert equipment types and quantities to EquipmentItem array
  const equipment = formData.equipmentTypes.map((type) => ({
    type,
    quantity: formData.quantities[type] || 1,
    details: formData.equipmentDetails[type] || undefined,
  }));

  return {
    company_id: companyId,
    submitted_by: userId,
    status: "pending" as const,
    form_type: "standard" as const,
    form_data: {},
    address: formData.address,
    city: formData.city,
    state: formData.state,
    zip_code: formData.zipCode,
    building_info: formData.buildingInfo || null,
    location_name: formData.locationName || null,
    equipment_location: formData.equipmentLocation || null,
    access_instructions: formData.accessInstructions || null,
    po_number: formData.poNumber || null,
    on_site_contact_name: formData.onSiteContactName,
    on_site_contact_email: formData.onSiteContactEmail,
    on_site_contact_phone: formData.onSiteContactPhone,
    pre_pickup_call: formData.prePickupCall,
    accounts_payable_email: formData.accountsPayableEmail || null,
    dock_type: formData.dockType,
    dock_hours_start: formData.dockHoursStart || null,
    dock_hours_end: formData.dockHoursEnd || null,
    dock_time_limit: formData.dockTimeLimit || null,
    has_freight_elevator: formData.hasFreightElevator,
    has_passenger_elevator: formData.hasPassengerElevator,
    elevator_restrictions: formData.elevatorRestrictions || null,
    can_use_handcarts: formData.canUseHandcarts,
    protective_floor_covering: formData.protectiveFloorCovering,
    protective_floor_covering_details: formData.protectiveFloorCoveringDetails || null,
    max_truck_size: formData.maxTruckSize || null,
    coi_required: formData.coiRequired,
    coi_sample_path: formData.coiSamplePath,
    equipment_unplugged_confirmed: formData.equipmentUnpluggedConfirmed,
    preferred_date: formData.preferredDate?.toISOString() || null,
    preferred_date_range_end: formData.preferredDateRangeEnd?.toISOString() || null,
    unavailable_dates: formData.unavailableDates || null,
    equipment,
    estimated_weight: formData.estimatedWeight || null,
    equipment_file_paths: formData.equipmentFilePaths,
    has_heavy_equipment: formData.hasHeavyEquipment,
    has_hazmat_or_batteries: formData.hasHazmatOrBatteries,
    service_type: formData.serviceType,
    data_destruction_service: formData.dataDestructionService,
    packing_service: formData.packingService,
    white_glove_service: formData.whiteGloveService,
    material_prepared: formData.materialPrepared,
    material_not_prepared_details: formData.materialNotPreparedDetails || null,
    packing_services_required: formData.packingServicesRequired,
    additional_notes: formData.additionalNotes || null,
  };
}
