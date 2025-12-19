import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft } from "lucide-react";
import { RequestDetails } from "./_components/request-details";
import { QuoteReview } from "./_components/quote-review";

// Mock data - would come from API
const requestData: {
  id: string;
  status: "pending" | "quote_ready" | "revision_requested" | "accepted" | "declined";
  submittedAt: string;
  location: {
    address: string;
    buildingInfo: string;
    city: string;
    state: string;
    zipCode: string;
    contactName: string;
    contactPhone: string;
    accessInstructions: string;
  };
  schedule: {
    preferredDate: string;
    alternateDate: string | null;
    timeWindow: string;
    urgency: string;
  };
  equipment: { type: string; quantity: number }[];
  services: string[];
  additionalNotes: string;
} = {
  id: "REQ-2024-0045",
  status: "quote_ready",
  submittedAt: "December 15, 2024 at 10:30 AM",
  location: {
    address: "123 Main Street",
    buildingInfo: "Suite 400, 4th Floor",
    city: "Los Angeles",
    state: "CA",
    zipCode: "90001",
    contactName: "John Smith",
    contactPhone: "(555) 123-4567",
    accessInstructions:
      "Use loading dock on east side. Check in with security at front desk.",
  },
  schedule: {
    preferredDate: "December 20, 2024",
    alternateDate: "December 22, 2024",
    timeWindow: "morning",
    urgency: "standard",
  },
  equipment: [
    { type: "Laptops", quantity: 15 },
    { type: "Desktop Computers", quantity: 8 },
    { type: "Hard Drives (loose)", quantity: 20 },
  ],
  services: ["HD Destruction (Off-site)", "Certificate of Destruction"],
  additionalNotes:
    "Please call 30 minutes before arrival. Building has limited parking.",
};

const quoteData = {
  id: "Q-2024-0042",
  issuedAt: "December 16, 2024",
  validUntil: "December 30, 2024",
  pickupDate: "December 20, 2024",
  pickupTimeWindow: "9:00 AM - 12:00 PM",
  lineItems: [
    {
      description: "Equipment Pickup & Transport",
      quantity: 1,
      unitPrice: 250,
      total: 250,
    },
    {
      description: "Laptop Recycling",
      quantity: 15,
      unitPrice: 25,
      total: 375,
    },
    {
      description: "Desktop Recycling",
      quantity: 8,
      unitPrice: 35,
      total: 280,
    },
    {
      description: "Hard Drive Destruction",
      quantity: 20,
      unitPrice: 15,
      total: 300,
    },
    {
      description: "Certificate of Destruction",
      quantity: 1,
      unitPrice: 50,
      total: 50,
    },
  ],
  subtotal: 1255,
  discount: 55,
  total: 1200,
  terms:
    "Payment due within 30 days of service completion. All equipment will be processed in accordance with NIST 800-88 and IEEE 2883-2022 standards. Certificate of Destruction will be provided within 5 business days of processing completion.",
};

interface RequestDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function RequestDetailPage({ params }: RequestDetailPageProps) {
  const { id } = await params;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/requests">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">{id}</h1>
            <StatusBadge status={requestData.status} />
          </div>
          <p className="text-sm text-muted-foreground">
            Submitted on {requestData.submittedAt}
          </p>
        </div>
      </div>

      <Tabs defaultValue={requestData.status === "quote_ready" ? "quote" : "details"}>
        <TabsList>
          <TabsTrigger value="details">Request Details</TabsTrigger>
          <TabsTrigger value="quote" disabled={requestData.status === "pending"}>
            Quote
            {requestData.status === "quote_ready" && (
              <span className="ml-2 h-2 w-2 rounded-full bg-primary" />
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="mt-4">
          <RequestDetails request={requestData} />
        </TabsContent>

        <TabsContent value="quote" className="mt-4">
          {requestData.status === "quote_ready" && (
            <QuoteReview quote={quoteData} />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
