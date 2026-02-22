import { NextRequest, NextResponse } from "next/server";
import {
  sendToPrinter,
  isPrinterConnected,
  PrintPayload,
} from "@/lib/printerSocket";
import { requireAdmin } from "@/lib/authGuard";

export async function POST(req: NextRequest) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const { order } = await req.json();

    if (!order) {
      return NextResponse.json(
        { error: "Order data required" },
        { status: 400 },
      );
    }

    const payload: PrintPayload = {
      type: "ORDER_PRINT",
      order,
    };

    const sent = sendToPrinter(payload);

    if (!sent) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Printer bridge not connected. Is printer-bridge running on the restaurant PC?",
        },
        { status: 503 },
      );
    }

    return NextResponse.json({
      success: true,
      message: "Print job sent to bridge",
    });
  } catch (err) {
    console.error("Print route error:", err);
    return NextResponse.json(
      { error: "Failed to dispatch print job" },
      { status: 500 },
    );
  }
}

export async function GET() {
  return NextResponse.json({
    connected: isPrinterConnected(),
    status: isPrinterConnected()
      ? "Printer bridge connected ✅"
      : "Printer bridge NOT connected ❌",
  });
}
