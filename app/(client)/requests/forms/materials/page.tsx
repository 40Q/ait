"use client";

import { useState } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Check, TreeDeciduous, Cpu, Box, AlertCircle } from "lucide-react";
import {
  useSubmitMaterials,
  type LocalMaterialsFormData,
} from "@/lib/hooks";

const initialFormData: LocalMaterialsFormData = {
  hasWood: false,
  hasMetal: false,
  hasElectronics: false,
  pickupLocation: "",
  siteContactName: "",
  siteContactPhone: "",
  siteContactEmail: "",
  materialsDescription: "",
};

export default function MaterialsPage() {
  const [formData, setFormData] = useState<LocalMaterialsFormData>(initialFormData);
  const { submit, isSubmitting, error } = useSubmitMaterials();

  const handleChange = (data: Partial<LocalMaterialsFormData>) => {
    setFormData((prev) => ({ ...prev, ...data }));
  };

  const handleSubmit = async () => {
    await submit(formData);
  };

  const hasSelectedMaterial = formData.hasWood || formData.hasMetal || formData.hasElectronics;
  const canSubmit = hasSelectedMaterial && formData.pickupLocation && formData.siteContactName;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader
        title="Materials Pickup"
        description="Request pickup for wood, metal, or electronics materials"
      />

      <Card>
        <CardHeader>
          <CardTitle>Material Type</CardTitle>
          <CardDescription>
            Select which materials you would like to recycle
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <div
              className={`flex flex-col items-center gap-3 rounded-lg border-2 p-4 cursor-pointer transition-colors ${
                formData.hasWood ? "border-primary bg-primary/5" : "border-muted"
              }`}
              onClick={() => handleChange({ hasWood: !formData.hasWood })}
            >
              <Checkbox
                id="hasWood"
                checked={formData.hasWood}
                onCheckedChange={(checked) => handleChange({ hasWood: checked === true })}
              />
              <TreeDeciduous className="h-8 w-8 text-muted-foreground" />
              <Label htmlFor="hasWood" className="cursor-pointer font-medium">
                Wood
              </Label>
            </div>

            <div
              className={`flex flex-col items-center gap-3 rounded-lg border-2 p-4 cursor-pointer transition-colors ${
                formData.hasMetal ? "border-primary bg-primary/5" : "border-muted"
              }`}
              onClick={() => handleChange({ hasMetal: !formData.hasMetal })}
            >
              <Checkbox
                id="hasMetal"
                checked={formData.hasMetal}
                onCheckedChange={(checked) => handleChange({ hasMetal: checked === true })}
              />
              <Box className="h-8 w-8 text-muted-foreground" />
              <Label htmlFor="hasMetal" className="cursor-pointer font-medium">
                Metal
              </Label>
            </div>

            <div
              className={`flex flex-col items-center gap-3 rounded-lg border-2 p-4 cursor-pointer transition-colors ${
                formData.hasElectronics ? "border-primary bg-primary/5" : "border-muted"
              }`}
              onClick={() => handleChange({ hasElectronics: !formData.hasElectronics })}
            >
              <Checkbox
                id="hasElectronics"
                checked={formData.hasElectronics}
                onCheckedChange={(checked) => handleChange({ hasElectronics: checked === true })}
              />
              <Cpu className="h-8 w-8 text-muted-foreground" />
              <Label htmlFor="hasElectronics" className="cursor-pointer font-medium">
                Electronics
              </Label>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Pickup Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="pickupLocation">
              Pickup Location <span className="text-destructive">*</span>
            </Label>
            <Input
              id="pickupLocation"
              value={formData.pickupLocation}
              onChange={(e) => handleChange({ pickupLocation: e.target.value })}
              placeholder="Please provide specific address"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="siteContactName">
              Site Contact Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="siteContactName"
              value={formData.siteContactName}
              onChange={(e) => handleChange({ siteContactName: e.target.value })}
              placeholder="John Smith"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="siteContactPhone">
                Site Contact Phone <span className="text-destructive">*</span>
              </Label>
              <Input
                id="siteContactPhone"
                type="tel"
                value={formData.siteContactPhone}
                onChange={(e) => handleChange({ siteContactPhone: e.target.value })}
                placeholder="(555) 123-4567"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="siteContactEmail">
                Site Contact Email <span className="text-destructive">*</span>
              </Label>
              <Input
                id="siteContactEmail"
                type="email"
                value={formData.siteContactEmail}
                onChange={(e) => handleChange({ siteContactEmail: e.target.value })}
                placeholder="john.smith@example.com"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="materialsDescription">
              What materials are on the pallets? (Rough estimation)
            </Label>
            <Textarea
              id="materialsDescription"
              value={formData.materialsDescription}
              onChange={(e) => handleChange({ materialsDescription: e.target.value })}
              placeholder="Describe the materials, estimated quantities, and any relevant details..."
              rows={4}
            />
          </div>
        </CardContent>
        <CardFooter className="flex-col items-stretch gap-4 border-t px-6 py-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
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
                Request Pickup
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
