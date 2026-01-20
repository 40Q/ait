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
  PaginatedResult,
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
   * Get paginated list items for tables/cards
   */
  async getListItems(
    filters?: RequestFilters,
    page: number = 1,
    pageSize: number = 20
  ): Promise<PaginatedResult<RequestListItem>> {
    const offset = (page - 1) * pageSize;

    let query = this.supabase
      .from("requests")
      .select(
        `
        id,
        request_number,
        company_id,
        status,
        form_type,
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

    if (filters?.search) {
      // First get company IDs that match the search term
      const { data: matchingCompanies } = await this.supabase
        .from("companies")
        .select("id")
        .ilike("name", `%${filters.search}%`);

      const matchingCompanyIds = matchingCompanies?.map(c => c.id) || [];

      if (matchingCompanyIds.length > 0) {
        query = query.or(
          `request_number.ilike.%${filters.search}%,company_id.in.(${matchingCompanyIds.join(",")})`
        );
      } else {
        query = query.ilike("request_number", `%${filters.search}%`);
      }
    }

    if (filters?.from_date) {
      query = query.gte("created_at", filters.from_date);
    }

    if (filters?.to_date) {
      query = query.lte("created_at", filters.to_date);
    }

    // Apply pagination
    query = query.range(offset, offset + pageSize - 1);

    const { data, count, error } = await query;
    if (error) throw error;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const items = (data ?? []).map((row: any) => {
      const equipment = (row.equipment as EquipmentItem[]) || [];
      const equipmentCount = equipment.reduce((sum: number, e: EquipmentItem) => sum + e.quantity, 0);
      const quote = Array.isArray(row.quote) ? row.quote[0] : row.quote;

      return {
        id: row.id,
        request_number: row.request_number,
        company_id: row.company_id,
        company_name: row.company?.name ?? "Unknown",
        status: row.status,
        form_type: row.form_type ?? "standard",
        preferred_date: row.preferred_date,
        location_summary: [row.address, row.city, row.state].filter(Boolean).join(", "),
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
    const statuses = ["pending", "quote_ready", "accepted", "declined"] as const;
    return this.getCountsByField(
      "status",
      [...statuses],
      companyId ? { company_id: companyId } : undefined
    );
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
      // Note: Company name search is handled in getListItems
      // This method only supports request_number search
      query = query.ilike("request_number", `%${filters.search}%`);
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
