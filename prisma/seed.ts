import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  // Create Admin
  await prisma.admin.upsert({
    where: { email: "admin@shivanya.com" },
    update: {},
    create: {
      email: "admin@shivanya.com",
      password: "password123", // In real app, hash this!
    },
  });

  // Check if profile exists
  const existingProfile = await prisma.restaurantProfile.findFirst();
  if (!existingProfile) {
    await prisma.restaurantProfile.create({
      data: {
        name: "Shivanya Restaurant",
        ownerName: "Shivanya Owner",
        contact: "9876543210",
        address: "123 Food Street, Tasty City",
        openTime: "10:00",
        closeTime: "23:00",
        isOpen: true,
      },
    });
  }

  // Create Categories & Items
  const starters = await prisma.category.create({
    data: {
      name: "Starters",
      items: {
        create: [
          {
            name: "Paneer Tikka",
            variants: [
              { name: "Half", price: 150 },
              { name: "Full", price: 250 },
            ],
            description: "Spicy cottage cheese",
            isVeg: true,
          },
          {
            name: "Chicken 65",
            variants: [
              { name: "Half", price: 180 },
              { name: "Full", price: 300 },
            ],
            description: "Spicy fried chicken",
            isVeg: false,
          },
        ],
      },
    },
  });

  const mainCourse = await prisma.category.create({
    data: {
      name: "Main Course",
      items: {
        create: [
          {
            name: "Butter Chicken",
            variants: [
              { name: "Half", price: 250 },
              { name: "Full", price: 400 },
            ],
            description: "Rich tomato gravy",
            isVeg: false,
          },
          {
            name: "Dal Tadka",
            variants: [
              { name: "Half", price: 120 },
              { name: "Full", price: 200 },
            ],
            description: "Yellow dal with spices",
            isVeg: true,
          },
        ],
      },
    },
  });

  console.log("Seeding finished.");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
