"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useCartStore } from "@/lib/store/cart";
import { useAuthStore } from "@/lib/stores/authStore";
import { placeOrder } from "@/lib/actions/orders";
import { sendOTP, verifyOTP } from "@/lib/authApi";
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
  ChevronRight,
  Receipt,
  CreditCard,
  Banknote,
  Info,
  ExternalLink,
} from "lucide-react";
import QRCode from "react-qr-code";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getRestaurantProfile } from "@/lib/actions/menu";

type OrderType = "DINE_IN" | "TAKEAWAY" | "DELIVERY";

export default function CheckoutPage() {
  const router = useRouter();
  const [shopSettings, setShopSettings] = useState<{
    open: string;
    close: string;
    paymentQrCode?: string;
    upiId?: string;
  } | null>(null);

  useEffect(() => {
    getRestaurantProfile().then((data) => {
      if (data) {
        setShopSettings({
          open: data.openTime,
          close: data.closeTime,
          paymentQrCode: data.paymentQrCode || undefined,
          upiId: data.upiId || undefined,
        });
      }
    });
  }, []);

  const isValidPickupTime = (time: string) => {
    if (!time || !shopSettings) return false;
    return time >= shopSettings.open && time <= shopSettings.close;
  };
  const {
    items,
    updateQuantity,
    removeItem,
    getTotalAmount,
    clearCart,
    orderType: storeOrderType,
  } = useCartStore();

  const [orderType, setOrderType] = useState<OrderType | null>(null);

  // Sync order type from cart store on mount
  useEffect(() => {
    if (storeOrderType) {
      setOrderType(storeOrderType.toUpperCase() as OrderType);
    }
  }, [storeOrderType]);
  const [customerName, setCustomerName] = useState("");
  const [customerMobile, setCustomerMobile] = useState("");
  const [tableNumber, setTableNumber] = useState("");
  // Structured Address State
  const [flat, setFlat] = useState("");
  const [building, setBuilding] = useState("Migsun Twiinz");
  const [city] = useState("Greater Noida");
  const [state] = useState("Uttar Pradesh");
  const [country] = useState("India");
  const [landmark, setLandmark] = useState("");
  const [pincode] = useState("201310");

  const [pickupTime, setPickupTime] = useState("");
  const [showPayment, setShowPayment] = useState(false);
  const [isPlacing, setIsPlacing] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<"UPI" | "CASH">("UPI");

  // ── Inline OTP verification ───────────────────────────────────────────────
  type OtpStep = "idle" | "sending" | "sent" | "verifying";
  const [otpStep, setOtpStep] = useState<OtpStep>("idle");
  const [otpValues, setOtpValues] = useState(["", "", "", "", "", ""]);
  const [otpError, setOtpError] = useState("");
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handleSendOtp = async () => {
    if (customerMobile.length !== 10) return;
    setOtpStep("sending");
    setOtpError("");
    try {
      await sendOTP(customerMobile);
      setOtpStep("sent");
      setTimeout(() => otpRefs.current[0]?.focus(), 100);
    } catch {
      setOtpError("Failed to send OTP. Try again.");
      setOtpStep("idle");
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const updated = [...otpValues];
    updated[index] = value.slice(-1);
    setOtpValues(updated);
    if (value && index < 5) otpRefs.current[index + 1]?.focus();
  };

  const handleOtpKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    if (e.key === "Backspace" && !otpValues[index] && index > 0)
      otpRefs.current[index - 1]?.focus();
  };

  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const digits = e.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, 6);
    if (!digits) return;
    const updated = ["", "", "", "", "", ""];
    digits.split("").forEach((d, i) => {
      updated[i] = d;
    });
    setOtpValues(updated);
    const nextEmpty = Math.min(digits.length, 5);
    otpRefs.current[nextEmpty]?.focus();
  };

  const handleVerifyOtp = async () => {
    const code = otpValues.join("");
    if (code.length !== 6) return;
    setOtpStep("verifying");
    setOtpError("");
    try {
      const res = await verifyOTP(
        customerMobile,
        code,
        customerName || undefined,
      );
      if (res.tokens && res.user) {
        setAuth({ user: res.user, tokens: res.tokens });
        setOtpValues(["", "", "", "", "", ""]);
      } else {
        setOtpError("Verification failed. Please try again.");
        setOtpStep("sent");
      }
    } catch (err: any) {
      setOtpError(err?.response?.data?.error || "Invalid OTP.");
      setOtpStep("sent");
    }
  };
  // ─────────────────────────────────────────────────────────────────────────

  const { isAuthenticated, user, checkTokenValidity, setAuth } = useAuthStore();

  const finalName = isAuthenticated
    ? user?.name?.replace(/^User \d{4}$/, "User") || ""
    : customerName;
  const finalPhone = isAuthenticated ? user?.phone || "" : customerMobile;

  const canProceed =
    isAuthenticated &&
    finalName.trim() &&
    finalPhone.trim().length >= 10 &&
    orderType &&
    (orderType !== "DINE_IN" || tableNumber.trim()) &&
    (orderType !== "TAKEAWAY" || pickupTime.trim()) &&
    (orderType !== "DELIVERY" ||
      (building.trim() && flat.trim() && pincode.trim())) &&
    (orderType !== "TAKEAWAY" || isValidPickupTime(pickupTime));

  const handleProceedToPayment = () => {
    if (canProceed) {
      setShowPayment(true);
    }
  };

  // Generate a unique transaction reference for UPI
  // This helps avoid "duplicate transaction" errors and makes the intent unique
  const [txnId, setTxnId] = useState("");

  useEffect(() => {
    // Generate a simple unique ID: timestamp + random suffix
    setTxnId(`TRX${Date.now()}${Math.floor(Math.random() * 1000)}`);
  }, [items]); // Regenerate if items change (amount changes)

  // Ultra-compatible Personal UPI URI
  const upiId = shopSettings?.upiId?.trim() || "";
  const upiUri = upiId
    ? `upi://pay?pa=${upiId}&pn=${encodeURIComponent("Shivanya")}&am=${getTotalAmount().toFixed(2)}&cu=INR`
    : "";

  const handleConfirmPayment = async () => {
    if (!isAuthenticated || !checkTokenValidity() || !user) {
      alert("You must be logged in to place an order.");
      router.push("/login");
      return;
    }

    setIsPlacing(true);
    try {
      const result = await placeOrder({
        customerName: user.name || customerName,
        customerMobile: user.phone || customerMobile,
        type: orderType!,
        tableNumber: orderType === "DINE_IN" ? tableNumber : undefined,
        address:
          orderType === "DELIVERY"
            ? `Flat ${flat}, ${building}${
                landmark ? ", Near " + landmark : ""
              }, ${city}, ${state} - ${pincode}, ${country}`
            : undefined,
        pickupTime: orderType === "TAKEAWAY" ? pickupTime : undefined,
        items: items.map((i) => ({
          id: i.id,
          name: i.name,
          price: i.price,
          quantity: i.quantity,
        })),
      });

      if (result.success && result.orderId) {
        setOrderSuccess(result.orderId);
        clearCart();
        // Redirect to menu page after a short delay
        setTimeout(() => {
          router.push("/menu");
        }, 2000);
      } else {
        alert(result.error || "Failed to place order. Please try again.");
      }
    } catch (error) {
      console.error("Order placement error:", error);
      alert(
        "Something went wrong. Please check your connection and try again.",
      );
    } finally {
      setIsPlacing(false);
    }
  };

  if (orderSuccess) {
    return (
      <div className="min-h-screen bg-[#F8F9FD] flex items-center justify-center px-6 font-sans">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", bounce: 0.5 }}
          className="w-full max-w-sm"
        >
          <div className="bg-white rounded-[3rem] p-10 shadow-2xl shadow-slate-200/50 text-center relative overflow-hidden">
            {/* Decorative Background Blob */}
            <div className="absolute top-[-50%] left-[-50%] w-[200%] h-[200%] bg-linear-to-b from-green-50/50 to-transparent rounded-full animate-pulse z-0 pointer-events-none" />

            <div className="relative z-10 flex flex-col items-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring" }}
                className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mb-6 shadow-sm ring-4 ring-green-50"
              >
                <CheckCircle className="w-12 h-12 text-green-600" />
              </motion.div>

              <h1 className="text-3xl font-black text-slate-900 mb-2 tracking-tight">
                Woohoo!
              </h1>
              <p className="text-slate-500 font-medium mb-8 leading-relaxed">
                Your order has been placed successfully. The kitchen has
                received your ticket.
              </p>

              <Link href="/menu" className="w-full">
                <Button className="w-full bg-slate-900 hover:bg-slate-800 text-white rounded-2xl py-6 font-bold text-lg shadow-xl shadow-slate-200 transition-transform active:scale-95">
                  Back to Menu
                </Button>
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-[#F8F9FD] flex items-center justify-center px-4 font-sans">
        <div className="text-center max-w-md">
          <div className="w-32 h-32 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl shadow-slate-100 text-6xl">
            🥣
          </div>
          <h1 className="text-2xl font-black text-slate-900 mb-2">
            Your Tray is Empty
          </h1>
          <p className="text-slate-400 font-medium mb-8">
            Looks like you haven't made your choice yet.
          </p>
          <Link href="/menu">
            <Button className="bg-orange-600 hover:bg-orange-700 text-white px-8 py-6 rounded-2xl font-bold shadow-lg shadow-orange-200">
              Browse Menu
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FD] font-sans text-slate-800 pb-40 selection:bg-orange-100">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-slate-100/50">
        <div className="max-w-4xl mx-auto px-6 py-5 flex items-center gap-6">
          <Link href="/menu">
            <Button
              variant="ghost"
              size="icon"
              className="hover:bg-white hover:shadow-sm rounded-xl text-slate-500"
            >
              <ArrowLeft className="w-6 h-6" />
            </Button>
          </Link>
          <div className="flex-1">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Checkout
            </h1>
            <p className="text-xs font-medium text-slate-400">
              Complete your order
            </p>
          </div>
          <div className="flex items-center gap-2 bg-orange-50 px-3 py-1.5 rounded-full">
            <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
            <span className="text-xs font-bold text-orange-700">
              Payment Pending
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* LEFT COLUMN: Order Details */}
        <div className="lg:col-span-7 space-y-6">
          {/* 1. Dining Preference */}
          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-4 px-1">
              Dining Preference
            </h2>
            <div className="grid grid-cols-3 gap-4">
              {[
                {
                  type: "DINE_IN" as OrderType,
                  icon: UtensilsCrossed,
                  label: "Dine-In",
                },
                {
                  type: "TAKEAWAY" as OrderType,
                  icon: Package,
                  label: "Takeaway",
                },
                {
                  type: "DELIVERY" as OrderType,
                  icon: Truck,
                  label: "Delivery",
                },
              ].map(({ type, icon: Icon, label }) => (
                <button
                  key={type}
                  onClick={() => setOrderType(type)}
                  className={`
                     relative p-4 rounded-[1.5rem] transition-all duration-300 flex flex-col items-center gap-3 group overflow-hidden
                     ${
                       orderType === type
                         ? "bg-white ring-2 ring-orange-500 shadow-xl shadow-orange-100/50 scale-[1.02]"
                         : "bg-white border border-slate-100 hover:border-orange-200 text-slate-400 hover:text-orange-500 hover:shadow-md"
                     }
                   `}
                >
                  <div
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors ${
                      orderType === type
                        ? "bg-orange-50 text-orange-600"
                        : "bg-slate-50 text-slate-400 group-hover:bg-orange-50 group-hover:text-orange-500"
                    }`}
                  >
                    <Icon className="w-6 h-6" />
                  </div>
                  <span
                    className={`font-bold text-sm ${
                      orderType === type ? "text-slate-900" : "text-slate-500"
                    }`}
                  >
                    {label}
                  </span>
                  {orderType === type && (
                    <div className="absolute top-3 right-3 w-4 h-4 bg-orange-500 rounded-full flex items-center justify-center">
                      <div className="w-1.5 h-1 bg-white rounded-full" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </section>

          {/* 2. Customer Details */}
          <section className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100/50">
            <h2 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
                <User className="w-4 h-4" />
              </div>
              Your Details
            </h2>
            <div className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="relative group">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-orange-500 transition-colors" />
                  <Input
                    placeholder="Your Name"
                    value={
                      isAuthenticated
                        ? user?.name?.replace(/^User \d{4}$/, "User") || ""
                        : customerName
                    }
                    onChange={(e) => setCustomerName(e.target.value)}
                    disabled={isAuthenticated}
                    className="pl-12 h-14 rounded-2xl bg-slate-50 border-none ring-1 ring-slate-100 focus:ring-2 focus:ring-orange-200 transition-all font-bold text-slate-700 placeholder:font-medium placeholder:text-slate-400/80 disabled:opacity-70 disabled:cursor-not-allowed"
                  />
                </div>
                <div className="relative group">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-orange-500 transition-colors" />
                  <Input
                    placeholder="Mobile Number"
                    type="tel"
                    value={isAuthenticated ? user?.phone || "" : customerMobile}
                    onChange={(e) => setCustomerMobile(e.target.value)}
                    disabled={isAuthenticated}
                    className="pl-12 h-14 rounded-2xl bg-slate-50 border-none ring-1 ring-slate-100 focus:ring-2 focus:ring-orange-200 transition-all font-bold text-slate-700 placeholder:font-medium placeholder:text-slate-400/80 disabled:opacity-70 disabled:cursor-not-allowed"
                  />
                </div>
              </div>

              {/* ── Inline OTP Verification ── */}
              {!isAuthenticated && (
                <AnimatePresence>
                  {customerMobile.length === 10 && (
                    <motion.div
                      key="otp-block"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="mt-1 p-4 rounded-2xl bg-blue-50 border border-blue-100 space-y-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-bold text-slate-800">
                              Verify Phone Number
                            </p>
                            <p className="text-xs text-slate-500">
                              OTP will be sent to +91 {customerMobile}
                            </p>
                          </div>
                          {otpStep === "idle" || otpStep === "sending" ? (
                            <Button
                              size="sm"
                              onClick={handleSendOtp}
                              disabled={otpStep === "sending"}
                              className="bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold h-8 px-4"
                            >
                              {otpStep === "sending" ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : (
                                "Send OTP"
                              )}
                            </Button>
                          ) : null}
                        </div>

                        {otpStep === "sent" || otpStep === "verifying" ? (
                          <div className="space-y-3">
                            <div className="flex gap-2 justify-center">
                              {otpValues.map((val, i) => (
                                <input
                                  key={i}
                                  ref={(el) => {
                                    otpRefs.current[i] = el;
                                  }}
                                  type="text"
                                  inputMode="numeric"
                                  maxLength={1}
                                  value={val}
                                  onChange={(e) =>
                                    handleOtpChange(i, e.target.value)
                                  }
                                  onKeyDown={(e) => handleOtpKeyDown(i, e)}
                                  onPaste={handleOtpPaste}
                                  className="w-10 h-12 text-center text-lg font-black rounded-xl bg-white border-2 border-slate-200 focus:border-orange-400 focus:outline-none transition-colors shadow-sm"
                                />
                              ))}
                            </div>
                            {otpError && (
                              <p className="text-xs text-red-500 font-bold text-center">
                                {otpError}
                              </p>
                            )}
                            <div className="flex gap-2">
                              <Button
                                onClick={handleVerifyOtp}
                                disabled={
                                  otpValues.join("").length !== 6 ||
                                  otpStep === "verifying"
                                }
                                className="flex-1 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-sm font-bold h-10"
                              >
                                {otpStep === "verifying" ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  "Verify OTP"
                                )}
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleSendOtp}
                                disabled={otpStep === "verifying"}
                                className="text-xs text-slate-500 rounded-xl h-10 px-3"
                              >
                                Resend
                              </Button>
                            </div>
                          </div>
                        ) : null}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              )}

              <AnimatePresence>
                {orderType === "DINE_IN" && (
                  <motion.div
                    key="dine-in"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="relative group overflow-hidden"
                  >
                    <Hash className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-orange-500" />
                    <Input
                      placeholder="Table Number"
                      value={tableNumber}
                      onChange={(e) => setTableNumber(e.target.value)}
                      className="pl-12 h-14 rounded-2xl bg-slate-50 border-none ring-1 ring-slate-100 focus:ring-2 focus:ring-orange-200 transition-all font-bold text-slate-700 placeholder:font-medium placeholder:text-slate-400/80"
                    />
                  </motion.div>
                )}

                {orderType === "TAKEAWAY" && (
                  <motion.div
                    key="takeaway"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="relative group overflow-hidden"
                  >
                    <Clock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-orange-500" />
                    <Input
                      type="time"
                      value={pickupTime}
                      onChange={(e) => setPickupTime(e.target.value)}
                      className={`pl-12 h-14 rounded-2xl bg-slate-50 border-none ring-1 focus:ring-2 transition-all font-bold text-slate-700 ${
                        pickupTime && !isValidPickupTime(pickupTime)
                          ? "ring-red-200 focus:ring-red-300 text-red-600"
                          : "ring-slate-100 focus:ring-orange-200"
                      }`}
                    />
                    {pickupTime &&
                      !isValidPickupTime(pickupTime) &&
                      shopSettings && (
                        <p className="text-xs text-red-500 font-bold mt-2 ml-4 flex items-center gap-1">
                          <Info className="w-3 h-3" /> Shop Hours:{" "}
                          {shopSettings.open} - {shopSettings.close}
                        </p>
                      )}
                  </motion.div>
                )}

                {orderType === "DELIVERY" && (
                  <motion.div
                    key="delivery"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="space-y-3 pt-2"
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {/* Building Selection */}
                      <div className="relative group">
                        <label className="text-[10px] font-bold text-slate-400 uppercase ml-4 mb-1 block">
                          Building
                        </label>
                        <div className="relative">
                          <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-orange-500 transition-colors z-10" />
                          <select
                            value={building}
                            onChange={(e) => setBuilding(e.target.value)}
                            className="w-full pl-10 pr-4 h-12 rounded-xl bg-slate-50 border-none ring-1 ring-slate-100 focus:ring-2 focus:ring-orange-200 transition-all font-bold text-slate-700 appearance-none bg-no-repeat bg-position-[right_1rem_center] cursor-pointer text-sm"
                            style={{
                              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`,
                              backgroundSize: "1rem",
                            }}
                          >
                            <option value="Migsun Twiinz">Migsun Twiinz</option>
                            <option value="Migsun Vilaasa">
                              Migsun Vilaasa
                            </option>
                          </select>
                        </div>
                      </div>

                      {/* Flat Number */}
                      <div className="relative group">
                        <label className="text-[10px] font-bold text-slate-400 uppercase ml-4 mb-1 block">
                          Flat / House No.
                        </label>
                        <div className="relative">
                          <Hash className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-orange-500 transition-colors" />
                          <Input
                            placeholder="e.g. A-101"
                            value={flat}
                            onChange={(e) => setFlat(e.target.value)}
                            className="pl-10 h-12 rounded-xl bg-slate-50 border-none ring-1 ring-slate-100 focus:ring-2 focus:ring-orange-200 transition-all font-bold text-slate-700 placeholder:font-medium placeholder:text-slate-400/80 text-sm"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Landmark */}
                    <div className="relative group">
                      <label className="text-[10px] font-bold text-slate-400 uppercase ml-4 mb-1 block">
                        Landmark (Optional)
                      </label>
                      <div className="relative">
                        <Info className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-orange-500 transition-colors" />
                        <Input
                          placeholder="e.g. Near Club House"
                          value={landmark}
                          onChange={(e) => setLandmark(e.target.value)}
                          className="pl-10 h-12 rounded-xl bg-slate-50 border-none ring-1 ring-slate-100 focus:ring-2 focus:ring-orange-200 transition-all font-bold text-slate-700 placeholder:font-medium placeholder:text-slate-400/80 text-sm"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="relative group">
                        <label className="text-[10px] font-bold text-slate-400 uppercase ml-4 mb-1 block">
                          Pincode
                        </label>
                        <Input
                          value={pincode}
                          readOnly
                          className="h-12 rounded-xl bg-slate-100 border-none ring-1 ring-slate-200 text-slate-500 font-bold text-sm cursor-not-allowed"
                        />
                      </div>

                      {/* City (Read-only) */}
                      <div className="relative group">
                        <label className="text-[10px] font-bold text-slate-400 uppercase ml-4 mb-1 block">
                          City
                        </label>
                        <Input
                          value={city}
                          readOnly
                          className="h-12 rounded-xl bg-slate-100 border-none ring-1 ring-slate-200 text-slate-500 font-bold text-sm cursor-not-allowed"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 pb-2">
                      {/* State (Read-only) */}
                      <div className="relative group">
                        <label className="text-[10px] font-bold text-slate-400 uppercase ml-4 mb-1 block">
                          State
                        </label>
                        <Input
                          value={state}
                          readOnly
                          className="h-12 rounded-xl bg-slate-100 border-none ring-1 ring-slate-200 text-slate-500 font-bold text-sm cursor-not-allowed"
                        />
                      </div>
                      {/* Country (Read-only) */}
                      <div className="relative group">
                        <label className="text-[10px] font-bold text-slate-400 uppercase ml-4 mb-1 block">
                          Country
                        </label>
                        <Input
                          value={country}
                          readOnly
                          className="h-12 rounded-xl bg-slate-100 border-none ring-1 ring-slate-200 text-slate-500 font-bold text-sm cursor-not-allowed"
                        />
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </section>
        </div>

        {/* RIGHT COLUMN: Order Summary (Tray) */}
        <div className="lg:col-span-5 space-y-6">
          <section className="bg-white rounded-[2.5rem] p-8 shadow-xl shadow-slate-200/50 border border-slate-100 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-orange-50 rounded-bl-full -mr-8 -mt-8 z-0"></div>

            <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2 relative z-10">
              <Receipt className="w-5 h-5 text-orange-500" /> Order Summary
            </h2>

            <div className="space-y-4 relative z-10 mb-8 max-h-100 overflow-y-auto pr-2 custom-scrollbar">
              {items.map((item) => (
                <div key={item.id} className="flex items-center gap-4 p-2">
                  <div className="w-16 h-16 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-2xl shrink-0">
                    🥗
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-bold text-slate-900 leading-tight">
                        {item.name}
                      </h3>
                      {item.isVeg ? (
                        <div className="w-2 h-2 rounded-full bg-green-500" />
                      ) : (
                        <div className="w-2 h-2 rounded-full bg-red-500" />
                      )}
                    </div>
                    <p className="text-sm font-medium text-slate-400">
                      ₹{item.price || 0}
                    </p>
                  </div>

                  <div className="flex flex-col items-end gap-2">
                    <div className="flex items-center gap-2 bg-slate-100 rounded-lg p-1">
                      <button
                        onClick={() =>
                          updateQuantity(item.id, item.quantity - 1)
                        }
                        className="w-6 h-6 flex items-center justify-center bg-white rounded shadow-sm hover:text-orange-600"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="text-xs font-bold w-4 text-center">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() =>
                          updateQuantity(item.id, item.quantity + 1)
                        }
                        className="w-6 h-6 flex items-center justify-center bg-white rounded shadow-sm hover:text-orange-600"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                    <span className="font-bold text-slate-900">
                      ₹{(item.price || 0) * item.quantity}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Bill Details */}
            <div className="bg-slate-50 rounded-2xl p-6 space-y-3 relative z-10">
              <div className="flex justify-between text-sm font-medium text-slate-500">
                <span>Subtotal</span>
                <span>₹{getTotalAmount()}</span>
              </div>

              <div className="border-t border-slate-200 border-dashed my-2"></div>
              <div className="flex justify-between items-center">
                <span className="font-bold text-slate-900">Total Amount</span>₹
                {getTotalAmount()}
              </div>
            </div>
          </section>

          {/* Developer Footer */}
          <footer className="mt-8 mb-4 text-center space-y-2">
            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">
              Developed by{" "}
              <a
                href="https://www.nagarjunatechsolutions.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-orange-500 hover:text-orange-600 transition-colors inline-flex items-center gap-1"
              >
                Nagarjuna tech solutions Pvt Ltd
                <ExternalLink className="w-2.5 h-2.5" />
              </a>
            </p>
          </footer>
        </div>
      </div>

      {/* Fixed Bottom Bar Float */}
      <div className="fixed bottom-6 left-0 right-0 z-40 px-6">
        <div className="max-w-4xl mx-auto">
          <Button
            onClick={handleProceedToPayment}
            disabled={!canProceed}
            className="w-full bg-slate-900 hover:bg-black disabled:bg-slate-700 disabled:text-slate-400 disabled:opacity-100 text-white h-20 rounded-[2rem] shadow-2xl shadow-slate-300 flex items-center justify-between px-8 text-lg font-bold transition-all transform active:scale-[0.99]"
          >
            <span className="flex flex-col items-start">
              <span className="text-xs text-slate-400 font-medium uppercase tracking-wider">
                Total to Pay
              </span>
              ₹{getTotalAmount()}
            </span>
            <span className="flex items-center gap-3">
              Proceed to Pay{" "}
              <div className="bg-orange-500 rounded-full p-2">
                <ChevronRight className="w-5 h-5 text-white" />
              </div>
            </span>
          </Button>
        </div>
      </div>

      {/* Payment Modal Refined */}
      <AnimatePresence>
        {showPayment && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4"
            onClick={() => setShowPayment(false)}
          >
            <motion.div
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-t-[2rem] sm:rounded-[2.5rem] p-5 sm:p-8 w-full max-w-md shadow-2xl relative overflow-hidden"
            >
              {/* Decorative Header */}
              <div className="absolute top-0 left-0 right-0 h-24 bg-orange-50 rounded-b-[50%] -mt-12 z-0" />

              <div className="relative z-10 text-center mb-2 pt-2">
                <h2 className="text-xl font-black text-slate-900 leading-none">
                  Payment
                </h2>
                <p className="text-xs text-slate-500 font-medium mt-1">
                  Select a payment method
                </p>
              </div>

              {/* Payment Methods */}
              <div className="grid grid-cols-2 gap-3 mb-4 relative z-10">
                <button
                  onClick={() => setPaymentMethod("UPI")}
                  className={`p-3 rounded-xl border transition-all flex flex-col items-center gap-1 ${
                    paymentMethod === "UPI"
                      ? "border-orange-500 bg-orange-50 text-orange-700"
                      : "border-slate-100 bg-white text-slate-500 hover:bg-slate-50"
                  }`}
                >
                  <QrCode className="w-6 h-6" />
                  <span className="font-bold text-xs">UPI / QR</span>
                </button>
                <button
                  onClick={() => setPaymentMethod("CASH")}
                  className={`p-3 rounded-xl border transition-all flex flex-col items-center gap-1 ${
                    paymentMethod === "CASH"
                      ? "border-orange-500 bg-orange-50 text-orange-700"
                      : "border-slate-100 bg-white text-slate-500 hover:bg-slate-50"
                  }`}
                >
                  <Banknote className="w-6 h-6" />
                  <span className="font-bold text-xs">Cash</span>
                </button>
              </div>

              {paymentMethod === "UPI" ? (
                <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl p-4 flex flex-col items-center mb-4 relative z-10">
                  {/* Amount Display */}
                  <div className="mb-3 text-center">
                    <p className="text-md text-slate-500 font-medium uppercase tracking-wider mb-0.5">
                      Total Payable
                    </p>
                    <p className="text-3xl font-black text-slate-900">
                      ₹{getTotalAmount()}
                    </p>
                  </div>

                  <div className="w-80 h-80 flex items-center justify-center overflow-hidden mb-4">
                    {shopSettings?.paymentQrCode ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={shopSettings.paymentQrCode}
                        alt="Payment QR"
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <div className="flex flex-col items-center gap-2 text-slate-400">
                        <QrCode className="w-12 h-12" />
                        <p className="text-[10px] font-medium uppercase">
                          QR Not Uploaded
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="w-full space-y-4">
                    <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 flex gap-3 items-start text-left">
                      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                        <Info className="w-4 h-4 text-blue-600" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-md font-bold text-blue-900 leading-tight">
                          Verification Required
                        </p>
                        <p className="text-sm text-blue-800 leading-normal">
                          Please scan and pay{" "}
                          <strong>₹{getTotalAmount()}</strong>. After payment,{" "}
                          <strong>share a screenshot</strong> with the seller on
                          Whatsapp to confirm your order.
                        </p>
                        <a href="https://wa.me/+919560232003">
                          <button className="cursor-pointer border border-green-800  px-4 py-2 my-4 rounded-full text-green-800 font-medium hover:bg-green-800 hover:text-white shadow-md shadow-green-200">
                            Click here to open whatsapp
                          </button>
                        </a>
                      </div>
                    </div>

                    <Button
                      onClick={handleConfirmPayment}
                      disabled={isPlacing}
                      className="w-full bg-slate-900 hover:bg-slate-800 text-white rounded-2xl py-6 font-bold text-base shadow-lg transform transition-transform active:scale-95 h-auto"
                    >
                      {isPlacing ? (
                        <Loader2 className="w-5 h-5 animate-spin mr-2" />
                      ) : (
                        "Complete Order"
                      )}
                    </Button>

                    {shopSettings?.upiId && (
                      <Button
                        variant="ghost"
                        onClick={() => {
                          const upiId = shopSettings?.upiId?.trim() || "";
                          navigator.clipboard.writeText(upiId);
                          alert("UPI ID Copied!");
                        }}
                        className="w-full text-slate-500 rounded-xl py-2 text-[10px] font-medium h-auto hover:bg-slate-100"
                      >
                        Trouble scanning? Copy UPI ID:{" "}
                        {shopSettings.upiId.trim()}
                      </Button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="bg-slate-50 rounded-2xl p-6 mb-6 text-center relative z-10">
                  <p className="text-sm text-slate-500 mb-1">
                    Please pay cash at the counter
                  </p>
                  <p className="text-lg font-black text-slate-900">
                    Counter #1
                  </p>
                </div>
              )}

              <div className="space-y-2 relative z-10">
                {paymentMethod === "CASH" && (
                  <Button
                    onClick={handleConfirmPayment}
                    disabled={isPlacing}
                    className="w-full bg-orange-600 hover:bg-orange-700 text-white py-5 text-base font-bold rounded-xl shadow-lg shadow-orange-200 h-auto"
                  >
                    {isPlacing ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Wait...
                      </>
                    ) : (
                      `Place Order (Cash)`
                    )}
                  </Button>
                )}

                <Button
                  variant="ghost"
                  onClick={() => setShowPayment(false)}
                  className="w-full text-slate-400 hover:bg-slate-50 hover:text-slate-600 rounded-lg text-xs h-8"
                ></Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
