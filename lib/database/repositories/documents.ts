import { SupabaseClient } from "@supabase/supabase-js";
import { BaseRepository, QueryBuilder } from "./base";
import type {
  DocumentRow,
  DocumentInsert,
  DocumentUpdate,
  DocumentFilters,
  DocumentWithRelations,
  DocumentListItem,
} from "../types";

export class DocumentRepository extends BaseRepository<
  DocumentRow,
  DocumentInsert,
  DocumentUpdate,
  DocumentFilters
> {
  constructor(supabase: SupabaseClient) {
    super(supabase, "documents");
  }

  /**
   * Find a document by ID with relations
   */
  async findByIdWithRelations(id: string): Promise<DocumentWithRelations | null> {
    const { data, error } = await this.supabase
      .from("documents")
      .select(
        `
        *,
        job:jobs(id, job_number),
        company:companies(id, name),
        uploaded_by_profile:profiles!uploaded_by(id, full_name, email)
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
      job: data.job,
      company: data.company,
      uploaded_by_profile: data.uploaded_by_profile,
    } as DocumentWithRelations;
  }

  /**
   * Get documents for a specific job
   */
  async findByJobId(jobId: string): Promise<DocumentRow[]> {
    const { data, error } = await this.supabase
      .from("documents")
      .select("*")
      .eq("job_id", jobId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return (data ?? []) as DocumentRow[];
  }

  /**
   * Get list items for tables
   */
  async getListItems(filters?: DocumentFilters): Promise<DocumentListItem[]> {
    let query = this.supabase
      .from("documents")
      .select(
        `
        id,
        name,
        document_type,
        job_id,
        company_id,
        file_url,
        file_size,
        created_at,
        job:jobs(job_number),
        company:companies(name),
        uploaded_by_profile:profiles!uploaded_by(full_name)
      `
      )
      .order("created_at", { ascending: false });

    if (filters?.document_type) {
      const types = Array.isArray(filters.document_type)
        ? filters.document_type
        : [filters.document_type];
      query = query.in("document_type", types);
    }

    if (filters?.job_id) {
      query = query.eq("job_id", filters.job_id);
    }

    if (filters?.company_id) {
      query = query.eq("company_id", filters.company_id);
    }

    const { data, error } = await query;
    if (error) throw error;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let items = (data ?? []).map((row: any) => ({
      id: row.id,
      name: row.name,
      document_type: row.document_type,
      job_id: row.job_id,
      job_number: row.job?.job_number ?? "",
      company_id: row.company_id,
      company_name: row.company?.name ?? "Unknown",
      file_url: row.file_url,
      file_size: row.file_size,
      uploaded_by_name: row.uploaded_by_profile?.full_name ?? "Unknown",
      created_at: row.created_at,
    } as DocumentListItem));

    // Filter by search term across name, job_number, and company_name
    if (filters?.search) {
      const searchLower = filters.search.toLowerCase();
      items = items.filter(
        (item) =>
          item.name.toLowerCase().includes(searchLower) ||
          item.job_number.toLowerCase().includes(searchLower) ||
          item.company_name.toLowerCase().includes(searchLower)
      );
    }

    return items;
  }

  /**
   * Get counts by document type
   */
  async getTypeCounts(companyId?: string): Promise<Record<string, number>> {
    const types = [
      "certificate_of_destruction",
      "certificate_of_recycling",
      "hd_serialization",
      "asset_serialization",
      "warehouse_report",
      "pickup_document",
    ];
    const counts: Record<string, number> = { all: 0 };

    for (const type of types) {
      let query = this.supabase
        .from("documents")
        .select("*", { count: "exact", head: true })
        .eq("document_type", type);

      if (companyId) {
        query = query.eq("company_id", companyId);
      }

      const { count } = await query;
      counts[type] = count ?? 0;
      counts.all += count ?? 0;
    }

    return counts;
  }

  protected applyFilters(
    query: QueryBuilder,
    filters?: DocumentFilters
  ): QueryBuilder {
    if (!filters) return query;

    if (filters.document_type) {
      const types = Array.isArray(filters.document_type)
        ? filters.document_type
        : [filters.document_type];
      query = query.in("document_type", types);
    }

    if (filters.job_id) {
      query = query.eq("job_id", filters.job_id);
    }

    if (filters.company_id) {
      query = query.eq("company_id", filters.company_id);
    }

    if (filters.search) {
      query = query.ilike("name", `%${filters.search}%`);
    }

    return query;
  }
}
