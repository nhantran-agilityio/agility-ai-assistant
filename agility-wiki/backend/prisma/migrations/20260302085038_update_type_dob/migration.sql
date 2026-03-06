/*
  Warnings:

  - The `date_of_birth` column on the `Employee` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "Employee" DROP COLUMN "date_of_birth",
ADD COLUMN     "date_of_birth" TIMESTAMP(3);
