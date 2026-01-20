"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { useCalendarNavigation, useCalendarJobs } from "@/lib/hooks";
import { DAYS_OF_WEEK, MONTH_NAMES, isSameDay } from "@/lib/utils/date";
import { cn } from "@/lib/utils";
import { JobEvent, PickupList } from "./_components";

export default function CalendarPage() {
  const {
    year,
    month,
    days,
    goToPreviousMonth,
    goToNextMonth,
    goToToday,
  } = useCalendarNavigation();

  const { getJobsForDate, sortedJobs, isLoading } = useCalendarJobs(year, month);

  const today = new Date();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Pickup Calendar</h1>
          <p className="text-muted-foreground">
            View scheduled pickups and add them to Google Calendar
          </p>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl">
              {MONTH_NAMES[month]} {year}
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={goToToday}>
                Today
              </Button>
              <Button variant="outline" size="icon" onClick={goToPreviousMonth}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" onClick={goToNextMonth}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="relative">
          <div className="grid grid-cols-7 gap-px bg-muted rounded-lg overflow-hidden">
            {/* Day headers */}
            {DAYS_OF_WEEK.map((day) => (
              <div
                key={day}
                className="bg-muted px-2 py-3 text-center text-sm font-medium text-muted-foreground"
              >
                {day}
              </div>
            ))}

            {/* Calendar days */}
            {days.map((day, index) => {
              const dayJobs = getJobsForDate(day);
              const isCurrentMonth = day.getMonth() === month;
              const isToday = isSameDay(day, today);

              return (
                <div
                  key={index}
                  className={cn(
                    "min-h-[120px] bg-background p-2 transition-colors",
                    !isCurrentMonth && "bg-muted/50",
                    isToday && "ring-2 ring-primary ring-inset"
                  )}
                >
                  <div
                    className={cn(
                      "text-sm font-medium mb-1",
                      !isCurrentMonth && "text-muted-foreground",
                      isToday && "text-primary"
                    )}
                  >
                    {day.getDate()}
                  </div>

                  <div className="space-y-1">
                    {dayJobs.slice(0, 3).map((job) => (
                      <JobEvent key={job.id} job={job} />
                    ))}
                    {dayJobs.length > 3 && (
                      <div className="text-xs text-muted-foreground pl-1">
                        +{dayJobs.length - 3} more
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {isLoading && (
            <div className="absolute inset-0 bg-background/80 flex items-center justify-center rounded-lg">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          )}
        </CardContent>
      </Card>

      <PickupList jobs={sortedJobs} isLoading={isLoading} />
    </div>
  );
}
