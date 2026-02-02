import { getDashboardStats, getPendingOrders } from "@/lib/actions/orders";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card className="p-4 bg-gradient-to-br from-green-500 to-emerald-600 text-white border-0">
          <div className="flex items-center justify-between mb-2">
            <TrendingUp className="w-8 h-8 opacity-80" />
            <span className="text-3xl font-bold">₹{stats.todaySales}</span>
          </div>
          <p className="text-green-100">Today&apos;s Sales</p>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-blue-500 to-indigo-600 text-white border-0">
          <div className="flex items-center justify-between mb-2">
            <ShoppingBag className="w-8 h-8 opacity-80" />
            <span className="text-3xl font-bold">{stats.totalOrders}</span>
          </div>
          <p className="text-blue-100">Total Orders</p>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-orange-500 to-red-600 text-white border-0">
          <div className="flex items-center justify-between mb-2">
            <Clock className="w-8 h-8 opacity-80" />
            <span className="text-3xl font-bold">{stats.pendingOrders}</span>
          </div>
          <p className="text-orange-100">Pending Orders</p>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-purple-500 to-pink-600 text-white border-0">
          <div className="flex items-center justify-between mb-2">
            <CheckCircle2 className="w-8 h-8 opacity-80" />
            <span className="text-3xl font-bold">{stats.deliveredOrders}</span>
          </div>
          <p className="text-purple-100">Delivered</p>
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
                className="p-4 border-l-4 border-l-orange-500"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="font-mono text-sm text-muted-foreground">
                    #{order.orderIdString.slice(-6)}
                  </span>
                  <Badge className="flex items-center gap-1">
                    {orderTypeIcon(order.type)}
                    {order.type.replace("_", " ")}
                  </Badge>
                </div>

                <h3 className="font-bold">{order.customerName}</h3>
                <p className="text-sm text-muted-foreground">
                  {order.customerMobile}
                </p>

                {order.tableNumber && (
                  <p className="text-sm mt-1">Table: {order.tableNumber}</p>
                )}

                <div className="mt-3 pt-3 border-t">
                  <p className="text-sm text-muted-foreground mb-1">
                    {order.items.length} items
                  </p>
                  <p className="font-bold text-lg text-orange-600">
                    ₹{order.totalAmount}
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
