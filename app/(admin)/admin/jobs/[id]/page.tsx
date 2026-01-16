"use client";

import { useState, use, useRef } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StatusBadge } from "@/components/ui/status-badge";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ArrowLeft,
  Building2,
  MapPin,
  Calendar,
  User,
  Phone,
  Mail,
  Package,
  Upload,
  FileText,
  CheckCircle2,
  Clock,
  Loader2,
  Link as LinkIcon,
  ExternalLink,
  Pencil,
  Truck,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useJob, useUpdateJob, useUpdateJobStatus, useRealtimeJob, useCreateDocument, useDeleteDocument, useCurrentUser } from "@/lib/hooks";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { jobStatusLabels, type JobStatus, type DocumentType } from "@/lib/database/types";
import { createClient } from "@/lib/supabase/client";
import { uploadFile, getSignedUrl, STORAGE_BUCKETS } from "@/lib/storage/upload";
import { DocumentList } from "@/components/ui/document-list";

const allJobStatuses: JobStatus[] = [
  "pickup_scheduled",
  "pickup_complete",
  "processing",
  "complete",
];

const documentTypes = [
  { value: "certificate_of_destruction", label: "Certificate of Destruction" },
  { value: "certificate_of_recycling", label: "Certificate of Recycling" },
  { value: "hd_serialization", label: "HD Serialization Report" },
  { value: "asset_serialization", label: "Asset Serialization Report" },
  { value: "warehouse_report", label: "Warehouse Processing Report" },
  { value: "pickup_document", label: "Pickup Document" },
];

interface JobDetailPageProps {
  params: Promise<{ id: string }>;
}

