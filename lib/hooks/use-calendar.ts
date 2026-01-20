"use client";

import { useState, useMemo, useCallback } from "react";
import { useJobList } from "./use-jobs";
import {
  getMonthStart,
  getMonthEnd,
  getCalendarDays,
  getDateKey,
} from "@/lib/utils/date";
import type { JobListItem, JobStatus } from "@/lib/database/types";

interface UseCalendarOptions {
  statuses?: JobStatus[];
}

const DEFAULT_STATUSES: JobStatus[] = ["needs_scheduling", "pickup_scheduled"];

/**
 * Hook for managing calendar navigation (month/year state)
 */
export function useCalendarNavigation(initialDate: Date = new Date()) {
  const [currentDate, setCurrentDate] = useState(initialDate);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const goToPreviousMonth = useCallback(() => {
    setCurrentDate(new Date(year, month - 1, 1));
  }, [year, month]);

  const goToNextMonth = useCallback(() => {
    setCurrentDate(new Date(year, month + 1, 1));
  }, [year, month]);

  const goToToday = useCallback(() => {
    setCurrentDate(new Date());
  }, []);

  const days = useMemo(() => getCalendarDays(year, month), [year, month]);

  return {
    currentDate,
    year,
    month,
    days,
    goToPreviousMonth,
    goToNextMonth,
    goToToday,
  };
}

/**
 * Hook for fetching and organizing jobs for calendar display
 * Includes prefetching for next month
 */
export function useCalendarJobs(
  year: number,
  month: number,
  options: UseCalendarOptions = {}
) {
  const { statuses = DEFAULT_STATUSES } = options;

  // Current month date range
  const fromDate = getMonthStart(year, month);
  const toDate = getMonthEnd(year, month);

  // Fetch current month jobs
  const { data: jobs = [], isLoading } = useJobList({
    status: statuses,
    from_date: fromDate,
    to_date: toDate,
  });

  // Prefetch next month's jobs
  const nextMonthStart = getMonthStart(year, month + 1);
  const nextMonthEnd = getMonthEnd(year, month + 1);
  useJobList({
    status: statuses,
    from_date: nextMonthStart,
    to_date: nextMonthEnd,
  });

  // Group jobs by date for calendar display
  const jobsByDate = useMemo(() => {
    const map = new Map<string, JobListItem[]>();
    jobs.forEach((job) => {
      if (job.pickup_date) {
        const dateKey = job.pickup_date.split("T")[0];
        const existing = map.get(dateKey) || [];
        map.set(dateKey, [...existing, job]);
      }
    });
    return map;
  }, [jobs]);

  // Get jobs for a specific date
  const getJobsForDate = useCallback(
    (date: Date): JobListItem[] => {
      const dateKey = getDateKey(date);
      return jobsByDate.get(dateKey) || [];
    },
    [jobsByDate]
  );

  // Get jobs with pickup dates, sorted by date
  const sortedJobs = useMemo(() => {
    return jobs
      .filter((j) => j.pickup_date)
      .sort(
        (a, b) =>
          new Date(a.pickup_date!).getTime() - new Date(b.pickup_date!).getTime()
      );
  }, [jobs]);

  return {
    jobs,
    jobsByDate,
    sortedJobs,
    getJobsForDate,
    isLoading,
  };
}
