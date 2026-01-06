"use client";

import { use } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge, type RequestStatus } from "@/components/ui/status-badge";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  MapPin,
  Calendar,
  User,
  Phone,
  Mail,
  Truck,
  Package,
  HardDrive,
  FileText,
  Sparkles,
  Clock,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  MessageSquare,
} from "lucide-react";

// Mock request data - would be fetched based on ID
const requestData = {
  id: "REQ-2024-0048",
  companyId: "1",
  companyName: "Acme Corporation",
  submittedAt: "December 18, 2024 at 9:15 AM",
  status: "pending" as RequestStatus,

  // Location
  location: {
    address: "123 Main Street",
    city: "Los Angeles",
    state: "CA",
    zipCode: "90001",
    buildingInfo: "Suite 400, 4th Floor",
    equipmentLocation: "Server room and IT closet on 4th floor",
    accessInstructions:
      "Check in with security at front desk. Loading dock on east side of building.",
  },

  // Contacts
  onSiteContact: {
    name: "John Smith",
    email: "john.smith@acme.com",
    phone: "(555) 123-4567",
  },
  accountsPayableEmail: "ap@acme.com",

  // Schedule
  preferredDate: "December 22, 2024",
  preferredDateRangeEnd: "December 27, 2024",
  unavailableDates: "December 24-25 (Holiday)",

  // Facility Info
  dockType: "truck_level" as const,
  dockHours: "7:00 AM - 4:00 PM",
  hasFreightElevator: true,
  hasPassengerElevator: true,
  elevatorRestrictions: "Freight elevator requires 30-min advance booking",
  canUseHandcarts: true,
  protectiveFloorCovering: true,
  maxTruckSize: "26ft_box",

  // COI
  coiRequired: true,

  // Equipment
  equipment: [
    { type: "Laptops", quantity: 25 },
    { type: "Desktop Computers", quantity: 10 },
    { type: "Hard Drives (loose)", quantity: 50 },
    { type: "Servers", quantity: 3 },
    { type: "Monitors", quantity: 15 },
  ],
  estimatedWeight: "Approximately 2,000 lbs",
  hasHeavyEquipment: true,
  hasHazmatOrBatteries: false,

  // Services
  serviceType: "pickup" as const,
  dataDestructionService: "hd_serialization_cod",
  packingService: "palletize_wrap",
  whiteGloveService: false,

  // Additional
  poNumber: "PO-2024-1234",
  additionalNotes:
    "Please call 30 minutes before arrival. Building has limited parking - recommend arriving early. Some servers are still rack-mounted and will need to be removed.",

  // Timeline
  timeline: [
    {
      event: "Request Submitted",
      timestamp: "Dec 18, 2024 at 9:15 AM",
      by: "Client",
    },
  ],
};

const dataDestructionLabels: Record<string, string> = {
  none: "No Data Destruction",
  hd_destruction_cod: "HD Destruction with Certificate",
  hd_serialization_cod: "HD Serialization & Destruction with Certificate",
  onsite_hd_serialization_cod: "On-Site HD Serialization & Destruction with Certificate",
  asset_serialization_cor: "Asset Serialization with Certificate of Recycling",
};

const packingServiceLabels: Record<string, string> = {
  none: "Customer Packed (Ready to Go)",
  shrink_wrap_only: "Shrink Wrap Only",
  palletize_wrap: "Palletize and Wrap",
  full_pack: "Full Pack/Palletize/Wrap",
};

const dockTypeLabels: Record<string, string> = {
  none: "No Dock (Liftgate Required)",
  ground_level: "Ground Level Dock",
  truck_level: "Standard Height / Truck Level Dock",
};

interface RequestDetailPageProps {
  params: Promise<{ id: string }>;
}

