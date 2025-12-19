import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/ui/status-badge";
import { ArrowLeft, Calendar, MapPin, FileCheck, Receipt, Truck, Clock, User, Phone, Mail } from "lucide-react";
import { JobTimeline } from "./_components/job-timeline";
import { DocumentsList } from "./_components/documents-list";
import { InvoicesList } from "./_components/invoices-list";

type ClientJobStatus = "pickup_scheduled" | "pickup_complete" | "processing" | "complete";

// Mock data
const jobData: {
  id: string;
  name: string;
  status: ClientJobStatus;
  pickupDate: string;
  pickupTime: string;
  createdAt: string;
  quoteId: string;
  requestId: string;
  location: { address: string; city: string; state: string; zipCode: string };
  contact: { name: string; phone: string; email: string };
  equipment: { type: string; quantity: number }[];
  services: string[];
  serviceType: "pickup" | "dropoff";
  timeline: {
    pickupScheduled?: string;
    pickupComplete?: string;
    processing?: string;
    complete?: string;
  };
} = {
  id: "W2512003",
  name: "Q4 Office Equipment Recycling",
  status: "processing",
  pickupDate: "December 10, 2024",
  pickupTime: "10:00 AM",
  createdAt: "December 8, 2024",
  quoteId: "Q-2024-0042",
  requestId: "REQ-2024-0045",
  location: {
    address: "123 Main Street, Suite 400",
    city: "Los Angeles",
    state: "CA",
    zipCode: "90001",
  },
  contact: {
    name: "John Smith",
    phone: "(555) 123-4567",
    email: "john.smith@company.com",
  },
  equipment: [
    { type: "Laptops", quantity: 15 },
    { type: "Desktop Computers", quantity: 8 },
    { type: "Hard Drives (loose)", quantity: 20 },
  ],
  services: ["HD Destruction (Off-site)", "Certificate of Destruction"],
  serviceType: "pickup",
  timeline: {
    pickupScheduled: "Dec 8, 2024",
    pickupComplete: "Dec 10, 2024",
    processing: "Dec 10, 2024",
  },
};

const certificates = [
  {
    id: "1",
    name: "Certificate of Destruction - W2512003.pdf",
    type: "certificate" as const,
    uploadedAt: "Dec 15, 2024",
  },
  {
    id: "2",
    name: "Certificate of Recycling - W2512003.pdf",
    type: "certificate" as const,
    uploadedAt: "Dec 15, 2024",
  },
  {
    id: "3",
    name: "HD Serialization Report - W2512003.pdf",
    type: "certificate" as const,
    uploadedAt: "Dec 15, 2024",
  },
  {
    id: "4",
    name: "Asset Serialization Report - W2512003.pdf",
    type: "certificate" as const,
    uploadedAt: "Dec 15, 2024",
  },
  {
    id: "5",
    name: "Warehouse Processing Report - W2512003.pdf",
    type: "certificate" as const,
    uploadedAt: "Dec 15, 2024",
  },
];

const invoices = [
  {
    id: "1",
    number: "INV-2024-1234",
    date: "Dec 15, 2024",
    dueDate: "Jan 15, 2025",
    amount: 1200,
    status: "unpaid" as const,
  },
];

interface JobDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function JobDetailPage({ params }: JobDetailPageProps) {
  const { id } = await params;

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
            <h1 className="text-2xl font-bold">{id}</h1>
            <StatusBadge status={jobData.status} />
          </div>
          <p className="mt-1 text-lg">{jobData.name}</p>
          <div className="mt-2 flex flex-wrap gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              Pickup: {jobData.pickupDate}
            </span>
            <span className="flex items-center gap-1">
              <MapPin className="h-4 w-4" />
              {jobData.location.city}, {jobData.location.state}
            </span>
          </div>
          <div className="mt-2 flex gap-4 text-sm">
            <Link
              href={`/requests/${jobData.requestId}`}
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
            currentStatus={jobData.status}
            timeline={jobData.timeline}
          />
        </CardContent>
      </Card>

      {/* Documents Tabs */}
      <Tabs defaultValue="certificates">
        <TabsList>
          <TabsTrigger value="certificates" className="gap-2">
            <FileCheck className="h-4 w-4" />
            Certificates
            {certificates.length > 0 && (
              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">
                {certificates.length}
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
            {invoices.length > 0 && (
              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">
                {invoices.length}
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
              <DocumentsList
                documents={certificates}
                emptyMessage="Certificates and reports will be uploaded once processing is complete"
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pickup" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                {jobData.serviceType === "pickup" ? "Pickup" : "Drop-off"} Details
              </CardTitle>
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
                        <span className="font-medium">{jobData.pickupDate}</span>
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{jobData.pickupTime}</span>
                      </span>
                    </div>
                  </div>
                  <Badge
                    variant="outline"
                    className={
                      jobData.status === "pickup_complete" || jobData.status === "processing" || jobData.status === "complete"
                        ? "border-green-200 bg-green-50 text-green-700"
                        : "border-yellow-200 bg-yellow-50 text-yellow-700"
                    }
                  >
                    {jobData.status === "pickup_complete" || jobData.status === "processing" || jobData.status === "complete"
                      ? "Completed"
                      : "Scheduled"}
                  </Badge>
                </div>
              </div>

              {/* Location */}
              <div className="rounded-lg border p-4 space-y-1">
                <p className="text-sm font-medium text-muted-foreground">
                  {jobData.serviceType === "pickup" ? "Pickup" : "Drop-off"} Location
                </p>
                <div className="flex items-start gap-1.5">
                  <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="font-medium">{jobData.location.address}</p>
                    <p className="text-muted-foreground">
                      {jobData.location.city}, {jobData.location.state} {jobData.location.zipCode}
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
                    <span className="font-medium">{jobData.contact.name}</span>
                  </div>
                  <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                      <Phone className="h-3.5 w-3.5" />
                      {jobData.contact.phone}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Mail className="h-3.5 w-3.5" />
                      {jobData.contact.email}
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
              <InvoicesList invoices={invoices} />
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
              {jobData.equipment.map((item, index) => (
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
              {jobData.services.map((service, index) => (
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
