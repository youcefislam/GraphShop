/*
  Warnings:

  - You are about to drop the column `boughtAt` on the `cart` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `cart` DROP COLUMN `boughtAt`,
    ADD COLUMN `addedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3);
