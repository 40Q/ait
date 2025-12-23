"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Loader2, Check, CalendarIcon, Truck } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface LogisticsFormData {
  // Contact Information
  authorizedPersonName: string;
  contactPhone: string;
  contactEmail: string;
  preferredContactMethod: "phone" | "email";

  // Pickup Details
  pickupDateRequested: Date | null;
  pickupAddress: string;
  destinationAddress: string;

  // Material Preparation
  isMaterialPrepared: boolean | null;
  materialFitsOnPallets: string;
  numberOfPallets: string;
  sizeOfPallets: string;
  heightOfPalletizedMaterial: string;
  estimatedWeightPerPallet: string;

  // Preparation Services Needed
  needsPalletizing: boolean;
  needsShrinkWrap: boolean;
  needsPalletStrap: boolean;

  // Additional
  additionalComments: string;
}

const initialFormData: LogisticsFormData = {
  authorizedPersonName: "",
  contactPhone: "",
  contactEmail: "",
  preferredContactMethod: "email",
  pickupDateRequested: null,
  pickupAddress: "",
  destinationAddress: "",
  isMaterialPrepared: null,
  materialFitsOnPallets: "",
  numberOfPallets: "",
  sizeOfPallets: "",
  heightOfPalletizedMaterial: "",
  estimatedWeightPerPallet: "",
  needsPalletizing: false,
  needsShrinkWrap: false,
  needsPalletStrap: false,
  additionalComments: "",
};

