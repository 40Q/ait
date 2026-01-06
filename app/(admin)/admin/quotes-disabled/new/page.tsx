"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  Loader2,
  Plus,
  Trash2,
  CalendarIcon,
  Package,
  MapPin,
  Send,
  Save,
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { serviceTemplates, termsTemplates } from "../../_types";

interface LineItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
}

interface QuoteFormData {
  pickupDate: Date | null;
  pickupTimeWindow: string;
  lineItems: LineItem[];
  discountType: "amount" | "percentage";
  discountValue: number;
  termsTemplate: string;
  customTerms: string;
  validDays: number;
}

// Mock request data - would be fetched based on requestId
const requestData = {
  id: "REQ-2024-0048",
  companyName: "Acme Corporation",
  location: "123 Main Street, Los Angeles, CA 90001",
  preferredDate: "December 22, 2024",
  equipment: [
    { type: "Laptops", quantity: 25 },
    { type: "Desktop Computers", quantity: 10 },
    { type: "Hard Drives (loose)", quantity: 50 },
    { type: "Servers", quantity: 3 },
    { type: "Monitors", quantity: 15 },
  ],
  services: {
    dataDestruction: "HD Serialization & Destruction with COD",
    packing: "Palletize and Wrap",
    whiteGlove: false,
  },
};

const timeWindowOptions = [
  { value: "8am-12pm", label: "8:00 AM - 12:00 PM" },
  { value: "9am-1pm", label: "9:00 AM - 1:00 PM" },
  { value: "10am-2pm", label: "10:00 AM - 2:00 PM" },
  { value: "1pm-5pm", label: "1:00 PM - 5:00 PM" },
  { value: "flexible", label: "Flexible (Full Day)" },
];

function NewQuoteContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestId = searchParams.get("request") || "REQ-2024-0048";

  const [formData, setFormData] = useState<QuoteFormData>({
    pickupDate: null,
    pickupTimeWindow: "",
    lineItems: [
      { id: "1", description: "Equipment Pickup & Transport", quantity: 1, unitPrice: 250 },
    ],
    discountType: "amount",
    discountValue: 0,
    termsTemplate: "standard",
    customTerms: "",
    validDays: 14,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);

  const addLineItem = (templateId?: string) => {
    const template = templateId
      ? serviceTemplates.find((t) => t.id === templateId)
      : null;

    const newItem: LineItem = {
      id: Date.now().toString(),
      description: template?.label || "",
      quantity: 1,
      unitPrice: template?.defaultPrice || 0,
    };

    setFormData((prev) => ({
      ...prev,
      lineItems: [...prev.lineItems, newItem],
    }));
  };

  const updateLineItem = (id: string, updates: Partial<LineItem>) => {
    setFormData((prev) => ({
      ...prev,
      lineItems: prev.lineItems.map((item) =>
        item.id === id ? { ...item, ...updates } : item
      ),
    }));
  };

  const removeLineItem = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      lineItems: prev.lineItems.filter((item) => item.id !== id),
    }));
  };

  // Calculate totals
  const subtotal = formData.lineItems.reduce(
    (sum, item) => sum + item.quantity * item.unitPrice,
    0
  );
  const discount =
    formData.discountType === "percentage"
      ? (subtotal * formData.discountValue) / 100
      : formData.discountValue;
  const total = subtotal - discount;

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

  const selectedTerms =
    formData.termsTemplate === "custom"
      ? formData.customTerms
      : termsTemplates.find((t) => t.id === formData.termsTemplate)?.content || "";

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

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          {/* Request Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Request Summary</CardTitle>
              <CardDescription>
                <Link
                  href={`/admin/requests/${requestId}`}
                  className="hover:underline"
                >
                  View full request details
                </Link>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-sm text-muted-foreground">Company</p>
                  <p className="font-medium">{requestData.companyName}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Preferred Date</p>
                  <p>{requestData.preferredDate}</p>
                </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  Location
                </p>
                <p>{requestData.location}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground flex items-center gap-1 mb-2">
                  <Package className="h-3 w-3" />
                  Equipment
                </p>
                <div className="flex flex-wrap gap-2">
                  {requestData.equipment.map((item, i) => (
                    <Badge key={i} variant="secondary">
                      {item.quantity} {item.type}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Schedule */}
          <Card>
            <CardHeader>
              <CardTitle>Schedule</CardTitle>
              <CardDescription>
                Confirm the pickup date and time window
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Pickup Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !formData.pickupDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.pickupDate ? (
                          format(formData.pickupDate, "PPP")
                        ) : (
                          <span>Select date</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={formData.pickupDate || undefined}
                        onSelect={(date) =>
                          setFormData((prev) => ({
                            ...prev,
                            pickupDate: date || null,
                          }))
                        }
                        disabled={(date) => date < new Date()}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="space-y-2">
                  <Label>Time Window</Label>
                  <Select
                    value={formData.pickupTimeWindow}
                    onValueChange={(value) =>
                      setFormData((prev) => ({
                        ...prev,
                        pickupTimeWindow: value,
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select time window" />
                    </SelectTrigger>
                    <SelectContent>
                      {timeWindowOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Line Items */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Pricing</CardTitle>
                  <CardDescription>
                    Add line items for services and fees
                  </CardDescription>
                </div>
                <Select onValueChange={(value) => addLineItem(value)}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Add service..." />
                  </SelectTrigger>
                  <SelectContent>
                    {serviceTemplates.map((template) => (
                      <SelectItem key={template.id} value={template.id}>
                        {template.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Line Items Table */}
              <div className="space-y-3">
                {formData.lineItems.map((item) => (
                  <div
                    key={item.id}
                    className="grid gap-3 sm:grid-cols-[1fr_80px_100px_100px_40px] items-end"
                  >
                    <div className="space-y-1">
                      <Label className="text-xs">Description</Label>
                      <Input
                        value={item.description}
                        onChange={(e) =>
                          updateLineItem(item.id, { description: e.target.value })
                        }
                        placeholder="Service description"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Qty</Label>
                      <Input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) =>
                          updateLineItem(item.id, {
                            quantity: parseInt(e.target.value) || 1,
                          })
                        }
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Unit Price</Label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                          $
                        </span>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.unitPrice}
                          onChange={(e) =>
                            updateLineItem(item.id, {
                              unitPrice: parseFloat(e.target.value) || 0,
                            })
                          }
                          className="pl-7"
                        />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Total</Label>
                      <div className="h-9 px-3 py-2 text-sm bg-muted rounded-md">
                        ${(item.quantity * item.unitPrice).toFixed(2)}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeLineItem(item.id)}
                      disabled={formData.lineItems.length === 1}
                    >
                      <Trash2 className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  </div>
                ))}
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => addLineItem()}
                className="w-full"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Custom Line Item
              </Button>

              <Separator />

              {/* Discount */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Discount Type</Label>
                  <Select
                    value={formData.discountType}
                    onValueChange={(value: "amount" | "percentage") =>
                      setFormData((prev) => ({
                        ...prev,
                        discountType: value,
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="amount">Fixed Amount ($)</SelectItem>
                      <SelectItem value="percentage">Percentage (%)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Discount Value</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                      {formData.discountType === "amount" ? "$" : "%"}
                    </span>
                    <Input
                      type="number"
                      min="0"
                      step={formData.discountType === "percentage" ? "1" : "0.01"}
                      value={formData.discountValue}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          discountValue: parseFloat(e.target.value) || 0,
                        }))
                      }
                      className="pl-7"
                    />
                  </div>
                </div>
              </div>

              <Separator />

              {/* Totals */}
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount</span>
                    <span>-${discount.toFixed(2)}</span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span>${total.toFixed(2)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Terms */}
          <Card>
            <CardHeader>
              <CardTitle>Terms & Conditions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Terms Template</Label>
                <Select
                  value={formData.termsTemplate}
                  onValueChange={(value) =>
                    setFormData((prev) => ({
                      ...prev,
                      termsTemplate: value,
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {termsTemplates.map((template) => (
                      <SelectItem key={template.id} value={template.id}>
                        {template.label}
                      </SelectItem>
                    ))}
                    <SelectItem value="custom">Custom Terms</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {formData.termsTemplate === "custom" ? (
                <div className="space-y-2">
                  <Label>Custom Terms</Label>
                  <Textarea
                    value={formData.customTerms}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        customTerms: e.target.value,
                      }))
                    }
                    placeholder="Enter custom terms and conditions..."
                    rows={4}
                  />
                </div>
              ) : (
                <div className="rounded-lg bg-muted p-4">
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {selectedTerms}
                  </p>
                </div>
              )}

              <div className="space-y-2">
                <Label>Quote Valid For</Label>
                <Select
                  value={formData.validDays.toString()}
                  onValueChange={(value) =>
                    setFormData((prev) => ({
                      ...prev,
                      validDays: parseInt(value),
                    }))
                  }
                >
                  <SelectTrigger className="w-[200px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7">7 days</SelectItem>
                    <SelectItem value="14">14 days</SelectItem>
                    <SelectItem value="30">30 days</SelectItem>
                    <SelectItem value="60">60 days</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar - Preview */}
        <div className="space-y-6">
          <Card className="sticky top-6">
            <CardHeader>
              <CardTitle className="text-base">Quote Preview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Company</span>
                  <span className="font-medium">{requestData.companyName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Pickup Date</span>
                  <span>
                    {formData.pickupDate
                      ? format(formData.pickupDate, "MMM d, yyyy")
                      : "Not set"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Time Window</span>
                  <span>
                    {timeWindowOptions.find(
                      (o) => o.value === formData.pickupTimeWindow
                    )?.label || "Not set"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Line Items</span>
                  <span>{formData.lineItems.length}</span>
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Discount</span>
                    <span>-${discount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-lg">
                  <span>Total</span>
                  <span>${total.toFixed(2)}</span>
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <Button
                  className="w-full"
                  onClick={handleSendQuote}
                  disabled={
                    isSubmitting ||
                    !formData.pickupDate ||
                    !formData.pickupTimeWindow ||
                    formData.lineItems.length === 0
                  }
                >
                  {isSubmitting ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="mr-2 h-4 w-4" />
                  )}
                  Send to Client
                </Button>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={handleSaveDraft}
                  disabled={isSavingDraft}
                >
                  {isSavingDraft ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="mr-2 h-4 w-4" />
                  )}
                  Save as Draft
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
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
