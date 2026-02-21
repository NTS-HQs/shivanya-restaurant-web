export const dynamic = "force-dynamic";

import { getDashboardStats, getPendingOrders } from "@/lib/actions/orders";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { NotificationPrompt } from "../notification-prompt";
import {
  TrendingUp,
  ShoppingBag,
  Clock,
  CheckCircle2,
  Package,
  Truck,
  UtensilsCrossed,
} from "lucide-react";

export default async function DashboardPage() {
  const [stats, pendingOrders] = await Promise.all([
    getDashboardStats(),
    getPendingOrders(),
  ]);

  const orderTypeIcon = (type: string) => {
    switch (type) {
      case "DINE_IN":
        return <UtensilsCrossed className="w-4 h-4" />;
      case "TAKEAWAY":
        return <Package className="w-4 h-4" />;
      case "DELIVERY":
        return <Truck className="w-4 h-4" />;
      default:
        return null;
    }
  };

  return (
    <div className="p-6">
      <NotificationPrompt />
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card className="p-6 border border-slate-200 shadow-sm bg-white">
          <div className="flex flex-col gap-1">
            <span className="text-sm font-medium text-slate-500">
              Today's Sales
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
              Total Orders
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
              Delivered
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
