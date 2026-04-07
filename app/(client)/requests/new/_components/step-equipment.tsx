import { useRef, useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, Upload, X, FileText, Image, ChevronDown, ChevronUp } from "lucide-react";
import { equipmentTypeOptions, type PickupRequestFormData } from "./types";

interface StepEquipmentProps {
  data: PickupRequestFormData;
  onChange: (data: Partial<PickupRequestFormData>) => void;
  formVariant?: string;
}

// IDs that belong to e-waste in the standard form — hidden in CyrusOne variant
// (replaced by the single "ewaste" checkbox)
const EWASTE_IDS = new Set([
  "lcd_monitors",
  "crt_monitors",
  "cellphones",
  "telephones",
  "tvs",
  "vcr_dvd",
]);

// Metal sub-types shown as a group in CyrusOne variant
// "racks" already exists in the standard list; misc_metals and metal_caging are new
const METAL_IDS = ["metal_misc", "racks", "metal_caging"];

// Wood sub-types (all new)
const WOOD_IDS = ["wood_plywood", "wood_pallets", "wood_crates"];

// IDs to hide entirely in CyrusOne (moved into Metal/Wood groups or replaced)
const CYRUSONE_HIDDEN_IDS = new Set([...EWASTE_IDS, ...METAL_IDS, ...WOOD_IDS, "ewaste"]);

// Accepted / Not Accepted e-waste lists
const EWASTE_ACCEPTED = [
  "Laptops & Desktops",
  "LCD/LED Monitors",
  "Servers & Network Equipment",
  "Hard Drives & Storage Media",
  "Printers & Peripherals",
  "Cell Phones & Tablets",
  "Cables & Accessories",
  "Small Consumer Electronics",
];

const EWASTE_NOT_ACCEPTED = [
  "CRT Monitors (surcharge applies — contact us)",
  "Standalone batteries",
  "Fluorescent tubes & light bulbs",
  "Smoke detectors",
  "Hazardous materials",
  "Items with unknown/unidentified substances",
];

