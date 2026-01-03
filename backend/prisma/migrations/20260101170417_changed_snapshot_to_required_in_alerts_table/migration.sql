/*
  Warnings:

  - Made the column `snapshot` on table `Alert` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Alert" ALTER COLUMN "snapshot" SET NOT NULL;