export default function RequestDetailPage({ params }: RequestDetailPageProps) {
  const { id } = use(params);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/admin/requests">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">{id}</h1>
            <StatusBadge status={requestData.status} />
          </div>
          <p className="text-sm text-muted-foreground">
            Submitted on {requestData.submittedAt}
          </p>
        </div>
      </div>

      {/* Action Buttons */}
      {requestData.status === "pending" && (
        <div className="flex gap-3">
          <Button asChild>
            <Link href={`/admin/quotes/new?request=${id}`}>
              Create Quote
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          <Button variant="ghost" className="text-destructive">
            <XCircle className="mr-2 h-4 w-4" />
            Decline Request
          </Button>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          {/* Company & Location */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Company & Location
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Company</p>
                <Link
                  href={`/admin/companies/${requestData.companyId}`}
                  className="font-medium hover:underline"
                >
                  {requestData.companyName}
                </Link>
              </div>

              <Separator />

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-sm text-muted-foreground">Address</p>
                  <p className="font-medium">{requestData.location.address}</p>
                  <p>
                    {requestData.location.city}, {requestData.location.state}{" "}
                    {requestData.location.zipCode}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Building Info</p>
                  <p>{requestData.location.buildingInfo}</p>
                </div>
              </div>

              <div>
                <p className="text-sm text-muted-foreground">
                  Equipment Location
                </p>
                <p>{requestData.location.equipmentLocation}</p>
              </div>

              <div>
                <p className="text-sm text-muted-foreground">
                  Access Instructions
                </p>
                <p>{requestData.location.accessInstructions}</p>
              </div>

              {requestData.poNumber && (
                <div>
                  <p className="text-sm text-muted-foreground">PO Number</p>
                  <p className="font-mono">{requestData.poNumber}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Contacts */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Contacts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-3">
                  <p className="text-sm font-medium text-muted-foreground">
                    On-Site Contact
                  </p>
                  <div className="space-y-2">
                    <p className="font-medium">
                      {requestData.onSiteContact.name}
                    </p>
                    <p className="flex items-center gap-2 text-sm">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      {requestData.onSiteContact.email}
                    </p>
                    <p className="flex items-center gap-2 text-sm">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      {requestData.onSiteContact.phone}
                    </p>
                  </div>
                </div>
                <div className="space-y-3">
                  <p className="text-sm font-medium text-muted-foreground">
                    Accounts Payable
                  </p>
                  <p className="flex items-center gap-2 text-sm">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    {requestData.accountsPayableEmail}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Schedule */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Schedule Preferences
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-sm text-muted-foreground">Preferred Date</p>
                  <p className="font-medium">{requestData.preferredDate}</p>
                  {requestData.preferredDateRangeEnd && (
                    <p className="text-sm text-muted-foreground">
                      through {requestData.preferredDateRangeEnd}
                    </p>
                  )}
                </div>
                {requestData.unavailableDates && (
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Unavailable Dates
                    </p>
                    <p>{requestData.unavailableDates}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Equipment */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Equipment
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                {requestData.equipment.map((item, index) => (
                  <div
                    key={index}
                    className="flex justify-between items-center py-2 border-b last:border-0"
                  >
                    <span>{item.type}</span>
                    <Badge variant="secondary">{item.quantity}</Badge>
                  </div>
                ))}
              </div>

              {requestData.estimatedWeight && (
                <div>
                  <p className="text-sm text-muted-foreground">
                    Estimated Weight
                  </p>
                  <p>{requestData.estimatedWeight}</p>
                </div>
              )}

              {/* Flags */}
              <div className="flex gap-4">
                {requestData.hasHeavyEquipment && (
                  <div className="flex items-center gap-2 text-orange-600">
                    <AlertTriangle className="h-4 w-4" />
                    <span className="text-sm">Heavy Equipment</span>
                  </div>
                )}
                {requestData.hasHazmatOrBatteries && (
                  <div className="flex items-center gap-2 text-red-600">
                    <AlertTriangle className="h-4 w-4" />
                    <span className="text-sm">Hazmat/Batteries</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Services */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <HardDrive className="h-5 w-5" />
                Services Requested
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-sm text-muted-foreground">Service Type</p>
                  <div className="flex items-center gap-2">
                    <Truck className="h-4 w-4" />
                    <span className="font-medium capitalize">
                      {requestData.serviceType}
                    </span>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    Data Destruction
                  </p>
                  <p className="font-medium">
                    {dataDestructionLabels[requestData.dataDestructionService]}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    Packing Service
                  </p>
                  <p className="font-medium">
                    {packingServiceLabels[requestData.packingService]}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    White Glove Service
                  </p>
                  <p className="font-medium">
                    {requestData.whiteGloveService ? (
                      <span className="flex items-center gap-1">
                        <Sparkles className="h-4 w-4 text-purple-500" />
                        Yes
                      </span>
                    ) : (
                      "No"
                    )}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Additional Notes */}
          {requestData.additionalNotes && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Additional Notes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap">{requestData.additionalNotes}</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Facility Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Facility Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Dock Type</span>
                <span>{dockTypeLabels[requestData.dockType]}</span>
              </div>
              {requestData.dockHours && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Dock Hours</span>
                  <span>{requestData.dockHours}</span>
                </div>
              )}
              <Separator />
              <div className="flex justify-between">
                <span className="text-muted-foreground">Freight Elevator</span>
                <span>{requestData.hasFreightElevator ? "Yes" : "No"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Passenger Elevator</span>
                <span>{requestData.hasPassengerElevator ? "Yes" : "No"}</span>
              </div>
              {requestData.elevatorRestrictions && (
                <div>
                  <span className="text-muted-foreground">Restrictions:</span>
                  <p className="text-xs mt-1">
                    {requestData.elevatorRestrictions}
                  </p>
                </div>
              )}
              <Separator />
              <div className="flex justify-between">
                <span className="text-muted-foreground">Handcarts Allowed</span>
                <span>{requestData.canUseHandcarts ? "Yes" : "No"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Floor Covering</span>
                <span>
                  {requestData.protectiveFloorCovering ? "Required" : "Not Required"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Max Truck Size</span>
                <span>{requestData.maxTruckSize?.replace("_", " ") || "Any"}</span>
              </div>
            </CardContent>
          </Card>

          {/* COI */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Insurance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                {requestData.coiRequired ? (
                  <>
                    <AlertTriangle className="h-4 w-4 text-orange-500" />
                    <span className="text-sm font-medium">COI Required</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    <span className="text-sm">No COI Required</span>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {requestData.timeline.map((event, index) => (
                  <div key={index} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className="h-2 w-2 rounded-full bg-primary" />
                      {index < requestData.timeline.length - 1 && (
                        <div className="w-0.5 flex-1 bg-border" />
                      )}
                    </div>
                    <div className="pb-4">
                      <p className="text-sm font-medium">{event.event}</p>
                      <p className="text-xs text-muted-foreground">
                        {event.timestamp}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        by {event.by}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
