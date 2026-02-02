import { getMenuWithCategories } from "@/lib/actions/menu";
import { MenuClient } from "./menu-client";

export default async function MenuPage() {
  const categories = await getMenuWithCategories();

  return <MenuClient categories={categories} />;
}
