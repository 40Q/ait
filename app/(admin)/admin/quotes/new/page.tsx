"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  Loader2,
  Plus,
  Trash2,
  Send,
  Save,
  Truck,
  Package,
} from "lucide-react";

type QuoteType = "pickup" | "logistics";

interface LineItem {
  id: string;
  description: string;
  additionalInfo: string;
  quantity: string;
  price: string;
}

interface QuoteFormData {
  quoteType: QuoteType;
  // Common fields
  quoteNumber: string;
  date: string;
  companyName: string;
  // Pickup-specific client details
  serviceDatePreference: string;
  contactName: string;
  contactPhone: string;
  serviceAddress: string;
  suiteBuilding: string;
  city: string;
  state: string;
  zip: string;
  // Logistics-specific
  fromAddress: string;
  toAddress: string;
  // Line items and comments
  lineItems: LineItem[];
  comments: string;
}

// Mock request data - would be fetched based on requestId
const requestData = {
  id: "REQ-2024-0048",
  companyName: "Acme Corporation",
  contactName: "John Smith",
  contactPhone: "555-123-4567",
  serviceAddress: "123 Main St",
  suiteBuilding: "Suite 400, 4th Floor",
  city: "Los Angeles",
  state: "CA",
  zip: "90001",
  preferredDate: "December 22, 2024",
};

function generateQuoteNumber(type: QuoteType): string {
  const prefix = type === "pickup" ? "PQ" : "LQ";
  const date = new Date();
  const year = date.getFullYear();
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, "0");
  return `${prefix}-${year}-${random}`;
}

function NewQuoteContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestId = searchParams.get("request") || "REQ-2024-0048";

  const [formData, setFormData] = useState<QuoteFormData>({
    quoteType: "pickup",
    quoteNumber: generateQuoteNumber("pickup"),
    date: new Date().toLocaleDateString("en-US"),
    companyName: requestData.companyName,
    serviceDatePreference: requestData.preferredDate,
    contactName: requestData.contactName,
    contactPhone: requestData.contactPhone,
    serviceAddress: requestData.serviceAddress,
    suiteBuilding: requestData.suiteBuilding,
    city: requestData.city,
    state: requestData.state,
    zip: requestData.zip,
    fromAddress: "",
    toAddress: "",
    lineItems: [
      { id: "1", description: "", additionalInfo: "", quantity: "", price: "" },
    ],
    comments: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);

  const handleQuoteTypeChange = (type: QuoteType) => {
    setFormData((prev) => ({
      ...prev,
      quoteType: type,
      quoteNumber: generateQuoteNumber(type),
    }));
  };

  const updateField = (field: keyof QuoteFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const addLineItem = () => {
    const newItem: LineItem = {
      id: Date.now().toString(),
      description: "",
      additionalInfo: "",
      quantity: "",
      price: "",
    };
    setFormData((prev) => ({
      ...prev,
      lineItems: [...prev.lineItems, newItem],
    }));
  };

  const updateLineItem = (id: string, field: keyof LineItem, value: string) => {
    setFormData((prev) => ({
      ...prev,
      lineItems: prev.lineItems.map((item) =>
        item.id === id ? { ...item, [field]: value } : item
      ),
    }));
  };

  const removeLineItem = (id: string) => {
    if (formData.lineItems.length > 1) {
      setFormData((prev) => ({
        ...prev,
        lineItems: prev.lineItems.filter((item) => item.id !== id),
      }));
    }
  };

  // Calculate totals
  const calculateLineTotal = (item: LineItem): number => {
    const qty = parseFloat(item.quantity) || 0;
    const price = parseFloat(item.price) || 0;
    return qty * price;
  };

  const total = formData.lineItems.reduce(
    (sum, item) => sum + calculateLineTotal(item),
    0
  );

  const handleSaveDraft = async () => {
    setIsSavingDraft(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsSavingDraft(false);
    router.push("/admin/quotes");
  };

  const handleSendQuote = async () => {
    setIsSubmitting(true);
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setIsSubmitting(false);
    router.push("/admin/quotes");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/admin/requests">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <PageHeader
          title="Create Quote"
          description={`For request ${requestId}`}
        />
      </div>

      {/* Quote Type Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Quote Type</CardTitle>
          <CardDescription>
            Select the type of quote you want to create
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RadioGroup
            value={formData.quoteType}
            onValueChange={(value: QuoteType) => handleQuoteTypeChange(value)}
            className="grid gap-4 sm:grid-cols-2"
          >
            <div>
              <RadioGroupItem value="pickup" id="pickup" className="peer sr-only" />
              <Label
                htmlFor="pickup"
                className="flex cursor-pointer flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
              >
                <Package className="mb-3 h-6 w-6" />
                <span className="font-semibold">Pickup Quote</span>
                <span className="text-sm text-muted-foreground text-center">
                  IT Asset Equipment Disposal
                </span>
              </Label>
            </div>
            <div>
              <RadioGroupItem value="logistics" id="logistics" className="peer sr-only" />
              <Label
                htmlFor="logistics"
                className="flex cursor-pointer flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
              >
                <Truck className="mb-3 h-6 w-6" />
                <span className="font-semibold">Logistics Quote</span>
                <span className="text-sm text-muted-foreground text-center">
                  Transport & Moving Services
                </span>
              </Label>
            </div>
          </RadioGroup>
        </CardContent>
      </Card>

      {/* Quote Header Info */}
      <Card>
        <CardHeader>
          <CardTitle>Quote Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="quoteNumber">Quote Number</Label>
              <Input
                id="quoteNumber"
                value={formData.quoteNumber}
                onChange={(e) => updateField("quoteNumber", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                value={formData.date}
                onChange={(e) => updateField("date", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="companyName">Company Name</Label>
              <Input
                id="companyName"
                value={formData.companyName}
                onChange={(e) => updateField("companyName", e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Client Details (Pickup) or From/To (Logistics) */}
      {formData.quoteType === "pickup" ? (
        <Card>
          <CardHeader>
            <CardTitle>Client Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="serviceDatePreference">Service Date Preference</Label>
                <Input
                  id="serviceDatePreference"
                  value={formData.serviceDatePreference}
                  onChange={(e) => updateField("serviceDatePreference", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contactName">Contact</Label>
                <Input
                  id="contactName"
                  value={formData.contactName}
                  onChange={(e) => updateField("contactName", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contactPhone">Phone #</Label>
                <Input
                  id="contactPhone"
                  value={formData.contactPhone}
                  onChange={(e) => updateField("contactPhone", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="serviceAddress">Service Address</Label>
                <Input
                  id="serviceAddress"
                  value={formData.serviceAddress}
                  onChange={(e) => updateField("serviceAddress", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="suiteBuilding">Suite #/Building</Label>
                <Input
                  id="suiteBuilding"
                  value={formData.suiteBuilding}
                  onChange={(e) => updateField("suiteBuilding", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => updateField("city", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="state">State</Label>
                <Input
                  id="state"
                  value={formData.state}
                  onChange={(e) => updateField("state", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="zip">Zip</Label>
                <Input
                  id="zip"
                  value={formData.zip}
                  onChange={(e) => updateField("zip", e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Transport Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="fromAddress">From Address</Label>
                <Textarea
                  id="fromAddress"
                  value={formData.fromAddress}
                  onChange={(e) => updateField("fromAddress", e.target.value)}
                  placeholder="Company Name&#10;123 Street Address&#10;City, State ZIP"
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="toAddress">To Address</Label>
                <Textarea
                  id="toAddress"
                  value={formData.toAddress}
                  onChange={(e) => updateField("toAddress", e.target.value)}
                  placeholder="Company Name&#10;123 Street Address&#10;City, State ZIP"
                  rows={3}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Line Items - Spreadsheet Style */}
      <Card>
        <CardHeader>
          <CardTitle>
            {formData.quoteType === "pickup"
              ? "IT Asset Equipment Disposal"
              : "Services"}
          </CardTitle>
          <CardDescription>
            Add line items for services and pricing
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Header Row */}
          <div className="hidden sm:grid sm:grid-cols-[1fr_1fr_100px_100px_100px_40px] gap-2 text-sm font-medium text-muted-foreground border-b pb-2">
            <div>Description of Service</div>
            <div>Additional Information</div>
            <div className="text-right">Quantity</div>
            <div className="text-right">Price</div>
            <div className="text-right">Total</div>
            <div></div>
          </div>

          {/* Line Items */}
          <div className="space-y-3">
            {formData.lineItems.map((item, index) => (
              <div
                key={item.id}
                className="grid gap-2 sm:grid-cols-[1fr_1fr_100px_100px_100px_40px] items-start border-b pb-3 sm:border-0 sm:pb-0"
              >
                <div className="space-y-1">
                  <Label className="text-xs sm:hidden">Description</Label>
                  <Input
                    value={item.description}
                    onChange={(e) =>
                      updateLineItem(item.id, "description", e.target.value)
                    }
                    placeholder="e.g., Pick up, HD serialization..."
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs sm:hidden">Additional Info</Label>
                  <Input
                    value={item.additionalInfo}
                    onChange={(e) =>
                      updateLineItem(item.id, "additionalInfo", e.target.value)
                    }
                    placeholder="e.g., Quantity TBD..."
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs sm:hidden">Quantity</Label>
                  <Input
                    value={item.quantity}
                    onChange={(e) =>
                      updateLineItem(item.id, "quantity", e.target.value)
                    }
                    placeholder="0"
                    className="text-right"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs sm:hidden">Price</Label>
                  <div className="relative">
                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                      $
                    </span>
                    <Input
                      value={item.price}
                      onChange={(e) =>
                        updateLineItem(item.id, "price", e.target.value)
                      }
                      placeholder="0.00"
                      className="pl-5 text-right"
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs sm:hidden">Total</Label>
                  <div className="h-9 px-3 py-2 text-sm bg-muted rounded-md text-right font-medium">
                    ${calculateLineTotal(item).toFixed(2)}
                  </div>
                </div>
                <div className="flex items-center justify-end sm:justify-center">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeLineItem(item.id)}
                    disabled={formData.lineItems.length === 1}
                    className="h-9 w-9"
                  >
                    <Trash2 className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={addLineItem}
            className="w-full"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Line Item
          </Button>

          <Separator />

          {/* Total */}
          <div className="flex justify-end">
            <div className="w-full sm:w-64 space-y-2">
              <div className="flex justify-between text-lg font-bold border-t pt-2">
                <span>TOTAL</span>
                <span>${total.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Comments */}
      <Card>
        <CardHeader>
          <CardTitle>Comments</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            value={formData.comments}
            onChange={(e) => updateField("comments", e.target.value)}
            placeholder="Add any additional comments or notes for the client..."
            rows={4}
          />
        </CardContent>
      </Card>

      {/* Actions */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-3 justify-end">
            <Button
              variant="outline"
              onClick={handleSaveDraft}
              disabled={isSavingDraft}
              className="sm:w-auto w-full"
            >
              {isSavingDraft ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              Save as Draft
            </Button>
            <Button
              onClick={handleSendQuote}
              disabled={isSubmitting}
              className="sm:w-auto w-full"
            >
              {isSubmitting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Send className="mr-2 h-4 w-4" />
              )}
              Send to Client
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function NewQuotePage() {
  return (
    <Suspense fallback={<div className="p-6">Loading...</div>}>
      <NewQuoteContent />
    </Suspense>
  );
}
