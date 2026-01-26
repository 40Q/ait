"use client";

import { useMemo, memo, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Pagination } from "@/components/ui/pagination";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { EmptyState } from "@/components/ui/empty-state";
import { ListFilters } from "@/components/ui/list-filters";
import { FetchingIndicator } from "@/components/ui/fetching-indicator";
import { Bell, Check, X, CheckCheck } from "lucide-react";
import {
  useNotifications,
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
  useDismissNotification,
} from "@/lib/hooks/use-notifications";
import { usePagination } from "@/lib/hooks";
import {
  notificationTypeLabels,
  type NotificationListItem,
  type NotificationFilters,
} from "@/lib/database/types";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

const filterOptions = [
  { value: "all", label: "All Notifications" },
  { value: "unread", label: "Unread" },
  { value: "read", label: "Read" },
];

const NotificationCard = memo(function NotificationCard({
  notification,
  onMarkRead,
  onDismiss,
  onClick,
}: {
  notification: NotificationListItem;
  onMarkRead: (id: string) => void;
  onDismiss: (id: string) => void;
  onClick: () => void;
}) {
  const priorityColors = {
    high: "border-l-destructive",
    normal: "border-l-primary",
    low: "border-l-muted-foreground",
  };

  return (
    <Card
      className={cn(
        "transition-colors hover:bg-muted/50 border-l-4",
        priorityColors[notification.priority],
        !notification.is_read && "bg-muted/30"
      )}
    >
      <CardContent>
        <div className="flex items-start justify-between gap-4">
          <button
            onClick={onClick}
            className="flex-1 text-left focus:outline-none"
          >
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">
                {notificationTypeLabels[notification.type] || "Notification"}
              </p>
              <p
                className={cn(
                  "text-sm",
                  !notification.is_read && "font-semibold"
                )}
              >
                {notification.title}
              </p>
              <p className="text-sm text-muted-foreground">
                {notification.message}
              </p>
              <p className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(notification.created_at), {
                  addSuffix: true,
                })}
              </p>
            </div>
          </button>

          <div className="flex gap-1 shrink-0">
            {!notification.is_read && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={(e) => {
                  e.stopPropagation();
                  onMarkRead(notification.id);
                }}
                title="Mark as read"
              >
                <Check className="h-4 w-4" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={(e) => {
                e.stopPropagation();
                onDismiss(notification.id);
              }}
              title="Dismiss"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
});

export function NotificationsPage() {
  const router = useRouter();
  const [readFilter, setReadFilter] = useState("all");

  const { currentPage, pageSize, setPage, setPageSize } = usePagination({
    initialPageSize: 20,
  });

  const queryFilters = useMemo((): NotificationFilters => {
    const filters: NotificationFilters = {
      is_dismissed: false,
    };

    if (readFilter === "unread") {
      filters.is_read = false;
    } else if (readFilter === "read") {
      filters.is_read = true;
    }

    return filters;
  }, [readFilter]);

  const { data: paginatedData, isLoading, isFetching } = useNotifications(
    queryFilters,
    currentPage,
    pageSize
  );
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();
  const dismiss = useDismissNotification();

  const notifications = paginatedData?.data ?? [];

  const handleFilterChange = useCallback(
    (value: string) => {
      setReadFilter(value);
      setPage(1);
    },
    [setPage]
  );

  const handleNotificationClick = (notification: NotificationListItem) => {
    if (!notification.is_read) {
      markRead.mutate(notification.id);
    }
    if (notification.action_url) {
      router.push(notification.action_url);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Notifications"
        description="View all your notifications"
      >
        <Button
          variant="outline"
          onClick={() => markAllRead.mutate()}
          disabled={markAllRead.isPending}
        >
          <CheckCheck className="mr-2 h-4 w-4" />
          Mark all as read
        </Button>
      </PageHeader>

      <ListFilters
        filters={[
          {
            value: readFilter,
            onChange: handleFilterChange,
            options: filterOptions,
            className: "w-full sm:w-48",
          },
        ]}
        isLoading={isFetching}
      />

      {isLoading ? (
        <LoadingSpinner />
      ) : (
        <FetchingIndicator isFetching={isFetching}>
          {notifications.length === 0 ? (
            <EmptyState
              icon={Bell}
              title="No notifications"
              description={
                readFilter === "unread"
                  ? "You're all caught up!"
                  : "No notifications to display"
              }
            />
          ) : (
            <div className="space-y-3">
              {notifications.map((notification) => (
                <NotificationCard
                  key={notification.id}
                  notification={notification}
                  onMarkRead={(id) => markRead.mutate(id)}
                  onDismiss={(id) => dismiss.mutate(id)}
                  onClick={() => handleNotificationClick(notification)}
                />
              ))}
            </div>
          )}
        </FetchingIndicator>
      )}

      {paginatedData && paginatedData.totalPages > 0 && (
        <Pagination
          currentPage={currentPage}
          totalPages={paginatedData.totalPages}
          totalItems={paginatedData.total}
          pageSize={pageSize}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
        />
      )}
    </div>
  );
}
