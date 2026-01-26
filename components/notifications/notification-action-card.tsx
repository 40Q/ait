"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { type LucideIcon, ChevronRight } from "lucide-react";

type CardColor = "orange" | "blue" | "green" | "red";

interface NotificationActionCardProps {
  title: string;
  count: number;
  description?: string;
  icon: LucideIcon;
  href: string;
  color: CardColor;
  className?: string;
}

const colorStyles: Record<CardColor, { bg: string; text: string; icon: string; border: string }> = {
  orange: {
    bg: "bg-orange-50 dark:bg-orange-950/30",
    text: "text-orange-700 dark:text-orange-300",
    icon: "bg-orange-100 text-orange-600 dark:bg-orange-900/50 dark:text-orange-400",
    border: "border-orange-200 dark:border-orange-800",
  },
  blue: {
    bg: "bg-blue-50 dark:bg-blue-950/30",
    text: "text-blue-700 dark:text-blue-300",
    icon: "bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-400",
    border: "border-blue-200 dark:border-blue-800",
  },
  green: {
    bg: "bg-green-50 dark:bg-green-950/30",
    text: "text-green-700 dark:text-green-300",
    icon: "bg-green-100 text-green-600 dark:bg-green-900/50 dark:text-green-400",
    border: "border-green-200 dark:border-green-800",
  },
  red: {
    bg: "bg-red-50 dark:bg-red-950/30",
    text: "text-red-700 dark:text-red-300",
    icon: "bg-red-100 text-red-600 dark:bg-red-900/50 dark:text-red-400",
    border: "border-red-200 dark:border-red-800",
  },
};

export function NotificationActionCard({
  title,
  count,
  description,
  icon: Icon,
  href,
  color,
  className,
}: NotificationActionCardProps) {
  const styles = colorStyles[color];

  if (count === 0) {
    return null;
  }

  return (
    <Link href={href} className="block">
      <Card
        className={cn(
          "transition-all hover:shadow-md",
          styles.bg,
          styles.border,
          className
        )}
      >
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className={cn("rounded-full p-2", styles.icon)}>
              <Icon className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className={cn("text-2xl font-bold", styles.text)}>
                  {count}
                </span>
                <span className={cn("text-sm font-medium", styles.text)}>
                  {title}
                </span>
              </div>
              {description && (
                <p className="text-xs text-muted-foreground mt-0.5 truncate">
                  {description}
                </p>
              )}
            </div>
            <ChevronRight className={cn("h-5 w-5 flex-shrink-0", styles.text)} />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
