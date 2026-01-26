import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { NotificationRepository } from "@/lib/database/repositories/notifications";
import { notificationPreferencesUpdateSchema } from "@/lib/validation/schemas";

/**
 * GET /api/notifications/preferences
 *
 * Get notification preferences for the current user
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
    const preferences = await notificationRepo.getPreferences(user.id);

    // Return default preferences if none exist
    if (!preferences) {
      return NextResponse.json({
        user_id: user.id,
        email_enabled: true,
        push_enabled: true,
        onesignal_player_id: null,
        onesignal_email_id: null,
        type_preferences: {},
      });
    }

    return NextResponse.json(preferences);
  } catch (error) {
    console.error("Error fetching notification preferences:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/notifications/preferences
 *
 * Update notification preferences for the current user
 */
export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rawBody = await request.json();
    const parseResult = notificationPreferencesUpdateSchema.safeParse(rawBody);

    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parseResult.error.flatten() },
        { status: 400 }
      );
    }

    const notificationRepo = new NotificationRepository(supabase);
    const updated = await notificationRepo.updatePreferences(user.id, parseResult.data);

    return NextResponse.json({
      success: true,
      preferences: updated,
    });
  } catch (error) {
    console.error("Error updating notification preferences:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
