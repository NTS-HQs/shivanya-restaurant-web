"use client";

import { useState, useEffect, useTransition } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { getMenuWithCategories } from "@/lib/actions/menu";
import { placeOrder } from "@/lib/actions/orders";
import {
  Search,
  Plus,
  Minus,
  Trash2,
  ShoppingCart,
  User,
  Phone,
  Loader2,
  CheckCircle,
} from "lucide-react";

type Category = Awaited<ReturnType<typeof getMenuWithCategories>>[0];
type MenuItem = Category["items"][0];

type CartItem = {
  id: string;
  name: string;
  price: number;
  quantity: number;
};

export default function POSPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("");
  const [customerName, setCustomerName] = useState("");
  const [customerMobile, setCustomerMobile] = useState("");
  const [tableNumber, setTableNumber] = useState("");
  const [isPending, startTransition] = useTransition();
  const [orderSuccess, setOrderSuccess] = useState<string | null>(null);

  useEffect(() => {
    getMenuWithCategories().then((data) => {
      setCategories(data);
      if (data.length > 0) setActiveCategory(data[0].id);
    });
  }, []);

  const addToCart = (item: MenuItem) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.id === item.id);
      if (existing) {
        return prev.map((i) =>
          i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [
        ...prev,
        { id: item.id, name: item.name, price: item.price, quantity: 1 },
      ];
    });
  };

  const updateQuantity = (itemId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.id === itemId)
            return { ...item, quantity: Math.max(0, item.quantity + delta) };
          return item;
        })
        .filter((i) => i.quantity > 0)
    );
  };

  const totalAmount = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  const handlePlaceOrder = () => {
    if (!customerName || !customerMobile || cart.length === 0) return;

    startTransition(async () => {
      const result = await placeOrder({
        customerName,
        customerMobile,
        type: "DINE_IN",
        tableNumber: tableNumber || undefined,
        items: cart,
      });
      if (result.success) {
        setOrderSuccess(result.orderId);
        setCart([]);
        setCustomerName("");
        setCustomerMobile("");
        setTableNumber("");
        setTimeout(() => setOrderSuccess(null), 3000);
      }
    });
  };

  const filteredItems =
    categories
      .find((c) => c.id === activeCategory)
      ?.items.filter((i) =>
        i.name.toLowerCase().includes(search.toLowerCase())
      ) || [];

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      {/* Menu Selection Area */}
      <div className="flex-1 flex flex-col p-4 gap-4 overflow-hidden">
        {/* Header & Search */}
        <div className="flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search items..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-white"
            />
          </div>
        </div>

        {/* Categories */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          {categories.map((cat) => (
            <Button
              key={cat.id}
              variant={activeCategory === cat.id ? "default" : "outline"}
              onClick={() => setActiveCategory(cat.id)}
              className="whitespace-nowrap"
            >
              {cat.name}
            </Button>
          ))}
        </div>

        {/* Items Grid */}
        <div className="flex-1 overflow-y-auto">
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 pb-20">
            {filteredItems.map((item) => (
              <Card
                key={item.id}
                className="p-3 cursor-pointer border border-slate-200 shadow-sm hover:shadow-md transition-all active:scale-95 bg-white"
                onClick={() => addToCart(item)}
              >
                <h3 className="font-bold line-clamp-1 text-slate-800">
                  {item.name}
                </h3>
                <p className="text-orange-600 font-bold">₹{item.price}</p>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* Cart Sidebar */}
      <div className="w-96 bg-white border-l shadow-xl flex flex-col h-full">
        <div className="p-4 border-b">
          <h2 className="font-bold text-lg flex items-center gap-2">
            <ShoppingCart className="w-5 h-5" /> Current Order
          </h2>
        </div>

        {/* Customer Details */}
        <div className="p-4 space-y-3 bg-slate-50 border-b">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Customer Name"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="pl-9 h-8"
              />
            </div>
            <div className="relative w-24">
              <Input
                placeholder="Table"
                value={tableNumber}
                onChange={(e) => setTableNumber(e.target.value)}
                className="h-8"
              />
            </div>
          </div>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Mobile Number"
              value={customerMobile}
              onChange={(e) => setCustomerMobile(e.target.value)}
              className="pl-9 h-8"
            />
          </div>
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="space-y-3">
            {cart.map((item) => (
              <div key={item.id} className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="font-medium text-sm line-clamp-1">
                    {item.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    ₹{item.price} each
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-6 w-6"
                    onClick={() => updateQuantity(item.id, -1)}
                  >
                    <Minus className="w-3 h-3" />
                  </Button>
                  <span className="w-6 text-center text-sm font-bold">
                    {item.quantity}
                  </span>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-6 w-6"
                    onClick={() => updateQuantity(item.id, 1)}
                  >
                    <Plus className="w-3 h-3" />
                  </Button>
                </div>
                <p className="font-bold text-sm w-16 text-right">
                  ₹{item.price * item.quantity}
                </p>
              </div>
            ))}
            {cart.length === 0 && (
              <div className="text-center text-muted-foreground py-8">
                Cart is empty
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t bg-slate-50">
          <div className="flex justify-between items-center mb-4">
            <span className="font-bold text-lg">Total</span>
            <span className="font-bold text-2xl text-orange-600">
              ₹{totalAmount}
            </span>
          </div>

          <Button
            className="w-full bg-orange-600 hover:bg-orange-700 py-6 text-lg font-bold shadow-md hover:shadow-lg transition-all"
            disabled={
              isPending || cart.length === 0 || !customerName || !customerMobile
            }
            onClick={handlePlaceOrder}
          >
            {isPending ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : orderSuccess ? (
              <span className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5" /> Placed!
              </span>
            ) : (
              "Place Order"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
