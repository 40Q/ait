export type TimelineEntityType = "request" | "quote" | "job";
export type TimelineEventType = "status_change" | "created" | "declined" | "note";

export interface TimelineEventRow {
  id: string;
  entity_type: TimelineEntityType;
  entity_id: string;
  event_type: TimelineEventType;
  previous_value: string | null;
  new_value: string | null;
  actor_id: string | null;
  created_at: string;
}

export interface TimelineEventInsert {
  entity_type: TimelineEntityType;
  entity_id: string;
  event_type: TimelineEventType;
  previous_value?: string | null;
  new_value?: string | null;
  actor_id?: string | null;
}

export interface TimelineEventWithActor extends TimelineEventRow {
  actor: {
    id: string;
    full_name: string | null;
    email: string;
  } | null;
}
