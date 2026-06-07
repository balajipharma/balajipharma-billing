import { NextRequest, NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";

export const dynamic = "force-dynamic";

// Generate purchase number: PUR-2026-00001
async function generatePurchaseNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `PUR-${year}-`;
  const lastPurchase = await prisma.purchase.findFirst({
    where: { purchaseNumber: { startsWith: prefix } },
    orderBy: { purchaseNumber: "desc" },
  });

  let seq = 1;
  if (lastPurchase) {
    const lastSeq = parseInt(lastPurchase.purchaseNumber.split("-")[2]);
    seq = lastSeq + 1;
  }

  return `${prefix}${String(seq).padStart(5, "0")}`;
}

// GET /api/purchase
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const skip = (page - 1) * limit;
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    const where: Record<string, unknown> = {};
    if (from || to) {
      where.invoiceDate = {};
      if (from) (where.invoiceDate as Record<string, Date>).gte = new Date(from);
      if (to) {
        const toDate = new Date(to);
        toDate.setDate(toDate.getDate() + 1);
        (where.invoiceDate as Record<string, Date>).lt = toDate;
      }
    }

    const [purchases, total] = await Promise.all([
      prisma.purchase.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          supplier: { select: { name: true } },
          items: {
            include: { product: { select: { name: true } } },
          },
        },
      }),
      prisma.purchase.count({ where }),
    ]);

    return NextResponse.json({ purchases, total, page, limit });
  } catch (error) {
    console.error("Purchase GET error:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

// POST /api/purchase
export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const purchaseNumber = await generatePurchaseNumber();

    // Calculate totals
    let totalAmount = 0;
    let totalTax = 0;

    for (const item of data.items) {
      const taxable = item.qty * item.purchaseRate;
      const gst = taxable * (item.gstPercent / 100);
      totalAmount += taxable;
      totalTax += gst;
    }

    const grandTotal = totalAmount + totalTax;

    const purchase = await prisma.$transaction(async (tx) => {
      const purchase = await tx.purchase.create({
        data: {
          purchaseNumber,
          supplierId: data.supplierId,
          invoiceNumber: data.invoiceNumber || null,
          invoiceDate: new Date(data.invoiceDate),
          totalAmount,
          totalTax,
          grandTotal,
          notes: data.notes || null,
        },
      });

      for (const item of data.items) {
        const expiryDate = new Date(item.expiryDate);
        const taxable = item.qty * item.purchaseRate;
        const gstAmt = taxable * (item.gstPercent / 100);
        const cgst = gstAmt / 2;
        const sgst = gstAmt / 2;
        const totalAmt = taxable + gstAmt;

        // Upsert BatchStock
        const batchStock = await tx.batchStock.upsert({
          where: {
            productId_batchNumber: {
              productId: item.productId,
              batchNumber: item.batchNumber,
            },
          },
          update: {
            availableQty: { increment: item.qty + (item.freeQty || 0) },
            purchaseRate: item.purchaseRate,
            sellingRate: item.sellingRate,
            mrp: item.mrp,
          },
          create: {
            productId: item.productId,
            batchNumber: item.batchNumber,
            expiryDate,
            mrp: item.mrp,
            purchaseRate: item.purchaseRate,
            sellingRate: item.sellingRate,
            availableQty: item.qty + (item.freeQty || 0),
          },
        });

        await tx.purchaseItem.create({
          data: {
            purchaseId: purchase.id,
            productId: item.productId,
            batchStockId: batchStock.id,
            batchNumber: item.batchNumber,
            expiryDate,
            qty: item.qty,
            freeQty: item.freeQty || 0,
            purchaseRate: item.purchaseRate,
            sellingRate: item.sellingRate,
            mrp: item.mrp,
            gstPercent: item.gstPercent,
            taxableAmt: taxable,
            cgst,
            sgst,
            totalAmt,
          },
        });
      }

      return purchase;
    });

    return NextResponse.json({ success: true, purchaseNumber: purchase.purchaseNumber }, { status: 201 });
  } catch (error) {
    console.error("Purchase POST error:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
