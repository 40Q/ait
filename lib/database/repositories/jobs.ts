import { SupabaseClient } from "@supabase/supabase-js";
import { BaseRepository, QueryBuilder } from "./base";
import type {
  JobRow,
  JobInsert,
  JobUpdate,
  JobFilters,
  JobWithRelations,
  JobListItem,
  EquipmentItem,
  Location,
} from "../types";

export class JobRepository extends BaseRepository<
  JobRow,
  JobInsert,
  JobUpdate,
  JobFilters
> {
  constructor(supabase: SupabaseClient) {
    super(supabase, "jobs");
  }

  /**
   * Find a job by ID with all relations
   */
  async findByIdWithRelations(id: string): Promise<JobWithRelations | null> {
    const { data, error } = await this.supabase
      .from("jobs")
      .select(
        `
        *,
        quote:quotes(id, quote_number, total),
        request:requests(id, request_number),
        company:companies(id, name),
        documents(*),
        invoices(*)
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
      quote: data.quote,
      request: data.request,
      company: data.company,
      documents: data.documents || [],
      invoices: data.invoices || [],
    } as JobWithRelations;
  }

  /**
   * Find a job by job number
   */
  async findByJobNumber(jobNumber: string): Promise<JobRow | null> {
    const { data, error } = await this.supabase
      .from("jobs")
      .select("*")
      .eq("job_number", jobNumber)
      .single();

    if (error) {
      if (error.code === "PGRST116") return null;
      throw error;
    }
    return data as JobRow;
  }

  /**
   * Get list items for tables
   */
  async getListItems(filters?: JobFilters): Promise<JobListItem[]> {
    let query = this.supabase
      .from("jobs")
      .select(
        `
        id,
        job_number,
        company_id,
        status,
        pickup_date,
        location,
        equipment,
        created_at,
        company:companies(name),
        documents(id),
        invoices(id, amount, status)
      `
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

    if (filters?.search) {
      query = query.ilike("job_number", `%${filters.search}%`);
    }

    if (filters?.from_date) {
      query = query.gte("pickup_date", filters.from_date);
    }

    if (filters?.to_date) {
      query = query.lte("pickup_date", filters.to_date);
    }

    const { data, error } = await query;
    if (error) throw error;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (data ?? []).map((row: any) => {
      const location = row.location as Location;
      const equipment = (row.equipment as EquipmentItem[]) || [];
      const documents = (row.documents as { id: string }[]) || [];
      const invoices = (row.invoices as { id: string; amount: number; status: string }[]) || [];
      const invoiceTotal = invoices.reduce((sum: number, inv: { amount: number }) => sum + inv.amount, 0);

      return {
        id: row.id,
        job_number: row.job_number,
        company_id: row.company_id,
        company_name: row.company?.name ?? "Unknown",
        status: row.status,
        pickup_date: row.pickup_date,
        location_summary: location
          ? `${location.city}, ${location.state}`
          : "Unknown",
        equipment_summary: this.formatEquipmentSummary(equipment),
        equipment_count: equipment.reduce((sum: number, e: EquipmentItem) => sum + e.quantity, 0),
        document_count: documents.length,
        invoice_total: invoices.length > 0 ? invoiceTotal : null,
        invoice_status: invoices.length > 0 ? invoices[0].status : null,
        created_at: row.created_at,
      } as JobListItem;
    });
  }

  /**
   * Get counts by status
   */
  async getStatusCounts(companyId?: string): Promise<Record<string, number>> {
    const statuses = [
      "pickup_scheduled",
      "pickup_complete",
      "processing",
      "complete",
    ];
    const counts: Record<string, number> = { all: 0 };

    for (const status of statuses) {
      let query = this.supabase
        .from("jobs")
        .select("*", { count: "exact", head: true })
        .eq("status", status);

      if (companyId) {
        query = query.eq("company_id", companyId);
      }

      const { count } = await query;
      counts[status] = count ?? 0;
      counts.all += count ?? 0;
    }

    return counts;
  }

  /**
   * Update job status with timeline tracking
   */
  async updateStatus(id: string, newStatus: string): Promise<JobRow> {
    const updateData: Record<string, unknown> = { status: newStatus };
    const now = new Date().toISOString();

    switch (newStatus) {
      case "pickup_complete":
        updateData.pickup_complete_at = now;
        break;
      case "processing":
        updateData.processing_started_at = now;
        break;
      case "complete":
        updateData.completed_at = now;
        break;
    }

    return this.update(id, updateData as JobUpdate);
  }

  protected applyFilters(query: QueryBuilder, filters?: JobFilters): QueryBuilder {
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

    if (filters.search) {
      query = query.ilike("job_number", `%${filters.search}%`);
    }

    if (filters.from_date) {
      query = query.gte("pickup_date", filters.from_date);
    }

    if (filters.to_date) {
      query = query.lte("pickup_date", filters.to_date);
    }

    return query;
  }

  private formatEquipmentSummary(equipment: EquipmentItem[]): string {
    if (!equipment || equipment.length === 0) return "No equipment";
    return equipment
      .slice(0, 2)
      .map((item) => `${item.quantity} ${item.type}`)
      .join(", ")
      .concat(equipment.length > 2 ? `, +${equipment.length - 2} more` : "");
  }
}
