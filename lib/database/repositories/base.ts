import { SupabaseClient } from "@supabase/supabase-js";
import type { PaginatedResult, PaginationParams } from "../types/common";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type QueryBuilder = any;

export abstract class BaseRepository<
  TRow,
  TInsert,
  TUpdate,
  TFilters = Record<string, unknown>
> {
  protected tableName: string;

  constructor(
    protected supabase: SupabaseClient,
    tableName: string
  ) {
    this.tableName = tableName;
  }

  /**
   * Find a single record by ID
   */
  async findById(id: string): Promise<TRow | null> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      if (error.code === "PGRST116") return null; // Not found
      throw error;
    }
    return data as TRow;
  }

  /**
   * Find all records with optional filters and pagination
   */
  async findAll(
    filters?: TFilters,
    pagination?: PaginationParams
  ): Promise<PaginatedResult<TRow>> {
    const page = pagination?.page ?? 1;
    const limit = pagination?.limit ?? 20;
    const offset = (page - 1) * limit;

    let query = this.supabase
      .from(this.tableName)
      .select("*", { count: "exact" });

    query = this.applyFilters(query, filters);

    const { data, count, error } = await query
      .range(offset, offset + limit - 1)
      .order("created_at", { ascending: false });

    if (error) throw error;

    return {
      data: (data ?? []) as TRow[],
      total: count ?? 0,
      page,
      limit,
      totalPages: Math.ceil((count ?? 0) / limit),
    };
  }

  /**
   * Create a new record
   */
  async create(data: TInsert): Promise<TRow> {
    const { data: created, error } = await this.supabase
      .from(this.tableName)
      .insert(data as Record<string, unknown>)
      .select()
      .single();

    if (error) throw error;
    return created as TRow;
  }

  /**
   * Create multiple records
   */
  async createMany(data: TInsert[]): Promise<TRow[]> {
    const { data: created, error } = await this.supabase
      .from(this.tableName)
      .insert(data as Record<string, unknown>[])
      .select();

    if (error) throw error;
    return (created ?? []) as TRow[];
  }

  /**
   * Update a record by ID
   */
  async update(id: string, data: TUpdate): Promise<TRow> {
    const { data: updated, error } = await this.supabase
      .from(this.tableName)
      .update(data as Record<string, unknown>)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return updated as TRow;
  }

  /**
   * Delete a record by ID
   */
  async delete(id: string): Promise<void> {
    const { error } = await this.supabase
      .from(this.tableName)
      .delete()
      .eq("id", id);

    if (error) throw error;
  }

  /**
   * Count records with optional filters
   */
  async count(filters?: TFilters): Promise<number> {
    let query = this.supabase
      .from(this.tableName)
      .select("*", { count: "exact", head: true });

    query = this.applyFilters(query, filters);

    const { count, error } = await query;

    if (error) throw error;
    return count ?? 0;
  }

  /**
   * Check if a record exists
   */
  async exists(id: string): Promise<boolean> {
    const { count, error } = await this.supabase
      .from(this.tableName)
      .select("*", { count: "exact", head: true })
      .eq("id", id);

    if (error) throw error;
    return (count ?? 0) > 0;
  }

  /**
   * Apply filters to a query - must be implemented by subclasses
   */
  protected abstract applyFilters(
    query: QueryBuilder,
    filters?: TFilters
  ): QueryBuilder;
}
