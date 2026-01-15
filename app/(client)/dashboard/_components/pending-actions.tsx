"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, ArrowRight, Loader2 } from "lucide-react";
import { useQuoteList } from "@/lib/hooks";

export function PendingActions() {
  // Get quotes that are sent and awaiting client response
  const { data: quotes = [], isLoading } = useQuoteList({ status: "sent" });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-4">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (quotes.length === 0) return null;

  return (
    <div className="space-y-3">
      {quotes.map((quote) => (
        <Card key={quote.id} className="border-primary/20 bg-primary/5">
          <CardContent className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="rounded-full bg-primary/10 p-2">
                <FileText className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-medium">Quote Ready for Review</p>
                <p className="text-sm text-muted-foreground">
                  Quote #{quote.quote_number} is ready for your review
                </p>
              </div>
            </div>
            <Button asChild size="sm">
              <Link href={`/requests/${quote.request_id}?tab=quote`}>
                Review
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
