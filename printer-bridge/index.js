/**
 * Shivanya Restaurant — Printer Bridge  v2.0
 * ─────────────────────────────────────────────────────────────────────────────
 * Run this on the restaurant PC (the machine with the thermal printer).
 * - First run: interactive setup wizard (Railway URL, secret, COM port)
 * - Auto-detects thermal printer USB COM port via vendor ID / description scan
 * - Config saved as shivanya-config.json beside the exe (or in CWD for node)
 * - Reconnects automatically on disconnect
 *
 * Build .exe:  npm run build   →  dist/ShivanyaPrinterBridge.exe
 * Run direct:  node index.js
 */

/* eslint-disable @typescript-eslint/no-require-imports */
const path = require("path");
const fs = require("fs");
const readline = require("readline");
const { execSync } = require("child_process");

// ── Config file location ─────────────────────────────────────────────────────
// When packaged as .exe (process.pkg exists), store config beside the executable.
// When running with `node`, store in the current working directory.
// NOTE: Split filename strings so pkg's static analyser doesn't bundle them.
const CFG_NAME = "shivanya-" + "config.json";
const ENV_NAME = "." + "env";
const CONFIG_FILE = process.pkg
    ? path.join(path.dirname(process.execPath), CFG_NAME)
    : path.join(__dirname, CFG_NAME);

// Legacy .env support (still works if present)
const ENV_FILE = process.pkg
    ? path.join(path.dirname(process.execPath), ENV_NAME)
    : path.join(__dirname, ENV_NAME);
if (fs.existsSync(ENV_FILE)) require("dotenv").config({ path: ENV_FILE });

// ── Banner ───────────────────────────────────────────────────────────────────
function banner() {
    console.log("=========================================");
    console.log("   Shivanya Restaurant — Printer Bridge  ");
    console.log("   v2.0  (Auto-Detect Edition)           ");
    console.log("=========================================\n");
}

// ── Auto COM port detection ──────────────────────────────────────────────────
// USB Vendor IDs of common thermal printer chipsets (hex, lowercase)
const THERMAL_VENDOR_IDS = [
    "04b8", // Epson
    "0519", // Star Micronics
    "1504", // Bixolon
    "1d90", // Citizen
    "0483", // STMicroelectronics USB-Serial (many generic printers)
    "6868", // Rugtek / RP326
    "0dd4", // Custom / Nippon
    "0fe6", // ICS Advent
    "1a86", // QinHeng CH340 — very common cheap USB-Serial chip
    "067b", // Prolific PL2303 — widely cloned
    "0403", // FTDI FT232R
];

const THERMAL_KEYWORDS = [
    "thermal", "receipt", "pos ", "printer",
    "epson", "star ", "bixolon", "citizen",
    "rugtek", "rp3", "tm-t", "tm-u",
];

// ── Pure-JS COM port detection (no native serialport module) ─────────────────
function detectPrinterPort() {
    try {
        const out = execSync(
            'wmic path Win32_PnPEntity where "Caption like \'%(COM%)%\'" get Caption,DeviceID /format:csv',
            { timeout: 5000 }
        ).toString();
        for (const line of out.split(/\r?\n/).slice(1).filter(Boolean)) {
            const parts = line.split(",");
            const caption = (parts[1] || "").trim().toLowerCase();
            const deviceId = (parts[2] || "").trim().toLowerCase();
            const match = caption.match(/\((com\d+)\)/i);
            if (!match) continue;
            if (THERMAL_KEYWORDS.some((k) => caption.includes(k)) ||
                THERMAL_VENDOR_IDS.some((v) => deviceId.includes(v))) {
                return caption.match(/\((COM\d+)\)/i)[1];
            }
        }
    } catch { /* wmic unavailable */ }
    return null;
}

function listAllPorts() {
    try {
        const out = execSync(
            'wmic path Win32_PnPEntity where "Caption like \'%(COM%)%\'" get Caption /format:csv',
            { timeout: 5000 }
        ).toString();
        return out.split(/\r?\n/).slice(1).filter(Boolean).map((line) => {
            const caption = line.split(",").slice(1).join(",").trim();
            const match = caption.match(/\((COM\d+)\)/i);
            return match ? { path: match[1], manufacturer: caption } : null;
        }).filter(Boolean);
    } catch { return []; }
}

