/*
  Warnings:

  - You are about to drop the column `location_id` on the `projects` table. All the data in the column will be lost.
  - You are about to drop the column `plant_code` on the `projects` table. All the data in the column will be lost.
  - You are about to drop the column `program_id` on the `projects` table. All the data in the column will be lost.
  - You are about to drop the column `vendor_code` on the `projects` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "projects" DROP CONSTRAINT "fk_projects_location";

-- DropForeignKey
ALTER TABLE "projects" DROP CONSTRAINT "fk_projects_plant";

-- DropForeignKey
ALTER TABLE "projects" DROP CONSTRAINT "fk_projects_program";

-- DropForeignKey
ALTER TABLE "projects" DROP CONSTRAINT "fk_projects_vendor";

-- AlterTable
ALTER TABLE "project_items" ADD COLUMN     "location_id" INTEGER,
ADD COLUMN     "plant_code" VARCHAR(20),
ADD COLUMN     "program_id" INTEGER,
ADD COLUMN     "vendor_code" VARCHAR(50);

-- AlterTable
ALTER TABLE "projects" DROP COLUMN "location_id",
DROP COLUMN "plant_code",
DROP COLUMN "program_id",
DROP COLUMN "vendor_code";

-- AddForeignKey
ALTER TABLE "project_items" ADD CONSTRAINT "fk_items_location" FOREIGN KEY ("location_id") REFERENCES "dim_locations"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "project_items" ADD CONSTRAINT "fk_items_plant" FOREIGN KEY ("plant_code") REFERENCES "dim_plants"("plant_code") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "project_items" ADD CONSTRAINT "fk_items_program" FOREIGN KEY ("program_id") REFERENCES "dim_programs"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "project_items" ADD CONSTRAINT "fk_items_vendor" FOREIGN KEY ("vendor_code") REFERENCES "dim_vendors"("vendor_code") ON DELETE SET NULL ON UPDATE NO ACTION;
