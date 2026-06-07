import { NextRequest, NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const search = searchParams.get("search") || "";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const skip = (page - 1) * limit;

    const where = search
      ? {
          isActive: true,
          OR: [
            { name: { contains: search } },
            { mobile: { contains: search } },
          ],
        }
      : { isActive: true };

    const [suppliers, total] = await Promise.all([
      prisma.supplier.findMany({ where, skip, take: limit, orderBy: { name: "asc" } }),
      prisma.supplier.count({ where }),
    ]);

    return NextResponse.json({ suppliers, total, page, limit });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const supplier = await prisma.supplier.create({
      data: {
        name: data.name,
        gstNumber: data.gstNumber || null,
        mobile: data.mobile,
        address: data.address,
      },
    });
    return NextResponse.json(supplier, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
