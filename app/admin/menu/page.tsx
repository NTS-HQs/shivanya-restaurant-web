"use client";

import { useEffect, useState, useTransition } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ImageUpload } from "@/components/ui/image-upload";
import { getAllMenuItems, getMenuWithCategories } from "@/lib/actions/menu";
import {
  toggleMenuItem,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
  createCategory,
  getCategories,
} from "@/lib/actions/seller";
import {
  Plus,
  Leaf,
  Drumstick,
  ToggleLeft,
  ToggleRight,
  Loader2,
  Pencil,
  Trash2,
} from "lucide-react";

type MenuItem = Awaited<ReturnType<typeof getAllMenuItems>>[0];
type Category = { id: string; name: string };

export default function MenuManagementPage() {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isPending, startTransition] = useTransition();
  const [showAddItem, setShowAddItem] = useState(false);
  const [showAddCategory, setShowAddCategory] = useState(false);

  // New item form
  const [newItem, setNewItem] = useState({
    name: "",
    description: "",
    price: "",
    image: "",
    isVeg: true,
    categoryId: "",
  });
  const [newCategoryName, setNewCategoryName] = useState("");

  const fetchData = async () => {
    const [menuItems, cats] = await Promise.all([
      getAllMenuItems(),
      getCategories(),
    ]);
    setItems(menuItems);
    setCategories(cats);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleToggleAvailability = (itemId: string, currentStatus: boolean) => {
    startTransition(async () => {
      await toggleMenuItem(itemId, !currentStatus);
      await fetchData();
    });
  };

  const handleAddItem = () => {
    if (!newItem.name || !newItem.price || !newItem.categoryId) return;

    startTransition(async () => {
      await createMenuItem({
        name: newItem.name,
        description: newItem.description || undefined,
        price: parseFloat(newItem.price),
        image: newItem.image || undefined,
        isVeg: newItem.isVeg,
        categoryId: newItem.categoryId,
      });
      setNewItem({
        name: "",
        description: "",
        price: "",
        image: "",
        isVeg: true,
        categoryId: "",
      });
      setShowAddItem(false);
      await fetchData();
    });
  };

  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);

  const handleUpdateItem = () => {
    if (!editingItem || !editingItem.name || !editingItem.price) return;

    startTransition(async () => {
      await updateMenuItem(editingItem.id, {
        name: editingItem.name,
        description: editingItem.description || undefined,
        price: Number(editingItem.price),
        image: editingItem.image || undefined,
        isVeg: editingItem.isVeg,
        categoryId: editingItem.categoryId,
      });
      setEditingItem(null);
      await fetchData();
    });
  };

  const handleDeleteItem = (itemId: string) => {
    if (!confirm("Are you sure you want to delete this item?")) return;

    startTransition(async () => {
      await deleteMenuItem(itemId);
      await fetchData();
    });
  };

  const handleAddCategory = () => {
    if (!newCategoryName.trim()) return;

    startTransition(async () => {
      await createCategory(newCategoryName.trim());
      setNewCategoryName("");
      setShowAddCategory(false);
      await fetchData();
    });
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Menu Management</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowAddCategory(true)}>
            <Plus className="w-4 h-4 mr-1" /> Category
          </Button>
          <Button onClick={() => setShowAddItem(true)}>
            <Plus className="w-4 h-4 mr-1" /> Add Item
          </Button>
        </div>
      </div>

      {/* Add Category Modal */}
      {showAddCategory && (
        <Card className="p-4 mb-6 border-2 border-dashed border-orange-300">
          <h3 className="font-bold mb-3">Add New Category</h3>
          <div className="flex gap-2">
            <Input
              placeholder="Category Name"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
            />
            <Button onClick={handleAddCategory} disabled={isPending}>
              {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Add"}
            </Button>
            <Button variant="outline" onClick={() => setShowAddCategory(false)}>
              Cancel
            </Button>
          </div>
        </Card>
      )}

      {/* Add Item Form */}
      {showAddItem && (
        <Card className="p-4 mb-6 border-2 border-dashed border-orange-300">
          <h3 className="font-bold mb-3">Add New Menu Item</h3>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Item Image
              </label>
              <ImageUpload
                value={newItem.image}
                onChange={(url) => setNewItem({ ...newItem, image: url })}
              />
            </div>

            <Input
              placeholder="Item Name *"
              value={newItem.name}
              onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
            />
            <Input
              placeholder="Price *"
              type="number"
              value={newItem.price}
              onChange={(e) =>
                setNewItem({ ...newItem, price: e.target.value })
              }
            />
            <Input
              placeholder="Description"
              value={newItem.description}
              onChange={(e) =>
                setNewItem({ ...newItem, description: e.target.value })
              }
            />
            <select
              className="border rounded-md px-3 py-2"
              value={newItem.categoryId}
              onChange={(e) =>
                setNewItem({ ...newItem, categoryId: e.target.value })
              }
            >
              <option value="">Select Category *</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  checked={newItem.isVeg}
                  onChange={() => setNewItem({ ...newItem, isVeg: true })}
                />
                <Leaf className="w-4 h-4 text-green-600" /> Veg
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  checked={!newItem.isVeg}
                  onChange={() => setNewItem({ ...newItem, isVeg: false })}
                />
                <Drumstick className="w-4 h-4 text-red-600" /> Non-Veg
              </label>
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <Button onClick={handleAddItem} disabled={isPending}>
              {isPending ? (
                <Loader2 className="w-4 h-4 animate-spin mr-1" />
              ) : null}
              Add Item
            </Button>
            <Button variant="outline" onClick={() => setShowAddItem(false)}>
              Cancel
            </Button>
          </div>
        </Card>
      )}

      {/* Edit Item Modal */}
      {editingItem && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="p-6 w-full max-w-lg bg-white overflow-y-auto max-h-[90vh]">
            <h3 className="font-bold text-lg mb-4">Edit Menu Item</h3>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Item Image
                </label>
                <ImageUpload
                  value={editingItem.image || ""}
                  onChange={(url) =>
                    setEditingItem({ ...editingItem, image: url })
                  }
                />
              </div>

              <Input
                placeholder="Item Name *"
                value={editingItem.name}
                onChange={(e) =>
                  setEditingItem({ ...editingItem, name: e.target.value })
                }
              />
              <Input
                placeholder="Price *"
                type="number"
                value={editingItem.price}
                onChange={(e) =>
                  setEditingItem({
                    ...editingItem,
                    price: Number(e.target.value),
                  })
                }
              />
              <Input
                placeholder="Description"
                value={editingItem.description || ""}
                onChange={(e) =>
                  setEditingItem({
                    ...editingItem,
                    description: e.target.value,
                  })
                }
              />
              <select
                className="border rounded-md px-3 py-2"
                value={editingItem.categoryId}
                onChange={(e) =>
                  setEditingItem({ ...editingItem, categoryId: e.target.value })
                }
              >
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    checked={editingItem.isVeg}
                    onChange={() =>
                      setEditingItem({ ...editingItem, isVeg: true })
                    }
                  />
                  <Leaf className="w-4 h-4 text-green-600" /> Veg
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    checked={!editingItem.isVeg}
                    onChange={() =>
                      setEditingItem({ ...editingItem, isVeg: false })
                    }
                  />
                  <Drumstick className="w-4 h-4 text-red-600" /> Non-Veg
                </label>
              </div>
            </div>
            <div className="flex gap-2 mt-6 justify-end">
              <Button variant="outline" onClick={() => setEditingItem(null)}>
                Cancel
              </Button>
              <Button onClick={handleUpdateItem} disabled={isPending}>
                {isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-1" />
                ) : (
                  <Pencil className="w-4 h-4 mr-1" />
                )}
                Update Item
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Menu Items List */}
      <div className="space-y-4">
        {categories.map((category) => {
          const categoryItems = items.filter(
            (i) => i.categoryId === category.id
          );
          if (categoryItems.length === 0) return null;

          return (
            <div key={category.id}>
              <h2 className="text-lg font-bold mb-3 text-orange-600">
                {category.name}
              </h2>
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {categoryItems.map((item) => (
                  <Card
                    key={item.id}
                    className={`p-4 border border-slate-200 shadow-sm bg-white hover:shadow-md transition-all ${
                      !item.isAvailable ? "opacity-60 bg-slate-50" : ""
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex gap-3">
                        {/* Thumbnail */}
                        <div className="w-16 h-16 rounded-lg bg-slate-100 overflow-hidden shrink-0">
                          {item.image ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={item.image}
                              alt={item.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-xl">
                              🍲
                            </div>
                          )}
                        </div>

                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            {item.isVeg ? (
                              <Badge
                                variant="outline"
                                className="border-green-500 text-green-600"
                              >
                                <Leaf className="w-3 h-3" />
                              </Badge>
                            ) : (
                              <Badge
                                variant="outline"
                                className="border-red-500 text-red-600"
                              >
                                <Drumstick className="w-3 h-3" />
                              </Badge>
                            )}
                            <span className="font-bold">{item.name}</span>
                          </div>
                          {item.description && (
                            <p className="text-sm text-muted-foreground mr-1 line-clamp-1">
                              {item.description}
                            </p>
                          )}
                          <p className="font-bold text-orange-600 mt-1">
                            ₹{item.price}
                          </p>
                        </div>
                      </div>

                      <div className="flex gap-1 flex-col">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setEditingItem(item)}
                          title="Edit"
                          className="h-8 w-8"
                        >
                          <Pencil className="w-4 h-4 text-blue-600" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() =>
                            handleToggleAvailability(item.id, item.isAvailable)
                          }
                          title={
                            item.isAvailable
                              ? "Mark Unavailable"
                              : "Mark Available"
                          }
                          className="h-8 w-8"
                        >
                          {item.isAvailable ? (
                            <ToggleRight className="w-6 h-6 text-green-600" />
                          ) : (
                            <ToggleLeft className="w-6 h-6 text-gray-400" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteItem(item.id)}
                          title="Delete"
                          className="text-red-500 hover:text-red-700 hover:bg-red-50 h-8 w-8"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
