"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useCartStore } from "@/lib/store/cart";
import { placeOrder } from "@/lib/actions/orders";
import {
  ArrowLeft,
  Minus,
  Plus,
  Trash2,
  UtensilsCrossed,
  Package,
  Truck,
  User,
  Phone,
  MapPin,
  Hash,
  Loader2,
  CheckCircle,
  QrCode,
  Clock,
} from "lucide-react";
import Link from "next/link";

type OrderType = "DINE_IN" | "TAKEAWAY" | "DELIVERY";

export default function CheckoutPage() {
  const router = useRouter();
  const { items, updateQuantity, removeItem, getTotalAmount, clearCart } =
    useCartStore();

  const [orderType, setOrderType] = useState<OrderType | null>(null);
  const [customerName, setCustomerName] = useState("");
  const [customerMobile, setCustomerMobile] = useState("");
  const [tableNumber, setTableNumber] = useState("");
  const [address, setAddress] = useState("");
  const [pickupTime, setPickupTime] = useState("");
  const [showPayment, setShowPayment] = useState(false);
  const [isPlacing, setIsPlacing] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState<string | null>(null);

  const canProceed =
    customerName.trim() &&
    customerMobile.trim().length >= 10 &&
    orderType &&
    (orderType !== "DINE_IN" || tableNumber.trim()) &&
    (orderType !== "TAKEAWAY" || pickupTime.trim()) &&
    (orderType !== "DELIVERY" || address.trim());

  const handleProceedToPayment = () => {
    if (canProceed) {
      setShowPayment(true);
    }
  };

  const handleConfirmPayment = async () => {
    setIsPlacing(true);
    try {
      const result = await placeOrder({
        customerName,
        customerMobile,
        type: orderType!,
        tableNumber: orderType === "DINE_IN" ? tableNumber : undefined,
        address: orderType === "DELIVERY" ? address : undefined,
        pickupTime: orderType === "TAKEAWAY" ? pickupTime : undefined,
        items: items.map((i) => ({
          id: i.id,
          name: i.name,
          price: i.price,
          quantity: i.quantity,
        })),
      });

      if (result.success) {
        setOrderSuccess(result.orderId);
        clearCart();
      }
    } catch (error) {
      console.error("Order failed:", error);
    } finally {
      setIsPlacing(false);
    }
  };

  if (orderSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 flex items-center justify-center px-4">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center"
        >
          <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-12 h-12 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold text-green-800 mb-2">
            Order Placed!
          </h1>
          <p className="text-muted-foreground mb-4">Your order ID is</p>
          <p className="text-2xl font-mono font-bold text-green-600 mb-8">
            {orderSuccess}
          </p>
          <Link href="/">
            <Button className="bg-green-600 hover:bg-green-700">
              Back to Home
            </Button>
          </Link>
        </motion.div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-amber-50 flex items-center justify-center px-4">
        <div className="text-center">
          <div className="text-6xl mb-4">🛒</div>
          <h1 className="text-2xl font-bold mb-2">Your cart is empty</h1>
          <p className="text-muted-foreground mb-6">
            Add some delicious items to get started
          </p>
          <Link href="/menu">
            <Button className="bg-orange-600 hover:bg-orange-700">
              Browse Menu
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-amber-50 pb-32">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-white/90 backdrop-blur-lg shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link href="/menu">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <h1 className="text-xl font-bold">Checkout</h1>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Cart Items */}
        <Card className="p-4 bg-white shadow-lg border-0">
          <h2 className="font-bold mb-4">Your Order ({items.length} items)</h2>
          <div className="space-y-4">
            {items.map((item) => (
              <div key={item.id} className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="outline"
                      className={
                        item.isVeg
                          ? "border-green-500 text-green-600"
                          : "border-red-500 text-red-600"
                      }
                    >
                      {item.isVeg ? "●" : "●"}
                    </Badge>
                    <span className="font-medium">{item.name}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    ₹{item.price} each
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7"
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                    >
                      <Minus className="w-3 h-3" />
                    </Button>
                    <span className="w-6 text-center text-sm font-bold">
                      {item.quantity}
                    </span>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7"
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    >
                      <Plus className="w-3 h-3" />
                    </Button>
                  </div>
                  <span className="font-bold w-16 text-right">
                    ₹{item.price * item.quantity}
                  </span>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7 text-red-500"
                    onClick={() => removeItem(item.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
          <div className="border-t mt-4 pt-4 flex justify-between font-bold text-lg">
            <span>Total</span>
            <span className="text-orange-600">₹{getTotalAmount()}</span>
          </div>
        </Card>

        {/* Order Type Selection */}
        <Card className="p-4 bg-white shadow-lg border-0">
          <h2 className="font-bold mb-4">Select Service Type</h2>
          <div className="grid grid-cols-3 gap-3">
            {[
              {
                type: "DINE_IN" as OrderType,
                icon: UtensilsCrossed,
                label: "Dine-In",
                color: "orange",
              },
              {
                type: "TAKEAWAY" as OrderType,
                icon: Package,
                label: "Take Away",
                color: "green",
              },
              {
                type: "DELIVERY" as OrderType,
                icon: Truck,
                label: "Delivery",
                color: "blue",
              },
            ].map(({ type, icon: Icon, label, color }) => (
              <button
                key={type}
                onClick={() => setOrderType(type)}
                className={`p-4 rounded-xl border-2 transition-all ${
                  orderType === type
                    ? `border-${color}-500 bg-${color}-50`
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <Icon
                  className={`w-6 h-6 mx-auto mb-2 ${
                    orderType === type ? `text-${color}-600` : "text-gray-400"
                  }`}
                />
                <p
                  className={`text-sm font-medium ${
                    orderType === type ? `text-${color}-600` : "text-gray-600"
                  }`}
                >
                  {label}
                </p>
              </button>
            ))}
          </div>
        </Card>

        {/* Customer Details */}
        <Card className="p-4 bg-white shadow-lg border-0">
          <h2 className="font-bold mb-4">Your Details</h2>
          <div className="space-y-4">
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                placeholder="Your Name *"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                placeholder="Mobile Number *"
                type="tel"
                value={customerMobile}
                onChange={(e) => setCustomerMobile(e.target.value)}
                className="pl-10"
              />
            </div>

            <AnimatePresence>
              {orderType === "DINE_IN" && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="relative"
                >
                  <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input
                    placeholder="Table Number *"
                    value={tableNumber}
                    onChange={(e) => setTableNumber(e.target.value)}
                    className="pl-10"
                  />
                </motion.div>
              )}

              {orderType === "TAKEAWAY" && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="relative"
                >
                  <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input
                    type="time"
                    placeholder="Pickup Time *"
                    value={pickupTime}
                    onChange={(e) => setPickupTime(e.target.value)}
                    className="pl-10"
                  />
                  <p className="text-xs text-muted-foreground mt-1 ml-1">
                    Please select a time within opening hours
                  </p>
                </motion.div>
              )}

              {orderType === "DELIVERY" && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="relative"
                >
                  <MapPin className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                  <textarea
                    placeholder="Delivery Address *"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border rounded-md min-h-[80px] resize-none"
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </Card>
      </div>

      {/* Payment Modal */}
      <AnimatePresence>
        {showPayment && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center"
            onClick={() => setShowPayment(false)}
          >
            <motion.div
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-t-3xl sm:rounded-2xl p-6 w-full sm:max-w-md"
            >
              <h2 className="text-xl font-bold text-center mb-4">
                Complete Payment
              </h2>

              <div className="text-center mb-6">
                <p className="text-muted-foreground mb-4">
                  Scan the QR code below to pay
                </p>
                <div className="w-48 h-48 bg-gray-100 rounded-xl mx-auto flex items-center justify-center border-2 border-dashed border-gray-300">
                  <QrCode className="w-24 h-24 text-gray-400" />
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  (Restaurant QR Code)
                </p>
              </div>

              <div className="bg-orange-50 rounded-xl p-4 mb-6">
                <div className="flex justify-between items-center">
                  <span className="font-medium">Amount to Pay</span>
                  <span className="text-2xl font-bold text-orange-600">
                    ₹{getTotalAmount()}
                  </span>
                </div>
              </div>

              <Button
                onClick={handleConfirmPayment}
                disabled={isPlacing}
                className="w-full bg-green-600 hover:bg-green-700 py-6 text-lg font-bold"
              >
                {isPlacing ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Placing Order...
                  </>
                ) : (
                  "✓ Confirm Payment Done"
                )}
              </Button>

              <Button
                variant="ghost"
                onClick={() => setShowPayment(false)}
                className="w-full mt-2"
              >
                Cancel
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Fixed Bottom Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg p-4 z-40">
        <div className="max-w-4xl mx-auto">
          <Button
            onClick={handleProceedToPayment}
            disabled={!canProceed}
            className="w-full bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 disabled:opacity-50 py-6 text-lg font-bold"
          >
            Proceed to Pay ₹{getTotalAmount()}
          </Button>
        </div>
      </div>
    </div>
  );
}
