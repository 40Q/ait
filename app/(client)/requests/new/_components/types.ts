export interface PickupRequestFormData {
  // Location
  address: string;
  city: string;
  state: string;
  zipCode: string;
  buildingInfo: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  accessInstructions: string;
  poNumber: string;

  // Schedule
  preferredDate: Date | null;

  // Equipment
  equipmentTypes: string[];
  quantities: Record<string, number>;
  estimatedWeight: string;

  // Services
  serviceType: "pickup" | "dropoff";
  hdDestruction: boolean;
  hdDestructionType: "onsite" | "offsite" | null;
  dataTapesDestruction: boolean;
  serialization: boolean;
  certificateOfDestruction: boolean;
  certificateOfRecycling: boolean;
  whiteGloveService: boolean;

  // Notes
  additionalNotes: string;
}

export const initialFormData: PickupRequestFormData = {
  address: "",
  city: "",
  state: "",
  zipCode: "",
  buildingInfo: "",
  contactName: "",
  contactEmail: "",
  contactPhone: "",
  accessInstructions: "",
  poNumber: "",
  preferredDate: null,
  equipmentTypes: [],
  quantities: {},
  estimatedWeight: "",
  serviceType: "pickup",
  hdDestruction: false,
  hdDestructionType: null,
  dataTapesDestruction: false,
  serialization: false,
  certificateOfDestruction: false,
  certificateOfRecycling: false,
  whiteGloveService: false,
  additionalNotes: "",
};

export const equipmentTypeOptions = [
  { id: "desktops", label: "Desktop Computers" },
  { id: "laptops", label: "Laptops" },
  { id: "servers", label: "Servers & Data Center Equipment" },
  { id: "hard_drives", label: "Hard Drives (loose)" },
  { id: "data_tapes", label: "Data Tapes" },
  { id: "monitors", label: "Monitors & Displays" },
  { id: "networking", label: "Networking Equipment" },
  { id: "mobile", label: "Mobile Devices" },
  { id: "printers", label: "Printers & Copiers" },
  { id: "batteries_ups", label: "Batteries & UPS" },
  { id: "cables", label: "Cables & Wiring" },
  { id: "other", label: "Other" },
];

export const steps = [
  { id: "location", title: "Location", description: "Service address" },
  { id: "schedule", title: "Schedule", description: "Preferred date" },
  { id: "equipment", title: "Equipment", description: "What to recycle" },
  { id: "services", title: "Services", description: "Additional options" },
  { id: "review", title: "Review", description: "Confirm details" },
];
