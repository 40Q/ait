import { SupabaseClient } from "@supabase/supabase-js";
import { BaseRepository, QueryBuilder } from "./base";
import type {
  QuoteRow,
  QuoteInsert,
  QuoteUpdate,
  QuoteFilters,
  QuoteWithRelations,
  QuoteListItem,
  QuoteLineItemRow,
  QuoteLineItemInsert,
  PaginatedResult,
} from "../types";

export class QuoteRepository extends BaseRepository<
  QuoteRow,
  QuoteInsert,
  QuoteUpdate,
  QuoteFilters
> {
  constructor(supabase: SupabaseClient) {
    super(supabase, "quotes");
  }

  /**
   * Find a quote by ID with all relations
   */
  async findByIdWithRelations(id: string): Promise<QuoteWithRelations | null> {
    const { data, error } = await this.supabase
      .from("quotes")
      .select(
        `
        *,
        request:requests(id, request_number, address, city, state),
        company:companies(id, name),
        line_items:quote_line_items(*),
        created_by_profile:profiles!created_by(id, full_name, email)
      `
      )
      .eq("id", id)
      .single();

    if (error) {
      if (error.code === "PGRST116") return null;
      throw error;
    }

    // Sort line items by sort_order
    const lineItems = (data.line_items as QuoteLineItemRow[]) || [];
    lineItems.sort((a, b) => a.sort_order - b.sort_order);

    return {
      ...data,
      request: data.request,
      company: data.company,
      line_items: lineItems,
      created_by_profile: data.created_by_profile,
    } as QuoteWithRelations;
  }

  /**
   * Find a quote by quote number
   */
  async findByQuoteNumber(quoteNumber: string): Promise<QuoteRow | null> {
    const { data, error } = await this.supabase
      .from("quotes")
      .select("*")
      .eq("quote_number", quoteNumber)
      .single();

    if (error) {
      if (error.code === "PGRST116") return null;
      throw error;
    }
    return data as QuoteRow;
  }

  /**
   * Find a quote by request ID with line items
   */
  async findByRequestId(requestId: string): Promise<(QuoteRow & { line_items: QuoteLineItemRow[] }) | null> {
    const { data, error } = await this.supabase
      .from("quotes")
      .select("*, line_items:quote_line_items(*)")
      .eq("request_id", requestId)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (error) {
      if (error.code === "PGRST116") return null;
      throw error;
    }
    return data as QuoteRow & { line_items: QuoteLineItemRow[] };
  }

  /**
   * Create a quote with line items
   */
  async createWithLineItems(
    quote: QuoteInsert,
    lineItems: Omit<QuoteLineItemInsert, "quote_id">[]
  ): Promise<QuoteWithRelations> {
    // Create the quote
    const { data: createdQuote, error: quoteError } = await this.supabase
      .from("quotes")
      .insert(quote as Record<string, unknown>)
      .select()
      .single();

    if (quoteError) throw quoteError;

    // Create line items
    if (lineItems.length > 0) {
      const lineItemsWithQuoteId = lineItems.map((item, index) => ({
        ...item,
        quote_id: createdQuote.id,
        sort_order: index,
      }));

      const { error: lineItemsError } = await this.supabase
        .from("quote_line_items")
        .insert(lineItemsWithQuoteId);

      if (lineItemsError) throw lineItemsError;
    }

    // Fetch the complete quote with relations
    return (await this.findByIdWithRelations(createdQuote.id))!;
  }

  /**
   * Update quote with line items (replaces all line items)
   */
  async updateWithLineItems(
    id: string,
    quote: QuoteUpdate,
    lineItems: Omit<QuoteLineItemInsert, "quote_id">[]
  ): Promise<QuoteWithRelations> {
    // Update the quote
    const { error: quoteError } = await this.supabase
      .from("quotes")
      .update(quote as Record<string, unknown>)
      .eq("id", id);

    if (quoteError) throw quoteError;

    // Delete existing line items
    const { error: deleteError } = await this.supabase
      .from("quote_line_items")
      .delete()
      .eq("quote_id", id);

    if (deleteError) throw deleteError;

    // Create new line items
    if (lineItems.length > 0) {
      const lineItemsWithQuoteId = lineItems.map((item, index) => ({
        ...item,
        quote_id: id,
        sort_order: index,
      }));

      const { error: lineItemsError } = await this.supabase
        .from("quote_line_items")
        .insert(lineItemsWithQuoteId);

      if (lineItemsError) throw lineItemsError;
    }

    // Fetch the complete quote with relations
    return (await this.findByIdWithRelations(id))!;
  }

  /**
   * Get paginated list items for tables
   */
  async getListItems(
    filters?: QuoteFilters,
    page: number = 1,
    pageSize: number = 20
  ): Promise<PaginatedResult<QuoteListItem>> {
    const offset = (page - 1) * pageSize;

    let query = this.supabase
      .from("quotes")
      .select(
        `
        id,
        quote_number,
        request_id,
        company_id,
        status,
        total,
        valid_until,
        created_at,
        sent_at,
        request:requests(request_number),
        company:companies(name)
      `,
        { count: "exact" }
      )
      .order("created_at", { ascending: false });

    if (filters?.status) {
      const statuses = Array.isArray(filters.status)
        ? filters.status
        : [filters.status];
      query = query.in("status", statuses);
    }

    if (filters?.company_id) {
      query = query.eq("company_id", filters.company_id);
    }

    if (filters?.request_id) {
      query = query.eq("request_id", filters.request_id);
    }

    if (filters?.search) {
      // Search by quote number or company name
      const { data: matchingCompanies } = await this.supabase
        .from("companies")
        .select("id")
        .ilike("name", `%${filters.search}%`);

      const matchingCompanyIds = matchingCompanies?.map(c => c.id) || [];

      if (matchingCompanyIds.length > 0) {
        query = query.or(
          `quote_number.ilike.%${filters.search}%,company_id.in.(${matchingCompanyIds.join(",")})`
        );
      } else {
        query = query.ilike("quote_number", `%${filters.search}%`);
      }
    }

    // Apply pagination
    query = query.range(offset, offset + pageSize - 1);

    const { data, count, error } = await query;
    if (error) throw error;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const items = (data ?? []).map((row: any) => ({
      id: row.id,
      quote_number: row.quote_number,
      request_id: row.request_id,
      request_number: row.request?.request_number ?? "",
      company_id: row.company_id,
      company_name: row.company?.name ?? "Unknown",
      status: row.status,
      total: row.total,
      valid_until: row.valid_until,
      created_at: row.created_at,
      sent_at: row.sent_at,
    } as QuoteListItem));

    const total = count ?? 0;

    return {
      data: items,
      total,
      page,
      limit: pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  /**
   * Get counts by status - single query with client-side grouping
   */
  async getStatusCounts(companyId?: string): Promise<Record<string, number>> {
    const statuses = ["draft", "sent", "accepted", "declined", "revision_requested"] as const;
    return this.getCountsByField(
      "status",
      [...statuses],
      companyId ? { company_id: companyId } : undefined
    );
  }

  protected applyFilters(
    query: QueryBuilder,
    filters?: QuoteFilters
  ): QueryBuilder {
    if (!filters) return query;

    if (filters.status) {
      const statuses = Array.isArray(filters.status)
        ? filters.status
        : [filters.status];
      query = query.in("status", statuses);
    }

    if (filters.company_id) {
      query = query.eq("company_id", filters.company_id);
    }

    if (filters.request_id) {
      query = query.eq("request_id", filters.request_id);
    }

    if (filters.search) {
      query = query.or(`quote_number.ilike.%${filters.search}%`);
    }

    return query;
  }
}
