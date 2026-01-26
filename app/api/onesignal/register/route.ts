import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { NotificationRepository } from "@/lib/database/repositories/notifications";
import { onesignalRegisterSchema } from "@/lib/validation/schemas";

/**
 * POST /api/onesignal/register
 *
 * Register a OneSignal player ID for push notifications
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rawBody = await request.json();
    const parseResult = onesignalRegisterSchema.safeParse(rawBody);

    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parseResult.error.flatten() },
        { status: 400 }
      );
    }

    const notificationRepo = new NotificationRepository(supabase);
    await notificationRepo.registerPlayerId(user.id, parseResult.data.playerId);

    return NextResponse.json({
      success: true,
      message: "OneSignal player ID registered",
    });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
