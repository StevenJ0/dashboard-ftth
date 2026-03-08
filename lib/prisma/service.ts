import { prisma } from "@/lib/prisma/prisma";
import { Prisma } from "@prisma/client";

// ==========================================
// USER SERVICE
// ==========================================
export const userService = {
  async create(data: Prisma.usersCreateInput) {
    return await prisma.users.create({ data });
  },

  async getByPhone(phoneNumber: string) {
    return await prisma.users.findUnique({
      where: { phone_number: phoneNumber },
    });
  },

  async getById(id: number) {
    return await prisma.users.findUnique({
      where: { id },
    });
  },

  async update(id: number, data: Prisma.usersUpdateInput) {
    return await prisma.users.update({
      where: { id },
      data,
    });
  },

  async delete(id: number) {
    return await prisma.users.delete({
      where: { id },
    });
  },
};

// ==========================================
// PROJECT SERVICE (Header)
// ==========================================
export const projectService = {
  async create(data: Prisma.projectsCreateInput) {
    return await prisma.projects.create({ data });
  },

  async getAll(params?: {
    skip?: number;
    take?: number;
    where?: Prisma.projectsWhereInput;
    orderBy?: Prisma.projectsOrderByWithRelationInput;
  }) {
    const { skip, take, where, orderBy } = params || {};
    return await prisma.projects.findMany({
      skip,
      take,
      where,
      orderBy,
      include: {
        dim_plants: true,
        dim_locations: true,
        dim_programs: true,
        dim_vendors: true,
      },
    });
  },

  async getByWbsId(wbsId: string) {
    return await prisma.projects.findUnique({
      where: { wbs_id: wbsId },
      include: {
        dim_plants: true,
        dim_locations: true,
        dim_programs: true,
        dim_vendors: true,
        project_items: true, // Include details for single view
      },
    });
  },

  async update(wbsId: string, data: Prisma.projectsUpdateInput) {
    return await prisma.projects.update({
      where: { wbs_id: wbsId },
      data,
    });
  },

  async delete(wbsId: string) {
    return await prisma.projects.delete({
      where: { wbs_id: wbsId },
    });
  },
};

// ==========================================
// PROJECT ITEM SERVICE (Detail)
// ==========================================
export const itemService = {
  async create(data: Prisma.project_itemsCreateInput) {
    return await prisma.project_items.create({ data });
  },

  async getByWbsId(wbsId: string) {
    return await prisma.project_items.findMany({
      where: { wbs_id: wbsId },
      orderBy: { id: "asc" },
    });
  },

  async getById(id: number) {
    return await prisma.project_items.findUnique({
      where: { id },
    });
  },

  async update(id: number, data: Prisma.project_itemsUpdateInput) {
    return await prisma.project_items.update({
      where: { id },
      data,
    });
  },

  async delete(id: number) {
    return await prisma.project_items.delete({
      where: { id },
    });
  },
};

// ==========================================
// DIMENSION SERVICE (References)
// ==========================================
export const dimensionService = {
  // Plants
  async getPlants() {
    return await prisma.dim_plants.findMany();
  },

  // Locations / Regional
  async getLocations() {
    return await prisma.dim_locations.findMany();
  },

  // Programs
  async getPrograms() {
    return await prisma.dim_programs.findMany();
  },

  // Vendors
  async getVendors() {
    return await prisma.dim_vendors.findMany();
  },
};

// ==========================================
// DASHBOARD / AGGREGATION SERVICE
// ==========================================
export const dashboardService = {
  // Example: Get total project count
  async getProjectCount() {
    return await prisma.projects.count();
  },

  async getRecentProjects(limit: number = 5) {
    return await prisma.projects.findMany({
      take: limit,
      orderBy: { contract_date: "desc" },
      include: {
        dim_plants: true,
      },
    });
  },
};
// ==========================================
// GENERIC DATABASE SERVICE
// ==========================================
export const genericDBService = {
  /**
   * Generic Create Data
   * @param modelName Nama tabel/model di schema.prisma (camelCase), misal: 'users', 'projects'
   * @param data Data object yang akan diinsert
   */
  async createData(modelName: string, data: any) {
    // @ts-ignore
    if (!prisma[modelName]) throw new Error(`Model ${modelName} not found`);
    // @ts-ignore
    return await prisma[modelName].create({ data });
  },

  /**
   * Generic Update Data by ID
   * @param modelName Nama tabel/model
   * @param id ID record (number or string depending on schema)
   * @param data Data yang akan diupdate
   */
  async updateData(modelName: string, id: number | string, data: any) {
    // @ts-ignore
    if (!prisma[modelName]) throw new Error(`Model ${modelName} not found`);
    
    // Determine the where clause key based on model if needed, or assume 'id'
    // Most models use 'id' or specific PK. For now assume 'id' works for standard models.
    // For non-standard PKs (like wbs_id), we might need logic or pass the where clause directly.
    // To keep it simple as requested:
    let whereClause: any = { id };
    
    // Special handling for known models with different PKs if strictly needed, 
    // or user can pass the logic. But 'updateData(table, id, data)' implies ID lookup.
    if (modelName === 'projects') whereClause = { wbs_id: id };
    if (modelName === 'dim_plants') whereClause = { plant_code: id };
    if (modelName === 'dim_vendors') whereClause = { vendor_code: id };

    // @ts-ignore
    return await prisma[modelName].update({
      where: whereClause,
      data,
    });
  },

  /**
   * Generic Delete Data by ID
   */
  async deleteData(modelName: string, id: number | string) {
    // @ts-ignore
    if (!prisma[modelName]) throw new Error(`Model ${modelName} not found`);

    let whereClause: any = { id };
    if (modelName === 'projects') whereClause = { wbs_id: id };
    if (modelName === 'dim_plants') whereClause = { plant_code: id };
    if (modelName === 'dim_vendors') whereClause = { vendor_code: id };

    // @ts-ignore
    return await prisma[modelName].delete({
      where: whereClause,
    });
  },

  async getDataById(modelName: string, id: number | string) {
    // @ts-ignore
    if (!prisma[modelName]) throw new Error(`Model ${modelName} not found`);

    let whereClause: any = { id };
    if (modelName === 'projects') whereClause = { wbs_id: id };
    if (modelName === 'dim_plants') whereClause = { plant_code: id };
    if (modelName === 'dim_vendors') whereClause = { vendor_code: id };

    // @ts-ignore
    return await prisma[modelName].findUnique({
      where: whereClause,
    });
  },
  
  async getAllData(modelName: string) {
    // @ts-ignore
    if (!prisma[modelName]) throw new Error(`Model ${modelName} not found`);
    // @ts-ignore
    return await prisma[modelName].findMany();
  }
};

// ==========================================
// OTP SERVICE
// ==========================================
export const otpService = {
  async createLog(phoneNumber: string, otpCode: string, userId?: number) {
    const expiresAt = new Date(new Date().getTime() + 5 * 60000); // 5 minutes
    return await prisma.otp_logs.create({
      data: {
        phone_number: phoneNumber,
        otp_code: otpCode,
        expires_at: expiresAt,
        is_used: false,
        user_id: userId,
      },
    });
  },

  async findValidLog(phoneNumber: string, otpCode: string) {
    return await prisma.otp_logs.findFirst({
      where: {
        phone_number: phoneNumber,
        otp_code: otpCode,
        is_used: false,
        expires_at: {
          gt: new Date(),
        },
      },
      orderBy: {
        created_at: 'desc',
      },
    });
  },

  async markAsUsed(id: number) {
    return await prisma.otp_logs.update({
      where: { id },
      data: { is_used: true },
    });
  },
};
