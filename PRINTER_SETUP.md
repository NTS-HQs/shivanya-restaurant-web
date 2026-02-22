# Shivanya Restaurant — Printer Setup Guide (Admin PC)

## What This Does

The printer bridge runs on the **restaurant PC** and automatically prints bills
whenever an order is placed — no button-clicking needed.

```
Customer Order → Railway (Next.js) → WebSocket → Printer Bridge (.exe) → USB Printer
```

---

## Option A — Use the Pre-Built EXE (Recommended for restaurant staff)

> No Node.js, no terminal, no coding required.

### Step 1 — Build the EXE (developer, done once)

On your development machine:

```powershell
cd printer-bridge
.\build.ps1
```

This produces **`printer-bridge\dist\ShivanyaPrinterBridge.exe`** (~90 MB self-contained executable).

### Step 2 — Deploy to restaurant PC

1. Copy `ShivanyaPrinterBridge.exe` to the restaurant PC (USB drive, WhatsApp, anything).
2. Place it anywhere — e.g. `C:\Shivanya\ShivanyaPrinterBridge.exe`.
3. Connect the thermal printer via USB.

### Step 3 — First-run Setup Wizard

Double-click the `.exe`. It will print a wizard in the console:

```
=========================================
   Shivanya Restaurant — Printer Bridge
   v2.0  (Auto-Detect Edition)
=========================================

🔍  Scanning for thermal printer... found → COM3

1. Railway WebSocket URL  (wss://your-app.up.railway.app): wss://shivanya.up.railway.app
2. PRINTER_BRIDGE_SECRET  (from Railway env vars): my_secret_here
3. Printer COM port        [//./COM3]:          ← press Enter to accept auto-detected
```

Answers are saved to `shivanya-config.json` in the same folder as the exe.
**The wizard only runs once** — subsequent launches connect automatically.

### Step 4 — Auto-start on Windows Boot

1. Press `Win + R`, type `shell:startup`, press Enter.
2. Create a shortcut to `ShivanyaPrinterBridge.exe` in that folder.

Done — printer bridge starts automatically whenever Windows boots.

---

## Option B — Node.js Developer Setup

## Option B — Node.js Developer Setup

For developers who want to run from source.

### Requirements

- Windows PC at restaurant
- Thermal printer (USB) — e.g. Rugtek RP326 / Epson TM-T82 / any ESC/POS 80mm
- Node.js 18+ installed: https://nodejs.org
- Railway app deployed and running

### 1 — Install & configure

```bash
cd printer-bridge
npm install
```

Create a `.env` file (or let the wizard create `shivanya-config.json`):

```env
RAILWAY_URL=wss://your-actual-app.up.railway.app
PRINTER_BRIDGE_SECRET=same_secret_as_in_railway_env_vars
PRINTER_INTERFACE=//./COM3   # COM port of the printer
```

> **COM port**: Open Device Manager → Ports (COM & LPT) → note `USB Serial Port (COMx)`.

### 2 — Start

```bash
npm start
```

Expected output:

```
=========================================
   Shivanya Restaurant — Printer Bridge
   v2.0  (Auto-Detect Edition)
=========================================

✅  Config loaded from shivanya-config.json
🔍  Thermal printer ready on //./COM3
✅  Connected to Shivanya server
🖨️   Waiting for print jobs...
```

### 3 — Auto-start with PM2

```bash
npm install -g pm2
pm2 start index.js --name shivanya-printer
pm2 startup
pm2 save
```

To check status anytime:

```bash
pm2 status
pm2 logs shivanya-printer
```

---

## Railway Environment Variables

In Railway dashboard → your service → **Variables**, ensure these are set:

| Key                            | Value                                             |
| ------------------------------ | ------------------------------------------------- |
| `PRINTER_BRIDGE_SECRET`        | A strong random secret (same as in bridge config) |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | From your `.env`                                  |
| `VAPID_PRIVATE_KEY`            | From your `.env`                                  |
| `VAPID_EMAIL`                  | `mailto:admin@shivanya.com`                       |
| `NEXT_PUBLIC_APP_URL`          | `https://your-app.up.railway.app`                 |
| `DATABASE_URL`                 | Your PostgreSQL URL                               |

---

## Verify Connection

Visit this URL in your browser (replace with your Railway domain):

```
https://your-app.up.railway.app/api/print
```

You should see:

```json
{ "connected": true, "status": "Printer bridge connected ✅" }
```

If `connected: false` — the bridge is not running on the restaurant PC.

---

## Test Print

In browser console on the admin page:

```js
fetch("/api/print", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    order: {
      id: "test",
      orderIdString: "TEST001",
      customerName: "Test Customer",
      customerMobile: "9999999999",
      tableNumber: "5",
      type: "DINE_IN",
      totalAmount: 350,
      items: [
        { name: "Paneer Butter Masala", quantity: 1, price: 200 },
        { name: "Roti x4", quantity: 4, price: 40 },
      ],
      createdAt: new Date().toISOString(),
    },
  }),
})
  .then((r) => r.json())
  .then(console.log);
```

---

## Troubleshooting

| Issue                            | Fix                                                                                      |
| -------------------------------- | ---------------------------------------------------------------------------------------- |
| Wizard doesn't find printer      | Check Device Manager → Ports (COM & LPT), then enter port manually in wizard             |
| `COM port not found` at startup  | Delete `shivanya-config.json` and re-run exe to re-run wizard with updated port          |
| `connected: false` on admin page | Bridge is not running — launch `ShivanyaPrinterBridge.exe` on the restaurant PC          |
| `PRINTER_BRIDGE_SECRET` mismatch | Ensure same secret in Railway env vars AND entered during wizard (delete config to redo) |
| Print garbled / wrong encoding   | Change `PrinterTypes.EPSON` to `PrinterTypes.STAR` in `printer-bridge/index.js`          |
| Bridge not reconnecting          | Restart the exe; add it to Windows Startup folder for auto-reconnect on boot             |
