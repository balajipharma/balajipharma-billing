import { NextRequest, NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";

export const dynamic = "force-dynamic";

// GET /api/dashboard
export async function GET(_request: NextRequest) {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const maxDate = new Date(today);
    maxDate.setDate(maxDate.getDate() + 180);

    const [
      totalProducts,
      totalCustomers,
      totalSuppliers,
      totalBatches,
      todayInvoices,
      pendingInvoices,
      recentInvoices,
      nearExpiryCount,
    ] = await Promise.all([
      prisma.product.count({ where: { isActive: true } }),
      prisma.customer.count({ where: { isActive: true } }),
      prisma.supplier.count({ where: { isActive: true } }),
      prisma.batchStock.aggregate({ _sum: { availableQty: true } }),
      prisma.invoice.aggregate({
        where: { invoiceDate: { gte: today, lt: tomorrow } },
        _sum: { grandTotal: true },
        _count: true,
      }),
      prisma.invoice.aggregate({
        where: { dueAmount: { gt: 0 } },
        _sum: { dueAmount: true },
        _count: true,
      }),
      prisma.invoice.findMany({
        take: 10,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          invoiceNumber: true,
          invoiceDate: true,
          grandTotal: true,
          paidAmount: true,
          dueAmount: true,
          paymentStatus: true,
          customer: { select: { storeName: true } },
        },
      }),
      prisma.batchStock.count({
        where: {
          availableQty: { gt: 0 },
          expiryDate: { lte: maxDate },
        },
      }),
    ]);

    return NextResponse.json({
      totalProducts,
      totalCustomers,
      totalSuppliers,
      totalStock: totalBatches._sum.availableQty || 0,
      todaySales: todayInvoices._sum.grandTotal || 0,
      todayInvoiceCount: todayInvoices._count,
      pendingAmount: pendingInvoices._sum.dueAmount || 0,
      pendingCount: pendingInvoices._count,
      recentInvoices,
      nearExpiryCount,
    });
  } catch (error) {
    console.error("Dashboard error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
