"use client";

import { useEffect } from "react";
import {
  useQuery,
  useMutation,
  useQueryClient,
  keepPreviousData,
} from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import {
  queryKeys,
  type NotificationFilters,
  type NotificationListItem,
  type NotificationPreferencesRow,
  type NotificationPreferencesUpdate,
  type PaginatedResult,
} from "@/lib/database/types";
import { getQueryOptions } from "./query-config";

/**
 * Hook to fetch a paginated list of notifications
 */
export function useNotifications(
  filters?: NotificationFilters,
  page: number = 1,
  pageSize: number = 20
) {
  return useQuery({
    queryKey: [...queryKeys.notifications.list(filters), page, pageSize],
    queryFn: async (): Promise<PaginatedResult<NotificationListItem>> => {
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("limit", String(pageSize));

      if (filters?.is_read !== undefined) {
        params.set("is_read", String(filters.is_read));
      }
      if (filters?.is_dismissed !== undefined) {
        params.set("is_dismissed", String(filters.is_dismissed));
      }

      const response = await fetch(`/api/notifications?${params.toString()}`);
      if (!response.ok) {
        throw new Error("Failed to fetch notifications");
      }
      return response.json();
    },
    placeholderData: keepPreviousData,
    ...getQueryOptions("list"),
  });
}

/**
 * Hook to fetch unread notifications
 */
export function useUnreadNotifications(limit: number = 10) {
  return useQuery({
    queryKey: queryKeys.notifications.unread(),
    queryFn: async (): Promise<PaginatedResult<NotificationListItem>> => {
      const params = new URLSearchParams();
      params.set("page", "1");
      params.set("limit", String(limit));
      params.set("is_read", "false");
      params.set("is_dismissed", "false");

      const response = await fetch(`/api/notifications?${params.toString()}`);
      if (!response.ok) {
        throw new Error("Failed to fetch unread notifications");
      }
      return response.json();
    },
    refetchInterval: 30000, // Poll every 30 seconds
    ...getQueryOptions("list"),
  });
}

/**
 * Hook to fetch unread notification count
 */
export function useUnreadNotificationCount() {
  return useQuery({
    queryKey: queryKeys.notifications.unreadCount(),
    queryFn: async (): Promise<number> => {
      const response = await fetch("/api/notifications/unread-count");
      if (!response.ok) {
        throw new Error("Failed to fetch unread count");
      }
      const data = await response.json();
      return data.count;
    },
    refetchInterval: 30000, // Poll every 30 seconds
    ...getQueryOptions("counts"),
  });
}

/**
 * Hook to mark a notification as read
 */
export function useMarkNotificationRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/notifications/${id}/read`, {
        method: "POST",
      });
      if (!response.ok) {
        throw new Error("Failed to mark notification as read");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.notifications.all,
      });
    },
  });
}

/**
 * Hook to mark all notifications as read
 */
export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/notifications/read-all", {
        method: "POST",
      });
      if (!response.ok) {
        throw new Error("Failed to mark all notifications as read");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.notifications.all,
      });
    },
  });
}

/**
 * Hook to dismiss a notification
 */
export function useDismissNotification() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/notifications/${id}/dismiss`, {
        method: "POST",
      });
      if (!response.ok) {
        throw new Error("Failed to dismiss notification");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.notifications.all,
      });
    },
  });
}

/**
 * Hook to subscribe to real-time notification updates
 */
export function useRealtimeNotifications() {
  const queryClient = useQueryClient();
  const supabase = createClient();

  useEffect(() => {
    const channel = supabase
      .channel("notifications-changes")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
        },
        () => {
          // Invalidate notification queries when a new notification arrives
          queryClient.invalidateQueries({
            queryKey: queryKeys.notifications.all,
          });
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "notifications",
        },
        () => {
          // Invalidate when notifications are updated (read/dismissed)
          queryClient.invalidateQueries({
            queryKey: queryKeys.notifications.all,
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient, supabase]);
}

/**
 * Hook to fetch notification preferences
 */
export function useNotificationPreferences() {
  return useQuery({
    queryKey: queryKeys.notifications.preferences(),
    queryFn: async (): Promise<NotificationPreferencesRow> => {
      const response = await fetch("/api/notifications/preferences");
      if (!response.ok) {
        throw new Error("Failed to fetch notification preferences");
      }
      return response.json();
    },
    ...getQueryOptions("detail"),
  });
}

/**
 * Hook to update notification preferences
 */
export function useUpdateNotificationPreferences() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (preferences: NotificationPreferencesUpdate) => {
      const response = await fetch("/api/notifications/preferences", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(preferences),
      });
      if (!response.ok) {
        throw new Error("Failed to update notification preferences");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.notifications.preferences(),
      });
    },
  });
}

/**
 * Hook to register OneSignal player ID
 */
export function useRegisterPushSubscription() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (playerId: string) => {
      const response = await fetch("/api/onesignal/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerId }),
      });
      if (!response.ok) {
        throw new Error("Failed to register push subscription");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.notifications.preferences(),
      });
    },
  });
}
