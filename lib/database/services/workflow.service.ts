import { SupabaseClient } from "@supabase/supabase-js";
import { RequestRepository } from "../repositories/requests";
import { QuoteRepository } from "../repositories/quotes";
import { JobRepository } from "../repositories/jobs";
import type {
  QuoteResponse,
  RequestRow,
  JobRow,
} from "../types";

/**
 * Validate that a user belongs to a specific company
 */
async function validateUserCompany(
  supabase: SupabaseClient,
  userId: string,
  companyId: string
): Promise<boolean> {
  const { data: profile } = await supabase
    .from("profiles")
    .select("company_id")
    .eq("id", userId)
    .single();

  return profile?.company_id === companyId;
}

/**
 * WorkflowService handles cross-entity business operations
 * - Sending quotes (quote + request status updates)
 * - Responding to quotes (accept/decline/revision)
 * - Creating jobs from accepted quotes
 * - Updating job status with timeline tracking
 */
export class WorkflowService {
  private requestRepo: RequestRepository;
  private quoteRepo: QuoteRepository;
  private jobRepo: JobRepository;

  constructor(private supabase: SupabaseClient) {
    this.requestRepo = new RequestRepository(supabase);
    this.quoteRepo = new QuoteRepository(supabase);
    this.jobRepo = new JobRepository(supabase);
  }

  /**
   * Send a quote to the client
   * - Updates quote status from 'draft' to 'sent' (DB trigger creates "sent" timeline event)
   * - Updates request status to 'quote_ready' (DB trigger creates status_change event)
   */
  async sendQuote(quoteId: string): Promise<void> {
    const quote = await this.quoteRepo.findById(quoteId);
    if (!quote) {
      throw new Error("Quote not found");
    }
    if (quote.status !== "draft" && quote.status !== "revision_requested") {
      throw new Error("Quote is not in a sendable status");
    }

    // Update quote status - DB trigger creates "sent" timeline event
    await this.quoteRepo.update(quoteId, {
      status: "sent",
      sent_at: new Date().toISOString(),
    });

    // Update request status - DB trigger creates status_change timeline event
    await this.requestRepo.update(quote.request_id, {
      status: "quote_ready",
    });
  }

  /**
   * Handle client response to a quote
   * Only updates the quote - DB trigger (handle_quote_status_change) handles:
   * - Request status sync (for accepted/declined)
   * - Job creation (for accepted quotes)
   * - Timeline events
   * This is necessary because clients can't directly update requests/jobs/timeline due to RLS
   *
   * @throws Error if user doesn't belong to the quote's company
   */
  async respondToQuote(
    quoteId: string,
    response: QuoteResponse,
    userId: string
  ): Promise<{ jobId: string | null }> {
    const quote = await this.quoteRepo.findByIdWithRelations(quoteId);
    if (!quote) {
      throw new Error("Quote not found");
    }
    if (quote.status !== "sent") {
      throw new Error("Quote is not awaiting response");
    }

    const isValidUser = await validateUserCompany(
      this.supabase,
      userId,
      quote.company_id
    );

    if (!isValidUser) {
      throw new Error("User is not authorized to respond to this quote");
    }

    switch (response.status) {
      case "accepted":
        await this.quoteRepo.update(quoteId, {
          status: "accepted",
          accepted_at: new Date().toISOString(),
          accepted_by: userId,
          signature_name: response.signature_name,
        });
        break;

      case "declined":
        await this.quoteRepo.update(quoteId, {
          status: "declined",
          decline_reason: response.decline_reason,
        });
        break;

      case "revision_requested":
        await this.quoteRepo.update(quoteId, {
          status: "revision_requested",
          revision_message: response.revision_message,
        });
        break;
    }

    // Job ID is created by DB trigger, fetch it if quote was accepted
    let jobId: string | null = null;
    if (response.status === "accepted") {
      const { data } = await this.supabase
        .from("jobs")
        .select("id")
        .eq("quote_id", quoteId)
        .single();
      jobId = data?.id ?? null;
    }

    return { jobId };
  }

  /**
   * Update job status with timeline tracking
   */
  async updateJobStatus(
    jobId: string,
    newStatus: string
  ): Promise<JobRow> {
    return this.jobRepo.updateStatus(jobId, newStatus);
  }

  /**
   * Decline a request without creating a quote
   */
  async declineRequest(
    requestId: string,
    reason?: string
  ): Promise<RequestRow> {
    const request = await this.requestRepo.findById(requestId);
    if (!request) {
      throw new Error("Request not found");
    }
    if (request.status !== "pending") {
      throw new Error("Request is not in pending status");
    }

    return this.requestRepo.update(requestId, {
      status: "declined",
      additional_notes: reason
        ? `${request.additional_notes ?? ""}\n\nDeclined: ${reason}`.trim()
        : request.additional_notes,
    });
  }
}
