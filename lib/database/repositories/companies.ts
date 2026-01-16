import { SupabaseClient } from "@supabase/supabase-js";
import { BaseRepository, QueryBuilder } from "./base";
import type {
  CompanyRow,
  CompanyInsert,
  CompanyUpdate,
  CompanyFilters,
  CompanyWithStats,
  CompanyListItem,
  QuickBooksStatus,
  CompanyLocationRow,
  CompanyLocationInsert,
  CompanyLocationUpdate,
  CompanyLocationListItem,
} from "../types";

export class CompanyRepository extends BaseRepository<
  CompanyRow,
  CompanyInsert,
  CompanyUpdate,
  CompanyFilters
> {
  constructor(supabase: SupabaseClient) {
    super(supabase, "companies");
  }

  /**
   * Find a company by ID with computed stats
   */
  async findByIdWithStats(id: string): Promise<CompanyWithStats | null> {
    const { data: company, error } = await this.supabase
      .from("companies")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      if (error.code === "PGRST116") return null;
      throw error;
    }

    // Run all count queries in parallel
    const [
      jobCountResult,
      activeJobCountResult,
      requestCountResult,
      pendingRequestCountResult,
      invoicesResult,
    ] = await Promise.all([
      this.supabase
        .from("jobs")
        .select("*", { count: "exact", head: true })
        .eq("company_id", id),
      this.supabase
        .from("jobs")
        .select("*", { count: "exact", head: true })
        .eq("company_id", id)
        .neq("status", "complete"),
      this.supabase
        .from("requests")
        .select("*", { count: "exact", head: true })
        .eq("company_id", id),
      this.supabase
        .from("requests")
        .select("*", { count: "exact", head: true })
        .eq("company_id", id)
        .eq("status", "pending"),
      this.supabase
        .from("invoices")
        .select("amount, status")
        .eq("company_id", id),
    ]);

    const invoices = invoicesResult.data;
    const invoiceCount = invoices?.length ?? 0;
    const outstandingAmount =
      invoices
        ?.filter((inv) => inv.status !== "paid")
        .reduce((sum, inv) => sum + inv.amount, 0) ?? 0;

    // Determine QuickBooks status
    let quickbooksStatus: QuickBooksStatus = "not_connected";
    if (company.quickbooks_customer_id) {
      quickbooksStatus = "connected";
    }

    return {
      ...company,
      job_count: jobCountResult.count ?? 0,
      active_job_count: activeJobCountResult.count ?? 0,
      request_count: requestCountResult.count ?? 0,
      pending_request_count: pendingRequestCountResult.count ?? 0,
      invoice_count: invoiceCount,
      outstanding_amount: outstandingAmount,
      quickbooks_status: quickbooksStatus,
    } as CompanyWithStats;
  }

  /**
   * Get list items for tables
   */
  async getListItems(filters?: CompanyFilters): Promise<CompanyListItem[]> {
    let query = this.supabase
      .from("companies")
      .select("*")
      .order("name", { ascending: true });

    if (filters?.status) {
      query = query.eq("status", filters.status);
    }

    if (filters?.search) {
      query = query.ilike("name", `%${filters.search}%`);
    }

    query = this.applyPagination(query, filters);

    const { data, error } = await query;
    if (error) throw error;

    const companies = data ?? [];
    if (companies.length === 0) return [];

    const companyIds = companies.map((c) => c.id);

    // Batch fetch all job counts and pending request counts in parallel
    const [jobsResult, pendingRequestsResult] = await Promise.all([
      this.supabase
        .from("jobs")
        .select("company_id")
        .in("company_id", companyIds),
      this.supabase
        .from("requests")
        .select("company_id")
        .in("company_id", companyIds)
        .eq("status", "pending"),
    ]);

    // Build count maps
    const jobCounts = new Map<string, number>();
    const pendingRequestCounts = new Map<string, number>();

    for (const job of jobsResult.data ?? []) {
      jobCounts.set(job.company_id, (jobCounts.get(job.company_id) ?? 0) + 1);
    }

    for (const request of pendingRequestsResult.data ?? []) {
      pendingRequestCounts.set(
        request.company_id,
        (pendingRequestCounts.get(request.company_id) ?? 0) + 1
      );
    }

    // Map companies to list items
    return companies.map((company) => {
      let quickbooksStatus: QuickBooksStatus = "not_connected";
      if (company.quickbooks_customer_id) {
        quickbooksStatus = "connected";
      }

      return {
        id: company.id,
        name: company.name,
        contact_email: company.contact_email,
        status: company.status,
        job_count: jobCounts.get(company.id) ?? 0,
        pending_request_count: pendingRequestCounts.get(company.id) ?? 0,
        quickbooks_status: quickbooksStatus,
        created_at: company.created_at,
      };
    });
  }

  /**
   * Get users (profiles) for a company
   */
  async getCompanyUsers(companyId: string): Promise<{ id: string; email: string; full_name: string | null }[]> {
    const { data, error } = await this.supabase
      .from("profiles")
      .select("id, email, full_name")
      .eq("company_id", companyId)
      .order("email", { ascending: true });

    if (error) throw error;
    return data ?? [];
  }

  /**
   * Search companies by name
   */
  async searchByName(search: string, limit = 10): Promise<CompanyRow[]> {
    const { data, error } = await this.supabase
      .from("companies")
      .select("*")
      .ilike("name", `%${search}%`)
      .eq("status", "active")
      .limit(limit);

    if (error) throw error;
    return (data ?? []) as CompanyRow[];
  }

  protected applyFilters(
    query: QueryBuilder,
    filters?: CompanyFilters
  ): QueryBuilder {
    if (!filters) return query;

    if (filters.status) {
      query = query.eq("status", filters.status);
    }

    if (filters.search) {
      query = query.ilike("name", `%${filters.search}%`);
    }

    return query;
  }

  // ============================================
  // COMPANY LOCATIONS
  // ============================================

  /**
   * Get all locations for a company
   */
  async getCompanyLocations(companyId: string): Promise<CompanyLocationListItem[]> {
    const { data, error } = await this.supabase
      .from("company_locations")
      .select("id, name, address, city, state, zip_code, is_primary")
      .eq("company_id", companyId)
      .order("is_primary", { ascending: false })
      .order("name", { ascending: true });

    if (error) throw error;
    return (data ?? []) as CompanyLocationListItem[];
  }

  /**
   * Get a single location by ID
   */
  async getLocation(id: string): Promise<CompanyLocationRow | null> {
    const { data, error } = await this.supabase
      .from("company_locations")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      if (error.code === "PGRST116") return null;
      throw error;
    }
    return data as CompanyLocationRow;
  }

  /**
   * Create a new location
   */
  async createLocation(data: CompanyLocationInsert): Promise<CompanyLocationRow> {
    const { data: location, error } = await this.supabase
      .from("company_locations")
      .insert(data)
      .select()
      .single();

    if (error) throw error;
    return location as CompanyLocationRow;
  }

  /**
   * Update a location
   */
  async updateLocation(id: string, data: CompanyLocationUpdate): Promise<CompanyLocationRow> {
    const { data: location, error } = await this.supabase
      .from("company_locations")
      .update({ ...data, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return location as CompanyLocationRow;
  }

  /**
   * Delete a location
   */
  async deleteLocation(id: string): Promise<void> {
    const { error } = await this.supabase
      .from("company_locations")
      .delete()
      .eq("id", id);

    if (error) throw error;
  }

  /**
   * Set a location as primary (will unset other primary locations)
   */
  async setLocationAsPrimary(companyId: string, locationId: string): Promise<void> {
    // The database trigger will handle unsetting other primary locations
    const { error } = await this.supabase
      .from("company_locations")
      .update({ is_primary: true, updated_at: new Date().toISOString() })
      .eq("id", locationId)
      .eq("company_id", companyId);

    if (error) throw error;
  }
}
