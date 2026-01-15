"use client";

import { use, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  Calendar,
  User,
  Phone,
  Mail,
  Truck,
  Package,
  HardDrive,
  FileText,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Loader2,
  TreeDeciduous,
  Box,
  Cpu,
  MapPin,
  Briefcase,
} from "lucide-react";
import { useRequest, useDeclineRequest, useQuoteByRequestId, useRequestFullTimeline, useJobByRequestId } from "@/lib/hooks";
import { Timeline } from "@/components/ui/timeline";
import { FileList } from "@/components/ui/file-list";
import { STORAGE_BUCKETS } from "@/lib/storage/upload";
import type { LogisticsFormData, MaterialsFormData } from "@/lib/database/types";

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
  const router = useRouter();
  const { data: request, isLoading, error } = useRequest(id);
  const { data: quote } = useQuoteByRequestId(id);
  const { data: timelineEvents = [], isLoading: timelineLoading } = useRequestFullTimeline(id, quote?.id);
  const { data: job } = useJobByRequestId(id);
  const declineRequest = useDeclineRequest();

  const [showDeclineDialog, setShowDeclineDialog] = useState(false);
  const [declineReason, setDeclineReason] = useState("");

  const handleDecline = async () => {
    await declineRequest.mutateAsync({
      id,
      reason: declineReason || undefined,
    });
    setShowDeclineDialog(false);
    router.push("/admin/requests");
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !request) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-4">
        <p className="text-destructive">
          {error ? `Failed to load request: ${error.message}` : "Request not found"}
        </p>
        <Button variant="outline" asChild>
          <Link href="/admin/requests">Back to Requests</Link>
        </Button>
      </div>
    );
  }

  const dockHours = request.dock_hours_start && request.dock_hours_end
    ? `${request.dock_hours_start} - ${request.dock_hours_end}`
    : null;

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
            <h1 className="text-2xl font-bold">{request.request_number}</h1>
            <StatusBadge status={request.status} />
          </div>
          <p className="text-sm text-muted-foreground">
            Submitted on {new Date(request.created_at).toLocaleString()}
          </p>
        </div>
      </div>

      {/* Action Buttons */}
      {request.status === "pending" && (
        <div className="flex gap-3">
          <Button asChild>
            <Link href={`/admin/quotes/new?request=${request.id}`}>
              Create Quote
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          <Button
            variant="ghost"
            className="text-destructive"
            onClick={() => setShowDeclineDialog(true)}
          >
            <XCircle className="mr-2 h-4 w-4" />
            Decline Request
          </Button>
        </div>
      )}

      {/* Form Type Badge */}
      {request.form_type !== "standard" && (
        <Badge variant="outline" className="capitalize">
          {request.form_type} Request
        </Badge>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          {/* Company - shown for all form types */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Company
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Link
                href={`/admin/companies/${request.company_id}`}
                className="font-medium hover:underline"
              >
                {request.company?.name || "Unknown Company"}
              </Link>
            </CardContent>
          </Card>

          {/* STANDARD FORM CONTENT */}
          {request.form_type === "standard" && (
            <>
              {/* Location */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    Location
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <p className="text-sm text-muted-foreground">Address</p>
                      <p className="font-medium">{request.address}</p>
                      <p>
                        {request.city}, {request.state} {request.zip_code}
                      </p>
                    </div>
                    {request.building_info && (
                      <div>
                        <p className="text-sm text-muted-foreground">Building Info</p>
                        <p>{request.building_info}</p>
                      </div>
                    )}
                  </div>

                  {request.equipment_location && (
                    <div>
                      <p className="text-sm text-muted-foreground">Equipment Location</p>
                      <p>{request.equipment_location}</p>
                    </div>
                  )}

                  {request.access_instructions && (
                    <div>
                      <p className="text-sm text-muted-foreground">Access Instructions</p>
                      <p>{request.access_instructions}</p>
                    </div>
                  )}

                  {request.po_number && (
                    <div>
                      <p className="text-sm text-muted-foreground">PO Number</p>
                      <p className="font-mono">{request.po_number}</p>
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
                      <p className="text-sm font-medium text-muted-foreground">On-Site Contact</p>
                      <div className="space-y-2">
                        <p className="font-medium">{request.on_site_contact_name}</p>
                        <p className="flex items-center gap-2 text-sm">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          {request.on_site_contact_email}
                        </p>
                        <p className="flex items-center gap-2 text-sm">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          {request.on_site_contact_phone}
                        </p>
                      </div>
                    </div>
                    {request.accounts_payable_email && (
                      <div className="space-y-3">
                        <p className="text-sm font-medium text-muted-foreground">Accounts Payable</p>
                        <p className="flex items-center gap-2 text-sm">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          {request.accounts_payable_email}
                        </p>
                      </div>
                    )}
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
                    {request.preferred_date && (
                      <div>
                        <p className="text-sm text-muted-foreground">Preferred Date</p>
                        <p className="font-medium">{new Date(request.preferred_date).toLocaleDateString()}</p>
                        {request.preferred_date_range_end && (
                          <p className="text-sm text-muted-foreground">
                            through {new Date(request.preferred_date_range_end).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    )}
                    {request.unavailable_dates && (
                      <div>
                        <p className="text-sm text-muted-foreground">Unavailable Dates</p>
                        <p>{request.unavailable_dates}</p>
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
                    {request.equipment && request.equipment.length > 0 ? (
                      request.equipment.map((item, index) => (
                        <div
                          key={index}
                          className="flex justify-between items-center py-2 border-b last:border-0"
                        >
                          <span>{item.type}</span>
                          <Badge variant="secondary">{item.quantity}</Badge>
                        </div>
                      ))
                    ) : (
                      <p className="text-muted-foreground">No equipment specified</p>
                    )}
                  </div>

                  {request.estimated_weight && (
                    <div>
                      <p className="text-sm text-muted-foreground">Estimated Weight</p>
                      <p>{request.estimated_weight}</p>
                    </div>
                  )}

                  <div className="flex gap-4">
                    {request.has_heavy_equipment && (
                      <div className="flex items-center gap-2 text-orange-600">
                        <AlertTriangle className="h-4 w-4" />
                        <span className="text-sm">Heavy Equipment</span>
                      </div>
                    )}
                    {request.has_hazmat_or_batteries && (
                      <div className="flex items-center gap-2 text-red-600">
                        <AlertTriangle className="h-4 w-4" />
                        <span className="text-sm">Hazmat/Batteries</span>
                      </div>
                    )}
                  </div>

                  {request.equipment_file_paths && request.equipment_file_paths.length > 0 && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">Attached Files</p>
                      <FileList paths={request.equipment_file_paths} bucket={STORAGE_BUCKETS.REQUEST_FILES} />
                    </div>
                  )}
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
                        <span className="font-medium capitalize">{request.service_type}</span>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Data Destruction</p>
                      <p className="font-medium">
                        {request.data_destruction_service
                          ? dataDestructionLabels[request.data_destruction_service]
                          : "N/A"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Packing Service</p>
                      <p className="font-medium">
                        {request.packing_service
                          ? packingServiceLabels[request.packing_service]
                          : "N/A"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">White Glove Service</p>
                      <p className="font-medium">
                        {request.white_glove_service ? (
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
            </>
          )}

          {/* LOGISTICS FORM CONTENT */}
          {request.form_type === "logistics" && (
            <>
              {(() => {
                const formData = request.form_data as LogisticsFormData;
                return (
                  <>
                    {/* Pickup & Destination */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Truck className="h-5 w-5" />
                          Pickup & Destination
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid gap-4 sm:grid-cols-2">
                          <div>
                            <p className="text-sm text-muted-foreground">Pickup Location</p>
                            <p className="font-medium">{request.address}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Destination</p>
                            <p className="font-medium">{formData.destination_address}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Site Contact */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <User className="h-5 w-5" />
                          Site Contact
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <p className="font-medium">{request.on_site_contact_name}</p>
                          <p className="flex items-center gap-2 text-sm">
                            <Mail className="h-4 w-4 text-muted-foreground" />
                            {request.on_site_contact_email}
                          </p>
                          <p className="flex items-center gap-2 text-sm">
                            <Phone className="h-4 w-4 text-muted-foreground" />
                            {request.on_site_contact_phone}
                          </p>
                          <p className="text-sm text-muted-foreground mt-2">
                            Preferred contact: <span className="capitalize">{formData.preferred_contact_method}</span>
                          </p>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Pallet Details */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Package className="h-5 w-5" />
                          Pallet Details
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid gap-4 sm:grid-cols-2">
                          <div>
                            <p className="text-sm text-muted-foreground">Material fits on pallets?</p>
                            <p className="font-medium">{formData.material_fits_on_pallets}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Number of pallets</p>
                            <p className="font-medium">{formData.number_of_pallets || "N/A"}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Pallet size</p>
                            <p className="font-medium">{formData.size_of_pallets || "N/A"}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Height of palletized material</p>
                            <p className="font-medium">{formData.height_of_palletized_material || "N/A"}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Estimated weight per pallet</p>
                            <p className="font-medium">{formData.estimated_weight_per_pallet || "N/A"}</p>
                          </div>
                        </div>

                        <Separator />

                        <div>
                          <p className="text-sm text-muted-foreground mb-2">Services Needed</p>
                          <div className="flex flex-wrap gap-2">
                            {formData.needs_palletizing && (
                              <Badge variant="secondary">Palletizing</Badge>
                            )}
                            {formData.needs_shrink_wrap && (
                              <Badge variant="secondary">Shrink Wrap</Badge>
                            )}
                            {formData.needs_pallet_strap && (
                              <Badge variant="secondary">Pallet Strap</Badge>
                            )}
                            {!formData.needs_palletizing && !formData.needs_shrink_wrap && !formData.needs_pallet_strap && (
                              <span className="text-muted-foreground">None requested</span>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </>
                );
              })()}
            </>
          )}

          {/* MATERIALS FORM CONTENT */}
          {request.form_type === "materials" && (
            <>
              {(() => {
                const formData = request.form_data as MaterialsFormData;
                return (
                  <>
                    {/* Pickup Location */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <MapPin className="h-5 w-5" />
                          Pickup Location
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="font-medium">{request.address}</p>
                      </CardContent>
                    </Card>

                    {/* Site Contact */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <User className="h-5 w-5" />
                          Site Contact
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <p className="font-medium">{request.on_site_contact_name}</p>
                          <p className="flex items-center gap-2 text-sm">
                            <Mail className="h-4 w-4 text-muted-foreground" />
                            {request.on_site_contact_email}
                          </p>
                          <p className="flex items-center gap-2 text-sm">
                            <Phone className="h-4 w-4 text-muted-foreground" />
                            {request.on_site_contact_phone}
                          </p>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Material Types */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Package className="h-5 w-5" />
                          Material Types
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid gap-4 sm:grid-cols-3">
                          <div
                            className={`flex flex-col items-center gap-2 rounded-lg border-2 p-4 ${
                              formData.has_wood ? "border-primary bg-primary/5" : "border-muted"
                            }`}
                          >
                            <TreeDeciduous className={`h-8 w-8 ${formData.has_wood ? "text-primary" : "text-muted-foreground"}`} />
                            <span className="font-medium">Wood</span>
                            {formData.has_wood && <CheckCircle2 className="h-4 w-4 text-primary" />}
                          </div>
                          <div
                            className={`flex flex-col items-center gap-2 rounded-lg border-2 p-4 ${
                              formData.has_metal ? "border-primary bg-primary/5" : "border-muted"
                            }`}
                          >
                            <Box className={`h-8 w-8 ${formData.has_metal ? "text-primary" : "text-muted-foreground"}`} />
                            <span className="font-medium">Metal</span>
                            {formData.has_metal && <CheckCircle2 className="h-4 w-4 text-primary" />}
                          </div>
                          <div
                            className={`flex flex-col items-center gap-2 rounded-lg border-2 p-4 ${
                              formData.has_electronics ? "border-primary bg-primary/5" : "border-muted"
                            }`}
                          >
                            <Cpu className={`h-8 w-8 ${formData.has_electronics ? "text-primary" : "text-muted-foreground"}`} />
                            <span className="font-medium">Electronics</span>
                            {formData.has_electronics && <CheckCircle2 className="h-4 w-4 text-primary" />}
                          </div>
                        </div>

                        {formData.materials_description && (
                          <div className="mt-4">
                            <p className="text-sm text-muted-foreground">Description</p>
                            <p className="whitespace-pre-wrap">{formData.materials_description}</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </>
                );
              })()}
            </>
          )}

          {/* Additional Notes - shown for all form types */}
          {request.additional_notes && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Additional Notes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap">{request.additional_notes}</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Facility Info - only for standard form */}
          {request.form_type === "standard" && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Facility Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Dock Type</span>
                    <span>{request.dock_type ? dockTypeLabels[request.dock_type] : "N/A"}</span>
                  </div>
                  {dockHours && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Dock Hours</span>
                      <span>{dockHours}</span>
                    </div>
                  )}
                  <Separator />
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Freight Elevator</span>
                    <span>{request.has_freight_elevator ? "Yes" : "No"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Passenger Elevator</span>
                    <span>{request.has_passenger_elevator ? "Yes" : "No"}</span>
                  </div>
                  {request.elevator_restrictions && (
                    <div>
                      <span className="text-muted-foreground">Restrictions:</span>
                      <p className="text-xs mt-1">{request.elevator_restrictions}</p>
                    </div>
                  )}
                  <Separator />
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Handcarts Allowed</span>
                    <span>{request.can_use_handcarts ? "Yes" : "No"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Floor Covering</span>
                    <span>{request.protective_floor_covering ? "Required" : "Not Required"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Max Truck Size</span>
                    <span>{request.max_truck_size?.replace("_", " ") || "Any"}</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Insurance</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2">
                    {request.coi_required ? (
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
                  {request.coi_required && request.coi_sample_path && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">COI Sample</p>
                      <FileList paths={[request.coi_sample_path]} bucket={STORAGE_BUCKETS.REQUEST_FILES} />
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          )}

          {/* Timeline - shown for all form types */}
          <Timeline events={timelineEvents} isLoading={timelineLoading} />

          {/* Job Card - shown when job exists */}
          {job && (
            <Card className="border-green-200 bg-green-50">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2 text-green-800">
                  <Briefcase className="h-4 w-4" />
                  Job Created
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-2">
                <Link
                  href={`/admin/jobs/${job.id}`}
                  className="font-mono text-sm text-green-700 hover:underline"
                >
                  {job.job_number}
                </Link>
                <p className="text-xs text-green-600 mt-1 capitalize">
                  Status: {job.status.replace(/_/g, " ")}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Decline Dialog */}
      <Dialog open={showDeclineDialog} onOpenChange={setShowDeclineDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Decline Request</DialogTitle>
            <DialogDescription>
              Are you sure you want to decline this request? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="decline-reason">Reason (optional)</Label>
            <Textarea
              id="decline-reason"
              placeholder="Enter a reason for declining..."
              value={declineReason}
              onChange={(e) => setDeclineReason(e.target.value)}
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeclineDialog(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDecline}
              disabled={declineRequest.isPending}
            >
              {declineRequest.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Declining...
                </>
              ) : (
                "Decline Request"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
