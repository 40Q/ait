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
import { HardDrive, Sparkles, Truck, Building2, Package } from "lucide-react";
import type { PickupRequestFormData, DataDestructionService, PackingService } from "./types";
import { dataDestructionOptions, packingServiceOptions } from "./types";

interface StepServicesProps {
  data: PickupRequestFormData;
  onChange: (data: Partial<PickupRequestFormData>) => void;
}

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

      {/* Data Destruction Services */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <HardDrive className="h-4 w-4" />
            Data Destruction Services
          </CardTitle>
          <CardDescription>
            Select the type of data destruction service you require, if any.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Select
            value={data.dataDestructionService}
            onValueChange={(value: DataDestructionService) =>
              onChange({ dataDestructionService: value })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Select data destruction service" />
            </SelectTrigger>
            <SelectContent>
              {dataDestructionOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  <div className="flex flex-col">
                    <span>{option.label}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {data.dataDestructionService !== "none" && (
            <p className="mt-2 text-sm text-muted-foreground">
              {dataDestructionOptions.find(
                (opt) => opt.value === data.dataDestructionService
              )?.description}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Packing Services */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Package className="h-4 w-4" />
            Packing / Palletizing Services
          </CardTitle>
          <CardDescription>
            How is the equipment currently prepared?
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Select
            value={data.packingService}
            onValueChange={(value: PackingService) =>
              onChange({ packingService: value })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Select packing service" />
            </SelectTrigger>
            <SelectContent>
              {packingServiceOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  <div className="flex flex-col">
                    <span>{option.label}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {data.packingService !== "none" && (
            <p className="mt-2 text-sm text-muted-foreground">
              {packingServiceOptions.find(
                (opt) => opt.value === data.packingService
              )?.description}
            </p>
          )}
        </CardContent>
      </Card>

      {/* White Glove Service */}
      <Card className={data.whiteGloveService ? "border-primary" : ""}>
        <CardHeader>
          <div className="flex items-start gap-4">
            <Checkbox
              id="whiteGloveService"
              checked={data.whiteGloveService}
              onCheckedChange={(checked) =>
                onChange({ whiteGloveService: checked === true })
              }
            />
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-muted-foreground" />
                <CardTitle className="text-base">
                  <Label htmlFor="whiteGloveService" className="cursor-pointer">
                    White Glove Services
                  </Label>
                </CardTitle>
              </div>
              <CardDescription className="mt-1">
                Our team handles the complete process: uninstallation, wrapping, packing, and palletizing of your equipment. Ideal for clients who need full-service handling without involving their own staff.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>
    </div>
  );
}
