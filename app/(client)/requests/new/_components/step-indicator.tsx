import { cn } from "@/lib/utils";
import { Check } from "lucide-react";
import { steps } from "./types";

interface StepIndicatorProps {
  currentStep: number;
}

export function StepIndicator({ currentStep }: StepIndicatorProps) {
  return (
    <nav aria-label="Progress">
      <ol className="flex items-center">
        {steps.map((step, index) => (
          <li
            key={step.id}
            className={cn(
              "relative",
              index !== steps.length - 1 && "flex-1"
            )}
          >
            <div className="flex items-center">
              <div
                className={cn(
                  "relative flex h-10 w-10 items-center justify-center rounded-full border-2 transition-colors",
                  index < currentStep
                    ? "border-primary bg-primary text-primary-foreground"
                    : index === currentStep
                    ? "border-primary bg-background text-primary"
                    : "border-muted bg-background text-muted-foreground"
                )}
              >
                {index < currentStep ? (
                  <Check className="h-5 w-5" />
                ) : (
                  <span className="text-sm font-medium">{index + 1}</span>
                )}
              </div>
              {index !== steps.length - 1 && (
                <div
                  className={cn(
                    "ml-4 hidden h-0.5 flex-1 sm:block",
                    index < currentStep ? "bg-primary" : "bg-muted"
                  )}
                />
              )}
            </div>
            <div className="mt-2 hidden sm:block">
              <p
                className={cn(
                  "text-sm font-medium",
                  index <= currentStep
                    ? "text-foreground"
                    : "text-muted-foreground"
                )}
              >
                {step.title}
              </p>
              <p className="text-xs text-muted-foreground">{step.description}</p>
            </div>
          </li>
        ))}
      </ol>
    </nav>
  );
}
