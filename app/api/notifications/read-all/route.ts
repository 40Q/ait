import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { NotificationRepository } from "@/lib/database/repositories/notifications";

/**
 * POST /api/notifications/read-all
 *
 * Mark all notifications as read for the current user
 */
export async function POST() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const notificationRepo = new NotificationRepository(supabase);
    await notificationRepo.markAllAsRead(user.id);

    return NextResponse.json({
      success: true,
      message: "All notifications marked as read",
    });
  } catch (error) {
    console.error("Error marking all notifications as read:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
