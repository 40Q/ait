import type { JobListItem } from "@/lib/database/types";

/**
 * Generate a Google Calendar URL to create an event for a pickup job
 */
export function generateGoogleCalendarUrl(job: JobListItem): string {
  const title = encodeURIComponent(`Pickup: ${job.company_name} (${job.job_number})`);
  const location = encodeURIComponent(job.location_summary || "");
  const details = encodeURIComponent(
    `Job: ${job.job_number}\nCompany: ${job.company_name}\nEquipment: ${job.equipment_summary || "N/A"}`
  );

  // Parse the pickup date and create start/end times (default 9am-12pm)
  const pickupDate = job.pickup_date ? new Date(job.pickup_date) : new Date();
  const startDate = new Date(pickupDate);
  startDate.setHours(9, 0, 0, 0);
  const endDate = new Date(pickupDate);
  endDate.setHours(12, 0, 0, 0);

  // Format dates for Google Calendar (YYYYMMDDTHHmmss)
  const formatGoogleDate = (d: Date) => {
    return d.toISOString().replace(/[-:]/g, "").split(".")[0];
  };

  const dates = `${formatGoogleDate(startDate)}/${formatGoogleDate(endDate)}`;

  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${dates}&location=${location}&details=${details}`;
}
