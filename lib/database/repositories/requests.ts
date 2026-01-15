import { SupabaseClient } from "@supabase/supabase-js";
import { BaseRepository, QueryBuilder } from "./base";
import type {
  RequestRow,
  RequestInsert,
  RequestUpdate,
  RequestFilters,
  RequestWithRelations,
  RequestListItem,
  EquipmentItem,
} from "../types";

export class RequestRepository extends BaseRepository<
  RequestRow,
  RequestInsert,
  RequestUpdate,
  RequestFilters
> {
  constructor(supabase: SupabaseClient) {
    super(supabase, "requests");
  }

  /**
   * Find a request by ID with all relations
   */
  async findByIdWithRelations(id: string): Promise<RequestWithRelations | null> {
    const { data, error } = await this.supabase
      .from("requests")
      .select(
        `
        *,
        company:companies(id, name),
        submitted_by_profile:profiles!submitted_by(id, full_name, email),
        quote:quotes(id, quote_number, status, total)
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
      submitted_by_profile: data.submitted_by_profile,
      quote: data.quote?.[0] ?? null,
    } as RequestWithRelations;
  }

  /**
   * Find a request by request number
   */
  async findByRequestNumber(requestNumber: string): Promise<RequestRow | null> {
    const { data, error } = await this.supabase
      .from("requests")
      .select("*")
      .eq("request_number", requestNumber)
      .single();

    if (error) {
      if (error.code === "PGRST116") return null;
      throw error;
    }
    return data as RequestRow;
  }

  /**
   * Get list items for tables/cards
   */
  async getListItems(filters?: RequestFilters): Promise<RequestListItem[]> {
    let query = this.supabase
      .from("requests")
      .select(
        `
        id,
        request_number,
        company_id,
        status,
        preferred_date,
        address,
        city,
        state,
        equipment,
        data_destruction_service,
        white_glove_service,
        created_at,
        company:companies(name),
        quote:quotes(id, total)
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
      query = query.or(
        `request_number.ilike.%${filters.search}%`
      );
    }

    if (filters?.from_date) {
      query = query.gte("created_at", filters.from_date);
    }

    if (filters?.to_date) {
      query = query.lte("created_at", filters.to_date);
    }

    const { data, error } = await query;
    if (error) throw error;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (data ?? []).map((row: any) => {
      const equipment = (row.equipment as EquipmentItem[]) || [];
      const equipmentCount = equipment.reduce((sum: number, e: EquipmentItem) => sum + e.quantity, 0);
      const quote = Array.isArray(row.quote) ? row.quote[0] : row.quote;

      return {
        id: row.id,
        request_number: row.request_number,
        company_id: row.company_id,
        company_name: row.company?.name ?? "Unknown",
        status: row.status,
        preferred_date: row.preferred_date,
        location_summary: `${row.address}, ${row.city}, ${row.state}`,
        equipment_summary: this.formatEquipmentSummary(equipment),
        equipment_count: equipmentCount,
        has_data_destruction: row.data_destruction_service !== "none",
        has_serialization: [
          "hd_serialization_cod",
          "onsite_hd_serialization_cod",
          "asset_serialization_cor",
        ].includes(row.data_destruction_service as string),
        has_white_glove: row.white_glove_service,
        quote_id: quote?.id,
        quote_total: quote?.total,
        created_at: row.created_at,
      } as RequestListItem;
    });
  }

  /**
   * Get counts by status (for tabs/badges)
   */
  async getStatusCounts(companyId?: string): Promise<Record<string, number>> {
    let query = this.supabase
      .from("requests")
      .select("status", { count: "exact" });

    if (companyId) {
      query = query.eq("company_id", companyId);
    }

    const statuses = ["pending", "quote_ready", "accepted", "declined"];
    const counts: Record<string, number> = { all: 0 };

    for (const status of statuses) {
      let statusQuery = this.supabase
        .from("requests")
        .select("*", { count: "exact", head: true })
        .eq("status", status);

      if (companyId) {
        statusQuery = statusQuery.eq("company_id", companyId);
      }

      const { count } = await statusQuery;
      counts[status] = count ?? 0;
      counts.all += count ?? 0;
    }

    return counts;
  }

  protected applyFilters(
    query: QueryBuilder,
    filters?: RequestFilters
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

    if (filters.search) {
      query = query.or(
        `request_number.ilike.%${filters.search}%`
      );
    }

    if (filters.from_date) {
      query = query.gte("created_at", filters.from_date);
    }

    if (filters.to_date) {
      query = query.lte("created_at", filters.to_date);
    }

    return query;
  }

  private formatEquipmentSummary(equipment: EquipmentItem[]): string {
    if (!equipment || equipment.length === 0) return "No equipment specified";
    return equipment
      .slice(0, 3)
      .map((item) => `${item.quantity} ${item.type}`)
      .join(", ")
      .concat(equipment.length > 3 ? `, +${equipment.length - 3} more` : "");
  }
}
