import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  MapPin,
  Package,
  Settings,
  Truck,
  User,
  Building2,
  AlertTriangle,
  FileText,
  CheckCircle2,
  Paperclip,
  TreeDeciduous,
  Cpu,
  Box,
  ArrowRight,
} from "lucide-react";
import { formatDate } from "@/lib/utils/date";
import type {
  RequestWithRelations,
  LogisticsFormData,
  MaterialsFormData,
} from "@/lib/database/types";
import {
  equipmentTypeOptions,
  dataDestructionOptions,
  packingServiceOptions,
  dockTypeOptions,
  truckSizeOptions,
} from "@/app/(client)/requests/new/_components/types";
import { FileList } from "@/components/ui/file-list";
import { STORAGE_BUCKETS } from "@/lib/storage/upload";

// Type guards for form data
function isLogisticsFormData(data: unknown): data is LogisticsFormData {
  return (
    typeof data === "object" &&
    data !== null &&
    "destination_address" in data
  );
}

function isMaterialsFormData(data: unknown): data is MaterialsFormData {
  return (
    typeof data === "object" &&
    data !== null &&
    "has_wood" in data
  );
}

interface RequestDetailsProps {
  request: RequestWithRelations;
}

export function RequestDetails({ request }: RequestDetailsProps) {
  const isStandardForm = request.form_type === "standard" || !request.form_type;
  const isLogisticsForm = request.form_type === "logistics";
  const isMaterialsForm = request.form_type === "materials";

  // Get readable labels for services (only used for standard forms)
  const dataDestructionLabel = dataDestructionOptions.find(
    (opt) => opt.value === request.data_destruction_service
  )?.label;

  const packingLabel = packingServiceOptions.find(
    (opt) => opt.value === request.packing_service
  )?.label;

  const dockLabel = dockTypeOptions.find(
    (opt) => opt.value === request.dock_type
  )?.label;

  const truckLabel = truckSizeOptions.find(
    (opt) => opt.value === request.max_truck_size
  )?.label;

  const services = [
    request.data_destruction_service !== "none" && dataDestructionLabel,
    request.packing_service !== "none" && packingLabel,
    request.white_glove_service && "White Glove Service",
  ].filter(Boolean);

  const importantFlags = [
    request.has_heavy_equipment && "Heavy equipment requiring special handling",
    request.has_hazmat_or_batteries && "Contains batteries or hazmat materials",
    request.coi_required && "COI required",
    request.protective_floor_covering && "Protective floor covering required",
  ].filter(Boolean);

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {/* Location - shown for all form types */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <MapPin className="h-4 w-4" />
            {isLogisticsForm ? "Pickup" : isMaterialsForm ? "Pickup" : request.service_type === "pickup" ? "Pickup" : "Drop-off"} Location
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-3">
          <div>
            {request.location_name && (
              <p className="font-medium mb-1">{request.location_name}</p>
            )}
            <p>{request.address}</p>
            {request.building_info && <p>{request.building_info}</p>}
            {/* Only show city/state/zip if they exist (standard form) */}
            {(request.city || request.state || request.zip_code) && (
              <p>
                {request.city}{request.city && request.state ? ", " : ""}{request.state} {request.zip_code}
              </p>
            )}
          </div>
          {request.equipment_location && (
            <div>
              <p className="text-muted-foreground text-xs uppercase">Equipment Location</p>
              <p>{request.equipment_location}</p>
            </div>
          )}
          {request.po_number && (
            <div>
              <p className="text-muted-foreground text-xs uppercase">PO #</p>
              <p className="font-medium">{request.po_number}</p>
            </div>
          )}
          {request.access_instructions && (
            <div>
              <p className="text-muted-foreground text-xs uppercase">Access Instructions</p>
              <p>{request.access_instructions}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Contact - shown for all form types */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <User className="h-4 w-4" />
            {isLogisticsForm ? "Contact" : "On-Site Contact"}
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-3">
          <div>
            <p className="font-medium">{request.on_site_contact_name}</p>
            <p className="text-muted-foreground">{request.on_site_contact_phone}</p>
            {request.on_site_contact_email && (
              <p className="text-muted-foreground">{request.on_site_contact_email}</p>
            )}
          </div>
          {request.pre_pickup_call !== "none" && (
            <p className="text-muted-foreground">
              {request.pre_pickup_call === "30_min"
                ? "Call 30 minutes before arrival"
                : "Call 1 hour before arrival"}
            </p>
          )}
          {request.accounts_payable_email && (
            <div>
              <p className="text-muted-foreground text-xs uppercase">Accounts Payable</p>
              <p>{request.accounts_payable_email}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Logistics-specific: Destination and details */}
      {isLogisticsForm && isLogisticsFormData(request.form_data) && (
        <>
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <ArrowRight className="h-4 w-4" />
                Logistics Details
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <p className="text-muted-foreground text-xs uppercase">Destination Address</p>
                  <p>{request.form_data.destination_address}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs uppercase">Preferred Contact Method</p>
                  <Badge variant="outline" className="capitalize">
                    {request.form_data.preferred_contact_method}
                  </Badge>
                </div>
              </div>

              {/* Preferred Date for logistics */}
              {request.preferred_date && (
                <div>
                  <p className="text-muted-foreground text-xs uppercase">Preferred Date</p>
                  <p className="font-medium">{formatDate(request.preferred_date)}</p>
                </div>
              )}

              {/* COI Required */}
              {request.coi_required && (
                <div>
                  <Badge variant="outline">COI Required</Badge>
                </div>
              )}

              {/* Material Prepared */}
              {request.material_prepared !== null && (
                <div>
                  <p className="text-muted-foreground text-xs uppercase">Material Prepared</p>
                  <p>{request.material_prepared ? "Yes" : "No"}</p>
                </div>
              )}

              {/* Pallet Information */}
              {(request.form_data.number_of_pallets ||
                request.form_data.material_fits_on_pallets) && (
                <div>
                  <p className="text-muted-foreground text-xs uppercase mb-2">Pallet Information</p>
                  <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
                    {request.form_data.material_fits_on_pallets && (
                      <div>
                        <p className="text-xs text-muted-foreground">Fits on Pallets</p>
                        <p className="font-medium">{request.form_data.material_fits_on_pallets}</p>
                      </div>
                    )}
                    {request.form_data.number_of_pallets && (
                      <div>
                        <p className="text-xs text-muted-foreground">Number of Pallets</p>
                        <p className="font-medium">{request.form_data.number_of_pallets}</p>
                      </div>
                    )}
                    {request.form_data.size_of_pallets && (
                      <div>
                        <p className="text-xs text-muted-foreground">Pallet Size</p>
                        <p className="font-medium">{request.form_data.size_of_pallets}</p>
                      </div>
                    )}
                    {request.form_data.height_of_palletized_material && (
                      <div>
                        <p className="text-xs text-muted-foreground">Height</p>
                        <p className="font-medium">{request.form_data.height_of_palletized_material}</p>
                      </div>
                    )}
                    {request.form_data.estimated_weight_per_pallet && (
                      <div>
                        <p className="text-xs text-muted-foreground">Weight per Pallet</p>
                        <p className="font-medium">{request.form_data.estimated_weight_per_pallet}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Preparation Services */}
              {(request.form_data.needs_palletizing ||
                request.form_data.needs_shrink_wrap ||
                request.form_data.needs_pallet_strap ||
                request.white_glove_service) && (
                <div>
                  <p className="text-muted-foreground text-xs uppercase mb-2">Services Needed</p>
                  <div className="flex gap-2 flex-wrap">
                    {request.form_data.needs_palletizing && (
                      <Badge variant="outline">Palletizing</Badge>
                    )}
                    {request.form_data.needs_shrink_wrap && (
                      <Badge variant="outline">Shrink Wrap</Badge>
                    )}
                    {request.form_data.needs_pallet_strap && (
                      <Badge variant="outline">Pallet Strap</Badge>
                    )}
                    {request.white_glove_service && (
                      <Badge variant="outline">White Glove Service</Badge>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {/* Materials-specific details */}
      {isMaterialsForm && isMaterialsFormData(request.form_data) && (
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Package className="h-4 w-4" />
              Materials for Pickup
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-4">
            <div className="flex gap-4 flex-wrap">
              {request.form_data.has_wood && (
                <div className="flex items-center gap-2 rounded-lg border p-3">
                  <TreeDeciduous className="h-5 w-5 text-muted-foreground" />
                  <span className="font-medium">Wood</span>
                </div>
              )}
              {request.form_data.has_metal && (
                <div className="flex items-center gap-2 rounded-lg border p-3">
                  <Box className="h-5 w-5 text-muted-foreground" />
                  <span className="font-medium">Metal</span>
                </div>
              )}
              {request.form_data.has_electronics && (
                <div className="flex items-center gap-2 rounded-lg border p-3">
                  <Cpu className="h-5 w-5 text-muted-foreground" />
                  <span className="font-medium">Electronics</span>
                </div>
              )}
            </div>
            {request.form_data.materials_description && (
              <div>
                <p className="text-muted-foreground text-xs uppercase mb-1">Materials Description</p>
                <p>{request.form_data.materials_description}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Standard form sections - only shown for standard forms */}
      {isStandardForm && (
        <>
          {/* Facility Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Building2 className="h-4 w-4" />
                Facility Information
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-3">
              {/* Dock */}
              <div>
                <p className="text-muted-foreground text-xs uppercase">Dock</p>
                <p>{dockLabel || "No dock"}</p>
                {request.dock_type !== "none" && request.dock_hours_start && request.dock_hours_end && (
                  <p className="text-muted-foreground">
                    Hours: {request.dock_hours_start} - {request.dock_hours_end}
                  </p>
                )}
                {request.dock_time_limit && (
                  <p className="text-muted-foreground">Time limit: {request.dock_time_limit}</p>
                )}
              </div>

              {/* Elevators */}
              <div>
                <p className="text-muted-foreground text-xs uppercase">Elevators</p>
                {request.has_freight_elevator || request.has_passenger_elevator ? (
                  <>
                    <div className="flex gap-2 flex-wrap">
                      {request.has_freight_elevator && <Badge variant="outline">Freight</Badge>}
                      {request.has_passenger_elevator && <Badge variant="outline">Passenger</Badge>}
                    </div>
                    {request.elevator_restrictions && (
                      <p className="text-muted-foreground mt-1">{request.elevator_restrictions}</p>
                    )}
                  </>
                ) : (
                  <p>No elevator access</p>
                )}
              </div>

              {/* Access */}
              <div className="flex gap-2 flex-wrap">
                {request.can_use_handcarts && <Badge variant="outline">Handcarts OK</Badge>}
                {request.max_truck_size && <Badge variant="outline">Max: {truckLabel}</Badge>}
              </div>

              {request.protective_floor_covering && (
                <div>
                  <p className="text-muted-foreground text-xs uppercase">Floor Covering Required</p>
                  <p>{request.protective_floor_covering_details || "Yes"}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Schedule */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Truck className="h-4 w-4" />
                Schedule
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-3">
              <div>
                <p className="text-muted-foreground text-xs uppercase">Service Type</p>
                <Badge variant="outline" className="capitalize">
                  {request.service_type}
                </Badge>
              </div>
              <div>
                <p className="text-muted-foreground text-xs uppercase">Preferred Date</p>
                <p className="font-medium">
                  {request.preferred_date
                    ? formatDate(request.preferred_date)
                    : "Not specified"}
                  {request.preferred_date_range_end && (
                    <span> - {formatDate(request.preferred_date_range_end)}</span>
                  )}
                </p>
              </div>
              {request.unavailable_dates && (
                <div>
                  <p className="text-muted-foreground text-xs uppercase">Not Available</p>
                  <p>{request.unavailable_dates}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Equipment */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Package className="h-4 w-4" />
                Equipment
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-3">
              {request.equipment && request.equipment.length > 0 ? (
                <div className="space-y-2">
                  {request.equipment.map((item, index) => {
                    const label =
                      equipmentTypeOptions.find((opt) => opt.id === item.type)?.label ||
                      item.type;
                    return (
                      <div key={index} className="flex justify-between">
                        <span>{label}</span>
                        <span className="font-medium">{item.quantity} units</span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-muted-foreground">No equipment specified</p>
              )}
              {request.estimated_weight && (
                <p className="text-muted-foreground">
                  Estimated weight: {request.estimated_weight}
                </p>
              )}
              {request.equipment_unplugged_confirmed && (
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Equipment will be unplugged</span>
                </div>
              )}
              {request.material_prepared !== null && (
                <div>
                  <p className="text-muted-foreground text-xs uppercase">Material Prepared</p>
                  <p>{request.material_prepared ? "Yes" : "No"}</p>
                  {!request.material_prepared && request.material_not_prepared_details && (
                    <p className="text-muted-foreground">{request.material_not_prepared_details}</p>
                  )}
                </div>
              )}
              {request.equipment_file_paths && request.equipment_file_paths.length > 0 && (
                <div>
                  <p className="text-muted-foreground text-xs uppercase mb-2">
                    <Paperclip className="h-3 w-3 inline mr-1" />
                    Attached Files
                  </p>
                  <FileList paths={request.equipment_file_paths} bucket={STORAGE_BUCKETS.REQUEST_FILES} />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Services */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Settings className="h-4 w-4" />
                Services Requested
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-3">
              {services.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {services.map((service, index) => (
                    <Badge key={index} variant="outline">
                      {service}
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">No additional services</p>
              )}
              {request.packing_services_required && (
                <p className="text-muted-foreground">Packing services required</p>
              )}
            </CardContent>
          </Card>

          {/* Important Flags */}
          {importantFlags.length > 0 && (
            <Card className="border-yellow-200 bg-yellow-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base text-yellow-800">
                  <AlertTriangle className="h-4 w-4" />
                  Important Notes
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm">
                <ul className="space-y-1">
                  {importantFlags.map((flag, index) => (
                    <li key={index} className="text-yellow-800">
                      {flag}
                    </li>
                  ))}
                </ul>
                {request.coi_required && request.coi_sample_path && (
                  <div className="mt-3">
                    <p className="text-yellow-700 text-xs uppercase mb-2">COI Sample</p>
                    <FileList paths={[request.coi_sample_path]} bucket={STORAGE_BUCKETS.REQUEST_FILES} />
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Notes - shown for all form types */}
      {request.additional_notes && (
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <FileText className="h-4 w-4" />
              Additional Notes
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm">
            <p>{request.additional_notes}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
