import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // Create default turf settings
  const settings = await prisma.turfSettings.upsert({
    where: { id: "default" },
    update: {},
    create: {
      id: "default",
      openingTime: "06:00",
      closingTime: "22:00",
      pricePerHour: 500.00,
    },
  });
  console.log("Default Turf settings upserted:", settings);

  // Create admin user
  const adminPhone = "1234567890";
  const admin = await prisma.user.upsert({
    where: { phoneNumber: adminPhone },
    update: {},
    create: {
      name: "Admin User",
      phoneNumber: adminPhone,
      role: "ADMIN",
    },
  });
  console.log("Admin user upserted:", admin);

  console.log("Seeding complete successfully.");
}

main()
  .catch((e) => {
    console.error("Error during seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
