"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { TimelineRepository } from "@/lib/database/repositories";
import type {
  TimelineEntityType,
  TimelineEventInsert,
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
