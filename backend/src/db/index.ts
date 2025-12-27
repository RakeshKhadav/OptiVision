import prisma from "../prismaClient";

export const connectDB = async () => {
  try {
    await prisma.$connect();
    console.log("✅ Connected to the database");
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("❌ Error connecting to the database:", errorMessage);
    throw error;
  }
};

export { prisma };
