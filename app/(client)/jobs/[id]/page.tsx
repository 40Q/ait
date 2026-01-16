"use client";

import { use } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  ArrowLeft,
  Calendar,
  MapPin,
  FileCheck,
  Receipt,
  Truck,
  Clock,
  User,
  Phone,
  Mail,
  Loader2,
} from "lucide-react";
import { JobTimeline } from "./_components/job-timeline";
import { InvoicesList } from "./_components/invoices-list";
import { DocumentList } from "@/components/ui/document-list";
import { useJob, useRealtimeJob } from "@/lib/hooks";
import { createClient } from "@/lib/supabase/client";
import { getSignedUrl, STORAGE_BUCKETS } from "@/lib/storage/upload";
import { formatDate } from "@/lib/utils/date";

interface JobDetailPageProps {
  params: Promise<{ id: string }>;
}

export default function JobDetailPage({ params }: JobDetailPageProps) {
  const { id } = use(params);
  const supabase = createClient();

  const { data: job, isLoading, error } = useJob(id);

  // Subscribe to real-time updates
  useRealtimeJob(id);

  const handleViewDocument = async (filePath: string) => {
    try {
      const signedUrl = await getSignedUrl(supabase, STORAGE_BUCKETS.DOCUMENTS, filePath, 60);
      window.open(signedUrl, "_blank");
    } catch (error) {
      console.error("Failed to view document:", error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-4">
        <p className="text-destructive">
          {error ? `Failed to load job: ${error.message}` : "Job not found"}
        </p>
        <Button variant="outline" asChild>
          <Link href="/jobs">Back to Jobs</Link>
        </Button>
      </div>
    );
  }

  const isPickupComplete = ["pickup_complete", "processing", "complete"].includes(job.status);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/jobs">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold">Job #{job.job_number}</h1>
            <StatusBadge status={job.status} />
          </div>
          <div className="mt-2 flex flex-wrap gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              Pickup: {formatDate(job.pickup_date)}
            </span>
            <span className="flex items-center gap-1">
              <MapPin className="h-4 w-4" />
              {job.location.city}, {job.location.state}
            </span>
          </div>
          <div className="mt-2 flex gap-4 text-sm">
            <Link
              href={`/requests/${job.request_id}`}
              className="text-primary hover:underline"
            >
              View Original Request
            </Link>
          </div>
        </div>
      </div>

      {/* Timeline */}
      <Card>
        <CardHeader>
          <CardTitle>Job Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <JobTimeline
            currentStatus={job.status}
            timeline={{
              pickup_scheduled_at: job.pickup_scheduled_at,
              pickup_complete_at: job.pickup_complete_at,
              processing_started_at: job.processing_started_at,
              completed_at: job.completed_at,
            }}
          />
        </CardContent>
      </Card>

      {/* Documents Tabs */}
      <Tabs defaultValue="certificates">
        <TabsList>
          <TabsTrigger value="certificates" className="gap-2">
            <FileCheck className="h-4 w-4" />
            Certificates
            {job.documents.length > 0 && (
              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">
                {job.documents.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="pickup" className="gap-2">
            <Truck className="h-4 w-4" />
            Pickup Details
          </TabsTrigger>
          <TabsTrigger value="invoices" className="gap-2">
            <Receipt className="h-4 w-4" />
            Invoices
            {job.invoices.length > 0 && (
              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">
                {job.invoices.length}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="certificates" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Certificates & Reports</CardTitle>
            </CardHeader>
            <CardContent>
              <DocumentList
                documents={job.documents}
                onView={handleViewDocument}
                emptyMessage="Certificates and reports will be uploaded once processing is complete"
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pickup" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Pickup Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Schedule */}
              <div className="rounded-lg border p-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">Scheduled Date & Time</p>
                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1.5">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{formatDate(job.pickup_date)}</span>
                      </span>
                      {job.pickup_time_window && (
                        <span className="flex items-center gap-1.5">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{job.pickup_time_window}</span>
                        </span>
                      )}
                    </div>
                  </div>
                  <Badge
                    variant="outline"
                    className={
                      isPickupComplete
                        ? "border-green-200 bg-green-50 text-green-700"
                        : "border-yellow-200 bg-yellow-50 text-yellow-700"
                    }
                  >
                    {isPickupComplete ? "Completed" : "Scheduled"}
                  </Badge>
                </div>
              </div>

              {/* Location */}
              <div className="rounded-lg border p-4 space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Pickup Location</p>
                <div className="flex items-start gap-1.5">
                  <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="font-medium">{job.location.address}</p>
                    <p className="text-muted-foreground">
                      {job.location.city}, {job.location.state} {job.location.zip_code}
                    </p>
                  </div>
                </div>
              </div>

              {/* Contact */}
              <div className="rounded-lg border p-4 space-y-2">
                <p className="text-sm font-medium text-muted-foreground">On-site Contact</p>
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{job.contact.name}</span>
                  </div>
                  <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                      <Phone className="h-3.5 w-3.5" />
                      {job.contact.phone}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Mail className="h-3.5 w-3.5" />
                      {job.contact.email}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="invoices" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Invoices</CardTitle>
            </CardHeader>
            <CardContent>
              <InvoicesList invoices={job.invoices} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Job Details */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Equipment</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              {job.equipment.map((item, index) => (
                <div key={index} className="flex justify-between">
                  <span>{item.type}</span>
                  <span className="font-medium">{item.quantity} units</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Services</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              {job.services.map((service, index) => (
                <li key={index} className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                  {service}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