export default function JobDetailPage({ params }: JobDetailPageProps) {
  const { id } = use(params);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();

  const { data: job, isLoading, error } = useJob(id);
  const { data: currentUser } = useCurrentUser();
  const updateJob = useUpdateJob();
  const updateJobStatus = useUpdateJobStatus();
  const createDocument = useCreateDocument();
  const deleteDocument = useDeleteDocument();

  // Subscribe to real-time updates
  useRealtimeJob(id);

  const [showStatusDialog, setShowStatusDialog] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<JobStatus | null>(null);
  const [selectedDocType, setSelectedDocType] = useState<string>("");

  // Edit mode state for schedule
  const [isEditingSchedule, setIsEditingSchedule] = useState(false);
  const [editPickupDate, setEditPickupDate] = useState("");
  const [editTimeWindow, setEditTimeWindow] = useState("");
  const [editLogisticsPerson, setEditLogisticsPerson] = useState("");

  const startEditingSchedule = () => {
    if (!job) return;
    setEditPickupDate(job.pickup_date);
    setEditTimeWindow(job.pickup_time_window || "");
    setEditLogisticsPerson(job.logistics_person_name || "");
    setIsEditingSchedule(true);
  };

  const cancelEditingSchedule = () => {
    setIsEditingSchedule(false);
  };

  const saveSchedule = () => {
    if (!job) return;
    updateJob.mutate(
      {
        id: job.id,
        data: {
          pickup_date: editPickupDate,
          pickup_time_window: editTimeWindow || null,
          logistics_person_name: editLogisticsPerson || null,
        },
      },
      {
        onSuccess: () => setIsEditingSchedule(false),
      }
    );
  };

  const isUploading = createDocument.isPending;

  const handleStatusChange = (newStatus: JobStatus) => {
    // Skip if selecting the same status
    if (job && newStatus === job.status) return;

    setPendingStatus(newStatus);
    setShowStatusDialog(true);
  };

  const confirmStatusChange = async () => {
    if (!pendingStatus || !job) return;

    updateJobStatus.mutate(
      { id: job.id, status: pendingStatus },
      {
        onSuccess: () => {
          setShowStatusDialog(false);
          setPendingStatus(null);
        },
        onError: (error) => {
          console.error("Failed to update status:", error);
          alert(`Failed to update status: ${error.message}`);
        },
      }
    );
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedDocType || !job || !currentUser?.id) return;

    try {
      // Upload file to storage
      const result = await uploadFile(supabase, file, {
        bucket: STORAGE_BUCKETS.DOCUMENTS,
        folder: job.company_id,
      });

      // Create document record in database
      createDocument.mutate({
        job_id: job.id,
        company_id: job.company_id,
        name: file.name,
        document_type: selectedDocType as DocumentType,
        file_url: result.path,
        file_size: result.size,
        mime_type: file.type,
        uploaded_by: currentUser.id,
      }, {
        onSuccess: () => {
          setSelectedDocType("");
          if (fileInputRef.current) {
            fileInputRef.current.value = "";
          }
        },
      });
    } catch (error) {
      console.error("Upload failed:", error);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleDeleteDocument = async (docId: string, filePath: string) => {
    if (!job) return;
    deleteDocument.mutate({
      id: docId,
      jobId: job.id,
      filePath,
    });
  };

  const handleViewDocument = async (filePath: string) => {
    try {
      const signedUrl = await getSignedUrl(supabase, STORAGE_BUCKETS.DOCUMENTS, filePath, 60);
      window.open(signedUrl, "_blank");
    } catch (error) {
      console.error("Failed to view document:", error);
    }
  };

  const timelineSteps = [
    { key: "pickup_scheduled_at", label: "Pickup Scheduled", status: "pickup_scheduled" },
    { key: "pickup_complete_at", label: "Pickup Complete", status: "pickup_complete" },
    { key: "processing_started_at", label: "Processing", status: "processing" },
    { key: "completed_at", label: "Complete", status: "complete" },
  ];

  const getStepStatus = (stepStatus: string) => {
    if (!job) return "upcoming";
    const statusOrder = ["pickup_scheduled", "pickup_complete", "processing", "complete"];
    const currentIndex = statusOrder.indexOf(job.status);
    const stepIndex = statusOrder.indexOf(stepStatus);

    if (stepIndex < currentIndex) return "complete";
    if (stepIndex === currentIndex) return "current";
    return "upcoming";
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
          <Link href="/admin/jobs">Back to Jobs</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/admin/jobs">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">{job.job_number}</h1>
            <StatusBadge status={job.status} />
          </div>
          <p className="text-sm text-muted-foreground">
            Created on {new Date(job.created_at).toLocaleDateString()}
          </p>
        </div>
      </div>

      {/* Status Update */}
      <Card>
        <CardContent>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-medium">Update Job Status</p>
              <p className="text-sm text-muted-foreground">
                Change the current job status
              </p>
            </div>
            <Select
              value={job.status}
              onValueChange={(value) => handleStatusChange(value as JobStatus)}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {allJobStatuses.map((status) => (
                  <SelectItem key={status} value={status}>
                    {jobStatusLabels[status]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Progress Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Job Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            {timelineSteps.map((step, index) => {
              const stepStatus = getStepStatus(step.status);
              return (
                <div key={step.key} className="flex flex-1 items-center">
                  <div className="flex flex-col items-center">
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-full border-2 ${
                        stepStatus === "complete"
                          ? "border-green-500 bg-green-500 text-white"
                          : stepStatus === "current"
                          ? "border-primary bg-primary text-white"
                          : "border-muted-foreground/30 bg-background text-muted-foreground"
                      }`}
                    >
                      {stepStatus === "complete" ? (
                        <CheckCircle2 className="h-5 w-5" />
                      ) : (
                        <span className="text-sm font-medium">{index + 1}</span>
                      )}
                    </div>
                    <p
                      className={`mt-2 text-xs text-center ${
                        stepStatus === "upcoming"
                          ? "text-muted-foreground"
                          : "font-medium"
                      }`}
                    >
                      {step.label}
                    </p>
                    {job[step.key as keyof typeof job] && (
                      <p className="text-xs text-muted-foreground">
                        {new Date(job[step.key as keyof typeof job] as string).toLocaleString()}
                      </p>
                    )}
                  </div>
                  {index < timelineSteps.length - 1 && (
                    <div
                      className={`h-0.5 flex-1 mx-2 ${
                        getStepStatus(timelineSteps[index + 1].status) !== "upcoming"
                          ? "bg-primary"
                          : "bg-muted-foreground/30"
                      }`}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          {/* Details Tabs */}
          <Tabs defaultValue="documents">
            <TabsList>
              <TabsTrigger value="documents">
                Documents ({job.documents.length})
              </TabsTrigger>
              <TabsTrigger value="details">Job Details</TabsTrigger>
              <TabsTrigger value="invoices">Invoices</TabsTrigger>
            </TabsList>

            {/* Documents Tab */}
            <TabsContent value="documents" className="mt-4">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Documents</CardTitle>
                      <CardDescription>
                        Upload and manage job documents
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Upload Section */}
                  <div className="flex flex-col gap-3 sm:flex-row">
                    <Select
                      value={selectedDocType}
                      onValueChange={setSelectedDocType}
                    >
                      <SelectTrigger className="sm:w-[250px]">
                        <SelectValue placeholder="Select document type..." />
                      </SelectTrigger>
                      <SelectContent>
                        {documentTypes.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".pdf"
                      onChange={handleFileUpload}
                      className="hidden"
                      disabled={!selectedDocType || isUploading}
                    />
                    <Button
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={!selectedDocType || isUploading}
                    >
                      {isUploading ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Upload className="mr-2 h-4 w-4" />
                      )}
                      Upload File
                    </Button>
                  </div>

                  <Separator />

                  {/* Documents List */}
                  <DocumentList
                    documents={job.documents}
                    onView={handleViewDocument}
                    onDelete={handleDeleteDocument}
                    isDeleting={deleteDocument.isPending}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            {/* Details Tab */}
            <TabsContent value="details" className="mt-4 space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    Location
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="font-medium">{job.location.address}</p>
                  <p>
                    {job.location.city}, {job.location.state}{" "}
                    {job.location.zip_code}
                  </p>
                  {job.location.building_info && (
                    <p className="text-muted-foreground">
                      {job.location.building_info}
                    </p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    On-Site Contact
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <p className="font-medium">{job.contact.name}</p>
                  <p className="flex items-center gap-2 text-sm">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    {job.contact.email}
                  </p>
                  <p className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    {job.contact.phone}
                  </p>
                </CardContent>
              </Card>

              <div className="grid gap-4 sm:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Package className="h-4 w-4" />
                      Equipment
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-1">
                      {job.equipment.map((item, i) => (
                        <li key={i} className="flex justify-between text-sm">
                          <span>{item.type}</span>
                          <Badge variant="secondary">{item.quantity}</Badge>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Services</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-1 text-sm">
                      {job.services.map((service, i) => (
                        <li key={i} className="flex items-center gap-2">
                          <CheckCircle2 className="h-3 w-3 text-green-500" />
                          {service}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Invoices Tab */}
            <TabsContent value="invoices" className="mt-4">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Linked Invoices</CardTitle>
                      <CardDescription>
                        Invoices from QuickBooks linked to this job
                      </CardDescription>
                    </div>
                    <Button variant="outline">
                      <LinkIcon className="mr-2 h-4 w-4" />
                      Link Invoice
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {job.invoices.length > 0 ? (
                    <div className="space-y-2">
                      {job.invoices.map((invoice) => (
                        <div
                          key={invoice.id}
                          className="flex items-center justify-between rounded-lg border p-4"
                        >
                          <div>
                            <p className="font-mono font-medium">
                              {invoice.invoice_number}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              Due: {new Date(invoice.due_date).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="text-right">
                              <p className="font-medium">
                                ${invoice.amount.toLocaleString()}
                              </p>
                              <Badge
                                variant={
                                  invoice.status === "paid"
                                    ? "default"
                                    : "secondary"
                                }
                              >
                                {invoice.status}
                              </Badge>
                            </div>
                            <Button variant="ghost" size="icon">
                              <ExternalLink className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <FileText className="mx-auto h-12 w-12 mb-2 opacity-50" />
                      <p>No invoices linked yet</p>
                      <p className="text-sm">
                        Link an invoice from QuickBooks to this job
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Reference */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Reference</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div>
                <p className="text-muted-foreground flex items-center gap-1">
                  <Building2 className="h-3 w-3" />
                  Company
                </p>
                <Link
                  href={`/admin/companies/${job.company_id}`}
                  className="font-medium hover:underline"
                >
                  {job.company?.name || "Unknown Company"}
                </Link>
              </div>
              {job.quote_id && (
                <div>
                  <p className="text-muted-foreground">Quote</p>
                  <Link
                    href={`/admin/quotes/${job.quote_id}`}
                    className="font-mono hover:underline"
                  >
                    {job.quote?.quote_number || job.quote_id}
                  </Link>
                </div>
              )}
              {job.request_id && (
                <div>
                  <p className="text-muted-foreground">Request</p>
                  <Link
                    href={`/admin/requests/${job.request_id}`}
                    className="font-mono hover:underline"
                  >
                    {job.request?.request_number || job.request_id}
                  </Link>
                </div>
              )}
              {!job.quote_id && !job.request_id && (
                <p className="text-muted-foreground text-xs">
                  Created directly (no quote/request)
                </p>
              )}
            </CardContent>
          </Card>

          {/* Schedule */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-base">Schedule</CardTitle>
              {!isEditingSchedule && (
                <Button variant="ghost" size="icon" onClick={startEditingSchedule}>
                  <Pencil className="h-4 w-4" />
                </Button>
              )}
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {isEditingSchedule ? (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="pickupDate">Pickup Date</Label>
                    <Input
                      id="pickupDate"
                      type="date"
                      value={editPickupDate}
                      onChange={(e) => setEditPickupDate(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="timeWindow">Time Window</Label>
                    <Input
                      id="timeWindow"
                      placeholder="e.g., 9:00 AM - 12:00 PM"
                      value={editTimeWindow}
                      onChange={(e) => setEditTimeWindow(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="logisticsPerson">Logistics Person</Label>
                    <Input
                      id="logisticsPerson"
                      placeholder="Name of pickup driver"
                      value={editLogisticsPerson}
                      onChange={(e) => setEditLogisticsPerson(e.target.value)}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={saveSchedule} disabled={updateJob.isPending}>
                      {updateJob.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Save
                    </Button>
                    <Button size="sm" variant="outline" onClick={cancelEditingSchedule}>
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-3">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-muted-foreground">Pickup Date</p>
                      <p className="font-medium">{new Date(job.pickup_date).toLocaleDateString()}</p>
                    </div>
                  </div>
                  {job.pickup_time_window && (
                    <div className="flex items-center gap-3">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-muted-foreground">Time Window</p>
                        <p className="font-medium">{job.pickup_time_window}</p>
                      </div>
                    </div>
                  )}
                  <div className="flex items-center gap-3">
                    <Truck className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-muted-foreground">Logistics Person</p>
                      <p className="font-medium">{job.logistics_person_name || "Not assigned"}</p>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Status Change Dialog */}
      <Dialog open={showStatusDialog} onOpenChange={setShowStatusDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Job Status</DialogTitle>
            <DialogDescription>
              Are you sure you want to change the status from{" "}
              <strong>{jobStatusLabels[job.status]}</strong> to{" "}
              <strong>{pendingStatus ? jobStatusLabels[pendingStatus] : ""}</strong>?
              This will send a notification to the client.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowStatusDialog(false)}
            >
              Cancel
            </Button>
            <Button onClick={confirmStatusChange} disabled={updateJobStatus.isPending}>
              {updateJobStatus.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
