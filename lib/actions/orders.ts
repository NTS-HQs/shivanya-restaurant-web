"use server";

import { prisma } from "@/lib/db";
import { OrderType, OrderStatus } from "@prisma/client";

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

  // Verify all items exist in the database to prevent foreign key violations
  // Extract base item IDs from composite IDs (format: "itemId-variantName")
  // Note: itemId is a UUID which already contains dashes
  const menuItemIds = input.items.map((i) => {
    // Handle both old format (just itemId) and new format (itemId-variantName)
    // For UUID-variantName format, we need to remove the last segment (variant name)
    const parts = i.id.split('-');
    // If last part is a variant name (not a valid UUID segment), remove it
    // UUID segments are exactly 8-4-4-4-12 hex characters
    const lastPart = parts[parts.length - 1];
    const isLastPartVariant = !/^[0-9a-fA-F]{12}$/.test(lastPart) && parts.length > 5;
    
    if (isLastPartVariant) {
      // Remove the last part (variant name)
      return parts.slice(0, -1).join('-');
    }
    // Old format or no variant
    return i.id;
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
          // Extract base item ID from composite ID (UUID-variantName format)
          const parts = item.id.split('-');
          const lastPart = parts[parts.length - 1];
          const isLastPartVariant = !/^[0-9a-fA-F]{12}$/.test(lastPart) && parts.length > 5;
          
          const menuItemId = isLastPartVariant 
            ? parts.slice(0, -1).join('-') 
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

  return { success: true, orderId: order.orderIdString, order };
}

export async function getOrderByIdString(orderIdString: string) {
  const order = await prisma.order.findUnique({
    where: { orderIdString },
    include: { items: true },
  });
  return order;
}

// Seller actions
export async function getPendingOrders() {
  const orders = await prisma.order.findMany({
    where: { status: OrderStatus.PENDING },
    include: { items: true },
    orderBy: { createdAt: "desc" },
  });
  return orders;
}

export async function getAllOrders() {
  const orders = await prisma.order.findMany({
    include: { items: true },
    orderBy: { createdAt: "desc" },
  });
  return orders;
}

export async function updateOrderStatus(
  orderId: string,
  status: "ACCEPTED" | "REJECTED" | "DELIVERED",
  rejectionReason?: string
) {
  const order = await prisma.order.update({
    where: { id: orderId },
    data: {
      status: status as OrderStatus,
      rejectionReason:
        status === "REJECTED" && rejectionReason ? rejectionReason : undefined,
    },
  });
  return order;
}

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
