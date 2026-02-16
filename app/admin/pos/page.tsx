"use client";

import { useState, useEffect, useTransition } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { getMenuWithCategories } from "@/lib/actions/menu";
import { placeOrder } from "@/lib/actions/orders";
import { Variant } from "@/lib/actions/seller";
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

// Helper to parse variants from JSON
type PrismaJson = {
  name: string;
  price: number;
};

export default function POSPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [customerName, setCustomerName] = useState("");
  const [customerMobile, setCustomerMobile] = useState("");
  const [tableNumber, setTableNumber] = useState("");
  const [isPending, startTransition] = useTransition();
  const [orderSuccess, setOrderSuccess] = useState<string | null>(null);
  const [showCart, setShowCart] = useState(false);

  useEffect(() => {
    getMenuWithCategories().then((data) => {
      setCategories(data);
    });
  }, []);

  const getVariants = (item: MenuItem): Variant[] => {
    const variants = (item as any).variants;
    if (!variants) return [];
    if (Array.isArray(variants)) return variants as Variant[];
    return [];
  };

  const addToCart = (item: MenuItem, variant: Variant) => {
    if (!variant.price) return;
    
    const itemId = `${item.id}-${variant.name}`;
    const itemName = `${item.name} (${variant.name})`;
    
    setCart((prev) => {
      const existing = prev.find((i) => i.id === itemId);
      if (existing) {
        return prev.map((i) =>
          i.id === itemId ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [
        ...prev,
        { id: itemId, name: itemName, price: variant.price, quantity: 1 },
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
    if (cart.length === 0) return;

    startTransition(async () => {
      const result = await placeOrder({
        customerName,
        customerMobile,
        type: "DINE_IN",
        tableNumber: tableNumber || undefined,
        items: cart,
      });
      if (result.success && result.orderId) {
        setOrderSuccess(result.orderId);
        setCart([]);
        setCustomerName("");
        setCustomerMobile("");
        setTableNumber("");
        setShowCart(false);
        setTimeout(() => setOrderSuccess(null), 3000);
      }
    });
  };

  const allItems = categories.flatMap((c) => c.items);
  const itemsToFilter =
    activeCategory === "all"
      ? allItems
      : categories.find((c) => c.id === activeCategory)?.items || [];

  const filteredItems = itemsToFilter.filter((i) =>
    i.name.toLowerCase().includes(search.toLowerCase())
  );

  console.log("POS Items:", {
    categoriesCount: categories.length,
    itemsToFilterCount: itemsToFilter.length,
    filteredItemsCount: filteredItems.length,
  });

  return (
    <div className="flex flex-col lg:flex-row h-screen overflow-hidden bg-slate-50">
      {/* Menu Selection Area */}
      <div className="flex-1 flex flex-col p-4 gap-4 overflow-hidden">
        {/* Header & Search */}
        <div className="flex gap-4 items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search items..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-white"
            />
          </div>
          <Button
            className="lg:hidden relative bg-orange-600 hover:bg-orange-700"
            size="icon"
            onClick={() => setShowCart(true)}
          >
            <ShoppingCart className="w-5 h-5" />
            {cart.length > 0 && (
              <Badge className="absolute -top-2 -right-2 bg-slate-900 border-white text-[10px] px-1.5 py-0">
                {cart.reduce((s, i) => s + i.quantity, 0)}
              </Badge>
            )}
          </Button>
        </div>

        {/* Categories */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          <Button
            variant={activeCategory === "all" ? "default" : "outline"}
            onClick={() => setActiveCategory("all")}
            className="whitespace-nowrap"
          >
            All Items
          </Button>
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
            {filteredItems.map((item) => {
              const variants = getVariants(item);
              return (
                <Card
                  key={item.id}
                  className="p-3 border border-slate-200 shadow-sm bg-white"
                >
                  <h3 className="font-bold line-clamp-1 text-slate-800 mb-2">
                    {item.name}
                  </h3>
                  <div className="space-y-1">
                    {variants.length > 0 ? (
                      variants.map((variant, idx) => (
                        <div 
                          key={idx}
                          className="flex justify-between items-center cursor-pointer hover:bg-slate-50 p-1 rounded"
                          onClick={() => addToCart(item, variant)}
                        >
                          <span className="text-xs text-slate-600">{variant.name}</span>
                          <span className="text-orange-600 font-bold text-sm">₹{variant.price}</span>
                        </div>
                      ))
                    ) : (
                      <span className="text-xs text-slate-400">No variants</span>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      </div>

      {/* Cart Sidebar */}
      {/* Backdrop for Mobile */}
      {showCart && (
        <div
          className="fixed inset-0 bg-black/40 z-40 lg:hidden backdrop-blur-sm transition-opacity"
          onClick={() => setShowCart(false)}
        />
      )}

      <div
        className={`
        fixed inset-y-0 right-0 z-50 w-[85%] sm:w-80 md:w-96 bg-white border-l shadow-2xl flex flex-col h-full transition-transform duration-300 ease-in-out
        lg:relative lg:translate-x-0 lg:z-0 lg:w-96 lg:shadow-xl lg:flex
        ${showCart ? "translate-x-0" : "translate-x-full lg:translate-x-0"}
      `}
      >
        <div className="p-4 border-b flex justify-between items-center">
          <h2 className="font-bold text-lg flex items-center gap-2">
            <ShoppingCart className="w-5 h-5" /> Current Order
          </h2>
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setShowCart(false)}
          >
            <Trash2 className="w-5 h-5 text-slate-400" />
          </Button>
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
            disabled={isPending || cart.length === 0}
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

      {/* Floating Cart Summary for Mobile */}
      {cart.length > 0 && !showCart && (
        <div className="lg:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-40 w-[calc(100%-3rem)] max-w-sm">
          <Button
            onClick={() => setShowCart(true)}
            className="w-full bg-slate-900 hover:bg-black text-white h-14 rounded-2xl shadow-2xl flex items-center justify-between px-6 font-bold"
          >
            <div className="flex items-center gap-3">
              <div className="bg-orange-600 rounded-lg p-1.5">
                <ShoppingCart className="w-4 h-4 text-white" />
              </div>
              <span className="text-sm">
                {cart.reduce((s, i) => s + i.quantity, 0)} Items
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm opacity-60">Total:</span>
              <span className="text-orange-400 font-bold">₹{totalAmount}</span>
            </div>
          </Button>
        </div>
      )}
    </div>
  );
}
