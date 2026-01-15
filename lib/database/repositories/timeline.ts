import { SupabaseClient } from "@supabase/supabase-js";
import type {
  TimelineEventRow,
  TimelineEventInsert,
  TimelineEventWithActor,
  TimelineEntityType,
} from "../types";

export class TimelineRepository {
  constructor(private supabase: SupabaseClient) {}

  /**
   * Get all timeline events for an entity
   */
  async getByEntity(
    entityType: TimelineEntityType,
    entityId: string
  ): Promise<TimelineEventWithActor[]> {
    const { data, error } = await this.supabase
      .from("timeline_events")
      .select(
        `
        *,
        actor:profiles!actor_id(id, full_name, email)
      `
      )
      .eq("entity_type", entityType)
      .eq("entity_id", entityId)
      .order("created_at", { ascending: true });

    if (error) throw error;
    return (data ?? []) as TimelineEventWithActor[];
  }

  /**
   * Create a new timeline event
   */
  async create(event: TimelineEventInsert): Promise<TimelineEventRow> {
    const { data, error } = await this.supabase
      .from("timeline_events")
      .insert(event)
      .select()
      .single();

    if (error) throw error;
    return data as TimelineEventRow;
  }

  /**
   * Create a status change event
   */
  async createStatusChange(
    entityType: TimelineEntityType,
    entityId: string,
    previousStatus: string | null,
    newStatus: string,
    actorId?: string
  ): Promise<TimelineEventRow> {
    return this.create({
      entity_type: entityType,
      entity_id: entityId,
      event_type: "status_change",
      previous_value: previousStatus,
      new_value: newStatus,
      actor_id: actorId,
    });
  }

  /**
   * Create a declined event with reason
   */
  async createDeclinedEvent(
    entityType: TimelineEntityType,
    entityId: string,
    reason: string | null,
    actorId?: string
  ): Promise<TimelineEventRow> {
    return this.create({
      entity_type: entityType,
      entity_id: entityId,
      event_type: "declined",
      new_value: reason,
      actor_id: actorId,
    });
  }

  /**
   * Create a note event
   */
  async createNote(
    entityType: TimelineEntityType,
    entityId: string,
    note: string,
    actorId?: string
  ): Promise<TimelineEventRow> {
    return this.create({
      entity_type: entityType,
      entity_id: entityId,
      event_type: "note",
      new_value: note,
      actor_id: actorId,
    });
  }

  /**
   * Create a created event
   */
  async createCreatedEvent(
    entityType: TimelineEntityType,
    entityId: string,
    actorId?: string
  ): Promise<TimelineEventRow> {
    return this.create({
      entity_type: entityType,
      entity_id: entityId,
      event_type: "created",
      actor_id: actorId,
    });
  }
}
