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

    // Get job counts
    const { count: jobCount } = await this.supabase
      .from("jobs")
      .select("*", { count: "exact", head: true })
      .eq("company_id", id);

    const { count: activeJobCount } = await this.supabase
      .from("jobs")
      .select("*", { count: "exact", head: true })
      .eq("company_id", id)
      .neq("status", "complete");

    // Get request counts
    const { count: requestCount } = await this.supabase
      .from("requests")
      .select("*", { count: "exact", head: true })
      .eq("company_id", id);

    const { count: pendingRequestCount } = await this.supabase
      .from("requests")
      .select("*", { count: "exact", head: true })
      .eq("company_id", id)
      .eq("status", "pending");

    // Get invoice counts and outstanding amount
    const { data: invoices } = await this.supabase
      .from("invoices")
      .select("amount, status")
      .eq("company_id", id);

    const invoiceCount = invoices?.length ?? 0;
    const outstandingAmount =
      invoices
        ?.filter((inv) => inv.status !== "paid")
        .reduce((sum, inv) => sum + inv.amount, 0) ?? 0;

    // Determine QuickBooks status
    let quickbooksStatus: QuickBooksStatus = "not_connected";
    if (company.quickbooks_customer_id) {
      // In a real implementation, we'd check if the connection is valid
      quickbooksStatus = "connected";
    }

    return {
      ...company,
      job_count: jobCount ?? 0,
      active_job_count: activeJobCount ?? 0,
      request_count: requestCount ?? 0,
      pending_request_count: pendingRequestCount ?? 0,
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

    const { data, error } = await query;
    if (error) throw error;

    // Get counts for each company
    const listItems: CompanyListItem[] = [];

    for (const company of data ?? []) {
      const { count: jobCount } = await this.supabase
        .from("jobs")
        .select("*", { count: "exact", head: true })
        .eq("company_id", company.id);

      const { count: pendingRequestCount } = await this.supabase
        .from("requests")
        .select("*", { count: "exact", head: true })
        .eq("company_id", company.id)
        .eq("status", "pending");

      let quickbooksStatus: QuickBooksStatus = "not_connected";
      if (company.quickbooks_customer_id) {
        quickbooksStatus = "connected";
      }

      listItems.push({
        id: company.id,
        name: company.name,
        contact_email: company.contact_email,
        status: company.status,
        job_count: jobCount ?? 0,
        pending_request_count: pendingRequestCount ?? 0,
        quickbooks_status: quickbooksStatus,
        created_at: company.created_at,
      });
    }

    return listItems;
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
