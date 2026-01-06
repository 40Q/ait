"use client";

import { useState, use, useRef } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StatusBadge, type JobStatus } from "@/components/ui/status-badge";
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
  Download,
  Trash2,
  CheckCircle2,
  Clock,
  Loader2,
  Link as LinkIcon,
  ExternalLink,
} from "lucide-react";
import type { JobDocument, LinkedInvoice } from "../../_types";

// Mock data
const jobData = {
  id: "W2512007",
  companyId: "1",
  companyName: "Acme Corporation",
  quoteId: "Q-2024-0055",
  requestId: "REQ-2024-0042",
  status: "pickup_complete" as JobStatus,
  createdAt: "December 10, 2024",
  pickupDate: "December 15, 2024",
  pickupTime: "9:00 AM - 12:00 PM",
  serviceType: "pickup" as const,

  location: {
    address: "123 Main Street",
    city: "Los Angeles",
    state: "CA",
    zipCode: "90001",
    buildingInfo: "Suite 400, 4th Floor",
  },

  contact: {
    name: "John Smith",
    email: "john.smith@acme.com",
    phone: "(555) 123-4567",
  },

  equipment: [
    { type: "Laptops", quantity: 25 },
    { type: "Desktop Computers", quantity: 10 },
    { type: "Hard Drives (loose)", quantity: 50 },
  ],

  services: [
    "Equipment Pickup & Transport",
    "HD Serialization & Destruction",
    "Certificate of Destruction",
    "Palletizing & Wrap",
  ],

  timeline: {
    pickupScheduled: "Dec 10, 2024 at 3:00 PM",
    pickupComplete: "Dec 15, 2024 at 11:30 AM",
    processing: null,
    complete: null,
  },

  documents: [
    {
      id: "1",
      name: "Pickup Manifest.pdf",
      type: "pickup_document" as const,
      uploadedAt: "Dec 15, 2024",
      uploadedBy: "Admin",
      fileSize: "245 KB",
      url: "#",
    },
  ] as JobDocument[],

  invoices: [] as LinkedInvoice[],
};

const statusTransitions: Record<JobStatus, JobStatus[]> = {
  pickup_scheduled: ["pickup_complete"],
  pickup_complete: ["processing"],
  processing: ["complete"],
  complete: [],
  completed: [],
  in_progress: ["processing", "complete"],
  pending_cod: ["complete"],
};

