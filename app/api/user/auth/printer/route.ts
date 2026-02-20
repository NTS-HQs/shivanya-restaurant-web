// @ts-ignore
import { NextRequest } from "next/server";
import { WebSocketServer } from "ws";

let wss: WebSocketServer | null = null;
let clients: any[] = [];

export async function GET(req: NextRequest) {
  if (!wss) {
    wss = new WebSocketServer({ noServer: true });

    wss.on("connection", (ws) => {
      clients.push(ws);

      ws.on("close", () => {
        clients = clients.filter(c => c !== ws);
      });
    });

    console.log("🖨 Printer socket ready");
  }

  return new Response("WebSocket server running");
}

export function sendToPrinter(html: string) {
  clients.forEach(ws => {
    if (ws.readyState === 1)
      ws.send(JSON.stringify({ html }));
  });
}