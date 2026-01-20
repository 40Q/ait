import { SupabaseClient } from "@supabase/supabase-js";
import { BaseRepository, QueryBuilder } from "./base";
import type {
  InvoiceRow,
  InvoiceInsert,
  InvoiceUpdate,
  InvoiceFilters,
  InvoiceWithRelations,
  InvoiceListItem,
  InvoiceStatus,
  PaginatedResult,
} from "../types";

export class InvoiceRepository extends BaseRepository<
  InvoiceRow,
  InvoiceInsert,
  InvoiceUpdate,
  InvoiceFilters
> {
  constructor(supabase: SupabaseClient) {
    super(supabase, "invoices");
  }

  /**
   * Find an invoice by ID with all relations
   */
  async findByIdWithRelations(id: string): Promise<InvoiceWithRelations | null> {
    const { data, error } = await this.supabase
      .from("invoices")
      .select(
        `
        *,
        company:companies(id, name),
        job:jobs(id, job_number)
      `
      )
      .eq("id", id)
      .single();

    if (error) {
      if (error.code === "PGRST116") return null;
      throw error;
    }

    return {
      ...data,
      company: data.company,
      job: data.job,
    } as InvoiceWithRelations;
  }

  /**
   * Find invoice by QuickBooks ID
   */
  async findByQuickBooksId(quickbooksId: string): Promise<InvoiceRow | null> {
    const { data, error } = await this.supabase
      .from("invoices")
      .select("*")
      .eq("quickbooks_id", quickbooksId)
      .single();

    if (error) {
      if (error.code === "PGRST116") return null;
      throw error;
    }
    return data as InvoiceRow;
  }

  /**
   * Get paginated list items for tables
   */
  async getListItems(
    filters?: InvoiceFilters,
    page: number = 1,
    pageSize: number = 20
  ): Promise<PaginatedResult<InvoiceListItem>> {
    const offset = (page - 1) * pageSize;

    // Build base query for data
    let query = this.supabase
      .from("invoices")
      .select(
        `
        id,
        invoice_number,
        company_id,
        job_id,
        amount,
        status,
        invoice_date,
        due_date,
        quickbooks_id,
        quickbooks_synced_at,
        created_at,
        company:companies(name),
        job:jobs(job_number)
      `,
        { count: "exact" }
      )
      .order("created_at", { ascending: false });

    // Apply filters
    if (filters?.status) {
      const statuses = Array.isArray(filters.status)
        ? filters.status
        : [filters.status];
      query = query.in("status", statuses);
    }

    if (filters?.company_id) {
      query = query.eq("company_id", filters.company_id);
    }

    if (filters?.job_id) {
      query = query.eq("job_id", filters.job_id);
    }

    if (filters?.from_date) {
      query = query.gte("invoice_date", filters.from_date);
    }

    if (filters?.to_date) {
      query = query.lte("invoice_date", filters.to_date);
    }

    // Apply pagination
    query = query.range(offset, offset + pageSize - 1);

    const { data, count, error } = await query;
    if (error) throw error;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let items = (data ?? []).map((row: any) => ({
      id: row.id,
      invoice_number: row.invoice_number,
      company_id: row.company_id,
      company_name: row.company?.name ?? "Unknown",
      job_id: row.job_id,
      job_number: row.job?.job_number ?? null,
      amount: row.amount,
      status: row.status,
      invoice_date: row.invoice_date,
      due_date: row.due_date,
      quickbooks_id: row.quickbooks_id,
      quickbooks_synced_at: row.quickbooks_synced_at,
      created_at: row.created_at,
    })) as InvoiceListItem[];

    // Apply job filtering (post-query due to nested relation)
    // Note: This affects total count accuracy when filtering by has_job
    if (filters?.has_job === true) {
      items = items.filter((inv) => inv.job_id !== null);
    } else if (filters?.has_job === false) {
      items = items.filter((inv) => inv.job_id === null);
    }

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
   * Get invoice stats (calculated server-side)
   */
  async getStats(companyId?: string): Promise<{
    totalAmount: number;
    paidAmount: number;
    unpaidAmount: number;
    paidCount: number;
    unpaidCount: number;
    unlinkedCount: number;
  }> {
    let query = this.supabase.from("invoices").select("amount, status, job_id");

    if (companyId) {
      query = query.eq("company_id", companyId);
    }

    const { data, error } = await query;
    if (error) throw error;

    const invoices = data ?? [];
    const totalAmount = invoices.reduce((sum, inv) => sum + inv.amount, 0);
    const paidAmount = invoices
      .filter((inv) => inv.status === "paid")
      .reduce((sum, inv) => sum + inv.amount, 0);
    const unpaidAmount = invoices
      .filter((inv) => inv.status === "unpaid" || inv.status === "overdue")
      .reduce((sum, inv) => sum + inv.amount, 0);
    const paidCount = invoices.filter((inv) => inv.status === "paid").length;
    const unpaidCount = invoices.filter((inv) => inv.status !== "paid").length;
    const unlinkedCount = invoices.filter((inv) => !inv.job_id).length;

    return {
      totalAmount,
      paidAmount,
      unpaidAmount,
      paidCount,
      unpaidCount,
      unlinkedCount,
    };
  }

  /**
   * Get invoices by job ID
   */
  async getByJobId(jobId: string): Promise<InvoiceRow[]> {
    const { data, error } = await this.supabase
      .from("invoices")
      .select("*")
      .eq("job_id", jobId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return (data ?? []) as InvoiceRow[];
  }

  /**
   * Get counts by status
   */
  async getStatusCounts(companyId?: string): Promise<Record<string, number>> {
    const statuses: InvoiceStatus[] = ["paid", "unpaid", "overdue"];
    return this.getCountsByField(
      "status",
      statuses,
      companyId ? { company_id: companyId } : undefined
    );
  }

  /**
   * Link invoice to a job
   */
  async linkToJob(invoiceId: string, jobId: string | null): Promise<InvoiceRow> {
    return this.update(invoiceId, { job_id: jobId } as InvoiceUpdate);
  }

  /**
   * Upsert invoice from QuickBooks (based on quickbooks_id)
   */
  async upsertFromQuickBooks(
    data: Omit<InvoiceInsert, "id">
  ): Promise<InvoiceRow> {
    const { data: result, error } = await this.supabase
      .from("invoices")
      .upsert(data, { onConflict: "quickbooks_id" })
      .select()
      .single();

    if (error) throw error;
    return result as InvoiceRow;
  }

  protected applyFilters(
    query: QueryBuilder,
    filters?: InvoiceFilters
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

    if (filters.job_id) {
      query = query.eq("job_id", filters.job_id);
    }

    if (filters.search) {
      query = query.ilike("invoice_number", `%${filters.search}%`);
    }

    if (filters.from_date) {
      query = query.gte("invoice_date", filters.from_date);
    }

    if (filters.to_date) {
      query = query.lte("invoice_date", filters.to_date);
    }

    return query;
  }
}
