import WebSocket from "ws";

export type PrintPayload = {
  type: "ORDER_PRINT";
  restaurantProfile?: {
    name: string;
    gstNumber?: string | null;
    address?: string | null;
    contact?: string | null;
  } | null;
  order: {
    id: string;
    orderIdString: string;
    customerName: string;
    customerMobile: string;
    tableNumber?: string | null;
    address?: string | null;
    pickupTime?: string | null;
    type: string;
    totalAmount: number;
    items: { name: string; quantity: number; price: number }[];
    createdAt: string;
  };
};

/**
 * Sends a print payload to the restaurant PC bridge.
 * The WebSocket client is managed by server.js in global.printerWsClient.
 * Returns true if sent, false if bridge is not connected.
 */
export function sendToPrinter(payload: PrintPayload): boolean {
  const client = (global as any).printerWsClient as WebSocket | null;

  if (!client || client.readyState !== WebSocket.OPEN) {
    console.warn("⚠️  sendToPrinter: No printer bridge connected");
    return false;
  }

  try {
    client.send(JSON.stringify(payload));
    console.log(`🖨️  Print job sent: Order #${payload.order.orderIdString}`);
    return true;
  } catch (err) {
    console.error("🖨️  Failed to send print job:", err);
    return false;
  }
}

/**
 * Returns current printer bridge connection status.
 */
export function isPrinterConnected(): boolean {
  const client = (global as any).printerWsClient as WebSocket | null;
  return !!client && client.readyState === WebSocket.OPEN;
}
