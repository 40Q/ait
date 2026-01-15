"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { TimelineRepository } from "@/lib/database/repositories";
import type {
  TimelineEntityType,
  TimelineEventInsert,
  TimelineEventWithActor,
} from "@/lib/database/types";

/**
 * Hook to fetch timeline events for an entity
 */
export function useTimeline(entityType: TimelineEntityType, entityId: string) {
  const supabase = createClient();
  const repo = new TimelineRepository(supabase);

  return useQuery({
    queryKey: ["timeline", entityType, entityId],
    queryFn: () => repo.getByEntity(entityType, entityId),
    enabled: !!entityId,
  });
}

/**
 * Hook to fetch combined timeline for a request + its quote
 * This gives a complete picture of all events related to a request
 */
export function useRequestFullTimeline(requestId: string, quoteId?: string | null) {
  const supabase = createClient();
  const repo = new TimelineRepository(supabase);

  return useQuery({
    queryKey: ["timeline", "request-full", requestId, quoteId],
    queryFn: async (): Promise<TimelineEventWithActor[]> => {
      // Fetch request events
      const requestEvents = await repo.getByEntity("request", requestId);

      // Fetch quote events if we have a quote
      let quoteEvents: TimelineEventWithActor[] = [];
      if (quoteId) {
        quoteEvents = await repo.getByEntity("quote", quoteId);
      }

      // Combine and sort by date
      const allEvents = [...requestEvents, ...quoteEvents];
      allEvents.sort((a, b) =>
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );

      return allEvents;
    },
    enabled: !!requestId,
  });
}

/**
 * Hook to create a timeline event
 */
export function useCreateTimelineEvent() {
  const queryClient = useQueryClient();
  const supabase = createClient();
  const repo = new TimelineRepository(supabase);

  return useMutation({
    mutationFn: (event: TimelineEventInsert) => repo.create(event),
    onSuccess: (_, event) => {
      queryClient.invalidateQueries({
        queryKey: ["timeline", event.entity_type, event.entity_id],
      });
    },
  });
}
