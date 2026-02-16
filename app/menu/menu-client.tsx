"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useCartStore, CartItem } from "@/lib/store/cart";
import {
  Plus,
  Minus,
  ShoppingCart,
  Leaf,
  Drumstick,
  Search,
  Home,
  Menu as MenuIcon,
  Clock,
  Users,
  Settings,
  LogOut,
  SlidersHorizontal,
  Bell,
  ChevronRight,
  MapPin,
  ExternalLink,
} from "lucide-react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

import { getRestaurantProfile } from "@/lib/actions/menu";

type Variant = {
  name: string;
  price: number;
};

type MenuItem = {
  id: string;
  name: string;
  description: string | null;
  variants: Variant[] | null;
  image: string | null;
  isVeg: boolean;
  isAvailable: boolean;
};

type Category = {
  id: string;
  name: string;
  items: MenuItem[];
};

type Profile = Awaited<ReturnType<typeof getRestaurantProfile>>;

export function MenuClient({
  categories,
  profile,
}: {
  categories: Category[];
  profile: Profile;
}) {
  const [activeCategory, setActiveCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Removed local orderType state in favor of global store state

  const {
    items: cartItems,
    addItem,
    updateQuantity,
    getTotalItems,
    getTotalAmount,
    orderType,
    setOrderType,
  } = useCartStore();

  const [mounted, setMounted] = useState(false);
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [selectedSize, setSelectedSize] = useState<string>("");

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null; // Or a loading skeleton
  }

  const getItemQuantity = (itemId: string) => {
    const item = cartItems.find((i) => i.id === itemId);
    return item?.quantity || 0;
  };

  const filteredCategory = categories.find((c) => c.id === activeCategory);

  const allItems = categories.flatMap((c) => c.items);
  const itemsToFilter =
    activeCategory === "all" ? allItems : filteredCategory?.items || [];

  const displayItems = itemsToFilter.filter((item) =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex h-screen bg-[#F8F9FD] font-sans text-slate-800 overflow-hidden selection:bg-orange-100">
      {/* 1. LEFT SIDEBAR - NAVIGATION */}
      <div className="hidden lg:flex w-24 xl:w-64 bg-white flex-col border-r border-slate-100 h-full flex-shrink-0 z-30">
        <div className="p-8 pb-4">
          <div className="flex items-center gap-2 text-2xl font-bold text-orange-600 tracking-tight">
            <div className="w-8 h-8 bg-orange-600 rounded-lg flex items-center justify-center text-white text-lg">
              S
            </div>
            <span className="hidden xl:inline">Shivanya</span>
          </div>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-2">
          <Link
            href="/"
            className="flex items-center gap-4 px-4 py-3 text-slate-400 hover:text-orange-600 hover:bg-orange-50 rounded-2xl transition-all group"
          >
            <Home className="w-6 h-6 group-hover:scale-110 transition-transform" />
            <span className="font-medium hidden xl:block">Home</span>
          </Link>
          <div className="flex items-center gap-4 px-4 py-3 text-orange-600 bg-orange-50 rounded-2xl font-bold cursor-pointer">
            <MenuIcon className="w-6 h-6" />
            <span className="hidden xl:block">Menu</span>
          </div>
        </nav>
      </div>

      {/* 2. MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col h-full min-w-0 bg-[#F8F9FD]">
        {/* Top Header */}

        {/* Content Scroll Area */}
        <main className="flex-1 overflow-y-auto scroll-smooth relative">
          {/* Banner / Hero */}
          {profile && (
            <div className="relative h-64 sm:h-80 w-full group shrink-0 overflow-hidden z-0">
              {profile.bannerImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={profile.bannerImage}
                  alt="Restaurant Banner"
                  className="absolute inset-0 w-full h-full object-cover"
                />
              ) : (
                <div className="absolute inset-0 bg-slate-900 flex items-center justify-center">
                  <span className="text-4xl">🍕</span>
                </div>
              )}

              {/* Dark Fade Gradient */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />

              <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-10 flex justify-between items-end">
                <div className="text-white">
                  <h1 className="text-4xl sm:text-5xl font-black mb-2 leading-tight drop-shadow-md">
                    {profile.name}
                  </h1>
                  <p className="text-white/90 font-medium text-sm sm:text-lg max-w-md line-clamp-1 drop-shadow-sm">
                    {profile.address}
                  </p>
                </div>
                <Badge
                  className={`backdrop-blur-xl border-0 px-4 py-1.5 text-sm shadow-sm ${
                    profile.isOpen
                      ? "bg-green-500 text-white"
                      : "bg-red-500 text-white"
                  }`}
                >
                  {profile.isOpen ? "Open Now" : "Closed"}
                </Badge>
              </div>
            </div>
          )}

          {/* Main Content with Padding */}
          <div className="p-6 relative z-10">
            {/* Search Bar - Sticky below banner */}
            <div className="sticky top-0 z-30 pt-2 pb-6 -mx-6 px-6 bg-[#F8F9FD]/95 backdrop-blur-sm transition-all mb-4">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <Input
                  placeholder="Search category or menu..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 h-12 rounded-2xl border-none bg-white shadow-sm ring-1 ring-slate-100 focus:ring-orange-200 transition-all font-medium"
                />
              </div>
            </div>

            {/* Categories */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-slate-900">
                  Choose Category
                </h3>
              </div>
              <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
                <button
                  onClick={() => setActiveCategory("all")}
                  className={`
                           flex items-center gap-2 px-4 py-2 rounded-full font-bold whitespace-nowrap transition-all text-sm
                           ${
                             activeCategory === "all"
                               ? "bg-slate-900 text-white shadow-md shadow-slate-200"
                               : "bg-white text-slate-500 hover:bg-slate-100 border border-slate-100"
                           }
                        `}
                >
                  All
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setActiveCategory(cat.id)}
                    className={`
                             flex items-center gap-2 px-4 py-2 rounded-full font-bold whitespace-nowrap transition-all text-sm
                             ${
                               activeCategory === cat.id
                                 ? "bg-slate-900 text-white shadow-md shadow-slate-200"
                                 : "bg-white text-slate-500 hover:bg-slate-100 border border-slate-100"
                             }
                          `}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Menu Grid */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-slate-900">
                  {activeCategory === "all"
                    ? "Full Menu"
                    : filteredCategory?.name + " Menu"}
                </h3>
                <span className="text-slate-400 font-medium text-sm">
                  {displayItems.length} items found
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
                {displayItems.length > 0 ? (
                  displayItems.map((item) => (
                    <div
                      key={item.id}
                      className="bg-white p-4 rounded-[2rem] shadow-sm hover:shadow-md transition-all group border border-slate-50"
                    >
                      <div className="relative h-40 mb-4 rounded-3xl overflow-hidden bg-orange-50">
                        {item.image ? (
                          <img
                            src={item.image}
                            alt={item.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-4xl">
                            🍲
                          </div>
                        )}
                        <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold shadow-sm">
                          {item.isVeg ? (
                            <span className="text-green-600 flex items-center gap-1">
                              <Leaf className="w-3 h-3 fill-current" /> Veg
                            </span>
                          ) : (
                            <span className="text-red-600 flex items-center gap-1">
                              <Drumstick className="w-3 h-3 fill-current" />{" "}
                              Non-Veg
                            </span>
                          )}
                        </div>
                      </div>

                      <h4 className="font-bold text-lg text-slate-800 mb-1 line-clamp-1">
                        {item.name}
                      </h4>
                      <p className="text-xs text-slate-400 line-clamp-2 mb-3 h-8">
                        {item.description}
                      </p>

                      {/* Price Options - Modern Single Button Design */}
                      <div className="mt-3">
                        {item.variants && item.isAvailable ? (
                          <div className="flex items-center justify-between">
                            <div className="text-sm text-slate-500">
                              {item.variants.length === 1 ? (
                                <span className="font-bold text-slate-800">₹{item.variants[0].price}</span>
                              ) : (
                                <span>₹{Math.min(...item.variants.map(v => v.price))} - ₹{Math.max(...item.variants.map(v => v.price))}</span>
                              )}
                            </div>
                            <button
                              onClick={() => {
                                if (item.variants && item.variants.length === 1) {
                                  // Single variant - add directly
                                  addItem({
                                    id: `${item.id}-${item.variants[0].name}`,
                                    name: `${item.name} (${item.variants[0].name})`,
                                    price: item.variants[0].price,
                                    isVeg: item.isVeg,
                                  });
                                } else {
                                  // Multiple variants - show selector
                                  setSelectedItem(item);
                                  setSelectedSize(item.variants?.[0]?.name || "");
                                }
                              }}
                              className="w-10 h-10 bg-orange-600 text-white rounded-full flex items-center justify-center hover:bg-orange-700 transition-colors shadow-md"
                            >
                              <Plus className="w-5 h-5" />
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs font-bold text-slate-300">
                            {item.isAvailable ? "No variants available" : "Sold Out"}
                          </span>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="col-span-full py-12 text-center text-slate-400 flex flex-col items-center">
                    <Search className="w-12 h-12 mb-2 opacity-50" />
                    <p>No delicious items found.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Developer Footer */}
            <footer className="mt-12 mb-8 text-center space-y-2">
              <p className="text-slate-400 text-sm font-medium">
                © {new Date().getFullYear()} {profile?.name}. All rights
                reserved.
              </p>
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
        </main>
      </div>

      {/* 3. RIGHT SIDEBAR - CART / BILLS */}
      <div className="w-[400px] bg-white border-l border-slate-100 flex-col h-full z-30 hidden 2xl:flex shadow-2xl shadow-slate-200">
        <div className="p-8 pb-4">
          <h2 className="text-2xl font-bold text-slate-900 mb-6">
            Current Order
          </h2>

          {/* Service Type Toggles */}
          <div className="bg-slate-50 p-1.5 rounded-2xl flex relative mb-6">
            <div
              className="absolute inset-y-1.5 transition-all w-1/3 bg-white rounded-xl shadow-sm z-0"
              style={{
                left:
                  orderType === "dine_in"
                    ? "4px"
                    : orderType === "takeaway"
                    ? "33.33%"
                    : "66.66%",
              }}
            />
            <button
              onClick={() => setOrderType("dine_in")}
              className={`flex-1 relative z-10 py-2.5 text-sm font-bold text-center transition-colors rounded-xl ${
                orderType === "dine_in"
                  ? "text-slate-800"
                  : "text-slate-400 hover:text-slate-600"
              }`}
            >
              Dine In
            </button>
            <button
              onClick={() => setOrderType("takeaway")}
              className={`flex-1 relative z-10 py-2.5 text-sm font-bold text-center transition-colors rounded-xl ${
                orderType === "takeaway"
                  ? "text-slate-800"
                  : "text-slate-400 hover:text-slate-600"
              }`}
            >
              Take Away
            </button>
            <button
              onClick={() => setOrderType("delivery")}
              className={`flex-1 relative z-10 py-2.5 text-sm font-bold text-center transition-colors rounded-xl ${
                orderType === "delivery"
                  ? "text-slate-800"
                  : "text-slate-400 hover:text-slate-600"
              }`}
            >
              Delivery
            </button>
          </div>

          {/* Order Info */}
        </div>

        {/* Cart Items List */}
        <div className="flex-1 overflow-y-auto px-8 space-y-4 pr-4 custom-scrollbar">
          {cartItems.length > 0 ? (
            cartItems.map((item) => (
              <div key={item.id} className="flex gap-4 group">
                <div className="w-16 h-16 rounded-2xl bg-slate-50 overflow-hidden flex-shrink-0">
                  {/* Placeholder image logic similar to menu items */}
                  <div className="w-full h-full flex items-center justify-center text-xl bg-orange-50 text-orange-400">
                    🍲
                  </div>
                </div>
                <div className="flex-1 flex flex-col justify-center">
                  <h4 className="font-bold text-slate-800 line-clamp-1 text-sm mb-1">
                    {item.name}
                  </h4>
                  <p className="text-xs text-slate-400 font-medium mb-2">
                    ₹{item.price}
                  </p>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      className="w-6 h-6 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600 hover:bg-slate-200"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="text-sm font-bold w-4 text-center">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      className="w-6 h-6 rounded-lg bg-black text-white flex items-center justify-center hover:bg-slate-800"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                </div>
                <div className="flex flex-col justify-between items-end py-1">
                  <span className="font-bold text-slate-800 text-sm">
                    ₹{(item.price || 0) * item.quantity}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div className="h-48 flex flex-col items-center justify-center text-slate-300 border-2 border-dashed border-slate-100 rounded-3xl">
              <ShoppingCart className="w-8 h-8 mb-2 opacity-50" />
              <p className="text-sm font-medium">Cart is empty</p>
            </div>
          )}
        </div>

        {/* Footer / Checkout */}
        <div className="p-8 pt-4">
          <div className="bg-slate-50 rounded-3xl p-6 mb-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-slate-400 text-sm font-medium">
                Items ({getTotalItems()})
              </span>
              <span className="text-slate-800 font-bold">
                ₹{getTotalAmount()}
              </span>
            </div>

            <div className="border-t border-slate-200 border-dashed my-3"></div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500 font-bold">Total</span>₹
              {getTotalAmount()}
            </div>
          </div>

          <Link href="/checkout">
            <Button
              disabled={cartItems.length === 0}
              className="w-full bg-orange-600 hover:bg-orange-700 text-white py-7 rounded-2xl font-bold shadow-xl shadow-orange-200 text-lg transition-transform active:scale-95"
            >
              Place Order
            </Button>
          </Link>
        </div>
      </div>

      {/* MOBILE FLOATING BUTTON (If logic dictates visual parity, we keep this for small screens) */}
      <div className="2xl:hidden fixed bottom-4 right-4 left-4 z-50">
        <Link href="/checkout">
          <Button className="w-full bg-slate-900 text-white py-4 rounded-xl shadow-2xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-orange-600 w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm">
                {getTotalItems()}
              </div>
              <div className="text-left">
                <p className="text-xs text-slate-400">Total</p>
                <p className="font-bold">₹{getTotalAmount()}</p>
              </div>
            </div>
            <span className="font-bold flex items-center gap-2">
              Checkout <ChevronRight className="w-4 h-4" />
            </span>
          </Button>
        </Link>
      </div>

      {/* Size Selector Modal */}
      <AnimatePresence>
        {selectedItem && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedItem(null)}
              className="fixed inset-0 bg-black/40 z-50 backdrop-blur-sm"
            />
            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed inset-0 flex items-center justify-center z-50 p-4 pointer-events-none"
            >
              <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 pointer-events-auto">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-lg text-slate-800">
                    {selectedItem.name}
                  </h3>
                  <button
                    onClick={() => setSelectedItem(null)}
                    className="text-slate-400 hover:text-slate-600"
                  >
                    <span className="text-2xl">×</span>
                  </button>
                </div>
                
                <p className="text-sm text-slate-500 mb-4">Select Size</p>
                
                <div className="space-y-2 mb-6">
                  {selectedItem.variants?.map((variant) => (
                    <label
                      key={variant.name}
                      className={`flex items-center justify-between p-3 rounded-xl border-2 cursor-pointer transition-all ${
                        selectedSize === variant.name
                          ? "border-orange-600 bg-orange-50"
                          : "border-slate-100 hover:border-slate-200"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="radio"
                          name="size"
                          value={variant.name}
                          checked={selectedSize === variant.name}
                          onChange={() => setSelectedSize(variant.name)}
                          className="w-4 h-4 text-orange-600 focus:ring-orange-600"
                        />
                        <span className="font-medium text-slate-700">
                          {variant.name}
                        </span>
                      </div>
                      <span className="font-bold text-slate-800">
                        ₹{variant.price}
                      </span>
                    </label>
                  ))}
                </div>
                
                <button
                  onClick={() => {
                    const variant = selectedItem.variants?.find(
                      (v) => v.name === selectedSize
                    );
                    if (variant) {
                      addItem({
                        id: `${selectedItem.id}-${variant.name}`,
                        name: `${selectedItem.name} (${variant.name})`,
                        price: variant.price,
                        isVeg: selectedItem.isVeg,
                      });
                      setSelectedItem(null);
                    }
                  }}
                  className="w-full py-3 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl transition-colors"
                >
                  Add to Cart
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

function MenuItemCard({
  item,
  quantity,
  onAdd,
  onUpdateQuantity,
}: {
  item: MenuItem;
  quantity: number;
  onAdd: () => void;
  onUpdateQuantity: (qty: number) => void;
}) {
  return (
    <Card className="border-0 shadow-sm bg-white rounded-3xl overflow-hidden hover:shadow-md transition-all flex flex-col h-full group">
      {/* Image Area - Placeholder if detailed image not available */}
      <div className="h-40 bg-slate-100 relative overflow-hidden flex items-center justify-center">
        {item.image ? (
          <img
            src={item.image}
            alt={item.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="text-4xl">🥘</div>
        )}
        <Badge
          className={`absolute top-3 left-3 backdrop-blur-md border-0 ${
            item.isVeg
              ? "bg-white/90 text-green-700"
              : "bg-white/90 text-red-700"
          }`}
        >
          {item.isVeg ? "Veg" : "Non-Veg"}
        </Badge>
        {!item.isAvailable && (
          <div className="absolute inset-0 bg-white/60 flex items-center justify-center backdrop-blur-sm">
            <Badge variant="secondary" className="font-bold">
              Out of Stock
            </Badge>
          </div>
        )}
      </div>

      <div className="p-5 flex-1 flex flex-col">
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-bold text-slate-900 text-lg leading-tight">
            {item.name}
          </h3>
        </div>

        <p className="text-sm text-slate-400 line-clamp-2 mb-4 flex-1">
          {item.description || "Freshly prepared delicious meal."}
        </p>

        <div className="mt-auto pt-2">
          {item.isAvailable ? (
            quantity === 0 ? (
              <Button
                onClick={onAdd}
                variant="outline"
                className="w-full rounded-xl border-orange-200 text-orange-600 hover:bg-orange-50 hover:text-orange-700 font-bold"
              >
                Add to Plate
              </Button>
            ) : (
              <div className="flex items-center justify-between bg-slate-900 rounded-xl p-1 text-white">
                <button
                  onClick={() => onUpdateQuantity(quantity - 1)}
                  className="w-10 h-8 flex items-center justify-center hover:bg-slate-700 rounded-lg transition-colors"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="font-bold">{quantity}</span>
                <button
                  onClick={() => onUpdateQuantity(quantity + 1)}
                  className="w-10 h-8 flex items-center justify-center hover:bg-slate-700 rounded-lg transition-colors"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            )
          ) : (
            <Button
              disabled
              className="w-full bg-slate-100 text-slate-400 rounded-xl"
            >
              Unavailable
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}
