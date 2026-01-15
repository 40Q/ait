"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
import { Calendar, Clock, Check, X, MessageSquare, Loader2, PenLine } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useRespondToQuote } from "@/lib/hooks";
import type { QuoteRow, QuoteLineItemRow } from "@/lib/database/types";
import { formatDate } from "@/lib/utils/date";

// The quote type returned by useQuoteByRequestId
type QuoteWithLineItems = QuoteRow & { line_items: QuoteLineItemRow[] };

interface QuoteReviewProps {
  quote: QuoteWithLineItems;
  userId: string;
}

export function QuoteReview({ quote, userId }: QuoteReviewProps) {
  const router = useRouter();
  const respondToQuote = useRespondToQuote();

  const [showAcceptDialog, setShowAcceptDialog] = useState(false);
  const [showRevisionDialog, setShowRevisionDialog] = useState(false);
  const [showDeclineDialog, setShowDeclineDialog] = useState(false);
  const [revisionMessage, setRevisionMessage] = useState("");
  const [declineReason, setDeclineReason] = useState("");
  const [signature, setSignature] = useState("");
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const isSubmitting = respondToQuote.isPending;
  const canRespond = quote.status === "sent";

  const handleAccept = async () => {
    respondToQuote.mutate(
      {
        quoteId: quote.id,
        response: {
          status: "accepted",
          signature_name: signature,
        },
        userId,
      },
      {
        onSuccess: (result) => {
          setShowAcceptDialog(false);
          // Redirect to job if created
          if (result.jobId) {
            router.push(`/jobs/${result.jobId}`);
          } else {
            router.refresh();
          }
        },
      }
    );
  };

  const handleRequestRevision = async () => {
    respondToQuote.mutate(
      {
        quoteId: quote.id,
        response: {
          status: "revision_requested",
          revision_message: revisionMessage,
        },
        userId,
      },
      {
        onSuccess: () => {
          setShowRevisionDialog(false);
          setRevisionMessage("");
          router.refresh();
        },
      }
    );
  };

  const handleDecline = async () => {
    respondToQuote.mutate(
      {
        quoteId: quote.id,
        response: {
          status: "declined",
          decline_reason: declineReason || undefined,
        },
        userId,
      },
      {
        onSuccess: () => {
          setShowDeclineDialog(false);
          setDeclineReason("");
          router.push("/requests");
        },
      }
    );
  };

  return (
    <>
      <Card className="border-primary/20 pt-0">
        <CardHeader className="bg-primary/5 py-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Quote #{quote.quote_number}</CardTitle>
            <Badge variant={canRespond ? "secondary" : "outline"}>
              {canRespond ? "Ready for Review" : quote.status === "accepted" ? "Accepted" : quote.status === "declined" ? "Declined" : "Revision Requested"}
            </Badge>
          </div>
          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
            <span>Issued: {formatDate(quote.created_at)}</span>
            <span className="text-destructive">
              Valid until: {quote.valid_until ? formatDate(quote.valid_until) : "N/A"}
            </span>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Confirmed Schedule */}
          <div className="rounded-lg bg-muted/50 p-4">
            <h4 className="mb-2 font-medium">Confirmed Pickup Schedule</h4>
            <div className="flex flex-wrap gap-4 text-sm">
              <span className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                {quote.pickup_date ? formatDate(quote.pickup_date) : "TBD"}
              </span>
              <span className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                {quote.pickup_time_window || "TBD"}
              </span>
            </div>
          </div>

          {/* Line Items */}
          <div>
            <h4 className="mb-3 font-medium">Pricing Breakdown</h4>
            <div className="rounded-lg border overflow-x-auto">
              <table className="w-full text-sm min-w-[400px]">
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
                  {quote.line_items.map((item) => (
                    <tr key={item.id} className="border-b last:border-0">
                      <td className="px-4 py-3">{item.description}</td>
                      <td className="px-4 py-3 text-center">{item.quantity}</td>
                      <td className="px-4 py-3 text-right">
                        ${item.unit_price.toFixed(2)}
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
          {quote.terms && (
            <div>
              <h4 className="mb-2 font-medium">Terms & Conditions</h4>
              <p className="text-sm text-muted-foreground">{quote.terms}</p>
            </div>
          )}
        </CardContent>

        {canRespond && (
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
        )}
      </Card>

      {/* Accept Dialog */}
      <Dialog open={showAcceptDialog} onOpenChange={(open) => {
        setShowAcceptDialog(open);
        if (!open) {
          setSignature("");
          setAgreedToTerms(false);
        }
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <PenLine className="h-5 w-5" />
              Sign and Agree to Quote
            </DialogTitle>
            <DialogDescription>
              Please review and sign below to accept this quote. A job will be
              scheduled for pickup on {quote.pickup_date ? formatDate(quote.pickup_date) : "the confirmed date"}.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="rounded-lg bg-muted/50 p-4">
              <p className="text-sm text-muted-foreground">Quote Total</p>
              <p className="text-2xl font-bold">${quote.total.toFixed(2)}</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="signature">
                Type your full name to sign <span className="text-destructive">*</span>
              </Label>
              <Input
                id="signature"
                value={signature}
                onChange={(e) => setSignature(e.target.value)}
                placeholder="Your full name"
                className="font-medium"
              />
              {signature && (
                <p className="text-sm text-muted-foreground italic">
                  Signed: <span className="font-medium">{signature}</span>
                </p>
              )}
            </div>

            <div className="flex items-start gap-3">
              <Checkbox
                id="agreeTerms"
                checked={agreedToTerms}
                onCheckedChange={(checked) => setAgreedToTerms(checked === true)}
              />
              <div>
                <Label htmlFor="agreeTerms" className="cursor-pointer text-sm">
                  I agree to the terms and conditions outlined in this quote and
                  authorize the scheduled pickup service.
                </Label>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAcceptDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleAccept}
              disabled={isSubmitting || !signature.trim() || !agreedToTerms}
            >
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Sign & Accept Quote
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
