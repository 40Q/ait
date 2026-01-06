import { useRef } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, Upload, X, FileText, Image } from "lucide-react";
import { equipmentTypeOptions, type PickupRequestFormData } from "./types";

interface StepEquipmentProps {
  data: PickupRequestFormData;
  onChange: (data: Partial<PickupRequestFormData>) => void;
}

export function StepEquipment({ data, onChange }: StepEquipmentProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const newFiles = Array.from(files);
      onChange({ equipmentFiles: [...data.equipmentFiles, ...newFiles] });
    }
    // Reset input so same file can be selected again
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

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Equipment to Recycle</h2>
        <p className="text-sm text-muted-foreground">
          Select the types of equipment and estimated quantities.
        </p>
      </div>

      <div className="space-y-4">
        <div className="grid gap-3">
          {equipmentTypeOptions.map((equipment) => {
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
                  <Label
                    htmlFor={equipment.id}
                    className="cursor-pointer font-normal"
                  >
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
                      onChange={(e) =>
                        handleQuantityChange(equipment.id, e.target.value)
                      }
                      placeholder="0"
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>

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
          <Label>Upload Photo or Inventory List (Optional)</Label>
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
