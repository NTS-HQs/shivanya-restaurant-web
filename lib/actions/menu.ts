"use server";

import { prisma } from "@/lib/db";

export async function getRestaurantProfile() {
  if (!process.env.DATABASE_URL) return null;
  const profile = await prisma.restaurantProfile.findFirst();

  if (profile && profile.openTime && profile.closeTime) {
    // Simple time comparison "HH:mm"
    const now = new Date();
    // Adjust for timezone if needed, assuming server time for simplicity or IST
    // For robust local time, we might need a library, but basic string compare works for 24h format
    const currentHour = now.getHours().toString().padStart(2, "0");
    const currentMinute = now.getMinutes().toString().padStart(2, "0");
    const currentTime = `${currentHour}:${currentMinute}`;

    const isOpenNow =
      currentTime >= profile.openTime && currentTime <= profile.closeTime;

    // We can either update the DB or just return the computed status
    // Updating DB ensures admin panel sees the correct status without refresh logic complexities
    if (profile.isOpen !== isOpenNow) {
      await prisma.restaurantProfile.update({
        where: { id: profile.id },
        data: { isOpen: isOpenNow },
      });
      profile.isOpen = isOpenNow;
    }
  }

  return profile;
}

export async function getMenuWithCategories() {
  if (!process.env.DATABASE_URL) return [];
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
  if (!process.env.DATABASE_URL) return [];
  const items = await prisma.menuItem.findMany({
    include: { category: true },
    orderBy: { name: "asc" },
  });
  return items;
}
