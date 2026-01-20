"use client";

import { useState, useMemo, useCallback } from "react";
import Link from "next/link";
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
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Loader2, Plus, Trash2, Send, Save } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import type { RequestWithRelations, QuoteWithRelations } from "@/lib/database/types";

interface LineItem {
  id: string;
  description: string;
  additionalInfo: string;
  quantity: string;
  price: string;
}

interface QuoteFormData {
  validUntil: string;
  lineItems: LineItem[];
  terms: string;
  discount: string;
}

// Default valid until date (30 days from now)
function getDefaultValidUntil(): string {
  const date = new Date();
  date.setDate(date.getDate() + 30);
  return date.toISOString().split("T")[0];
}

// Default terms
const defaultTerms =
  "Payment is due within 30 days of invoice date. Services will be performed in accordance with industry standards for IT asset disposition and data destruction.";

// Parse existing line items into form format
function parseExistingLineItems(quote: QuoteWithRelations): LineItem[] {
  return quote.line_items.map((item, index) => {
    // Try to split description and additional info (they were joined with " - ")
    const parts = item.description.split(" - ");
    const description = parts[0] || "";
    const additionalInfo = parts.slice(1).join(" - ") || "";

    return {
      id: item.id || String(index + 1),
      description,
      additionalInfo,
      quantity: String(item.quantity),
      price: String(item.unit_price),
    };
  });
}

export interface QuoteFormSubmitData {
  validUntil: string;
  subtotal: number;
  discount: number;
  total: number;
  terms: string | null;
  lineItems: {
    description: string;
    quantity: number;
    unit_price: number;
    total: number;
    sort_order: number;
  }[];
}

interface QuoteFormProps {
  request: RequestWithRelations;
  existingQuote?: QuoteWithRelations;
  onSaveDraft: (data: QuoteFormSubmitData) => void;
  onSend: (data: QuoteFormSubmitData) => void;
  isPending: boolean;
  backUrl: string;
}

