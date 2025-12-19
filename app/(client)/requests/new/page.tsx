"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
import {
  initialFormData,
  steps,
  type PickupRequestFormData,
} from "./_components/types";

export default function NewRequestPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<PickupRequestFormData>(initialFormData);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFormChange = (data: Partial<PickupRequestFormData>) => {
    setFormData((prev) => ({ ...prev, ...data }));
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setIsSubmitting(false);
    // Would redirect to confirmation or requests page
    router.push("/requests");
  };

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

  const isLastStep = currentStep === steps.length - 1;
  const canSubmit = isLastStep && termsAccepted;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader
        title="Request a Pickup"
        description="Submit a new pickup request for electronics recycling"
      />

      {/* Step Indicator */}
      <Card>
        <CardContent>
          <StepIndicator currentStep={currentStep} />
        </CardContent>
      </Card>

      {/* Form Content */}
      <Card>
        <CardContent>{renderStep()}</CardContent>
        <CardFooter className="flex justify-between border-t px-6 py-4">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={currentStep === 0}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>

          {isLastStep ? (
            <Button
              onClick={handleSubmit}
              disabled={!canSubmit || isSubmitting}
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
          ) : (
            <Button onClick={handleNext}>
              Next
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}
