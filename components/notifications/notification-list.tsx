"use client";

import { useRouter } from "next/navigation";
import { Check, CheckCheck, X, Bell, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  useUnreadNotifications,
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
  useDismissNotification,
} from "@/lib/hooks/use-notifications";
import { useCurrentUser } from "@/lib/hooks";
import { cn } from "@/lib/utils";
import type { NotificationListItem, NotificationType } from "@/lib/database/types";
import { formatDistanceToNow } from "date-fns";

const typeIcons: Partial<Record<NotificationType, string>> = {
  request_submitted: "New Request",
  quote_sent: "Quote Ready",
  quote_accepted: "Quote Accepted",
  quote_declined: "Quote Declined",
  quote_revision_requested: "Revision Needed",
  pickup_scheduled: "Pickup Scheduled",
  pickup_complete: "Pickup Complete",
  job_complete: "Job Complete",
  invoice_overdue: "Invoice Overdue",
  document_uploaded: "New Document",
};

interface NotificationItemProps {
  notification: NotificationListItem;
  onMarkRead: (id: string) => void;
  onDismiss: (id: string) => void;
  onClick: () => void;
}

function NotificationItem({
  notification,
  onMarkRead,
  onDismiss,
  onClick,
}: NotificationItemProps) {
  const priorityColors = {
    high: "border-l-destructive",
    normal: "border-l-primary",
    low: "border-l-muted-foreground",
  };

  return (
    <div
      className={cn(
        "group relative flex flex-col gap-1 border-l-2 bg-background p-3 transition-colors hover:bg-muted/50",
        priorityColors[notification.priority],
        !notification.is_read && "bg-muted/30"
      )}
    >
      <button
        onClick={onClick}
        className="flex-1 text-left focus:outline-none"
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-muted-foreground">
              {typeIcons[notification.type] || "Notification"}
            </p>
            <p
              className={cn(
                "text-sm font-medium truncate",
                !notification.is_read && "font-semibold"
              )}
            >
              {notification.title}
            </p>
          </div>
        </div>
        <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
          {notification.message}
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          {formatDistanceToNow(new Date(notification.created_at), {
            addSuffix: true,
          })}
        </p>
      </button>
      <div className="absolute right-2 top-2 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
        {!notification.is_read && (
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={(e) => {
              e.stopPropagation();
              onMarkRead(notification.id);
            }}
            title="Mark as read"
          >
            <Check className="h-3 w-3" />
          </Button>
        )}
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          onClick={(e) => {
            e.stopPropagation();
            onDismiss(notification.id);
          }}
          title="Dismiss"
        >
          <X className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}

export function NotificationList() {
  const router = useRouter();
  const { data: currentUser } = useCurrentUser();
  const { data, isLoading } = useUnreadNotifications(10);
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();
  const dismiss = useDismissNotification();

  const notifications = data?.data ?? [];
  const hasNotifications = notifications.length > 0;
  const notificationsPath = currentUser?.role === "admin" ? "/admin/notifications" : "/notifications";

  const handleNotificationClick = (notification: NotificationListItem) => {
    // Mark as read
    if (!notification.is_read) {
      markRead.mutate(notification.id);
    }

    // Navigate to action URL if present
    if (notification.action_url) {
      router.push(notification.action_url);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      <div className="flex items-center justify-between border-b px-3 py-2">
        <h4 className="font-semibold text-sm">Notifications</h4>
        {hasNotifications && (
          <Button
            variant="ghost"
            size="sm"
            className="h-auto px-2 py-1 text-xs"
            onClick={() => markAllRead.mutate()}
            disabled={markAllRead.isPending}
          >
            <CheckCheck className="mr-1 h-3 w-3" />
            Mark all read
          </Button>
        )}
      </div>

      {hasNotifications ? (
        <ScrollArea className="max-h-80">
          <div className="divide-y">
            {notifications.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onMarkRead={(id) => markRead.mutate(id)}
                onDismiss={(id) => dismiss.mutate(id)}
                onClick={() => handleNotificationClick(notification)}
              />
            ))}
          </div>
        </ScrollArea>
      ) : (
        <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
          <Bell className="h-8 w-8 mb-2 opacity-50" />
          <p className="text-sm">No new notifications</p>
        </div>
      )}

      <div className="border-t px-3 py-2">
        <Button
          variant="ghost"
          size="sm"
          className="w-full text-xs"
          onClick={() => router.push(notificationsPath)}
        >
          View all notifications
        </Button>
      </div>
    </div>
  );
}
