"use client";

import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { NotificationList } from "./notification-list";
import {
  useUnreadNotificationCount,
  useRealtimeNotifications,
} from "@/lib/hooks/use-notifications";
import { cn } from "@/lib/utils";

export function NotificationBell() {
  const { data: unreadCount = 0 } = useUnreadNotificationCount();

  // Subscribe to real-time updates
  useRealtimeNotifications();

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span
              className={cn(
                "absolute -right-0.5 -top-0.5 flex items-center justify-center rounded-full bg-destructive text-destructive-foreground text-xs font-medium",
                unreadCount > 99 ? "h-5 w-6 px-1" : "h-5 w-5"
              )}
            >
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
          <span className="sr-only">
            {unreadCount > 0
              ? `${unreadCount} unread notifications`
              : "Notifications"}
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <NotificationList />
      </PopoverContent>
    </Popover>
  );
}
