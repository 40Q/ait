import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { NotificationRepository } from "@/lib/database/repositories/notifications";

/**
 * GET /api/notifications/unread-count
 *
 * Get the count of unread notifications for the current user
 */
export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const notificationRepo = new NotificationRepository(supabase);
    const count = await notificationRepo.getUnreadCount(user.id);

    return NextResponse.json({ count });
  } catch (error) {
    console.error("Error fetching unread count:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
