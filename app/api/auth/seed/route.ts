import { NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";

// GET /api/auth/seed — creates a plain-text admin for development
export async function GET() {
  try {
    const admin = await prisma.admin.upsert({
      where: { username: "admin" },
      update: { password: "admin123" },
      create: {
        username: "admin",
        email: "admin@balajipharma.com",
        password: "admin123",
      },
    });
    return NextResponse.json({
      success: true,
      message: "Admin created",
      email: admin.email,
      password: "admin123",
    });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
