import {
  getMenuWithCategories,
  getRestaurantProfile,
} from "@/lib/actions/menu";
import { MenuClient } from "./menu-client";

export default async function MenuPage() {
  const [categories, profile] = await Promise.all([
    getMenuWithCategories(),
    getRestaurantProfile(),
  ]);

  return <MenuClient categories={categories} profile={profile} />;
}
