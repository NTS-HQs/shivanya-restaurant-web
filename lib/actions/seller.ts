"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";

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
  paymentQrCode?: string;
  upiId?: string;
  autoAccept?: boolean;
}) {
  const profile = await prisma.restaurantProfile.findFirst();
  if (!profile) throw new Error("Restaurant profile not found");

  const updated = await prisma.restaurantProfile.update({
    where: { id: profile.id },
    data,
  });
  revalidatePath("/");
  revalidatePath("/menu");
  revalidatePath("/checkout");
  revalidatePath("/admin/dashboard");
  revalidatePath("/admin/settings");
  return updated;
}

export async function toggleMenuItem(itemId: string, isAvailable: boolean) {
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
  const item = await prisma.menuItem.create({
    data: {
      ...data,
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
  const item = await prisma.menuItem.update({
    where: { id: itemId },
    data: {
      ...data,
      variants: data.variants as any,
    },
  });
  revalidatePath("/menu");
  revalidatePath("/admin/pos");
  return item;
}

export async function deleteMenuItem(itemId: string) {
  await prisma.menuItem.delete({ where: { id: itemId } });
  revalidatePath("/menu");
  revalidatePath("/admin/pos");
  return { success: true };
}

export async function createCategory(name: string) {
  const category = await prisma.category.create({ data: { name } });
  revalidatePath("/menu");
  revalidatePath("/admin/pos");
  return category;
}

export async function getCategories() {
  const categories = await prisma.category.findMany({
    orderBy: { sortOrder: "asc" },
  });
  return categories;
}
