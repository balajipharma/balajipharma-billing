import { NextRequest, NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";

// GET /api/batches?productId=&search=
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const productId = searchParams.get("productId");
    const search = searchParams.get("search") || "";

    if (productId) {
      const batches = await prisma.batchStock.findMany({
        where: {
          productId: parseInt(productId),
          availableQty: { gt: 0 },
        },
        orderBy: { expiryDate: "asc" },
      });
      return NextResponse.json({ batches });
    }

    // Search products with available batches
    const products = await prisma.product.findMany({
      where: search
        ? {
            isActive: true,
            OR: [
              { name: { contains: search } },
              { companyName: { contains: search } },
              { hsnCode: { contains: search } },
            ],
          }
        : { isActive: true },
      take: 20,
      orderBy: { name: "asc" },
      include: {
        batches: {
          where: { availableQty: { gt: 0 } },
          orderBy: { expiryDate: "asc" },
          take: 5,
        },
      },
    });

    return NextResponse.json({ products });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
