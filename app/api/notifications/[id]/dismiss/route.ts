import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { NotificationRepository } from "@/lib/database/repositories/notifications";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/notifications/[id]/dismiss
 *
 * Dismiss a specific notification
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const notificationRepo = new NotificationRepository(supabase);

    // Verify the notification belongs to the user
    const notification = await notificationRepo.findById(id);
    if (!notification) {
      return NextResponse.json(
        { error: "Notification not found" },
        { status: 404 }
      );
    }

    if (notification.user_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const updated = await notificationRepo.dismiss(id);

    return NextResponse.json({
      success: true,
      notification: updated,
    });
  } catch (error) {
    console.error("Error dismissing notification:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