export function StepEquipment({ data, onChange, formVariant }: StepEquipmentProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showEwasteInfo, setShowEwasteInfo] = useState(false);
  const isCyrusOne = formVariant === "cyrusone";

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const newFiles = Array.from(files);
      onChange({ equipmentFiles: [...data.equipmentFiles, ...newFiles] });
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleRemoveFile = (index: number) => {
    const newFiles = data.equipmentFiles.filter((_, i) => i !== index);
    onChange({ equipmentFiles: newFiles });
  };

  const getFileIcon = (file: File) => {
    if (file.type.startsWith("image/")) {
      return <Image className="h-4 w-4" />;
    }
    return <FileText className="h-4 w-4" />;
  };

  const handleEquipmentToggle = (equipmentId: string, checked: boolean) => {
    const newTypes = checked
      ? [...data.equipmentTypes, equipmentId]
      : data.equipmentTypes.filter((id) => id !== equipmentId);

    const newQuantities = { ...data.quantities };
    if (!checked) {
      delete newQuantities[equipmentId];
    }

    onChange({ equipmentTypes: newTypes, quantities: newQuantities });
  };

  const handleQuantityChange = (equipmentId: string, value: string) => {
    const quantity = parseInt(value, 10) || 0;
    onChange({
      quantities: { ...data.quantities, [equipmentId]: quantity },
    });
  };

  const renderEquipmentRow = (equipment: { id: string; label: string }) => {
    const isChecked = data.equipmentTypes.includes(equipment.id);
    return (
      <div
        key={equipment.id}
        className="flex items-center justify-between rounded-lg border p-4"
      >
        <div className="flex items-center gap-3">
          <Checkbox
            id={equipment.id}
            checked={isChecked}
            onCheckedChange={(checked) =>
              handleEquipmentToggle(equipment.id, checked === true)
            }
          />
          <Label htmlFor={equipment.id} className="cursor-pointer font-normal">
            {equipment.label}
          </Label>
        </div>
        {isChecked && (
          <div className="flex items-center gap-2">
            <Label htmlFor={`qty-${equipment.id}`} className="text-sm">
              Qty:
            </Label>
            <Input
              id={`qty-${equipment.id}`}
              type="number"
              min="1"
              className="w-20"
              value={data.quantities[equipment.id] || ""}
              onChange={(e) => handleQuantityChange(equipment.id, e.target.value)}
              placeholder="0"
            />
          </div>
        )}
      </div>
    );
  };

  // Standard equipment list (CyrusOne hides e-waste items, racks, and new sub-type IDs)
  const standardOptions = equipmentTypeOptions.filter((eq) =>
    isCyrusOne ? !CYRUSONE_HIDDEN_IDS.has(eq.id) : !["metal_misc", "metal_caging", "wood_plywood", "wood_pallets", "wood_crates", "ewaste"].includes(eq.id)
  );

  const metalOptions = equipmentTypeOptions.filter((eq) => METAL_IDS.includes(eq.id));
  const woodOptions = equipmentTypeOptions.filter((eq) => WOOD_IDS.includes(eq.id));
  const ewasteOption = equipmentTypeOptions.find((eq) => eq.id === "ewaste")!;
  const ewasteChecked = data.equipmentTypes.includes("ewaste");

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Equipment to Recycle</h2>
        <p className="text-sm text-muted-foreground">
          Select the types of equipment and estimated quantities.
        </p>
      </div>

      <div className="space-y-4">
        {/* Standard equipment list */}
        <div className="grid gap-3">
          {standardOptions.map(renderEquipmentRow)}
        </div>

        {/* CyrusOne — Metal group */}
        {isCyrusOne && (
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
              Metal
            </p>
            <div className="grid gap-3">
              {metalOptions.map(renderEquipmentRow)}
            </div>
          </div>
        )}

        {/* CyrusOne — Wood group */}
        {isCyrusOne && (
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
              Wood
            </p>
            <div className="grid gap-3">
              {woodOptions.map(renderEquipmentRow)}
            </div>
          </div>
        )}

        {/* CyrusOne — E-waste single checkbox */}
        {isCyrusOne && (
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
              E-Waste
            </p>
            <div className="rounded-lg border p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Checkbox
                    id="ewaste"
                    checked={ewasteChecked}
                    onCheckedChange={(checked) =>
                      handleEquipmentToggle("ewaste", checked === true)
                    }
                  />
                  <Label htmlFor="ewaste" className="cursor-pointer font-normal">
                    {ewasteOption.label}
                  </Label>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-xs text-muted-foreground h-auto py-1"
                  onClick={() => setShowEwasteInfo((v) => !v)}
                >
                  Accepted / Not Accepted
                  {showEwasteInfo ? (
                    <ChevronUp className="ml-1 h-3 w-3" />
                  ) : (
                    <ChevronDown className="ml-1 h-3 w-3" />
                  )}
                </Button>
              </div>

              {ewasteChecked && (
                <div className="flex items-center gap-2 pl-7">
                  <Label htmlFor="qty-ewaste" className="text-sm">Qty:</Label>
                  <Input
                    id="qty-ewaste"
                    type="number"
                    min="1"
                    className="w-20"
                    value={data.quantities["ewaste"] || ""}
                    onChange={(e) => handleQuantityChange("ewaste", e.target.value)}
                    placeholder="0"
                  />
                </div>
              )}

              {showEwasteInfo && (
                <div className="grid gap-4 sm:grid-cols-2 pt-2 border-t">
                  <div>
                    <p className="text-xs font-semibold text-green-700 dark:text-green-400 mb-1">
                      ✓ Accepted
                    </p>
                    <ul className="space-y-1">
                      {EWASTE_ACCEPTED.map((item) => (
                        <li key={item} className="text-xs text-muted-foreground">
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-red-700 dark:text-red-400 mb-1">
                      ✗ Not Accepted
                    </p>
                    <ul className="space-y-1">
                      {EWASTE_NOT_ACCEPTED.map((item) => (
                        <li key={item} className="text-xs text-muted-foreground">
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="estimatedWeight">
            Estimated Total Weight (Optional)
          </Label>
          <Input
            id="estimatedWeight"
            value={data.estimatedWeight}
            onChange={(e) => onChange({ estimatedWeight: e.target.value })}
            placeholder="e.g., 500 lbs or 10 pallets"
          />
        </div>

        {/* File Upload Section */}
        <div className="space-y-3">
          <div className="flex items-baseline gap-2">
            <Label>
              {isCyrusOne ? "Upload Photo or Inventory List *" : "Upload Photo or Inventory List (Optional)"}
            </Label>
            {isCyrusOne && (
              <span className="text-xs text-muted-foreground">Required</span>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            Upload photos of equipment or an inventory spreadsheet to help us
            provide an accurate quote.
          </p>
          <div className="flex flex-col gap-3">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,.pdf,.xlsx,.xls,.csv"
              multiple
              onChange={handleFileChange}
              className="hidden"
              id="equipment-files"
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              className="w-full sm:w-auto"
            >
              <Upload className="mr-2 h-4 w-4" />
              Choose Files
            </Button>

            {data.equipmentFiles.length > 0 && (
              <div className="space-y-2">
                {data.equipmentFiles.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      {getFileIcon(file)}
                      <span className="text-sm truncate">{file.name}</span>
                      <span className="text-xs text-muted-foreground">
                        ({(file.size / 1024).toFixed(1)} KB)
                      </span>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveFile(index)}
                      className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* CyrusOne — Comments field */}
        {isCyrusOne && (
          <div className="space-y-2">
            <Label htmlFor="comments">Comments (Optional)</Label>
            <Textarea
              id="comments"
              value={data.comments}
              onChange={(e) => onChange({ comments: e.target.value })}
              placeholder="Any additional notes about the equipment or photos..."
              rows={3}
            />
          </div>
        )}
      </div>

      {/* General Questions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <AlertTriangle className="h-4 w-4" />
            Important Questions
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start gap-3">
            <Checkbox
              id="hasHeavyEquipment"
              checked={data.hasHeavyEquipment}
              onCheckedChange={(checked) =>
                onChange({ hasHeavyEquipment: checked === true })
              }
            />
            <div>
              <Label htmlFor="hasHeavyEquipment" className="cursor-pointer">
                There is equipment too large or heavy for one person to handle
              </Label>
              <p className="text-sm text-muted-foreground mt-1">
                This helps us plan appropriate staffing and equipment for the pickup.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Checkbox
              id="hasHazmatOrBatteries"
              checked={data.hasHazmatOrBatteries}
              onCheckedChange={(checked) =>
                onChange({ hasHazmatOrBatteries: checked === true })
              }
            />
            <div>
              <Label htmlFor="hasHazmatOrBatteries" className="cursor-pointer">
                There are batteries or hazardous materials (hazmat) included
              </Label>
              <p className="text-sm text-muted-foreground mt-1">
                Special handling may be required for batteries, chemicals, or other hazardous materials.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Checkbox
              id="equipmentUnpluggedConfirmed"
              checked={data.equipmentUnpluggedConfirmed}
              onCheckedChange={(checked) =>
                onChange({ equipmentUnpluggedConfirmed: checked === true })
              }
            />
            <div>
              <Label htmlFor="equipmentUnpluggedConfirmed" className="cursor-pointer">
                All equipment will be unplugged and powered down before pickup
              </Label>
              <p className="text-sm text-muted-foreground mt-1">
                Please confirm that all equipment will be disconnected and ready for removal.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