// ── Windows installed printer detection (wmic) ────────────────────────────────
function listWindowsPrinters() {
    try {
        const out = execSync("wmic printer get name,portname /value", { timeout: 5000 }).toString();
        const printers = [];
        let cur = {};
        for (const line of out.split(/\r?\n/)) {
            const eq = line.indexOf("=");
            if (eq === -1) { if (cur.name) { printers.push(cur); cur = {}; } continue; }
            const key = line.slice(0, eq).trim().toLowerCase();
            const val = line.slice(eq + 1).trim();
            if (key === "name") cur.name = val;
            else if (key === "portname") cur.portName = val;
        }
        if (cur.name) printers.push(cur);
        return printers;
    } catch { return []; }
}

function detectWindowsPrinterName() {
    const printers = listWindowsPrinters();
    for (const p of printers) {
        const n = (p.name || "").toLowerCase();
        if (THERMAL_KEYWORDS.some((k) => n.includes(k.trim()))) return p.name;
    }
    for (const p of printers) {
        if ((p.portName || "").toUpperCase().startsWith("USB")) return p.name;
    }
    return printers.length === 1 ? printers[0].name : null;
}

async function detectUsbPrinterInterface() {
    if (process.platform !== "win32") return null;
    const name = detectWindowsPrinterName();
    if (name) return `printer:${name}`;
    return null;
}

// ── Config helpers ───────────────────────────────────────────────────────────
function readConfig() {
    if (fs.existsSync(CONFIG_FILE)) {
        try { return JSON.parse(fs.readFileSync(CONFIG_FILE, "utf8")); } catch { return {}; }
    }
    // Fall back to env vars (legacy .env / Railway-injected environment)
    return {
        RAILWAY_URL: process.env.RAILWAY_URL,
        PRINTER_BRIDGE_SECRET: process.env.PRINTER_BRIDGE_SECRET,
        PRINTER_INTERFACE: process.env.PRINTER_INTERFACE,
    };
}

function saveConfig(cfg) {
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(cfg, null, 2), "utf8");
    console.log(`\nConfig saved → ${CONFIG_FILE}\n`);
}

// ── First-run interactive setup wizard ──────────────────────────────────────
async function prompt(rl, q) {
    return new Promise((resolve) => rl.question(q, resolve));
}

async function runSetupWizard() {
    console.log("[SETUP] First-run setup — answers are saved; this only happens once.\n");

    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

    // Auto-detect: wmic gives the exact Windows printer name
    process.stdout.write("Scanning for thermal printer...");
    const winPrinterName = detectWindowsPrinterName();
    const winPrinters = listWindowsPrinters();
    const detectedCom = !winPrinterName ? await detectPrinterPort() : null;
    const allPorts = await listAllPorts();

    if (winPrinterName) {
        console.log(` found: "${winPrinterName}"`);
        if (winPrinters.length > 1) {
            console.log(`\n   All installed printers:`);
            winPrinters.forEach((p) => console.log(`     "${p.name}"  port: ${p.portName}`));
        }
    } else if (detectedCom) {
        console.log(` found: ${detectedCom} (serial)`);
    } else if (allPorts.length) {
        console.log(` not found.\n\n   Available COM ports:`);
        allPorts.forEach((p) => console.log(`     ${p.path.padEnd(8)} ${p.manufacturer || "(unknown)"}`));
    } else {
        console.log(" nothing found - connect printer and re-run.");
    }

    const defaultPort = winPrinterName
        ? `printer:${winPrinterName}`
        : detectedCom || "printer:POS80 Printer";

    const railwayUrl = (await prompt(rl, "\n1. Railway WebSocket URL  (wss://your-app.up.railway.app): ")).trim();
    const secret = (await prompt(rl, "2. PRINTER_BRIDGE_SECRET  (from Railway env vars): ")).trim();
    console.log(`   Formats: printer:NAME (USB, recommended)  or  //./COM3 (serial)`);
    const portRaw = (await prompt(rl, `3. Printer interface       [${defaultPort}]: `)).trim();

    rl.close();

    const printerInterface = portRaw === "" ? defaultPort : portRaw;

    if (!railwayUrl.startsWith("wss://") && !railwayUrl.startsWith("ws://")) {
        console.error("\n Railway URL must start with wss:// — please re-run and try again.");
        process.exit(1);
    }
    if (!secret) { console.error("\nSecret cannot be empty."); process.exit(1); }

    const cfg = { RAILWAY_URL: railwayUrl, PRINTER_BRIDGE_SECRET: secret, PRINTER_INTERFACE: printerInterface };
    saveConfig(cfg);
    return cfg;
}

const os = require("os");

