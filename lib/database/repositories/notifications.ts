import { SupabaseClient } from "@supabase/supabase-js";
import { BaseRepository, QueryBuilder } from "./base";
import type {
  NotificationRow,
  NotificationInsert,
  NotificationUpdate,
  NotificationFilters,
  NotificationListItem,
  NotificationPreferencesRow,
  NotificationPreferencesUpdate,
  PaginatedResult,
} from "../types";

export class NotificationRepository extends BaseRepository<
  NotificationRow,
  NotificationInsert,
  NotificationUpdate,
  NotificationFilters
> {
  constructor(supabase: SupabaseClient) {
    super(supabase, "notifications");
  }

  /**
   * Create a notification using SECURITY DEFINER function to bypass RLS
   */
  async create(data: NotificationInsert): Promise<NotificationRow> {
    const { data: result, error } = await this.supabase.rpc(
      "create_notification",
      {
        p_user_id: data.user_id,
        p_type: data.type,
        p_title: data.title,
        p_message: data.message,
        p_priority: data.priority || "normal",
        p_action_url: data.action_url || null,
        p_entity_type: data.entity_type || null,
        p_entity_id: data.entity_id || null,
        p_metadata: data.metadata || {},
      }
    );

    if (error) throw error;

    // Return a minimal notification object with the created ID
    // We can't fetch the full row due to RLS (user may not own this notification)
    return {
      id: result,
      user_id: data.user_id,
      type: data.type,
      title: data.title,
      message: data.message,
      priority: data.priority || "normal",
      action_url: data.action_url || null,
      entity_type: data.entity_type || null,
      entity_id: data.entity_id || null,
      metadata: data.metadata || {},
      is_read: false,
      read_at: null,
      is_dismissed: false,
      dismissed_at: null,
      email_sent: false,
      email_sent_at: null,
      push_sent: false,
      push_sent_at: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    } as NotificationRow;
  }

  /**
   * Get paginated list items for the notification list
   */
  async getListItems(
    filters?: NotificationFilters,
    page: number = 1,
    pageSize: number = 20
  ): Promise<PaginatedResult<NotificationListItem>> {
    const offset = (page - 1) * pageSize;

    let query = this.supabase
      .from("notifications")
      .select(
        `
        id,
        type,
        title,
        message,
        priority,
        action_url,
        entity_type,
        entity_id,
        is_read,
        is_dismissed,
        created_at
      `,
        { count: "exact" }
      )
      .order("created_at", { ascending: false });

    query = this.applyFilters(query, filters);
    query = query.range(offset, offset + pageSize - 1);

    const { data, count, error } = await query;
    if (error) throw error;

    const total = count ?? 0;

    return {
      data: (data ?? []) as NotificationListItem[],
      total,
      page,
      limit: pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  /**
   * Get unread notifications for a user
   */
  async getUnread(userId: string, limit: number = 10): Promise<NotificationListItem[]> {
    const { data, error } = await this.supabase
      .from("notifications")
      .select(
        `
        id,
        type,
        title,
        message,
        priority,
        action_url,
        entity_type,
        entity_id,
        is_read,
        is_dismissed,
        created_at
      `
      )
      .eq("user_id", userId)
      .eq("is_read", false)
      .eq("is_dismissed", false)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) throw error;
    return (data ?? []) as NotificationListItem[];
  }

  /**
   * Get unread count for a user
   */
  async getUnreadCount(userId: string): Promise<number> {
    const { count, error } = await this.supabase
      .from("notifications")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("is_read", false)
      .eq("is_dismissed", false);

    if (error) throw error;
    return count ?? 0;
  }

  /**
   * Mark a notification as read
   */
  async markAsRead(id: string): Promise<NotificationRow> {
    const { data, error } = await this.supabase
      .from("notifications")
      .update({
        is_read: true,
        read_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return data as NotificationRow;
  }

  /**
   * Mark all notifications as read for a user
   */
  async markAllAsRead(userId: string): Promise<void> {
    const { error } = await this.supabase
      .from("notifications")
      .update({
        is_read: true,
        read_at: new Date().toISOString(),
      })
      .eq("user_id", userId)
      .eq("is_read", false);

    if (error) throw error;
  }

  /**
   * Dismiss a notification
   */
  async dismiss(id: string): Promise<NotificationRow> {
    const { data, error } = await this.supabase
      .from("notifications")
      .update({
        is_dismissed: true,
        dismissed_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return data as NotificationRow;
  }

  /**
   * Get notification preferences for a user
   * Uses SECURITY DEFINER function to bypass RLS
   */
  async getPreferences(userId: string): Promise<NotificationPreferencesRow | null> {
    const { data, error } = await this.supabase.rpc(
      "get_notification_preferences",
      { p_user_id: userId }
    );

    if (error) throw error;

    // RPC returns an array, get first item or null
    const row = Array.isArray(data) ? data[0] : data;
    if (!row) return null;

    return row as NotificationPreferencesRow;
  }

  /**
   * Update notification preferences for a user
   */
  async updatePreferences(
    userId: string,
    preferences: NotificationPreferencesUpdate
  ): Promise<NotificationPreferencesRow> {
    // Try to update first
    const { data: updated, error: updateError } = await this.supabase
      .from("notification_preferences")
      .update(preferences)
      .eq("user_id", userId)
      .select()
      .single();

    if (!updateError) {
      return updated as NotificationPreferencesRow;
    }

    // If no row exists, create one
    if (updateError.code === "PGRST116") {
      const { data: created, error: createError } = await this.supabase
        .from("notification_preferences")
        .insert({ user_id: userId, ...preferences })
        .select()
        .single();

      if (createError) throw createError;
      return created as NotificationPreferencesRow;
    }

    throw updateError;
  }

  /**
   * Register OneSignal player ID for a user
   */
  async registerPlayerId(userId: string, playerId: string): Promise<void> {
    await this.updatePreferences(userId, { onesignal_player_id: playerId });
  }

  /**
   * Mark notification as email sent
   */
  async markEmailSent(id: string): Promise<void> {
    const { error } = await this.supabase
      .from("notifications")
      .update({
        email_sent: true,
        email_sent_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (error) throw error;
  }

  /**
   * Mark notification as push sent
   */
  async markPushSent(id: string): Promise<void> {
    const { error } = await this.supabase
      .from("notifications")
      .update({
        push_sent: true,
        push_sent_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (error) throw error;
  }

  protected applyFilters(
    query: QueryBuilder,
    filters?: NotificationFilters
  ): QueryBuilder {
    if (!filters) return query;

    if (filters.user_id) {
      query = query.eq("user_id", filters.user_id);
    }

    if (filters.type) {
      const types = Array.isArray(filters.type) ? filters.type : [filters.type];
      query = query.in("type", types);
    }

    if (filters.is_read !== undefined) {
      query = query.eq("is_read", filters.is_read);
    }

    if (filters.is_dismissed !== undefined) {
      query = query.eq("is_dismissed", filters.is_dismissed);
    }

    if (filters.entity_type) {
      query = query.eq("entity_type", filters.entity_type);
    }

    if (filters.entity_id) {
      query = query.eq("entity_id", filters.entity_id);
    }

    return query;
  }
}
