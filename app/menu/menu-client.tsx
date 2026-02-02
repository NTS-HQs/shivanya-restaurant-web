"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useCartStore, CartItem } from "@/lib/store/cart";
import { Plus, Minus, ShoppingCart, Leaf, Drumstick } from "lucide-react";
import Link from "next/link";

type MenuItem = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  image: string | null;
  isVeg: boolean;
  isAvailable: boolean;
};

type Category = {
  id: string;
  name: string;
  items: MenuItem[];
};

export function MenuClient({ categories }: { categories: Category[] }) {
  const [activeCategory, setActiveCategory] = useState(categories[0]?.id || "");
  const {
    items: cartItems,
    addItem,
    updateQuantity,
    getTotalItems,
    getTotalAmount,
  } = useCartStore();

  const getItemQuantity = (itemId: string) => {
    const item = cartItems.find((i) => i.id === itemId);
    return item?.quantity || 0;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-amber-50 pb-24">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-white/90 backdrop-blur-lg shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold text-center mb-4">🍽️ Our Menu</h1>

          {/* Category Tabs */}
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setActiveCategory(category.id)}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                  activeCategory === category.id
                    ? "bg-gradient-to-r from-orange-600 to-red-600 text-white shadow-lg"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {category.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Menu Items */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        <AnimatePresence mode="wait">
          {categories.map(
            (category) =>
              category.id === activeCategory && (
                <motion.div
                  key={category.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-4"
                >
                  {category.items.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">
                      No items available in this category
                    </p>
                  ) : (
                    category.items.map((item) => (
                      <MenuItemCard
                        key={item.id}
                        item={item}
                        quantity={getItemQuantity(item.id)}
                        onAdd={() =>
                          addItem({
                            id: item.id,
                            name: item.name,
                            price: item.price,
                            isVeg: item.isVeg,
                          })
                        }
                        onUpdateQuantity={(qty) => updateQuantity(item.id, qty)}
                      />
                    ))
                  )}
                </motion.div>
              )
          )}
        </AnimatePresence>
      </div>

      {/* Floating Cart Button */}
      {getTotalItems() > 0 && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="fixed bottom-4 left-4 right-4 z-40"
        >
          <Link href="/checkout">
            <Button className="w-full bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white py-6 rounded-2xl shadow-2xl flex items-center justify-between px-6">
              <div className="flex items-center gap-2">
                <ShoppingCart className="w-5 h-5" />
                <span className="font-bold">{getTotalItems()} items</span>
              </div>
              <span className="font-bold text-lg">₹{getTotalAmount()}</span>
            </Button>
          </Link>
        </motion.div>
      )}
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
    <Card
      className={`p-4 flex gap-4 bg-white shadow-md border-0 overflow-hidden ${
        !item.isAvailable ? "opacity-60 grayscale" : ""
      }`}
    >
      {/* Veg/Non-Veg Indicator */}
      <div className="flex flex-col items-start gap-2 flex-1">
        <div className="flex items-center gap-2">
          {item.isVeg ? (
            <Badge
              variant="outline"
              className="border-green-500 text-green-600 gap-1"
            >
              <Leaf className="w-3 h-3" /> Veg
            </Badge>
          ) : (
            <Badge
              variant="outline"
              className="border-red-500 text-red-600 gap-1"
            >
              <Drumstick className="w-3 h-3" /> Non-Veg
            </Badge>
          )}
          {!item.isAvailable && (
            <Badge variant="destructive" className="ml-2">
              Unavailable
            </Badge>
          )}
        </div>

        <h3 className="font-bold text-lg">{item.name}</h3>

        {item.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {item.description}
          </p>
        )}

        <p className="font-bold text-lg text-orange-600">₹{item.price}</p>
      </div>

      {/* Add/Quantity Controls */}
      <div className="flex flex-col justify-end">
        {item.isAvailable ? (
          quantity === 0 ? (
            <Button
              onClick={onAdd}
              className="bg-orange-100 hover:bg-orange-200 text-orange-600 font-bold"
            >
              ADD
            </Button>
          ) : (
            <div className="flex items-center gap-2 bg-orange-100 rounded-lg p-1">
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8 text-orange-600"
                onClick={() => onUpdateQuantity(quantity - 1)}
              >
                <Minus className="w-4 h-4" />
              </Button>
              <span className="w-6 text-center font-bold text-orange-600">
                {quantity}
              </span>
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8 text-orange-600"
                onClick={() => onUpdateQuantity(quantity + 1)}
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          )
        ) : (
          <Button disabled variant="outline">
            Out of Stock
          </Button>
        )}
      </div>
    </Card>
  );
}
