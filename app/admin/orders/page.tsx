"use client";

import { useEffect, useState, useTransition, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { getAllOrders, updateOrderStatus } from "@/lib/actions/orders";
import {
  Clock,
  CheckCircle2,
  XCircle,
  Package,
  Truck,
  UtensilsCrossed,
  RefreshCw,
  Loader2,
  Printer,
} from "lucide-react";
import PrintBillModal from "@/components/PrintBillModal";

type Order = Awaited<ReturnType<typeof getAllOrders>>[0];

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filter, setFilter] = useState<string>("ALL");
  const [isPending, startTransition] = useTransition();
  const [rejectingOrderId, setRejectingOrderId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [printOrder, setPrintOrder] = useState<Order | null>(null);
  const [lastOrderCount, setLastOrderCount] = useState<number>(0);
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);
  const [audioEnabled, setAudioEnabled] = useState(false);
  const prevOrdersRef = useRef<Order[]>([]);

  // Initialize and resume audio context on user interaction
  useEffect(() => {
    const initAudio = async () => {
      if (!audioContext) {
        const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
        setAudioContext(ctx);
        setAudioEnabled(true);
        console.log('Audio context created');
      } else if (audioContext.state === 'suspended') {
        await audioContext.resume();
        setAudioEnabled(true);
        console.log('Audio context resumed');
      }
    };
    
    // Initialize on any user interaction
    const events = ['click', 'touchstart', 'keydown'];
    events.forEach(event => {
      window.addEventListener(event, initAudio, { once: true });
    });
    
    return () => {
      events.forEach(event => {
        window.removeEventListener(event, initAudio);
      });
    };
  }, [audioContext]);

  // Play buzzer sound
  const playBuzzer = async () => {
    if (!audioContext) {
      console.log('Audio context not ready');
      return;
    }
    
    // Ensure context is running
    if (audioContext.state === 'suspended') {
      await audioContext.resume();
    }
    
    try {
      const now = audioContext.currentTime;
      
      // First ding - higher pitch
      const osc1 = audioContext.createOscillator();
      const gain1 = audioContext.createGain();
      osc1.connect(gain1);
      gain1.connect(audioContext.destination);
      
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(1200, now);
      osc1.frequency.exponentialRampToValueAtTime(600, now + 0.3);
      
      gain1.gain.setValueAtTime(0.5, now);
      gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
      
      osc1.start(now);
      osc1.stop(now + 0.5);
      
      // Second ding - lower pitch, starts after first
      const osc2 = audioContext.createOscillator();
      const gain2 = audioContext.createGain();
      osc2.connect(gain2);
      gain2.connect(audioContext.destination);
      
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(800, now + 0.15);
      osc2.frequency.exponentialRampToValueAtTime(400, now + 0.45);
      
      gain2.gain.setValueAtTime(0.5, now + 0.15);
      gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.6);
      
      osc2.start(now + 0.15);
      osc2.stop(now + 0.6);
      
      console.log('Buzzer played successfully');
    } catch (error) {
      console.error('Error playing buzzer:', error);
    }
  };

  const fetchOrders = async () => {
    setIsRefreshing(true);
    const data = await getAllOrders();
    
    // Check for new pending orders using ref for accurate comparison
    const currentPendingCount = data.filter(o => o.status === "PENDING").length;
    const previousPendingCount = prevOrdersRef.current.filter(o => o.status === "PENDING").length;
    
    console.log(`Orders check: ${previousPendingCount} → ${currentPendingCount} pending orders`);
    
    // If there are more pending orders than before, play buzzer
    if (currentPendingCount > previousPendingCount && prevOrdersRef.current.length > 0) {
      console.log('New order detected! Playing buzzer...');
      console.log('Audio context state before play:', audioContext?.state);
      
      // Ensure audio context is ready before playing
      if (audioContext) {
        if (audioContext.state === 'suspended') {
          await audioContext.resume();
          console.log('Audio context resumed');
        }
        await playBuzzer();
      } else {
        console.log('Audio context not available');
      }
      
      // Show browser notification
      if (Notification.permission === "granted") {
        new Notification("New Order!", {
          body: `You have ${currentPendingCount} pending order${currentPendingCount > 1 ? 's' : ''}`,
          icon: "🍽️",
        });
      }
    }
    
    // Update ref before setting state
    prevOrdersRef.current = data;
    setOrders(data);
    setIsRefreshing(false);
  };

  const handleRejectClick = (orderId: string) => {
    setRejectingOrderId(orderId);
    setRejectionReason("");
    setShowRejectModal(true);
  };

  const handleRejectConfirm = () => {
    if (!rejectingOrderId) return;

    handleStatusUpdate(
      rejectingOrderId,
      "REJECTED",
      rejectionReason || "No reason provided"
    );
    setShowRejectModal(false);
    setRejectingOrderId(null);
  };

  useEffect(() => {
    fetchOrders();
    // Use interval to poll for new orders (e.g. every 10 seconds)
    const interval = setInterval(fetchOrders, 10000);
    return () => clearInterval(interval);
  }, []);

  // Update ref when orders state changes
  useEffect(() => {
    prevOrdersRef.current = orders;
  }, [orders]);



  const handleStatusUpdate = (
    orderId: string,
    status: "ACCEPTED" | "REJECTED" | "DELIVERED",
    rejectionReason?: string
  ) => {
    startTransition(async () => {
      await updateOrderStatus(orderId, status, rejectionReason);
      await fetchOrders();
    });
  };

  const filteredOrders =
    filter === "ALL" ? orders : orders.filter((o) => o.status === filter);

  const statusColors = {
    PENDING: "bg-yellow-50 text-yellow-700 border-yellow-200 border",
    ACCEPTED: "bg-blue-50 text-blue-700 border-blue-200 border",
    REJECTED: "bg-red-50 text-red-700 border-red-200 border",
    DELIVERED: "bg-green-50 text-green-700 border-green-200 border",
  };

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
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Orders</h1>
        <Button
          variant="outline"
          size="icon"
          onClick={fetchOrders}
          disabled={isRefreshing}
        >
          <RefreshCw
            className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`}
          />
        </Button>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {["ALL", "PENDING", "ACCEPTED", "DELIVERED", "REJECTED"].map(
          (status) => (
            <Button
              key={status}
              variant={filter === status ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter(status)}
            >
              {status.replace("_", " ")}
              {status !== "ALL" && (
                <Badge variant="secondary" className="ml-2">
                  {
                    orders.filter(
                      (o) => status === "ALL" || o.status === status
                    ).length
                  }
                </Badge>
              )}
            </Button>
          )
        )}
      </div>

      {/* Orders List */}
      {filteredOrders.length === 0 ? (
        <Card className="p-8 text-center text-muted-foreground">
          <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>No orders found</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order) => (
            <Card
              key={order.id}
              className="p-4 border border-slate-200 shadow-sm bg-white hover:shadow-md transition-all"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
                      #{order.orderIdString.slice(-6)}
                    </span>
                    <Badge
                      className={
                        statusColors[order.status as keyof typeof statusColors]
                      }
                    >
                      {order.status}
                    </Badge>
                    <Badge
                      variant="outline"
                      className="flex items-center gap-1"
                    >
                      {orderTypeIcon(order.type)}
                      {order.type.replace("_", " ")}
                    </Badge>
                  </div>

                  {order.status === "REJECTED" && order.rejectionReason && (
                    <p className="text-sm text-red-600 bg-red-50 p-2 rounded mb-2">
                      Reason: {order.rejectionReason}
                    </p>
                  )}

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Customer</p>
                      <p className="font-medium">{order.customerName}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Mobile</p>
                      <p className="font-medium">{order.customerMobile}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Items</p>
                      <p className="font-medium">{order.items.length} items</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Total</p>
                      <p className="font-bold text-orange-600">
                        ₹{order.totalAmount}
                      </p>
                    </div>
                  </div>

                  {order.tableNumber && (
                    <p className="text-sm mt-2">Table: {order.tableNumber}</p>
                  )}
                  {order.address && (
                    <p className="text-sm mt-2 text-muted-foreground">
                      📍 {order.address}
                    </p>
                  )}

                  {/* Order Items */}
                  <div className="mt-3 pt-3 border-t">
                    <p className="text-sm text-muted-foreground mb-1">Items:</p>
                    <div className="flex flex-wrap gap-2">
                      {order.items.map((item) => (
                        <Badge key={item.id} variant="secondary">
                          {item.name} × {item.quantity}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                {order.status === "PENDING" && (
                  <div className="flex flex-col gap-2">
                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleStatusUpdate(order.id, "ACCEPTED")}
                        className="bg-green-600 hover:bg-green-700 flex-1"
                        disabled={isPending}
                      >
                        {isPending ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <CheckCircle2 className="w-4 h-4 mr-1" />
                        )}
                        Accept
                      </Button>
                      <Button
                        onClick={() => handleRejectClick(order.id)}
                        variant="destructive"
                        disabled={isPending}
                        className="flex-1"
                      >
                        {isPending ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <XCircle className="w-4 h-4 mr-1" />
                        )}
                        Reject
                      </Button>
                    </div>
                  </div>
                )}

                {order.status === "ACCEPTED" && (
                  <Button
                    onClick={() => handleStatusUpdate(order.id, "DELIVERED")}
                    className="bg-blue-600 hover:bg-blue-700"
                    disabled={isPending}
                  >
                    {isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4 mr-1" />
                    )}
                    Mark Delivered
                  </Button>
                )}

                {order.status === "DELIVERED" && (
                  <Button
                    onClick={() => setPrintOrder(order)}
                    className="bg-orange-600 hover:bg-orange-700"
                  >
                    <Printer className="w-4 h-4 mr-1" />
                    Print Bill
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
      {/* Rejection Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="p-6 w-full max-w-sm bg-white">
            <h3 className="font-bold text-lg mb-4">Reject Order</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Please provide a reason for rejecting this order.
            </p>
            <Input
              placeholder="Reason (e.g. Out of stock)"
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              className="mb-4"
              autoFocus
            />
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => setShowRejectModal(false)}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleRejectConfirm}
                disabled={!rejectionReason.trim()}
              >
                Reject Order
              </Button>
            </div>
          </Card>
        </div>
      )}
      {/* Print Bill Modal */}
      {printOrder && (
        <PrintBillModal
          order={printOrder}
          isOpen={!!printOrder}
          onClose={() => setPrintOrder(null)}
        />
      )}
    </div>
  );
}