export default function LogisticsPage() {
  const router = useRouter();
  const [formData, setFormData] =
    useState<LogisticsFormData>(initialFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (data: Partial<LogisticsFormData>) => {
    setFormData((prev) => ({ ...prev, ...data }));
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setIsSubmitting(false);
    router.push("/requests");
  };

  const canSubmit =
    formData.authorizedPersonName &&
    formData.contactPhone &&
    formData.contactEmail &&
    formData.pickupAddress &&
    formData.destinationAddress &&
    formData.isMaterialPrepared !== null;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader
        title="Logistics Request"
        description="Request logistics services for material transportation"
      />

      <Card>
        <CardHeader>
          <CardTitle>Contact Information</CardTitle>
          <CardDescription>
            After you fill out this order request, we will contact you to go over
            details and availability before the order is completed.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="authorizedPersonName">
              Name of authorized person requesting logistics{" "}
              <span className="text-destructive">*</span>
            </Label>
            <Input
              id="authorizedPersonName"
              value={formData.authorizedPersonName}
              onChange={(e) =>
                handleChange({ authorizedPersonName: e.target.value })
              }
              placeholder="Your name"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="contactPhone">
                Contact Phone <span className="text-destructive">*</span>
              </Label>
              <Input
                id="contactPhone"
                type="tel"
                value={formData.contactPhone}
                onChange={(e) => handleChange({ contactPhone: e.target.value })}
                placeholder="(555) 123-4567"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contactEmail">
                Contact Email <span className="text-destructive">*</span>
              </Label>
              <Input
                id="contactEmail"
                type="email"
                value={formData.contactEmail}
                onChange={(e) => handleChange({ contactEmail: e.target.value })}
                placeholder="email@example.com"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Preferred Contact Method</Label>
            <RadioGroup
              value={formData.preferredContactMethod}
              onValueChange={(value: "phone" | "email") =>
                handleChange({ preferredContactMethod: value })
              }
              className="flex gap-4"
            >
              <div className="flex items-center gap-2">
                <RadioGroupItem value="phone" id="contact-phone" />
                <Label htmlFor="contact-phone" className="cursor-pointer">
                  Phone
                </Label>
              </div>
              <div className="flex items-center gap-2">
                <RadioGroupItem value="email" id="contact-email" />
                <Label htmlFor="contact-email" className="cursor-pointer">
                  Email
                </Label>
              </div>
            </RadioGroup>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Truck className="h-5 w-5" />
            Pickup & Delivery Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>
              Pick Up Date Requested <span className="text-destructive">*</span>
            </Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !formData.pickupDateRequested && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {formData.pickupDateRequested ? (
                    format(formData.pickupDateRequested, "PPP")
                  ) : (
                    <span>Select date</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={formData.pickupDateRequested || undefined}
                  onSelect={(date) =>
                    handleChange({ pickupDateRequested: date || null })
                  }
                  disabled={(date) => date < new Date()}
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label htmlFor="pickupAddress">
              Pick-up Address <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="pickupAddress"
              value={formData.pickupAddress}
              onChange={(e) => handleChange({ pickupAddress: e.target.value })}
              placeholder="Full address where material will be picked up"
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="destinationAddress">
              Destination Address <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="destinationAddress"
              value={formData.destinationAddress}
              onChange={(e) =>
                handleChange({ destinationAddress: e.target.value })
              }
              placeholder="Full address where material will be delivered"
              rows={2}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Material Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>
              Is material prepared for pickup?{" "}
              <span className="text-destructive">*</span>
            </Label>
            <RadioGroup
              value={
                formData.isMaterialPrepared === null
                  ? ""
                  : formData.isMaterialPrepared
                  ? "yes"
                  : "no"
              }
              onValueChange={(value) =>
                handleChange({ isMaterialPrepared: value === "yes" })
              }
              className="flex gap-4"
            >
              <div className="flex items-center gap-2">
                <RadioGroupItem value="yes" id="prepared-yes" />
                <Label htmlFor="prepared-yes" className="cursor-pointer">
                  Yes
                </Label>
              </div>
              <div className="flex items-center gap-2">
                <RadioGroupItem value="no" id="prepared-no" />
                <Label htmlFor="prepared-no" className="cursor-pointer">
                  No
                </Label>
              </div>
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <Label htmlFor="materialFitsOnPallets">
              Does all of the material fit onto pallets? If NO, please explain
            </Label>
            <Input
              id="materialFitsOnPallets"
              value={formData.materialFitsOnPallets}
              onChange={(e) =>
                handleChange({ materialFitsOnPallets: e.target.value })
              }
              placeholder="Yes / No - explanation if needed"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="numberOfPallets">Number of Pallets</Label>
              <Input
                id="numberOfPallets"
                value={formData.numberOfPallets}
                onChange={(e) =>
                  handleChange({ numberOfPallets: e.target.value })
                }
                placeholder="e.g., 5"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sizeOfPallets">Size of Pallets</Label>
              <Input
                id="sizeOfPallets"
                value={formData.sizeOfPallets}
                onChange={(e) => handleChange({ sizeOfPallets: e.target.value })}
                placeholder="e.g., 48x40 inches"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="heightOfPalletizedMaterial">
                Height of Palletized Material
              </Label>
              <Input
                id="heightOfPalletizedMaterial"
                value={formData.heightOfPalletizedMaterial}
                onChange={(e) =>
                  handleChange({ heightOfPalletizedMaterial: e.target.value })
                }
                placeholder="e.g., 4 feet"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="estimatedWeightPerPallet">
                Estimated Weight per Pallet
              </Label>
              <Input
                id="estimatedWeightPerPallet"
                value={formData.estimatedWeightPerPallet}
                onChange={(e) =>
                  handleChange({ estimatedWeightPerPallet: e.target.value })
                }
                placeholder="e.g., 500 lbs each"
              />
            </div>
          </div>

          {formData.isMaterialPrepared === false && (
            <div className="space-y-3 rounded-lg border p-4">
              <Label className="text-base">
                Preparation services needed (if material is not prepared)
              </Label>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Checkbox
                    id="needsPalletizing"
                    checked={formData.needsPalletizing}
                    onCheckedChange={(checked) =>
                      handleChange({ needsPalletizing: checked === true })
                    }
                  />
                  <Label htmlFor="needsPalletizing" className="cursor-pointer">
                    Palletize
                  </Label>
                </div>
                <div className="flex items-center gap-3">
                  <Checkbox
                    id="needsShrinkWrap"
                    checked={formData.needsShrinkWrap}
                    onCheckedChange={(checked) =>
                      handleChange({ needsShrinkWrap: checked === true })
                    }
                  />
                  <Label htmlFor="needsShrinkWrap" className="cursor-pointer">
                    Shrink Wrap
                  </Label>
                </div>
                <div className="flex items-center gap-3">
                  <Checkbox
                    id="needsPalletStrap"
                    checked={formData.needsPalletStrap}
                    onCheckedChange={(checked) =>
                      handleChange({ needsPalletStrap: checked === true })
                    }
                  />
                  <Label htmlFor="needsPalletStrap" className="cursor-pointer">
                    Pallet Strap
                  </Label>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div className="space-y-2">
            <Label htmlFor="additionalComments">
              Any additional comments that might help us assess your logistics
              request?
            </Label>
            <Textarea
              id="additionalComments"
              value={formData.additionalComments}
              onChange={(e) =>
                handleChange({ additionalComments: e.target.value })
              }
              placeholder="Special requirements, timing constraints, access instructions, etc."
              rows={4}
            />
          </div>
        </CardContent>
        <CardFooter className="border-t px-6 py-4">
          <Button
            onClick={handleSubmit}
            disabled={!canSubmit || isSubmitting}
            className="w-full sm:w-auto"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <Check className="mr-2 h-4 w-4" />
                Submit Request
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
