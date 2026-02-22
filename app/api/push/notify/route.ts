import { NextRequest, NextResponse } from "next/server";
import { sendPushNotification } from "@/lib/pushNotification";
import { requireAdmin } from "@/lib/authGuard";

export async function POST(req: NextRequest) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const { title, body, url, userType = "admin" } = await req.json();

    if (!title || !body) {
      return NextResponse.json(
        { error: "title and body are required" },
        { status: 400 },
      );
    }

    await sendPushNotification({ title, body, url }, userType);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Push notify error:", err);
    return NextResponse.json(
      { error: "Failed to send push notification" },
      { status: 500 },
    );
  }
}
