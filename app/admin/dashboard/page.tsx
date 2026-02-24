export const dynamic = "force-dynamic";

import Link from "next/link";
import { getDashboardStats, getPendingOrders } from "@/lib/actions/orders";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { NotificationPrompt } from "../notification-prompt";
import {
  TrendingUp,
  ShoppingBag,
  Clock,
  CheckCircle2,
  CalendarDays,
  CalendarRange,
} from "lucide-react";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string }>;
}) {
  const { period: rawPeriod } = await searchParams;
  const period: "daily" | "monthly" =
    rawPeriod === "monthly" ? "monthly" : "daily";

  const [stats, pendingOrders] = await Promise.all([
    getDashboardStats(period),
    getPendingOrders(),
  ]);

  return (
    <div className="p-6">
      <NotificationPrompt />

      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold">Dashboard</h1>

        {/* Period filter */}
        <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-lg">
          <Link
            href="?period=daily"
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
              period === "daily"
                ? "bg-white shadow-sm text-slate-900"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            <CalendarDays className="w-4 h-4" />
            Today
          </Link>
          <Link
            href="?period=monthly"
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
              period === "monthly"
                ? "bg-white shadow-sm text-slate-900"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            <CalendarRange className="w-4 h-4" />
            This Month
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card className="p-6 border border-slate-200 shadow-sm bg-white">
          <div className="flex flex-col gap-1">
            <span className="text-sm font-medium text-slate-500">
              {period === "monthly" ? "Month's Sales" : "Today's Sales"}
            </span>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold text-slate-900 tracking-tight">
                ₹{stats.todaySales}
              </span>
              <div className="p-2 bg-green-50 rounded-lg">
                <TrendingUp className="w-4 h-4 text-green-600" />
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-6 border border-slate-200 shadow-sm bg-white">
          <div className="flex flex-col gap-1">
            <span className="text-sm font-medium text-slate-500">
              {period === "monthly" ? "Month's Orders" : "Today's Orders"}
            </span>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold text-slate-900 tracking-tight">
                {stats.totalOrders}
              </span>
              <div className="p-2 bg-blue-50 rounded-lg">
                <ShoppingBag className="w-4 h-4 text-blue-600" />
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-6 border border-slate-200 shadow-sm bg-white">
          <div className="flex flex-col gap-1">
            <span className="text-sm font-medium text-slate-500">Pending</span>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold text-slate-900 tracking-tight">
                {stats.pendingOrders}
              </span>
              <div className="p-2 bg-orange-50 rounded-lg">
                <Clock className="w-4 h-4 text-orange-600" />
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-6 border border-slate-200 shadow-sm bg-white">
          <div className="flex flex-col gap-1">
            <span className="text-sm font-medium text-slate-500">
              {period === "monthly" ? "Month's Delivered" : "Delivered Today"}
            </span>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold text-slate-900 tracking-tight">
                {stats.deliveredOrders}
              </span>
              <div className="p-2 bg-purple-50 rounded-lg">
                <CheckCircle2 className="w-4 h-4 text-purple-600" />
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Pending Orders */}
      <div>
        <h2 className="text-xl font-bold mb-4">Pending Orders</h2>
        {pendingOrders.length === 0 ? (
          <Card className="p-8 text-center text-muted-foreground">
            <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No pending orders</p>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {pendingOrders.map((order) => (
              <Card
                key={order.id}
                className="p-4 border border-slate-200 shadow-sm hover:shadow-md transition-all bg-white"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-medium text-slate-500 bg-slate-100 px-2 py-1 rounded">
                      #{order.orderIdString.slice(-4)}
                    </span>
                    <Badge
                      variant="outline"
                      className="font-normal text-slate-600 bg-white"
                    >
                      {order.type.replace("_", " ")}
                    </Badge>
                  </div>
                  <Badge className="bg-orange-50 text-orange-700 hover:bg-orange-100 border-orange-100">
                    Pending
                  </Badge>
                </div>

                <div className="mb-4">
                  <h3 className="font-semibold text-slate-900">
                    {order.customerName}
                  </h3>
                  <p className="text-sm text-slate-500">
                    {order.items.length} items • ₹{order.totalAmount}
                  </p>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