// ── Receipt formatting helpers ───────────────────────────────────────────────
function formatReceiptDate(dateStr) {
    return new Date(dateStr).toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
        timeZone: "Asia/Kolkata",
    });
}

function formatReceiptPhone(phone) {
    if (!phone) return "";
    const cleaned = phone.replace(/\D/g, "");
    if (cleaned.length === 10) return `+91 ${cleaned.slice(0, 5)} ${cleaned.slice(5)}`;
    if (cleaned.length === 12 && cleaned.startsWith("91")) {
        const d = cleaned.slice(2);
        return `+91 ${d.slice(0, 5)} ${d.slice(5)}`;
    }
    return phone;
}

// ── Raw bytes → Windows print spooler via Winspool.drv RAW API ───────────────
// Uses Win32 OpenPrinter/WritePrinter P/Invoke — the correct way to send
// ESC/POS raw bytes to a thermal printer through the Windows spooler.
// System.Printing AddJob creates XPS jobs which mangle raw bytes — that's
// why printing appeared to succeed but nothing came out.
async function printRawToWindowsPrinter(printerName, buffer) {
    const tmpDir = os.tmpdir();
    const stamp = Date.now();
    const prnFile = path.join(tmpDir, `shivanya_${stamp}.prn`);
    const psFile = path.join(tmpDir, `shivanya_${stamp}.ps1`);

    fs.writeFileSync(prnFile, buffer);

    const safeName = printerName.replace(/'/g, "''");
    const psScript = `
$ErrorActionPreference = 'Stop'

$sig = @'
[System.Runtime.InteropServices.DllImport("winspool.drv", CharSet=System.Runtime.InteropServices.CharSet.Unicode, SetLastError=true)]
public static extern bool OpenPrinter(string pPrinterName, out System.IntPtr phPrinter, System.IntPtr pDefault);

[System.Runtime.InteropServices.DllImport("winspool.drv", CharSet=System.Runtime.InteropServices.CharSet.Unicode, SetLastError=true)]
public static extern bool StartDocPrinter(System.IntPtr hPrinter, int level, ref DOCINFOA pDocInfo);

[System.Runtime.InteropServices.DllImport("winspool.drv", SetLastError=true)]
public static extern bool StartPagePrinter(System.IntPtr hPrinter);

[System.Runtime.InteropServices.DllImport("winspool.drv", SetLastError=true)]
public static extern bool WritePrinter(System.IntPtr hPrinter, byte[] pBytes, int dwCount, out int dwWritten);

[System.Runtime.InteropServices.DllImport("winspool.drv", SetLastError=true)]
public static extern bool EndPagePrinter(System.IntPtr hPrinter);

[System.Runtime.InteropServices.DllImport("winspool.drv", SetLastError=true)]
public static extern bool EndDocPrinter(System.IntPtr hPrinter);

[System.Runtime.InteropServices.DllImport("winspool.drv", SetLastError=true)]
public static extern bool ClosePrinter(System.IntPtr hPrinter);

[System.Runtime.InteropServices.StructLayout(System.Runtime.InteropServices.LayoutKind.Sequential, CharSet=System.Runtime.InteropServices.CharSet.Unicode)]
public struct DOCINFOA {
    [System.Runtime.InteropServices.MarshalAs(System.Runtime.InteropServices.UnmanagedType.LPWStr)] public string pDocName;
    [System.Runtime.InteropServices.MarshalAs(System.Runtime.InteropServices.UnmanagedType.LPWStr)] public string pOutputFile;
    [System.Runtime.InteropServices.MarshalAs(System.Runtime.InteropServices.UnmanagedType.LPWStr)] public string pDatatype;
}
'@

Add-Type -MemberDefinition $sig -Name RawPrinter -Namespace Win32

$bytes = [System.IO.File]::ReadAllBytes('${prnFile.replace(/\\/g, "\\\\")}')
Write-Host "Read $($bytes.Length) bytes"

$hPrinter = [System.IntPtr]::Zero
$ok = [Win32.RawPrinter]::OpenPrinter('${safeName}', [ref]$hPrinter, [System.IntPtr]::Zero)
if (-not $ok -or $hPrinter -eq [System.IntPtr]::Zero) {
    throw "OpenPrinter failed for '${safeName}' (err $([System.Runtime.InteropServices.Marshal]::GetLastWin32Error()))"
}
Write-Host "OpenPrinter OK handle=$hPrinter"

$di = New-Object Win32.RawPrinter+DOCINFOA
$di.pDocName    = 'Shivanya Receipt'
$di.pOutputFile = $null
$di.pDatatype   = 'RAW'

$jobId = [Win32.RawPrinter]::StartDocPrinter($hPrinter, 1, [ref]$di)
if (-not $jobId) {
    [Win32.RawPrinter]::ClosePrinter($hPrinter)
    throw "StartDocPrinter failed (err $([System.Runtime.InteropServices.Marshal]::GetLastWin32Error()))"
}
Write-Host "StartDocPrinter OK"

[Win32.RawPrinter]::StartPagePrinter($hPrinter) | Out-Null

$written = 0
$ok = [Win32.RawPrinter]::WritePrinter($hPrinter, $bytes, $bytes.Length, [ref]$written)
Write-Host "WritePrinter ok=$ok written=$written / $($bytes.Length)"

[Win32.RawPrinter]::EndPagePrinter($hPrinter) | Out-Null
[Win32.RawPrinter]::EndDocPrinter($hPrinter) | Out-Null
[Win32.RawPrinter]::ClosePrinter($hPrinter) | Out-Null

if ($ok -and $written -eq $bytes.Length) {
    Write-Host "PRINT_OK written=$written"
} else {
    throw "WritePrinter wrote $written of $($bytes.Length) bytes"
}
`;

    fs.writeFileSync(psFile, psScript, "utf8");

    try {
        const out = execSync(
            `powershell -NoProfile -NonInteractive -ExecutionPolicy Bypass -File "${psFile}"`,
            { timeout: 20000 }
        ).toString();
        if (!out.includes("PRINT_OK")) {
            throw new Error(`Print job sent but no confirmation: ${out.trim()}`);
        }
    } catch (e) {
        const stderr = e.stderr ? e.stderr.toString().trim() : "";
        const stdout = e.stdout ? e.stdout.toString().trim() : "";
        throw new Error(stderr || stdout || e.message);
    } finally {
        // Cleanup temp files
        try { fs.unlinkSync(prnFile); } catch { /* ignore */ }
        try { fs.unlinkSync(psFile); } catch { /* ignore */ }
    }
}

// ── Printer helpers ──────────────────────────────────────────────────────────
const { ThermalPrinter, PrinterTypes, CharacterSet } = require("node-thermal-printer");

function createPrinter(iface) {
    // When using printer:NAME we route bytes via PowerShell, never via execute().
    // Passing printer:NAME to ThermalPrinter constructor throws "No driver set!"
    // because it tries to load the native 'printer' npm module.
    // Use a harmless TCP interface so node-thermal-printer stays in pure-JS mode
    // and we can still call getBuffer() to extract the ESC/POS bytes.
    const safeIface = iface.startsWith("printer:") ? "tcp://127.0.0.1:19999" : iface;
    return new ThermalPrinter({
        type: PrinterTypes.EPSON,
        interface: safeIface,
        characterSet: CharacterSet.PC437_USA,
        removeSpecialCharacters: false,
        lineCharacter: "-",
        options: { timeout: 5000 },
    });
}

async function testPrinter(iface) {
    const isPrinterName = iface.startsWith("printer:");
    const isUsb = isPrinterName || iface.toUpperCase().includes("USB");

    if (isUsb) {
        let ok;
        if (isPrinterName) {
            const name = iface.slice("printer:".length);
            ok = listWindowsPrinters().some((p) => p.name === name);
        } else {
            // Direct USB device path (legacy) — treat as available
            ok = true;
        }
        if (ok) {
            console.log(`[PRINTER] Ready: ${iface}`);
        } else {
            console.log(`[PRINTER] Cannot open ${iface}.`);
            console.log(`   Make sure the printer is on and connected.`);
            console.log(`   Delete shivanya-config.json and re-run to change the interface.`);
            console.log(`   Print jobs will still be received and retried.`);
        }
        return ok;
    }

    // Serial / COM port — standard check works fine
    const printer = createPrinter(iface);
    const ok = await printer.isPrinterConnected();
    if (ok) {
        console.log(`Thermal printer ready on ${iface}`);
    } else {
        console.log(`Printer unreachable on ${iface}`);
        console.log(`   → Check Device Manager → Ports (COM & LPT) for the correct port.`);
        console.log(`   → If it's a USB printer (not serial), try //./USB001 instead.`);
        console.log(`   → Delete shivanya-config.json and re-run to change the interface.\n`);
    }
    return ok;
}

async function printReceipt(order, iface, profile) {
    const printer = createPrinter(iface);

    // ====== CONFIG ======
    const LINE_WIDTH = 48; // 80mm printer
    const NAME_WIDTH = 26;
    const QTY_WIDTH = 6;
    const AMT_WIDTH = 16;

    const repeat = (char, count) => char.repeat(count);

    const line = () => printer.println(repeat("-", LINE_WIDTH));

    const formatCurrency = (amount) =>
        `Rs.${Number(amount || 0).toLocaleString("en-IN", {
            maximumFractionDigits: 0
        })}`;

    const padRight = (text, width) =>
        text.length >= width
            ? text.slice(0, width)
            : text + " ".repeat(width - text.length);

    const padLeft = (text, width) =>
        text.length >= width
            ? text.slice(0, width)
            : " ".repeat(width - text.length) + text;

    try {
        // =========================================================
        // HEADER
        // =========================================================
        printer.alignCenter();
        printer.bold(true);
        printer.println(profile?.name?.toUpperCase() || "SHIVANYA RESTAURANT");
        printer.bold(false);

        if (profile?.gstNumber)
            printer.println(`GSTIN: ${profile.gstNumber}`);

        if (profile?.address)
            printer.println(profile.address);

        if (profile?.contact)
            printer.println(`Tel: ${formatReceiptPhone(profile.contact)}`);

        line();

        // =========================================================
        // ORDER DETAILS
        // =========================================================
        printer.alignLeft();

        const orderId = order?.orderIdString
            ? order.orderIdString.slice(-6).toUpperCase()
            : "------";

        printer.println(`Customer : ${order?.customerName || "-"}`);
        printer.println(`Phone    : ${formatReceiptPhone(order?.customerMobile || "")}`);
        printer.println(`Order #  : ${orderId}`);
        printer.println(`Date     : ${formatReceiptDate(order?.createdAt)}`);

        const typeMap = {
            DINE_IN: "Dine-In",
            TAKEAWAY: "Takeaway",
            DELIVERY: "Delivery"
        };

        printer.println(`Type     : ${typeMap[order?.type] || order?.type || "-"}`);

        if (order?.tableNumber)
            printer.println(`Table    : ${order.tableNumber}`);

        if (order?.pickupTime)
            printer.println(`Pickup   : ${order.pickupTime}`);

        if (order?.type === "DELIVERY" && order?.address) {
            line();
            printer.bold(true);
            printer.println("DELIVERY ADDRESS");
            printer.bold(false);
            printer.println(order.address);
        }

        line();

        // =========================================================
        // ITEMS HEADER
        // =========================================================
        printer.bold(true);
        printer.println(
            padRight("ITEM", NAME_WIDTH) +
            padLeft("QTY", QTY_WIDTH) +
            padLeft("AMT", AMT_WIDTH)
        );
        printer.bold(false);

        line();

        // =========================================================
        // ITEMS LIST
        // =========================================================
        if (!order?.items || order.items.length === 0) {
            printer.println("No items found");
        } else {
            for (const item of order.items) {
                const name = item?.name || "Item";
                const qty = String(item?.quantity || 0);
                const amount = formatCurrency(
                    (item?.price || 0) * (item?.quantity || 0)
                );

                // Handle long names (wrap properly)
                if (name.length > NAME_WIDTH) {
                    printer.println(name.slice(0, NAME_WIDTH));
                    printer.println(
                        padRight("", NAME_WIDTH) +
                        padLeft(qty, QTY_WIDTH) +
                        padLeft(amount, AMT_WIDTH)
                    );
                } else {
                    printer.println(
                        padRight(name, NAME_WIDTH) +
                        padLeft(qty, QTY_WIDTH) +
                        padLeft(amount, AMT_WIDTH)
                    );
                }
            }
        }

        line();

        // =========================================================
        // TOTAL SECTION
        // =========================================================
        if (order?.subTotal) {
            printer.println(
                padRight("SUBTOTAL", NAME_WIDTH + QTY_WIDTH) +
                padLeft(formatCurrency(order.subTotal), AMT_WIDTH)
            );
        }

        if (order?.taxAmount) {
            printer.println(
                padRight("GST", NAME_WIDTH + QTY_WIDTH) +
                padLeft(formatCurrency(order.taxAmount), AMT_WIDTH)
            );
        }

        printer.bold(true);
        printer.println(
            padRight("TOTAL", NAME_WIDTH + QTY_WIDTH) +
            padLeft(formatCurrency(order?.totalAmount), AMT_WIDTH)
        );
        printer.bold(false);

        line();

        // =========================================================
        // PAYMENT INFO
        // =========================================================
        if (order?.paymentMethod) {
            printer.println(`Payment  : ${order.paymentMethod}`);
            line();
        }

        // =========================================================
        // FOOTER
        // =========================================================
        printer.alignCenter();
        printer.println("Thank you for dining with us!");
        printer.println("Visit Again");
        printer.println("-- Powered by Shivanya POS --");

        printer.newLine();
        printer.cut();

        // =========================================================
        // EXECUTE PRINT
        // =========================================================
        if (iface && iface.startsWith("printer:")) {
            const printerName = iface.slice("printer:".length);
            await printRawToWindowsPrinter(
                printerName,
                printer.getBuffer()
            );
        } else {
            await printer.execute();
        }

        console.log(`Printed Order #${orderId}`);
        return { success: true };

    } catch (err) {
        const msg = err?.stack || err?.message || String(err);
        console.error(`Print failed for #${order?.orderIdString}`, msg);
        return { success: false, error: msg };
    }
}

// ── WebSocket bridge ─────────────────────────────────────────────────────────
const WebSocket = require("ws");
const RECONNECT_DELAY_MS = 5000;
let ws = null;
let pingInterval = null;

function connect(cfg) {
    console.log(`\n[WS] Connecting to ${cfg.RAILWAY_URL}/printer-ws ...`);
    ws = new WebSocket(`${cfg.RAILWAY_URL}/printer-ws?secret=${cfg.PRINTER_BRIDGE_SECRET}`);

    ws.on("open", () => {
        console.log(" Connected to Shivanya server");
        console.log(" Waiting for print jobs...\n");
        pingInterval = setInterval(() => {
            if (ws?.readyState === WebSocket.OPEN) ws.send(JSON.stringify({ type: "PING" }));
        }, 30000);
    });

    ws.on("message", async (data) => {
        try {
            const payload = JSON.parse(data.toString());
            if (payload.type === "PONG") return;
            if (payload.type === "ORDER_PRINT") {
                console.log(`\n  Print job: Order #${payload.order.orderIdString}`);
                const result = await printReceipt(payload.order, cfg.PRINTER_INTERFACE, payload.restaurantProfile || null);
                if (ws?.readyState === WebSocket.OPEN) {
                    ws.send(JSON.stringify({
                        type: "PRINT_STATUS",
                        orderId: payload.order.orderIdString,
                        status: result.success ? "SUCCESS" : "FAILED",
                        error: result.error || null,
                    }));
                }
            }
        } catch (err) {
            console.error("Failed to process message:", err.message);
        }
    });

    ws.on("close", (code) => {
        clearInterval(pingInterval);
        pingInterval = null;
        console.log(`[WS] Disconnected (code: ${code}). Reconnecting in ${RECONNECT_DELAY_MS / 1000}s...`);
        setTimeout(() => connect(cfg), RECONNECT_DELAY_MS);
    });

    ws.on("error", (err) => console.error(` WebSocket error: ${err.message}`));
}

// ── Entry point ──────────────────────────────────────────────────────────────
(async () => {
    banner();

    let cfg = readConfig();

    // First-run: config missing → run wizard
    if (!cfg.RAILWAY_URL || !cfg.PRINTER_BRIDGE_SECRET) {
        cfg = await runSetupWizard();
    } else {
        // Existing config: try to improve the COM port if it's still the generic default
        if (!cfg.PRINTER_INTERFACE || cfg.PRINTER_INTERFACE === "//./COM3" || cfg.PRINTER_INTERFACE === "//./USB001") {
            process.stdout.write("Auto-detecting printer interface...");
            const winName = detectWindowsPrinterName();
            const best = winName ? `printer:${winName}` : await detectPrinterPort();
            if (best && best !== cfg.PRINTER_INTERFACE) {
                cfg.PRINTER_INTERFACE = best;
                console.log(` detected: ${cfg.PRINTER_INTERFACE}`);
                saveConfig(cfg);
            } else {
                console.log(` using: ${cfg.PRINTER_INTERFACE}`);
            }
        }

        console.log(`   Config loaded from ${CONFIG_FILE}`);
        console.log(`   Server : ${cfg.RAILWAY_URL}`);
        console.log(`   Port   : ${cfg.PRINTER_INTERFACE}\n`);
    }

    await testPrinter(cfg.PRINTER_INTERFACE);
    connect(cfg);
})();
