"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useQuote, useRequest, useUpdateQuote, useSendQuote } from "@/lib/hooks";
import { QuoteForm, type QuoteFormSubmitData } from "../../_components/quote-form";

interface EditQuotePageProps {
  params: Promise<{ id: string }>;
}

export default function EditQuotePage({ params }: EditQuotePageProps) {
  const { id } = use(params);
  const router = useRouter();

  // Fetch quote data
  const { data: quote, isLoading: quoteLoading, error: quoteError } = useQuote(id);

  // Fetch request data (needed for the form context)
  const { data: request, isLoading: requestLoading } = useRequest(quote?.request_id || "");

  // Mutations
  const updateQuote = useUpdateQuote();
  const sendQuote = useSendQuote();

  if (quoteLoading || requestLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (quoteError || !quote) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-4">
        <p className="text-destructive">
          {quoteError ? `Failed to load quote: ${quoteError.message}` : "Quote not found"}
        </p>
        <Button variant="outline" asChild>
          <Link href="/admin/quotes">Back to Quotes</Link>
        </Button>
      </div>
    );
  }

  if (!request) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-4">
        <p className="text-destructive">Request not found for this quote</p>
        <Button variant="outline" asChild>
          <Link href="/admin/quotes">Back to Quotes</Link>
        </Button>
      </div>
    );
  }

  const handleSaveDraft = (data: QuoteFormSubmitData) => {
    updateQuote.mutate(
      {
        id: quote.id,
        quote: {
          status: "draft",
          pickup_date: data.pickupDate,
          pickup_time_window: data.pickupTimeWindow,
          valid_until: data.validUntil,
          subtotal: data.subtotal,
          discount: data.discount,
          total: data.total,
          terms: data.terms,
        },
        lineItems: data.lineItems,
      },
      {
        onSuccess: () => {
          router.push(`/admin/quotes/${quote.id}`);
        },
      }
    );
  };

  const handleSend = (data: QuoteFormSubmitData) => {
    // First update the quote data (keep current status so sendQuote workflow can process it)
    updateQuote.mutate(
      {
        id: quote.id,
        quote: {
          pickup_date: data.pickupDate,
          pickup_time_window: data.pickupTimeWindow,
          valid_until: data.validUntil,
          subtotal: data.subtotal,
          discount: data.discount,
          total: data.total,
          terms: data.terms,
        },
        lineItems: data.lineItems,
      },
      {
        onSuccess: () => {
          // Then send via workflow (updates quote to "sent" + request to "quote_ready")
          sendQuote.mutate(quote.id, {
            onSuccess: () => {
              router.push(`/admin/quotes/${quote.id}`);
            },
          });
        },
      }
    );
  };

  return (
    <QuoteForm
      request={request}
      existingQuote={quote}
      onSaveDraft={handleSaveDraft}
      onSend={handleSend}
      isPending={updateQuote.isPending || sendQuote.isPending}
      backUrl={`/admin/quotes/${quote.id}`}
    />
  );
}
