"use server";

import { prisma } from "@/lib/db";
import { OrderType, OrderStatus } from "@prisma/client";
import { sendToPrinter } from "@/lib/printerSocket";

type CartItem = {
  id: string;
  name: string;
  price: number | null;
  quantity: number;
};

type PlaceOrderInput = {
  customerName?: string;
  customerMobile?: string;
  type: "DINE_IN" | "TAKEAWAY" | "DELIVERY";
  tableNumber?: string;
  address?: string;
  pickupTime?: string;
  items: CartItem[];
};

export async function placeOrder(input: PlaceOrderInput) {
  const totalAmount = input.items.reduce(
    (sum, item) => sum + (item.price || 0) * item.quantity,
    0
  );

  const profile = await prisma.restaurantProfile.findFirst();
  const initialStatus = profile?.autoAccept
    ? OrderStatus.DELIVERED
    : OrderStatus.PENDING;

  // Extract base menu item IDs
  const menuItemIds = input.items.map((i) => {
    const parts = i.id.split("-");
    const lastPart = parts[parts.length - 1];
    const isVariant = !/^[0-9a-fA-F]{12}$/.test(lastPart) && parts.length > 5;

    return isVariant ? parts.slice(0, -1).join("-") : i.id;
  });

  const uniqueMenuItemIds = [...new Set(menuItemIds)];

  const existingItems = await prisma.menuItem.findMany({
    where: { id: { in: uniqueMenuItemIds } },
    select: { id: true },
  });

  if (existingItems.length !== uniqueMenuItemIds.length) {
    return {
      success: false,
      error:
        "Some items in your cart are no longer available. Please refresh the menu and try again.",
    };
  }

  // Create order
  const order = await prisma.order.create({
    data: {
      customerName: input.customerName || "Counter Customer",
      customerMobile: input.customerMobile || "NA",
      type: input.type as OrderType,
      status: initialStatus,
      tableNumber: input.tableNumber,
      address: input.address,
      pickupTime: input.pickupTime,
      totalAmount,
      items: {
        create: input.items.map((item) => {
          const parts = item.id.split("-");
          const lastPart = parts[parts.length - 1];
          const isVariant =
            !/^[0-9a-fA-F]{12}$/.test(lastPart) && parts.length > 5;

          const menuItemId = isVariant
            ? parts.slice(0, -1).join("-")
            : item.id;

          return {
            menuItemId,
            name: item.name,
            price: item.price || 0,
            quantity: item.quantity,
          };
        }),
      },
    },
    include: { items: true },
  });

  /* ---------------- PRINT TRIGGER ---------------- */

  const printText = `
ORDER #${order.orderIdString}
------------------------------
${order.items.map(i => `${i.name} x ${i.quantity}`).join("\n")}
------------------------------
TOTAL: ₹${order.totalAmount}
`;

  console.log("🖨 Sending to printer:", order.orderIdString);

  sendToPrinter(printText);

  /* ------------------------------------------------ */

  return { success: true, orderId: order.orderIdString, order };
}

/* ---------------- FETCH ORDER ---------------- */

export async function getOrderByIdString(orderIdString: string) {
  return prisma.order.findUnique({
    where: { orderIdString },
    include: { items: true },
  });
}

/* ---------------- SELLER ACTIONS ---------------- */

export async function getPendingOrders() {
  return prisma.order.findMany({
    where: { status: OrderStatus.PENDING },
    include: { items: true },
    orderBy: { createdAt: "desc" },
  });
}

export async function getAllOrders() {
  return prisma.order.findMany({
    include: { items: true },
    orderBy: { createdAt: "desc" },
  });
}

export async function updateOrderStatus(
  orderId: string,
  status: "ACCEPTED" | "REJECTED" | "DELIVERED",
  rejectionReason?: string
) {
  return prisma.order.update({
    where: { id: orderId },
    data: {
      status: status as OrderStatus,
      rejectionReason:
        status === "REJECTED" && rejectionReason ? rejectionReason : undefined,
    },
  });
}

/* ---------------- DASHBOARD STATS ---------------- */

export async function getDashboardStats() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [totalOrders, pendingOrders, deliveredOrders, todaySales] =
    await Promise.all([
      prisma.order.count(),
      prisma.order.count({ where: { status: OrderStatus.PENDING } }),
      prisma.order.count({ where: { status: OrderStatus.DELIVERED } }),
      prisma.order.aggregate({
        where: {
          createdAt: { gte: today },
          status: OrderStatus.DELIVERED,
        },
        _sum: { totalAmount: true },
      }),
    ]);

  return {
    totalOrders,
    pendingOrders,
    deliveredOrders,
    todaySales: todaySales._sum.totalAmount || 0,
  };
}