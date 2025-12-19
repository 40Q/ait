"use client";

import { useState } from "react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Calendar, Clock, Check, X, MessageSquare, Loader2 } from "lucide-react";

interface QuoteLineItem {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

interface Quote {
  id: string;
  issuedAt: string;
  validUntil: string;
  pickupDate: string;
  pickupTimeWindow: string;
  lineItems: QuoteLineItem[];
  subtotal: number;
  discount: number;
  total: number;
  terms: string;
}

interface QuoteReviewProps {
  quote: Quote;
}

export function QuoteReview({ quote }: QuoteReviewProps) {
  const [showAcceptDialog, setShowAcceptDialog] = useState(false);
  const [showRevisionDialog, setShowRevisionDialog] = useState(false);
  const [showDeclineDialog, setShowDeclineDialog] = useState(false);
  const [revisionMessage, setRevisionMessage] = useState("");
  const [declineReason, setDeclineReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAccept = async () => {
    setIsSubmitting(true);
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setIsSubmitting(false);
    setShowAcceptDialog(false);
    // Would redirect to job
  };

  const handleRequestRevision = async () => {
    setIsSubmitting(true);
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setIsSubmitting(false);
    setShowRevisionDialog(false);
  };

  const handleDecline = async () => {
    setIsSubmitting(true);
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setIsSubmitting(false);
    setShowDeclineDialog(false);
  };

  return (
    <>
      <Card className="border-primary/20">
        <CardHeader className="bg-primary/5">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Quote #{quote.id}</CardTitle>
            <Badge variant="secondary">Ready for Review</Badge>
          </div>
          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
            <span>Issued: {quote.issuedAt}</span>
            <span className="text-destructive">
              Valid until: {quote.validUntil}
            </span>
          </div>
        </CardHeader>

        <CardContent className="space-y-6 pt-6">
          {/* Confirmed Schedule */}
          <div className="rounded-lg bg-muted/50 p-4">
            <h4 className="mb-2 font-medium">Confirmed Pickup Schedule</h4>
            <div className="flex flex-wrap gap-4 text-sm">
              <span className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                {quote.pickupDate}
              </span>
              <span className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                {quote.pickupTimeWindow}
              </span>
            </div>
          </div>

          {/* Line Items */}
          <div>
            <h4 className="mb-3 font-medium">Pricing Breakdown</h4>
            <div className="rounded-lg border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="px-4 py-2 text-left font-medium">
                      Description
                    </th>
                    <th className="px-4 py-2 text-center font-medium">Qty</th>
                    <th className="px-4 py-2 text-right font-medium">
                      Unit Price
                    </th>
                    <th className="px-4 py-2 text-right font-medium">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {quote.lineItems.map((item, index) => (
                    <tr key={index} className="border-b last:border-0">
                      <td className="px-4 py-3">{item.description}</td>
                      <td className="px-4 py-3 text-center">{item.quantity}</td>
                      <td className="px-4 py-3 text-right">
                        ${item.unitPrice.toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-right font-medium">
                        ${item.total.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totals */}
            <div className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span>${quote.subtotal.toFixed(2)}</span>
              </div>
              {quote.discount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Discount</span>
                  <span>-${quote.discount.toFixed(2)}</span>
                </div>
              )}
              <Separator />
              <div className="flex justify-between text-lg font-bold">
                <span>Total</span>
                <span>${quote.total.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Terms */}
          <div>
            <h4 className="mb-2 font-medium">Terms & Conditions</h4>
            <p className="text-sm text-muted-foreground">{quote.terms}</p>
          </div>
        </CardContent>

        <CardFooter className="flex flex-col gap-3 border-t bg-muted/30 sm:flex-row">
          <Button className="w-full sm:w-auto" onClick={() => setShowAcceptDialog(true)}>
            <Check className="mr-2 h-4 w-4" />
            Accept Quote
          </Button>
          <Button
            variant="outline"
            className="w-full sm:w-auto"
            onClick={() => setShowRevisionDialog(true)}
          >
            <MessageSquare className="mr-2 h-4 w-4" />
            Request Changes
          </Button>
          <Button
            variant="ghost"
            className="w-full text-muted-foreground sm:w-auto"
            onClick={() => setShowDeclineDialog(true)}
          >
            <X className="mr-2 h-4 w-4" />
            Decline
          </Button>
        </CardFooter>
      </Card>

      {/* Accept Dialog */}
      <Dialog open={showAcceptDialog} onOpenChange={setShowAcceptDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Accept Quote</DialogTitle>
            <DialogDescription>
              By accepting this quote, a job will be created and scheduled for
              pickup on {quote.pickupDate}. You will receive a confirmation
              email shortly.
            </DialogDescription>
          </DialogHeader>
          <div className="rounded-lg bg-muted/50 p-4">
            <p className="text-sm text-muted-foreground">Quote Total</p>
            <p className="text-2xl font-bold">${quote.total.toFixed(2)}</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAcceptDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleAccept} disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Confirm & Accept
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Revision Dialog */}
      <Dialog open={showRevisionDialog} onOpenChange={setShowRevisionDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request Changes</DialogTitle>
            <DialogDescription>
              Let us know what changes you&apos;d like to the quote. We&apos;ll
              review and send you an updated quote.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="Please describe the changes you'd like..."
            value={revisionMessage}
            onChange={(e) => setRevisionMessage(e.target.value)}
            rows={4}
          />
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowRevisionDialog(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleRequestRevision}
              disabled={!revisionMessage.trim() || isSubmitting}
            >
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Send Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Decline Dialog */}
      <Dialog open={showDeclineDialog} onOpenChange={setShowDeclineDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Decline Quote</DialogTitle>
            <DialogDescription>
              Are you sure you want to decline this quote? This action will
              close the request.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="Please let us know why (optional)..."
            value={declineReason}
            onChange={(e) => setDeclineReason(e.target.value)}
            rows={3}
          />
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeclineDialog(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDecline}
              disabled={isSubmitting}
            >
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Decline Quote
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
