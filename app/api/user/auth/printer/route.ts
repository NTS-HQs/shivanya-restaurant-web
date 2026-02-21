// This endpoint is now superseded by /api/print
// The WebSocket server is managed by server.js on path /printer-ws
// Kept for backwards compatibility — returns current printer bridge status.

import { NextResponse } from "next/server";
import { isPrinterConnected } from "@/lib/printerSocket";

export async function GET() {
  return NextResponse.json({
    connected: isPrinterConnected(),
    status: isPrinterConnected()
      ? "Printer bridge connected ✅"
      : "Printer bridge NOT connected ❌",
    note: "WebSocket server runs via server.js on /printer-ws path",
  });
}
