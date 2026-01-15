"use client";

import { useState } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { ArrowLeft, ArrowRight, Loader2, Check } from "lucide-react";
import { StepIndicator } from "./_components/step-indicator";
import { StepLocation } from "./_components/step-location";
import { StepSchedule } from "./_components/step-schedule";
import { StepEquipment } from "./_components/step-equipment";
import { StepServices } from "./_components/step-services";
import { StepReview } from "./_components/step-review";
import { initialFormData, steps, type PickupRequestFormData } from "./_components/types";
import { useSubmitRequest } from "./_hooks/use-submit-request";

export default function NewRequestPage() {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<PickupRequestFormData>(initialFormData);
  const [termsAccepted, setTermsAccepted] = useState(false);

  const { submit, isUploading, isSubmitting, error } = useSubmitRequest();

  const handleFormChange = (data: Partial<PickupRequestFormData>) => {
    setFormData((prev) => ({ ...prev, ...data }));
  };

  const isLastStep = currentStep === steps.length - 1;
  const canSubmit = isLastStep && termsAccepted;
  const isPending = isUploading || isSubmitting;

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return <StepLocation data={formData} onChange={handleFormChange} />;
      case 1:
        return <StepSchedule data={formData} onChange={handleFormChange} />;
      case 2:
        return <StepEquipment data={formData} onChange={handleFormChange} />;
      case 3:
        return <StepServices data={formData} onChange={handleFormChange} />;
      case 4:
        return (
          <StepReview
            data={formData}
            onChange={handleFormChange}
            termsAccepted={termsAccepted}
            onTermsChange={setTermsAccepted}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader
        title="Request a Pickup"
        description="Submit a new pickup request for electronics recycling"
      />

      <Card>
        <CardContent>
          <StepIndicator currentStep={currentStep} />
        </CardContent>
      </Card>

      <Card>
        <CardContent>{renderStep()}</CardContent>
        <CardFooter className="flex flex-col gap-4 border-t px-6 py-4">
          {error && (
            <p className="text-sm text-destructive w-full">{error}</p>
          )}
          <div className="flex justify-between w-full">
            <Button
              variant="outline"
              onClick={() => setCurrentStep((s) => s - 1)}
              disabled={currentStep === 0}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>

            {isLastStep ? (
              <Button
                onClick={() => submit(formData)}
                disabled={!canSubmit || isPending}
              >
                {isUploading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Uploading files...
                  </>
                ) : isSubmitting ? (
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
            ) : (
              <Button onClick={() => setCurrentStep((s) => s + 1)}>
                Next
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            )}
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
