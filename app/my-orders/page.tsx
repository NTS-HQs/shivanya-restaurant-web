"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "@/lib/stores/authStore";
import { getMyOrders } from "@/lib/actions/orders";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  ClipboardList,
  UtensilsCrossed,
  Package,
  Truck,
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
} from "lucide-react";

type Order = Awaited<ReturnType<typeof getMyOrders>>[number];

const STATUS_CONFIG: Record<
  string,
  { label: string; icon: React.ElementType; color: string; bg: string }
> = {
  PENDING: {
    label: "Pending",
    icon: Clock,
    color: "text-amber-700",
    bg: "bg-amber-50 border-amber-200",
  },
  ACCEPTED: {
    label: "Accepted",
    icon: CheckCircle2,
    color: "text-blue-700",
    bg: "bg-blue-50 border-blue-200",
  },
  DELIVERED: {
    label: "Delivered",
    icon: CheckCircle2,
    color: "text-green-700",
    bg: "bg-green-50 border-green-200",
  },
  REJECTED: {
    label: "Rejected",
    icon: XCircle,
    color: "text-red-700",
    bg: "bg-red-50 border-red-200",
  },
};

const TYPE_ICON: Record<string, React.ElementType> = {
  DINE_IN: UtensilsCrossed,
  TAKEAWAY: Package,
  DELIVERY: Truck,
};

const TYPE_LABEL: Record<string, string> = {
  DINE_IN: "Dine-In",
  TAKEAWAY: "Takeaway",
  DELIVERY: "Delivery",
};

export default function MyOrdersPage() {
  const { isAuthenticated, user } = useAuthStore();
  const [orders, setOrders] = useState<Order[]>([]);
  const [fetched, setFetched] = useState(false);

  useEffect(() => {
    if (!isAuthenticated || !user?.phone) return;
    getMyOrders(user.phone).then((data) => {
      setOrders(data);
      setFetched(true);
    });
  }, [isAuthenticated, user?.phone]);

  if (isAuthenticated && !fetched) {
    return (
      <div className="min-h-screen bg-[#F8F9FD] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen bg-[#F8F9FD] flex items-center justify-center px-6 font-sans">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 bg-orange-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <ClipboardList className="w-10 h-10 text-orange-400" />
          </div>
          <h1 className="text-2xl font-black text-slate-900 mb-2">
            Sign in to view orders
          </h1>
          <p className="text-slate-400 font-medium mb-6">
            Log in to track your orders and view your history.
          </p>
          <Link href="/login">
            <Button className="bg-orange-600 hover:bg-orange-700 text-white px-8 py-6 rounded-2xl font-bold shadow-lg shadow-orange-200">
              Login
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FD] font-sans pb-16">
      <div className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-slate-100/50">
        <div className="max-w-2xl mx-auto px-6 py-5 flex items-center gap-4">
          <Link href="/menu">
            <Button
              variant="ghost"
              size="icon"
              className="hover:bg-white hover:shadow-sm rounded-xl text-slate-500"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div className="flex-1">
            <h1 className="text-xl font-black text-slate-900 tracking-tight">
              My Orders
            </h1>
            <p className="text-xs font-medium text-slate-400">
              {user.name?.replace(/^User \d{4}$/, "User") || "Your"}&apos;s
              order history
            </p>
          </div>
          <span className="text-xs font-bold bg-orange-100 text-orange-700 px-3 py-1 rounded-full">
            {orders.length} {orders.length === 1 ? "order" : "orders"}
          </span>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        {orders.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <ClipboardList className="w-10 h-10 text-slate-300" />
            </div>
            <h2 className="text-lg font-bold text-slate-500 mb-1">
              No orders yet
            </h2>
            <p className="text-slate-400 text-sm mb-6">
              Your order history will appear here.
            </p>
            <Link href="/menu">
              <Button className="bg-orange-600 hover:bg-orange-700 text-white rounded-2xl px-6 font-bold">
                Browse Menu
              </Button>
            </Link>
          </div>
        ) : (
          orders.map((order) => {
            const statusCfg =
              STATUS_CONFIG[order.status] || STATUS_CONFIG.PENDING;
            const StatusIcon = statusCfg.icon;
            const TypeIcon = TYPE_ICON[order.type] || Package;
            return (
              <div
                key={order.id}
                className="bg-white rounded-[1.75rem] p-5 shadow-sm border border-slate-100/50"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-0.5">
                      Order
                    </p>
                    <p className="font-black text-slate-900 text-base leading-tight">
                      #{order.orderIdString}
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      {new Date(order.createdAt).toLocaleString("en-IN", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span
                      className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full border ${statusCfg.bg} ${statusCfg.color}`}
                    >
                      <StatusIcon className="w-3 h-3" />
                      {statusCfg.label}
                    </span>
                    <span className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 bg-slate-50 px-3 py-1 rounded-full border border-slate-200">
                      <TypeIcon className="w-3 h-3" />
                      {TYPE_LABEL[order.type] || order.type}
                    </span>
                  </div>
                </div>
                <div className="border-t border-slate-100 pt-3 space-y-1.5">
                  {order.items.map((item) => (
                    <div
                      key={item.id}
                      className="flex justify-between items-center text-sm"
                    >
                      <span className="text-slate-700 font-medium">
                        {item.name}{" "}
                        <span className="text-slate-400 font-normal">
                          x{item.quantity}
                        </span>
                      </span>
                      <span className="font-bold text-slate-800">
                        Rs.{item.price * item.quantity}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="border-t border-dashed border-slate-200 mt-3 pt-3 flex justify-between items-center">
                  <span className="text-sm font-bold text-slate-500">
                    Total
                  </span>
                  <span className="text-lg font-black text-orange-600">
                    Rs.{order.totalAmount}
                  </span>
                </div>
                {order.rejectionReason && (
                  <div className="mt-3 bg-red-50 border border-red-200 rounded-xl px-4 py-2">
                    <p className="text-xs font-bold text-red-600">
                      Reason: {order.rejectionReason}
                    </p>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
