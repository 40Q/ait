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
  // Client Info
  clientName: string;

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
  coiSampleFile: string | null; // File path/URL for uploaded sample COI

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
  equipmentFiles: File[]; // Photo or inventory list uploads

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
  // Client Info
  clientName: "",

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
