-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "pickupTime" TEXT,
ADD COLUMN     "rejectionReason" TEXT;

-- AlterTable
ALTER TABLE "RestaurantProfile" ADD COLUMN     "autoAccept" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "bannerImage" TEXT;