const statusLabels: Record<JobStatus, string> = {
  pickup_scheduled: "Pickup Scheduled",
  pickup_complete: "Pickup Complete",
  in_progress: "In Progress",
  processing: "Processing",
  pending_cod: "Pending COD",
  complete: "Complete",
  completed: "Completed",
};

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

  const [status, setStatus] = useState<JobStatus>(jobData.status);
  const [documents, setDocuments] = useState<JobDocument[]>(jobData.documents);
  const [showStatusDialog, setShowStatusDialog] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<JobStatus | null>(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedDocType, setSelectedDocType] = useState<string>("");

  const nextStatuses = statusTransitions[status] || [];

  const handleStatusChange = (newStatus: JobStatus) => {
    setPendingStatus(newStatus);
    setShowStatusDialog(true);
  };

  const confirmStatusChange = async () => {
    if (!pendingStatus) return;

    setIsUpdatingStatus(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setStatus(pendingStatus);
    setIsUpdatingStatus(false);
    setShowStatusDialog(false);
    setPendingStatus(null);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedDocType) return;

    setIsUploading(true);
    await new Promise((resolve) => setTimeout(resolve, 1500));

    const newDoc: JobDocument = {
      id: Date.now().toString(),
      name: file.name,
      type: selectedDocType as JobDocument["type"],
      uploadedAt: new Date().toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }),
      uploadedBy: "Admin",
      fileSize: `${(file.size / 1024).toFixed(0)} KB`,
      url: "#",
    };

    setDocuments((prev) => [...prev, newDoc]);
    setIsUploading(false);
    setSelectedDocType("");

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleDeleteDocument = async (docId: string) => {
    setDocuments((prev) => prev.filter((d) => d.id !== docId));
  };

  const timelineSteps = [
    { key: "pickupScheduled", label: "Pickup Scheduled", status: "pickup_scheduled" },
    { key: "pickupComplete", label: "Pickup Complete", status: "pickup_complete" },
    { key: "processing", label: "Processing", status: "processing" },
    { key: "complete", label: "Complete", status: "complete" },
  ];

  const getStepStatus = (stepStatus: string) => {
    const statusOrder = ["pickup_scheduled", "pickup_complete", "processing", "complete"];
    const currentIndex = statusOrder.indexOf(status);
    const stepIndex = statusOrder.indexOf(stepStatus);

    if (stepIndex < currentIndex) return "complete";
    if (stepIndex === currentIndex) return "current";
    return "upcoming";
  };

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
            <h1 className="text-2xl font-bold">{id}</h1>
            <StatusBadge status={status} />
          </div>
          <p className="text-sm text-muted-foreground">
            Created on {jobData.createdAt}
          </p>
        </div>
      </div>

      {/* Status Update */}
      {nextStatuses.length > 0 && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-medium">Update Job Status</p>
                <p className="text-sm text-muted-foreground">
                  Current status: {statusLabels[status]}
                </p>
              </div>
              <div className="flex gap-2">
                {nextStatuses.map((nextStatus) => (
                  <Button
                    key={nextStatus}
                    onClick={() => handleStatusChange(nextStatus)}
                  >
                    Mark as {statusLabels[nextStatus]}
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

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
                    {jobData.timeline[step.key as keyof typeof jobData.timeline] && (
                      <p className="text-xs text-muted-foreground">
                        {jobData.timeline[step.key as keyof typeof jobData.timeline]}
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
                Documents ({documents.length})
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
                  {documents.length > 0 ? (
                    <div className="space-y-2">
                      {documents.map((doc) => (
                        <div
                          key={doc.id}
                          className="flex items-center justify-between rounded-lg border p-4"
                        >
                          <div className="flex items-center gap-3">
                            <FileText className="h-8 w-8 text-muted-foreground" />
                            <div>
                              <p className="font-medium">{doc.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {documentTypes.find((t) => t.value === doc.type)?.label} | {doc.fileSize} | Uploaded {doc.uploadedAt}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button variant="ghost" size="icon">
                              <Download className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteDocument(doc.id)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <FileText className="mx-auto h-12 w-12 mb-2 opacity-50" />
                      <p>No documents uploaded yet</p>
                    </div>
                  )}
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
                  <p className="font-medium">{jobData.location.address}</p>
                  <p>
                    {jobData.location.city}, {jobData.location.state}{" "}
                    {jobData.location.zipCode}
                  </p>
                  {jobData.location.buildingInfo && (
                    <p className="text-muted-foreground">
                      {jobData.location.buildingInfo}
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
                  <p className="font-medium">{jobData.contact.name}</p>
                  <p className="flex items-center gap-2 text-sm">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    {jobData.contact.email}
                  </p>
                  <p className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    {jobData.contact.phone}
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
                      {jobData.equipment.map((item, i) => (
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
                      {jobData.services.map((service, i) => (
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
                  {jobData.invoices.length > 0 ? (
                    <div className="space-y-2">
                      {jobData.invoices.map((invoice) => (
                        <div
                          key={invoice.id}
                          className="flex items-center justify-between rounded-lg border p-4"
                        >
                          <div>
                            <p className="font-mono font-medium">
                              {invoice.invoiceNumber}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {invoice.date} | Due: {invoice.dueDate}
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
                  href={`/admin/companies/${jobData.companyId}`}
                  className="font-medium hover:underline"
                >
                  {jobData.companyName}
                </Link>
              </div>
              <div>
                <p className="text-muted-foreground">Quote</p>
                <Link
                  href={`/admin/quotes/${jobData.quoteId}`}
                  className="font-mono hover:underline"
                >
                  {jobData.quoteId}
                </Link>
              </div>
              <div>
                <p className="text-muted-foreground">Request</p>
                <Link
                  href={`/admin/requests/${jobData.requestId}`}
                  className="font-mono hover:underline"
                >
                  {jobData.requestId}
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Schedule */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Schedule</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center gap-3">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-muted-foreground">Pickup Date</p>
                  <p className="font-medium">{jobData.pickupDate}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-muted-foreground">Time Window</p>
                  <p className="font-medium">{jobData.pickupTime}</p>
                </div>
              </div>
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
              <strong>{statusLabels[status]}</strong> to{" "}
              <strong>{pendingStatus ? statusLabels[pendingStatus] : ""}</strong>?
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
            <Button onClick={confirmStatusChange} disabled={isUpdatingStatus}>
              {isUpdatingStatus && (
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
