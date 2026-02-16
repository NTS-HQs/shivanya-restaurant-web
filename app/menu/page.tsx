import {
  getMenuWithCategories,
  getRestaurantProfile,
} from "@/lib/actions/menu";
import { MenuClient } from "./menu-client";

type Variant = {
  name: string;
  price: number;
};

// Transform categories to properly type the variants
function transformCategories(categories: Awaited<ReturnType<typeof getMenuWithCategories>>) {
  return categories.map((category) => ({
    ...category,
    items: category.items.map((item) => ({
      ...item,
      variants: item.variants ? (item.variants as unknown as Variant[]) : null,
    })),
  }));
}

export default async function MenuPage() {
  const [categories, profile] = await Promise.all([
    getMenuWithCategories(),
    getRestaurantProfile(),
  ]);

  const transformedCategories = transformCategories(categories);

  return <MenuClient categories={transformedCategories} profile={profile} />;
}