export function QuoteForm({
  request,
  existingQuote,
  onSaveDraft,
  onSend,
  isPending,
  backUrl,
}: QuoteFormProps) {
  const isEditing = !!existingQuote;

  // Form state
  const [formData, setFormData] = useState<QuoteFormData>(() => {
    if (existingQuote) {
      return {
        validUntil: existingQuote.valid_until?.split("T")[0] || getDefaultValidUntil(),
        lineItems: parseExistingLineItems(existingQuote),
        terms: existingQuote.terms || defaultTerms,
        discount: String(existingQuote.discount || 0),
      };
    }
    return {
      validUntil: getDefaultValidUntil(),
      lineItems: [
        { id: "1", description: "", additionalInfo: "", quantity: "1", price: "" },
      ],
      terms: defaultTerms,
      discount: "0",
    };
  });

  const updateField = useCallback((field: keyof QuoteFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }, []);

  const addLineItem = useCallback(() => {
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
  }, []);

  const updateLineItem = useCallback((id: string, field: keyof LineItem, value: string) => {
    setFormData((prev) => ({
      ...prev,
      lineItems: prev.lineItems.map((item) =>
        item.id === id ? { ...item, [field]: value } : item
      ),
    }));
  }, []);

  const removeLineItem = useCallback((id: string) => {
    setFormData((prev) => {
      if (prev.lineItems.length <= 1) return prev;
      return {
        ...prev,
        lineItems: prev.lineItems.filter((item) => item.id !== id),
      };
    });
  }, []);

  // Memoized line total calculation
  const calculateLineTotal = useCallback((item: LineItem): number => {
    const qty = parseFloat(item.quantity) || 0;
    const price = parseFloat(item.price) || 0;
    return qty * price;
  }, []);

  // Memoized totals calculation
  const { subtotal, discountAmount, total } = useMemo(() => {
    const subtotal = formData.lineItems.reduce(
      (sum, item) => sum + calculateLineTotal(item),
      0
    );
    const discountAmount = parseFloat(formData.discount) || 0;
    const total = Math.max(0, subtotal - discountAmount);
    return { subtotal, discountAmount, total };
  }, [formData.lineItems, formData.discount, calculateLineTotal]);

  // Memoized submit data builder
  const buildSubmitData = useCallback((): QuoteFormSubmitData => {
    return {
      validUntil: formData.validUntil,
      subtotal,
      discount: discountAmount,
      total,
      terms: formData.terms || null,
      lineItems: formData.lineItems
        .filter((item) => item.description.trim() !== "")
        .map((item, index) => ({
          description:
            item.description + (item.additionalInfo ? ` - ${item.additionalInfo}` : ""),
          quantity: parseFloat(item.quantity) || 1,
          unit_price: parseFloat(item.price) || 0,
          total: calculateLineTotal(item),
          sort_order: index,
        })),
    };
  }, [formData, subtotal, discountAmount, total, calculateLineTotal]);

  const handleSaveDraft = useCallback(() => {
    onSaveDraft(buildSubmitData());
  }, [onSaveDraft, buildSubmitData]);

  const handleSend = useCallback(() => {
    onSend(buildSubmitData());
  }, [onSend, buildSubmitData]);

  const canSubmit = useMemo(
    () => formData.lineItems.some((item) => item.description.trim() !== ""),
    [formData.lineItems]
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={backUrl}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <PageHeader
          title={isEditing ? "Edit Quote" : "Create Quote"}
          description={`For request ${request.request_number}`}
        />
      </div>

      {/* Request Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Request Summary</CardTitle>
          <CardDescription>
            {isEditing ? "Editing" : "Creating"} quote for {request.request_number}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <p className="text-sm text-muted-foreground">Company</p>
              <p className="font-medium">{request.company?.name || "Unknown"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Contact</p>
              <p className="font-medium">{request.on_site_contact_name}</p>
              <p className="text-sm">{request.on_site_contact_phone}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Location</p>
              <p className="font-medium">{request.address}</p>
              <p className="text-sm">
                {request.city}, {request.state} {request.zip_code}
              </p>
            </div>
            {request.preferred_date && (
              <div>
                <p className="text-sm text-muted-foreground">Preferred Date</p>
                <p className="font-medium">
                  {new Date(request.preferred_date).toLocaleDateString()}
                </p>
              </div>
            )}
            <div>
              <p className="text-sm text-muted-foreground">Equipment</p>
              <p className="font-medium">{request.equipment?.length ?? 0} item(s)</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quote Validity */}
      <Card>
        <CardHeader>
          <CardTitle>Quote Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="max-w-xs">
            <div className="space-y-2">
              <Label htmlFor="validUntil">Quote Valid Until</Label>
              <Input
                id="validUntil"
                type="date"
                value={formData.validUntil}
                onChange={(e) => updateField("validUntil", e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Line Items - Spreadsheet Style */}
      <Card>
        <CardHeader>
          <CardTitle>
            {request.form_type === "logistics" ? "Services" : "IT Asset Equipment Disposal"}
          </CardTitle>
          <CardDescription>Add line items for services and pricing</CardDescription>
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
            {formData.lineItems.map((item) => (
              <div
                key={item.id}
                className="grid gap-2 sm:grid-cols-[1fr_1fr_100px_100px_100px_40px] items-start border-b pb-3 sm:border-0 sm:pb-0"
              >
                <div className="space-y-1">
                  <Label className="text-xs sm:hidden">Description</Label>
                  <Input
                    value={item.description}
                    onChange={(e) => updateLineItem(item.id, "description", e.target.value)}
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
                    onChange={(e) => updateLineItem(item.id, "quantity", e.target.value)}
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
                      onChange={(e) => updateLineItem(item.id, "price", e.target.value)}
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

          <Button variant="outline" size="sm" onClick={addLineItem} className="w-full">
            <Plus className="mr-2 h-4 w-4" />
            Add Line Item
          </Button>

          <Separator />

          {/* Totals */}
          <div className="flex justify-end">
            <div className="w-full sm:w-64 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm items-center gap-2">
                <span className="text-muted-foreground">Discount</span>
                <div className="flex items-center gap-1">
                  <span>$</span>
                  <Input
                    value={formData.discount}
                    onChange={(e) => updateField("discount", e.target.value)}
                    className="w-24 h-8 text-right"
                    placeholder="0.00"
                  />
                </div>
              </div>
              <div className="flex justify-between text-lg font-bold border-t pt-2">
                <span>TOTAL</span>
                <span>${total.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Terms */}
      <Card>
        <CardHeader>
          <CardTitle>Terms & Conditions</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            value={formData.terms}
            onChange={(e) => updateField("terms", e.target.value)}
            placeholder="Enter terms and conditions..."
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
              disabled={!canSubmit || isPending}
              className="sm:w-auto w-full"
            >
              {isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              {isEditing ? "Save Changes" : "Save as Draft"}
            </Button>
            <Button
              onClick={handleSend}
              disabled={!canSubmit || isPending}
              className="sm:w-auto w-full"
            >
              {isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Send className="mr-2 h-4 w-4" />
              )}
              {isEditing ? "Save & Send" : "Send to Client"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
