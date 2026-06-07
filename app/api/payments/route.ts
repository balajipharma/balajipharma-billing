import { NextRequest, NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const skip = (page - 1) * limit;
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "";
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    const andConditions: any[] = [];

    if (status) {
      if (status === "outstanding") {
        andConditions.push({ dueAmount: { gt: 0 } });
      } else {
        andConditions.push({ paymentStatus: status });
      }
    }

    if (from || to) {
      const dateCond: Record<string, Date> = {};
      if (from) dateCond.gte = new Date(from);
      if (to) {
        const toDate = new Date(to);
        toDate.setDate(toDate.getDate() + 1);
        dateCond.lt = toDate;
      }
      andConditions.push({ invoiceDate: dateCond });
    }

    if (search) {
      andConditions.push({
        OR: [
          { invoiceNumber: { contains: search } },
          { customer: { storeName: { contains: search } } }
        ]
      });
    }

    const where = andConditions.length > 0 ? { AND: andConditions } : {};

    const [invoices, total] = await Promise.all([
      prisma.invoice.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          customer: { select: { storeName: true } },
        },
      }),
      prisma.invoice.count({ where }),
    ]);

    return NextResponse.json({ invoices, total, page, limit });
  } catch (error) {
    console.error("Payments GET error:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
