"use client";

import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import type { PickupRequestFormData } from "./types";

interface StepScheduleProps {
  data: PickupRequestFormData;
  onChange: (data: Partial<PickupRequestFormData>) => void;
}

export function StepSchedule({ data, onChange }: StepScheduleProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Schedule Pickup</h2>
        <p className="text-sm text-muted-foreground">
          When would you like us to pick up the equipment?
        </p>
      </div>

      <div className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Preferred Start Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !data.preferredDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {data.preferredDate
                    ? format(data.preferredDate, "PPP")
                    : "Select date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={data.preferredDate ?? undefined}
                  onSelect={(date) => onChange({ preferredDate: date ?? null })}
                  disabled={(date) => date < new Date()}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label>End of Date Range (optional)</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !data.preferredDateRangeEnd && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {data.preferredDateRangeEnd
                    ? format(data.preferredDateRangeEnd, "PPP")
                    : "Select end date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={data.preferredDateRangeEnd ?? undefined}
                  onSelect={(date) => onChange({ preferredDateRangeEnd: date ?? null })}
                  disabled={(date) =>
                    date < new Date() ||
                    (data.preferredDate ? date < data.preferredDate : false)
                  }
                />
              </PopoverContent>
            </Popover>
            <p className="text-xs text-muted-foreground">
              If you have flexibility, select an end date to give us a date range.
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="unavailableDates">
            Dates/times the on-site contact will NOT be available
          </Label>
          <Textarea
            id="unavailableDates"
            value={data.unavailableDates}
            onChange={(e) => onChange({ unavailableDates: e.target.value })}
            placeholder="e.g., Dec 24-26, mornings before 10am, Fridays after 2pm"
            rows={2}
          />
          <p className="text-xs text-muted-foreground">
            Let us know any dates or times within your preferred range when pickup cannot occur.
          </p>
        </div>
      </div>
    </div>
  );
}
