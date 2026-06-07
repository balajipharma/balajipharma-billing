import { NextRequest, NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";

// GET /api/products?search=&page=1&limit=20
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
            { companyName: { contains: search } },
            { hsnCode: { contains: search } },
          ],
        }
      : { isActive: true };

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip,
        take: limit,
        orderBy: { name: "asc" },
        include: {
          batches: {
            select: { availableQty: true },
          },
        },
      }),
      prisma.product.count({ where }),
    ]);

    const productsWithStock = products.map((p) => ({
      ...p,
      totalStock: p.batches.reduce((sum, b) => sum + b.availableQty, 0),
    }));

    return NextResponse.json({ products: productsWithStock, total, page, limit });
  } catch (error) {
    console.error("Products GET error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// POST /api/products
export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const product = await prisma.product.create({
      data: {
        name: data.name,
        companyName: data.companyName,
        hsnCode: data.hsnCode,
        pack: data.pack || null,
        manufacturer: data.manufacturer || null,
        gstPercent: parseFloat(data.gstPercent),
      },
    });
    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    console.error("Products POST error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
