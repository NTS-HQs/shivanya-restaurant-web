# Shivanya Restaurant — Printer Setup Guide (Admin PC)

## What This Does

The printer bridge is a small Node.js program that runs on the **restaurant PC**.  
It connects to the Railway server via WebSocket and **automatically prints bills** whenever a new order is placed — no button clicks needed.

```
Customer Order → Railway (Next.js) → WebSocket → Restaurant PC Bridge → USB Printer
```

---

## Requirements

- Windows PC at restaurant
- Thermal printer (USB) — e.g. Rugtek RP326 / Epson TM-T82 / any ESC/POS 80mm
- Node.js 18+ installed on PC: https://nodejs.org
- The Railway app deployed and running

---

## Step 1 — Find Your Printer COM Port

1. Connect the thermal printer via USB
2. Open **Device Manager** (`Win + X` → Device Manager)
3. Expand **Ports (COM & LPT)**
4. Note the port — e.g. `USB Serial Port (COM3)` → your interface is `//./COM3`

> If nothing appears, install the driver from the printer manufacturer's website.

---

## Step 2 — Set Up the Bridge

Open Terminal / PowerShell in the `printer-bridge` folder:

```bash
cd printer-bridge
npm install
copy .env.example .env
```

Edit `.env`:

```env
RAILWAY_URL=wss://your-actual-app.up.railway.app
PRINTER_BRIDGE_SECRET=same_secret_as_in_railway_env_vars
PRINTER_INTERFACE=//./COM3   # change to your COM port
```

---

## Step 3 — Railway Environment Variables

In Railway dashboard → your service → **Variables**, add:

| Key                            | Value                                             |
| ------------------------------ | ------------------------------------------------- |
| `PRINTER_BRIDGE_SECRET`        | A strong random secret (same as in bridge `.env`) |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | From your `.env`                                  |
| `VAPID_PRIVATE_KEY`            | From your `.env`                                  |
| `VAPID_EMAIL`                  | `mailto:admin@shivanya.com`                       |
| `NEXT_PUBLIC_APP_URL`          | `https://your-app.up.railway.app`                 |
| `DATABASE_URL`                 | Your PostgreSQL URL                               |

---

## Step 4 — Start the Bridge

```bash
cd printer-bridge
node index.js
```

You should see:

```
========================================
  Shivanya Printer Bridge v1.0
========================================

✅  Thermal printer found on //./COM3
🔌  Connecting to Railway: wss://your-app.up.railway.app/printer-ws
✅  Connected to Shivanya Railway server
🖨️   Waiting for print jobs...
```

---

## Step 5 — Auto-start on Windows Boot (Recommended)

Install PM2 to keep the bridge running even after a reboot:

```bash
npm install -g pm2

# Start the bridge as a managed process
pm2 start index.js --name shivanya-printer

# Auto-start on Windows boot
pm2 startup
pm2 save
```

To check status anytime:

```bash
pm2 status
pm2 logs shivanya-printer
```

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

| Issue                            | Fix                                                                |
| -------------------------------- | ------------------------------------------------------------------ |
| `COM port not found`             | Check Device Manager, change `PRINTER_INTERFACE` in `.env`         |
| `connected: false`               | Bridge is not running — start `node index.js` in `printer-bridge/` |
| `PRINTER_BRIDGE_SECRET` mismatch | Ensure same string in Railway env vars AND bridge `.env`           |
| Print garbled text               | Change `PrinterTypes.EPSON` to `PrinterTypes.STAR` in `index.js`   |
| Bridge not reconnecting          | Restart the bridge; PM2 handles this automatically                 |
