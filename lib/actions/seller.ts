"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/authGuard";

export async function updateRestaurantProfile(data: {
  name?: string;
  ownerName?: string;
  contact?: string;
  address?: string;
  gstNumber?: string;
  openTime?: string;
  closeTime?: string;
  isOpen?: boolean;
  bannerImage?: string;
  bannerImages?: string[];
  marqueeText?: string[];
  paymentQrCode?: string;
  upiId?: string;
  autoAccept?: boolean;
}) {
  await requireAdmin();
  const profile = await prisma.restaurantProfile.findFirst();
  if (!profile) throw new Error("Restaurant profile not found");

  const updated = await prisma.restaurantProfile.update({
    where: { id: profile.id },
    data,
  });
  revalidatePath("/menu");
  revalidatePath("/checkout");
  revalidatePath("/admin/dashboard");
  revalidatePath("/admin/settings");
  return updated;
}

export async function toggleMenuItem(itemId: string, isAvailable: boolean) {
  await requireAdmin();
  const item = await prisma.menuItem.update({
    where: { id: itemId },
    data: { isAvailable },
  });
  revalidatePath("/menu");
  revalidatePath("/admin/pos");
  return item;
}

export type Variant = {
  name: string;
  price: number;
};

export async function createMenuItem(data: {
  name: string;
  description?: string;
  variants: Variant[];
  image?: string;
  isVeg: boolean;
  categoryId: string;
}) {
  await requireAdmin();
  const item = await prisma.menuItem.create({
    data: {
      ...data,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      variants: data.variants as any,
    },
  });
  revalidatePath("/menu");
  revalidatePath("/admin/pos");
  return item;
}

export async function updateMenuItem(
  itemId: string,
  data: {
    name?: string;
    description?: string;
    variants?: Variant[];
    image?: string;
    isVeg?: boolean;
    isAvailable?: boolean;
    categoryId?: string;
  },
) {
  await requireAdmin();
  const item = await prisma.menuItem.update({
    where: { id: itemId },
    data: {
      ...data,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      variants: data.variants as any,
    },
  });
  revalidatePath("/menu");
  revalidatePath("/admin/pos");
  return item;
}

export async function deleteMenuItem(itemId: string) {
  await requireAdmin();
  await prisma.menuItem.delete({ where: { id: itemId } });
  revalidatePath("/menu");
  revalidatePath("/admin/pos");
  return { success: true };
}

export async function createCategory(name: string) {
  await requireAdmin();
  const category = await prisma.category.create({ data: { name } });
  revalidatePath("/menu");
  revalidatePath("/admin/pos");
  return category;
}

export async function deleteCategory(categoryId: string) {
  await requireAdmin();
  // Block deletion if items still use this category
  const itemCount = await prisma.menuItem.count({ where: { categoryId } });
  if (itemCount > 0) {
    throw new Error(
      `Cannot delete: ${itemCount} menu item(s) are still in this category. Delete or move them first.`,
    );
  }
  await prisma.category.delete({ where: { id: categoryId } });
  revalidatePath("/menu");
  revalidatePath("/admin/menu");
  revalidatePath("/admin/pos");
  return { success: true };
}

export async function getCategories() {
  const categories = await prisma.category.findMany({
    orderBy: { sortOrder: "asc" },
  });
  return categories;
}

/**
 * Automatically syncs store open/close status based on scheduled openTime/closeTime.
 * Safe to call on every public page render — only writes to DB when status actually changes.
 * Does NOT require admin auth so it can be called from public server components.
 */
export async function syncStoreAutoStatus() {
  const profile = await prisma.restaurantProfile.findFirst();
  if (!profile || !profile.openTime || !profile.closeTime) return;

  // Get current time in IST (UTC+5:30)
  const now = new Date();
  const istOffset = 5.5 * 60 * 60 * 1000;
  const ist = new Date(now.getTime() + istOffset);
  const hhmm = `${String(ist.getUTCHours()).padStart(2, "0")}:${String(ist.getUTCMinutes()).padStart(2, "0")}`;

  // Compare HH:MM strings — handles both same-day AND overnight ranges
  // Overnight example: openTime="09:00", closeTime="02:00"
  //   → store is open if hhmm >= "09:00" OR hhmm < "02:00"
  // Same-day example: openTime="09:00", closeTime="22:00"
  //   → store is open if hhmm >= "09:00" AND hhmm < "22:00"
  const isOvernight = profile.closeTime < profile.openTime;
  const shouldBeOpen = isOvernight
    ? hhmm >= profile.openTime || hhmm < profile.closeTime
    : hhmm >= profile.openTime && hhmm < profile.closeTime;

  // Only write to DB if the status needs to change (avoids unnecessary writes)
  if (shouldBeOpen !== profile.isOpen) {
    await prisma.restaurantProfile.update({
      where: { id: profile.id },
      data: { isOpen: shouldBeOpen },
    });
    // No revalidatePath here — this is called during render (force-dynamic page).
    revalidatePath("/menu");
    revalidatePath("/checkout");
    revalidatePath("/admin/*");
  }
}
