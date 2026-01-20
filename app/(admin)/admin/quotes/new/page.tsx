"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useRequest, useCreateQuote, useSendQuote } from "@/lib/hooks";
import { createClient } from "@/lib/supabase/client";
import { QuoteForm, type QuoteFormSubmitData } from "../_components/quote-form";

function NewQuoteContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestId = searchParams.get("request");

  // Fetch request data
  const {
    data: request,
    isLoading: requestLoading,
    error: requestError,
  } = useRequest(requestId || "");

  // Mutations
  const createQuote = useCreateQuote();
  const sendQuote = useSendQuote();

  // Current user state
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // Get current user on mount
  useEffect(() => {
    const getUser = async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        setCurrentUserId(user.id);
      }
    };
    getUser();
  }, []);

  // Loading and error states
  if (!requestId) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-4">
        <p className="text-destructive">No request ID provided</p>
        <Button variant="outline" asChild>
          <Link href="/admin/requests">Back to Requests</Link>
        </Button>
      </div>
    );
  }

  if (requestLoading || !currentUserId) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (requestError || !request) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-4">
        <p className="text-destructive">
          {requestError ? `Failed to load request: ${requestError.message}` : "Request not found"}
        </p>
        <Button variant="outline" asChild>
          <Link href="/admin/requests">Back to Requests</Link>
        </Button>
      </div>
    );
  }

  const handleSaveDraft = (data: QuoteFormSubmitData) => {
    createQuote.mutate(
      {
        quote: {
          request_id: request.id,
          company_id: request.company_id,
          created_by: currentUserId,
          status: "draft",
          valid_until: data.validUntil,
          subtotal: data.subtotal,
          discount: data.discount,
          discount_type: "amount",
          total: data.total,
          terms: data.terms,
          revision_message: null,
          decline_reason: null,
        },
        lineItems: data.lineItems,
      },
      {
        onSuccess: (createdQuote) => {
          router.push(`/admin/quotes/${createdQuote.id}`);
        },
      }
    );
  };

  const handleSend = (data: QuoteFormSubmitData) => {
    // Create as draft first, then send via workflow to properly update request status
    createQuote.mutate(
      {
        quote: {
          request_id: request.id,
          company_id: request.company_id,
          created_by: currentUserId,
          status: "draft",
          valid_until: data.validUntil,
          subtotal: data.subtotal,
          discount: data.discount,
          discount_type: "amount",
          total: data.total,
          terms: data.terms,
          revision_message: null,
          decline_reason: null,
        },
        lineItems: data.lineItems,
      },
      {
        onSuccess: (createdQuote) => {
          // Send via workflow (updates quote to "sent" + request to "quote_ready")
          sendQuote.mutate(createdQuote.id, {
            onSuccess: () => {
              router.push(`/admin/quotes/${createdQuote.id}`);
            },
          });
        },
      }
    );
  };

  return (
    <QuoteForm
      request={request}
      onSaveDraft={handleSaveDraft}
      onSend={handleSend}
      isPending={createQuote.isPending || sendQuote.isPending}
      backUrl="/admin/requests"
    />
  );
}

export default function NewQuotePage() {
  return (
    <Suspense fallback={<div className="p-6">Loading...</div>}>
      <NewQuoteContent />
    </Suspense>
  );
}
