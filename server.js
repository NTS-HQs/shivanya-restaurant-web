// server.js — Custom Next.js server with WebSocket support for printer bridge
// This runs on Railway: HTTP + WS on the SAME port (Railway's exposed PORT)
// Printer bridge on restaurant PC connects via: wss://yourapp.up.railway.app/printer-ws?secret=xxx
/* eslint-disable @typescript-eslint/no-require-imports */

const { createServer } = require("http");
const { parse } = require("url");
const next = require("next");
const { WebSocketServer } = require("ws");

const dev = process.env.NODE_ENV !== "production";
const app = next({ dev });
const handle = app.getRequestHandler();

// ── Global Printer Client  ───────────────────────────────────────────────────
// Shared between this server and lib/printerSocket.ts (same Node.js process)
global.printerWsClient = null;

app.prepare().then(() => {
    const httpServer = createServer((req, res) => {
        const parsedUrl = parse(req.url, true);
        handle(req, res, parsedUrl);
    });

    // ── WebSocket Server (noServer = upgrade is handled manually) ─────────────
    const wss = new WebSocketServer({ noServer: true });

    wss.on("connection", (ws) => {
        global.printerWsClient = ws;
        console.log("🖨️  Printer bridge connected from restaurant PC");

        ws.on("close", () => {
            global.printerWsClient = null;
            console.log("🔌  Printer bridge disconnected");
        });

        ws.on("error", (err) => {
            console.error("🖨️  Printer WS error:", err.message);
            global.printerWsClient = null;
        });

        ws.on("message", (data) => {
            // Bridge can send status pings — log them
            try {
                const msg = JSON.parse(data.toString());
                if (msg.type === "PING") {
                    ws.send(JSON.stringify({ type: "PONG" }));
                } else if (msg.type === "PRINT_STATUS") {
                    console.log(
                        `🖨️  Print status [${msg.orderId}]: ${msg.status}`,
                        msg.error || ""
                    );
                }
            } catch { }
        });
    });

    // ── HTTP → WebSocket Upgrade Handler ─────────────────────────────────────
    httpServer.on("upgrade", (req, socket, head) => {
        const { pathname, query } = parse(req.url, true);

        if (pathname === "/printer-ws") {
            const secret = query.secret;
            const expected = process.env.PRINTER_BRIDGE_SECRET;

            // Timing-safe comparison to prevent secret inference via response time
            const secretMatches =
                expected &&
                secret &&
                secret.length === expected.length &&
                require("crypto").timingSafeEqual(
                    Buffer.from(String(secret)),
                    Buffer.from(String(expected))
                );

            if (!secretMatches) {
                console.warn("❌  Unauthorized printer bridge attempt rejected");
                socket.write("HTTP/1.1 401 Unauthorized\r\n\r\n");
                socket.destroy();
                return;
            }

            wss.handleUpgrade(req, socket, head, (ws) => {
                wss.emit("connection", ws, req);
            });
        } else {
            socket.destroy();
        }
    });

    const PORT = parseInt(process.env.PORT || "3000", 10);

    httpServer.listen(PORT, () => {
        console.log(`✅  Shivanya app ready on http://localhost:${PORT}`);
        console.log(`🖨️  Printer WebSocket endpoint: ws://localhost:${PORT}/printer-ws`);
    });
});
