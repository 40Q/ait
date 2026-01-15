"use client";

import { use, useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Timeline } from "@/components/ui/timeline";
import { ArrowLeft, Loader2 } from "lucide-react";
import { RequestDetails } from "./_components/request-details";
import { QuoteReview } from "./_components/quote-review";
import { useRequest, useQuoteByRequestId, useRequestFullTimeline } from "@/lib/hooks";
import { formatDateTime } from "@/lib/utils/date";
import { createClient } from "@/lib/supabase/client";

interface RequestDetailPageProps {
  params: Promise<{ id: string }>;
}

export default function RequestDetailPage({ params }: RequestDetailPageProps) {
  const { id } = use(params);
  const { data: request, isLoading, error } = useRequest(id);
  const { data: quote } = useQuoteByRequestId(id);
  const { data: timelineEvents = [], isLoading: timelineLoading } = useRequestFullTimeline(id, quote?.id);
  const [userId, setUserId] = useState<string | null>(null);

  // Get current user on mount
  useEffect(() => {
    const getUser = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
      }
    };
    getUser();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !request) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-4">
        <p className="text-destructive">
          {error ? `Failed to load request: ${error.message}` : "Request not found"}
        </p>
        <Button variant="outline" asChild>
          <Link href="/requests">Back to Requests</Link>
        </Button>
      </div>
    );
  }

  const hasQuote = request.status !== "pending" && quote;
  const defaultTab = request.status === "quote_ready" ? "quote" : "details";

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
            <h1 className="text-2xl font-bold">{request.request_number}</h1>
            <StatusBadge status={request.status} />
          </div>
          <p className="text-sm text-muted-foreground">
            Submitted on {formatDateTime(request.created_at)}
          </p>
        </div>
      </div>

      <Tabs defaultValue={defaultTab}>
        <TabsList>
          <TabsTrigger value="details">Request Details</TabsTrigger>
          <TabsTrigger value="quote" disabled={!hasQuote}>
            Quote
            {request.status === "quote_ready" && (
              <span className="ml-2 h-2 w-2 rounded-full bg-primary" />
            )}
          </TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="mt-4">
          <RequestDetails request={request} />
        </TabsContent>

        <TabsContent value="quote" className="mt-4">
          {hasQuote && userId && (
            <QuoteReview quote={quote} userId={userId} />
          )}
        </TabsContent>

        <TabsContent value="timeline" className="mt-4">
          <Timeline
            events={timelineEvents}
            isLoading={timelineLoading}
            title="Timeline"
            showActors={false}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
