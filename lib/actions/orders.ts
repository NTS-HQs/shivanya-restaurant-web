"use server";

import { prisma } from "@/lib/db";
import { OrderType, OrderStatus } from "@prisma/client";

type CartItem = {
  id: string;
  name: string;
  price: number;
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
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  const profile = await prisma.restaurantProfile.findFirst();
  const initialStatus = profile?.autoAccept
    ? OrderStatus.DELIVERED
    : OrderStatus.PENDING;

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
        create: input.items.map((item) => ({
          menuItemId: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
        })),
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
