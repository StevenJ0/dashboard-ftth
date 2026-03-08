-- CreateTable
CREATE TABLE "dim_regionals" (
    "id" SERIAL NOT NULL,
    "regional_name" VARCHAR(50) NOT NULL,

    CONSTRAINT "dim_regionals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dim_witels" (
    "id" SERIAL NOT NULL,
    "witel_name" VARCHAR(50) NOT NULL,
    "regional_id" INTEGER NOT NULL,

    CONSTRAINT "dim_witels_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dim_locations" (
    "id" SERIAL NOT NULL,
    "sub_district" VARCHAR(100),
    "port_location" VARCHAR(50),
    "witel_id" INTEGER,

    CONSTRAINT "dim_locations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dim_plants" (
    "plant_code" VARCHAR(20) NOT NULL,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "dim_plants_pkey" PRIMARY KEY ("plant_code")
);

-- CreateTable
CREATE TABLE "dim_programs" (
    "id" SERIAL NOT NULL,
    "program_name" VARCHAR(255),

    CONSTRAINT "dim_programs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dim_vendors" (
    "vendor_code" VARCHAR(50) NOT NULL,
    "vendor_name" VARCHAR(255),

    CONSTRAINT "dim_vendors_pkey" PRIMARY KEY ("vendor_code")
);

-- CreateTable
CREATE TABLE "project_items" (
    "id" SERIAL NOT NULL,
    "wbs_id" VARCHAR(50),
    "short_text" TEXT,
    "pr_number" VARCHAR(50),
    "po_number" VARCHAR(50),
    "pr_date" DATE,
    "po_date" DATE,
    "delivery_date" DATE,
    "gr_date" DATE,
    "pr_amount" DECIMAL(19,2),
    "po_amount" DECIMAL(19,2),
    "gr_amount" DECIMAL(19,2),
    "ir_amount" DECIMAL(19,2),
    "progress_percent" DOUBLE PRECISION,
    "status_lapangan" VARCHAR(100),
    "status_tomps_percent" VARCHAR(50),
    "status_tomps_stage" VARCHAR(100),
    "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "project_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "projects" (
    "wbs_id" VARCHAR(50) NOT NULL,
    "project_name" TEXT,
    "identification_project" VARCHAR(100),
    "project_type" VARCHAR(20),
    "plant_code" VARCHAR(20),
    "location_id" INTEGER,
    "program_id" INTEGER,
    "vendor_code" VARCHAR(50),
    "contract_number" VARCHAR(100),
    "contract_date" DATE,

    CONSTRAINT "projects_pkey" PRIMARY KEY ("wbs_id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "full_name" VARCHAR(100),
    "phone_number" VARCHAR(20) NOT NULL,
    "password_hash" VARCHAR(255) NOT NULL,
    "role" VARCHAR(20) DEFAULT 'USER',
    "is_verified" BOOLEAN DEFAULT false,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "telegram_id" VARCHAR(50),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "otp_logs" (
    "id" SERIAL NOT NULL,
    "phone_number" VARCHAR,
    "otp_code" VARCHAR,
    "expires_at" TIMESTAMP(6),
    "is_used" BOOLEAN DEFAULT false,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "user_id" INTEGER,

    CONSTRAINT "otp_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "dim_regionals_regional_name_key" ON "dim_regionals"("regional_name");

-- CreateIndex
CREATE UNIQUE INDEX "users_phone_number_key" ON "users"("phone_number");

-- CreateIndex
CREATE UNIQUE INDEX "users_telegram_id_key" ON "users"("telegram_id");

-- AddForeignKey
ALTER TABLE "dim_witels" ADD CONSTRAINT "dim_witels_regional_id_fkey" FOREIGN KEY ("regional_id") REFERENCES "dim_regionals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dim_locations" ADD CONSTRAINT "dim_locations_witel_id_fkey" FOREIGN KEY ("witel_id") REFERENCES "dim_witels"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_items" ADD CONSTRAINT "fk_items_project" FOREIGN KEY ("wbs_id") REFERENCES "projects"("wbs_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "projects" ADD CONSTRAINT "fk_projects_location" FOREIGN KEY ("location_id") REFERENCES "dim_locations"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "projects" ADD CONSTRAINT "fk_projects_plant" FOREIGN KEY ("plant_code") REFERENCES "dim_plants"("plant_code") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "projects" ADD CONSTRAINT "fk_projects_program" FOREIGN KEY ("program_id") REFERENCES "dim_programs"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "projects" ADD CONSTRAINT "fk_projects_vendor" FOREIGN KEY ("vendor_code") REFERENCES "dim_vendors"("vendor_code") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "otp_logs" ADD CONSTRAINT "otp_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION;
