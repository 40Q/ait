import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { HardDrive, ListOrdered, FileCheck, Disc, Leaf, Sparkles, Truck, Building2 } from "lucide-react";
import type { PickupRequestFormData } from "./types";

interface StepServicesProps {
  data: PickupRequestFormData;
  onChange: (data: Partial<PickupRequestFormData>) => void;
}

const services = [
  {
    id: "hdDestruction",
    title: "Hard Drive Destruction",
    description: "Physical destruction of hard drives with certification",
    icon: HardDrive,
    hasSubOption: true,
  },
  {
    id: "dataTapesDestruction",
    title: "Data Tapes Destruction",
    description: "Physical destruction of data tapes with certification",
    icon: Disc,
    hasSubOption: false,
  },
  {
    id: "serialization",
    title: "Serialization / Asset Tracking",
    description: "Record serial numbers and asset tags for your records",
    icon: ListOrdered,
    hasSubOption: false,
  },
  {
    id: "certificateOfDestruction",
    title: "Certificate of Destruction",
    description: "Official documentation certifying proper data destruction",
    icon: FileCheck,
    hasSubOption: false,
  },
  {
    id: "certificateOfRecycling",
    title: "Certificate of Recycling",
    description: "Official documentation certifying responsible recycling",
    icon: Leaf,
    hasSubOption: false,
  },
  {
    id: "whiteGloveService",
    title: "White Glove Service",
    description: "Premium handling with extra care and dedicated support",
    icon: Sparkles,
    hasSubOption: false,
  },
] as const;

export function StepServices({ data, onChange }: StepServicesProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Service Type</h2>
        <p className="text-sm text-muted-foreground">
          How would you like to get your equipment to us?
        </p>
      </div>

      <RadioGroup
        value={data.serviceType}
        onValueChange={(value: "pickup" | "dropoff") =>
          onChange({ serviceType: value })
        }
        className="grid gap-4 sm:grid-cols-2"
      >
        <div>
          <RadioGroupItem
            value="pickup"
            id="pickup"
            className="peer sr-only"
          />
          <Label
            htmlFor="pickup"
            className="flex cursor-pointer flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
          >
            <Truck className="mb-3 h-6 w-6" />
            <span className="font-semibold">Pickup</span>
            <span className="text-sm text-muted-foreground text-center">
              We come to your location
            </span>
          </Label>
        </div>
        <div>
          <RadioGroupItem
            value="dropoff"
            id="dropoff"
            className="peer sr-only"
          />
          <Label
            htmlFor="dropoff"
            className="flex cursor-pointer flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
          >
            <Building2 className="mb-3 h-6 w-6" />
            <span className="font-semibold">Drop-off</span>
            <span className="text-sm text-muted-foreground text-center">
              You bring it to our facility
            </span>
          </Label>
        </div>
      </RadioGroup>

      <div>
        <h2 className="text-lg font-semibold">Additional Services</h2>
        <p className="text-sm text-muted-foreground">
          Select any additional services you require.
        </p>
      </div>

      <div className="grid gap-4">
        {services.map((service) => {
          const isChecked = data[service.id as keyof PickupRequestFormData] as boolean;
          const Icon = service.icon;

          return (
            <Card
              key={service.id}
              className={isChecked ? "border-primary" : ""}
            >
              <CardHeader className="pb-3 py-0">
                <div className="flex items-start gap-4">
                  <Checkbox
                    id={service.id}
                    checked={isChecked}
                    onCheckedChange={(checked) => {
                      const updates: Partial<PickupRequestFormData> = {
                        [service.id]: checked === true,
                      };
                      if (service.id === "hdDestruction" && !checked) {
                        updates.hdDestructionType = null;
                      }
                      onChange(updates);
                    }}
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Icon className="h-4 w-4 text-muted-foreground" />
                      <CardTitle className="text-base">
                        <Label htmlFor={service.id} className="cursor-pointer">
                          {service.title}
                        </Label>
                      </CardTitle>
                    </div>
                    <CardDescription className="mt-1">
                      {service.description}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
