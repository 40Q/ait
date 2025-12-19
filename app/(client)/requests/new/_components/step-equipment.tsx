import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { equipmentTypeOptions, type PickupRequestFormData } from "./types";

interface StepEquipmentProps {
  data: PickupRequestFormData;
  onChange: (data: Partial<PickupRequestFormData>) => void;
}

export function StepEquipment({ data, onChange }: StepEquipmentProps) {
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
      </div>
    </div>
  );
}
