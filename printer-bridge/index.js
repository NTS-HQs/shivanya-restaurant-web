/**
 * Shivanya Restaurant — Printer Bridge
 * ─────────────────────────────────────────────────────────────────────────────
 * Run this on the restaurant PC (the machine with the thermal printer).
 * It connects to the Railway app via WebSocket and prints orders automatically.
 *
 * Setup: see PRINTER_SETUP.md in the main project
 */

require("dotenv").config();
const WebSocket = require("ws");
const { ThermalPrinter, PrinterTypes, CharacterSet } = require("node-thermal-printer");

// ── Config ─────────────────────────────────────────────────────────────────
const RAILWAY_URL = process.env.RAILWAY_URL;        // e.g. wss://your-app.up.railway.app
const SECRET = process.env.PRINTER_BRIDGE_SECRET;
const PRINTER_INTERFACE = process.env.PRINTER_INTERFACE || "//./COM3";
const RECONNECT_DELAY_MS = 5000;

if (!RAILWAY_URL || !SECRET) {
    console.error("❌  Missing RAILWAY_URL or PRINTER_BRIDGE_SECRET in .env");
    process.exit(1);
}

// ── Printer Test ───────────────────────────────────────────────────────────
async function testPrinter() {
    const printer = createPrinter();
    const isConnected = await printer.isPrinterConnected();
    if (isConnected) {
        console.log(`✅  Thermal printer found on ${PRINTER_INTERFACE}`);
    } else {
        console.warn(
            `⚠️  Cannot reach printer on ${PRINTER_INTERFACE}. Check USB connection and COM port in .env`
        );
    }
    return isConnected;
}

function createPrinter() {
    return new ThermalPrinter({
        type: PrinterTypes.EPSON, // Compatible with most 80mm thermal printers
        interface: PRINTER_INTERFACE,
        characterSet: CharacterSet.PC437_USA,
        removeSpecialCharacters: false,
        lineCharacter: "-",
        options: { timeout: 5000 },
    });
}

// ── Print Receipt ──────────────────────────────────────────────────────────
async function printReceipt(order) {
    const printer = createPrinter();

    try {
        // ── Header ──
        printer.alignCenter();
        printer.bold(true);
        printer.setTextSize(1, 1);
        printer.println("SHIVANYA RESTAURANT");
        printer.bold(false);
        printer.setTextNormal();
        printer.println("www.shivanya.com");
        printer.drawLine();

        // ── Order Info ──
        printer.alignLeft();
        const orderId = order.orderIdString.slice(-8).toUpperCase();
        printer.println(`Order  : #${orderId}`);
        printer.println(`Date   : ${new Date(order.createdAt).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}`);

        const typeMap = { DINE_IN: "Dine In", TAKEAWAY: "Takeaway", DELIVERY: "Delivery" };
        printer.println(`Type   : ${typeMap[order.type] || order.type}`);

        if (order.tableNumber) printer.println(`Table  : ${order.tableNumber}`);
        if (order.address) printer.println(`Addr   : ${order.address}`);
        if (order.pickupTime) printer.println(`Pickup : ${order.pickupTime}`);

        printer.println(`Name   : ${order.customerName}`);
        printer.println(`Phone  : ${order.customerMobile}`);
        printer.drawLine();

        // ── Items ──
        printer.bold(true);
        printer.println("ITEMS:");
        printer.bold(false);

        for (const item of order.items) {
            const total = `Rs.${(item.price * item.quantity).toFixed(2)}`;
            const desc = `${item.name} x${item.quantity}`;
            printer.tableCustom([
                { text: desc, align: "LEFT", width: 0.72 },
                { text: total, align: "RIGHT", width: 0.28 },
            ]);
        }

        printer.drawLine();

        // ── Total ──
        printer.bold(true);
        printer.tableCustom([
            { text: "TOTAL", align: "LEFT", width: 0.5 },
            { text: `Rs.${order.totalAmount.toFixed(2)}`, align: "RIGHT", width: 0.5 },
        ]);
        printer.bold(false);

        printer.drawLine();

        // ── Footer ──
        printer.alignCenter();
        printer.println("Thank you for dining with us!");
        printer.println("Visit again :)");
        printer.newLine();
        printer.cut();

        await printer.execute();

        console.log(`✅  Printed Order #${orderId}`);
        return { success: true };
    } catch (err) {
        console.error(`❌  Print failed for Order #${order.orderIdString}:`, err.message);
        return { success: false, error: err.message };
    }
}

// ── WebSocket Bridge ───────────────────────────────────────────────────────
let ws = null;
let pingInterval = null;

function connect() {
    const url = `${RAILWAY_URL}/printer-ws?secret=${SECRET}`;
    console.log(`🔌  Connecting to Railway: ${RAILWAY_URL}/printer-ws`);

    ws = new WebSocket(url);

    ws.on("open", () => {
        console.log("✅  Connected to Shivanya Railway server");
        console.log("🖨️   Waiting for print jobs...\n");

        // Keep-alive ping every 30s
        pingInterval = setInterval(() => {
            if (ws && ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({ type: "PING" }));
            }
        }, 30000);
    });

    ws.on("message", async (data) => {
        try {
            const payload = JSON.parse(data.toString());

            if (payload.type === "PONG") {
                // Heartbeat acknowledged — silent
                return;
            }

            if (payload.type === "ORDER_PRINT") {
                console.log(`\n📄  New print job received: Order #${payload.order.orderIdString}`);
                const result = await printReceipt(payload.order);

                // Report status back to server
                if (ws && ws.readyState === WebSocket.OPEN) {
                    ws.send(
                        JSON.stringify({
                            type: "PRINT_STATUS",
                            orderId: payload.order.orderIdString,
                            status: result.success ? "SUCCESS" : "FAILED",
                            error: result.error || null,
                        })
                    );
                }
            }
        } catch (err) {
            console.error("Failed to process message:", err.message);
        }
    });

    ws.on("close", (code, reason) => {
        clearInterval(pingInterval);
        pingInterval = null;
        console.log(`🔌  Disconnected (code: ${code}). Reconnecting in ${RECONNECT_DELAY_MS / 1000}s...`);
        setTimeout(connect, RECONNECT_DELAY_MS);
    });

    ws.on("error", (err) => {
        console.error(`❌  WebSocket error: ${err.message}`);
        // close event will fire after error → auto-reconnect handles it
    });
}

// ── Entry Point ────────────────────────────────────────────────────────────
(async () => {
    console.log("========================================");
    console.log("  Shivanya Printer Bridge v1.0");
    console.log("========================================\n");

    await testPrinter();
    connect();
})();
