"use server";

import { prisma } from "@/lib/db";

export async function getRestaurantProfile() {
  const profile = await prisma.restaurantProfile.findFirst();
  return profile;
}

export async function getMenuWithCategories() {
  const categories = await prisma.category.findMany({
    include: {
      items: {
        orderBy: { name: "asc" },
      },
    },
    orderBy: { sortOrder: "asc" },
  });
  return categories;
}

export async function getAllMenuItems() {
  const items = await prisma.menuItem.findMany({
    include: { category: true },
    orderBy: { name: "asc" },
  });
  return items;
}
