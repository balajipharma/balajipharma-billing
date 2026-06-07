import { NextRequest, NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";

export const dynamic = "force-dynamic";

// GET /api/stock?tab=current|batch|expiry&productId=&search=
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const tab = searchParams.get("tab") || "current";
    const search = searchParams.get("search") || "";
    const productId = searchParams.get("productId");

    if (tab === "ledger" && productId) {
      // Product Ledger
      const product = await prisma.product.findUnique({
        where: { id: parseInt(productId) },
        include: { batches: true },
      });

      const purchaseItems = await prisma.purchaseItem.findMany({
        where: { productId: parseInt(productId) },
        include: { purchase: { select: { purchaseNumber: true, createdAt: true } } },
        orderBy: { createdAt: "asc" },
      });

      const invoiceItems = await prisma.invoiceItem.findMany({
        where: { productId: parseInt(productId) },
        include: { invoice: { select: { invoiceNumber: true, createdAt: true } } },
        orderBy: { createdAt: "asc" },
      });

      // Merge and sort
      const ledger = [
        ...purchaseItems.map((i) => ({
          date: i.purchase.createdAt,
          type: "Purchase",
          ref: i.purchase.purchaseNumber,
          batch: i.batchNumber,
          qty: i.qty + i.freeQty,
          balance: 0,
        })),
        ...invoiceItems.map((i) => ({
          date: i.invoice.createdAt,
          type: "Sale",
          ref: i.invoice.invoiceNumber,
          batch: i.batchNumber,
          qty: -(i.qty + (i.freeQty || 0)),
          balance: 0,
        })),
      ].sort((a, b) => a.date.getTime() - b.date.getTime());

      let balance = 0;
      ledger.forEach((entry) => {
        balance += entry.qty;
        entry.balance = balance;
      });

      return NextResponse.json({ product, ledger });
    }

    if (tab === "expiry") {
      // Sort by expiry
      const where = search
        ? { product: { name: { contains: search } } }
        : {};
      const batches = await prisma.batchStock.findMany({
        where: { ...where, availableQty: { gt: 0 } },
        orderBy: { expiryDate: "asc" },
        include: { product: { select: { name: true, hsnCode: true, companyName: true } } },
      });
      return NextResponse.json({ batches });
    }

    if (tab === "report") {
      console.log("Stock Report API - querying batchStock...");
      const batches = await prisma.batchStock.findMany({
        where: { availableQty: { gt: 0 } },
        include: {
          product: true,
        },
        orderBy: { product: { name: "asc" } },
      });
      console.log("Stock Report API - found batches count:", batches.length);
      console.log("Stock Report API - batch sample:", batches[0] || "No records");
      return NextResponse.json({ batches });
    }

    // Current stock or batch-wise
    const where = search
      ? {
          isActive: true,
          OR: [
            { name: { contains: search } },
            { companyName: { contains: search } },
          ],
        }
      : { isActive: true };

    const products = await prisma.product.findMany({
      where,
      include: {
        batches: {
          where: { availableQty: { gt: 0 } },
          orderBy: { expiryDate: "asc" },
        },
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json({ products });
  } catch (error) {
    console.error("Stock GET error:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
