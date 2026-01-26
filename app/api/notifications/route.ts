import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { NotificationRepository } from "@/lib/database/repositories/notifications";

/**
 * GET /api/notifications
 *
 * Get paginated list of notifications for the current user
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "20", 10);
    const isRead = searchParams.get("is_read");
    const isDismissed = searchParams.get("is_dismissed");

    const notificationRepo = new NotificationRepository(supabase);
    const result = await notificationRepo.getListItems(
      {
        user_id: user.id,
        is_read: isRead !== null ? isRead === "true" : undefined,
        is_dismissed: isDismissed !== null ? isDismissed === "true" : undefined,
      },
      page,
      limit
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
