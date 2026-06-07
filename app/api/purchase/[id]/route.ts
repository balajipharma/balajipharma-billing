import { NextRequest, NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const purchase = await prisma.purchase.findUnique({
      where: { id: parseInt(id) },
      include: {
        supplier: true,
        items: {
          include: {
            product: true,
            batchStock: true,
          },
        },
      },
    });
    if (!purchase) return NextResponse.json({ success: false, message: "Purchase not found" }, { status: 404 });
    return NextResponse.json(purchase);
  } catch (error) {
    console.error("Purchase GET [id] error:", error);
    return NextResponse.json({ success: false, message: "Failed to fetch purchase" }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const data = await request.json();

    // 1. Validate
    if (!data.supplierId) {
      return NextResponse.json({ error: "Supplier is required" }, { status: 400 });
    }
    if (!data.items || !Array.isArray(data.items) || data.items.length === 0) {
      return NextResponse.json({ error: "At least one item is required" }, { status: 400 });
    }
    for (const item of data.items) {
      if (!item.productId) {
        return NextResponse.json({ error: "Product is required for all items" }, { status: 400 });
      }
      if (!item.qty || item.qty <= 0) {
        return NextResponse.json({ error: "Quantity must be greater than 0" }, { status: 400 });
      }
      if (!item.batchNumber) {
        return NextResponse.json({ error: "Batch number is required for all items" }, { status: 400 });
      }
    }

    const purchaseId = parseInt(id);

    // 2. Fetch old purchase items to reverse stock
    const oldPurchase = await prisma.purchase.findUnique({
      where: { id: purchaseId },
      include: { items: true },
    });

    if (!oldPurchase) {
      return NextResponse.json({ error: "Purchase not found" }, { status: 404 });
    }

    // Calculate new totals
    let totalAmount = 0;
    let totalTax = 0;

    for (const item of data.items) {
      const taxable = item.qty * item.purchaseRate;
      const calculatedGst = taxable * (item.gstPercent / 100);
      totalAmount += taxable;
      totalTax += calculatedGst;
    }

    const grandTotal = totalAmount + totalTax;

    // 3. Execute Transaction
    const updatedPurchase = await prisma.$transaction(async (tx) => {
      // Step A: Reverse old quantities from BatchStock
      for (const oldItem of oldPurchase.items) {
        await tx.batchStock.update({
          where: { id: oldItem.batchStockId },
          data: {
            availableQty: { decrement: oldItem.qty + oldItem.freeQty },
          },
        });
      }

      // Step B: Delete existing PurchaseItems
      await tx.purchaseItem.deleteMany({
        where: { purchaseId },
      });

      // Step C: Update Purchase details
      const purchase = await tx.purchase.update({
        where: { id: purchaseId },
        data: {
          supplierId: data.supplierId,
          invoiceNumber: data.invoiceNumber || null,
          invoiceDate: new Date(data.invoiceDate),
          totalAmount,
          totalTax,
          grandTotal,
          notes: data.notes || null,
        },
      });

      // Step D: Create new PurchaseItems & Apply stock changes
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
            expiryDate: expiryDate,
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

        // Create PurchaseItem record
        await tx.purchaseItem.create({
          data: {
            purchaseId,
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

    return NextResponse.json({ success: true, purchaseNumber: updatedPurchase.purchaseNumber });
  } catch (error) {
    console.error("Purchase PUT error:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const purchaseId = parseInt(id);

    const purchase = await prisma.purchase.findUnique({
      where: { id: purchaseId },
      include: { items: true },
    });
    if (!purchase) return NextResponse.json({ error: "Purchase not found" }, { status: 404 });

    await prisma.$transaction(async (tx) => {
      // Step 1: Validate stock usage
      for (const item of purchase.items) {
        const batchStock = await tx.batchStock.findUnique({
          where: { id: item.batchStockId },
        });
        if (!batchStock) continue;

        const purchasedQty = item.qty + item.freeQty;
        const currentAvailableQty = batchStock.availableQty;
        const soldQty = purchasedQty - currentAvailableQty;

        // Check references count for logging and extra safety
        const invoiceItemCount = await tx.invoiceItem.count({
          where: { batchStockId: item.batchStockId },
        });
        const purchaseItemCount = await tx.purchaseItem.count({
          where: { batchStockId: item.batchStockId },
        });

        console.log(`[DEBUG] Purchase ID: ${purchaseId}, BatchStock ID: ${item.batchStockId}, Current Qty: ${purchasedQty}, Available Qty: ${currentAvailableQty}, Sold Qty: ${soldQty}, InvoiceItem references: ${invoiceItemCount}, PurchaseItem references: ${purchaseItemCount}`);

        if (soldQty > 0 || invoiceItemCount > 0) {
          throw new Error(
            `Cannot delete purchase. Some stock from this batch has already been sold.`
          );
        }
      }

      // Step 2: Determine which BatchStock records should be deleted vs decremented
      const batchesToDelete: number[] = [];
      const batchesToDecrement: { id: number; qty: number }[] = [];

      for (const item of purchase.items) {
        const otherPurchaseCount = await tx.purchaseItem.count({
          where: {
            batchStockId: item.batchStockId,
            purchaseId: { not: purchaseId },
          },
        });
        const invoiceItemCount = await tx.invoiceItem.count({
          where: { batchStockId: item.batchStockId },
        });

        if (otherPurchaseCount === 0 && invoiceItemCount === 0) {
          batchesToDelete.push(item.batchStockId);
        } else {
          batchesToDecrement.push({ id: item.batchStockId, qty: item.qty + item.freeQty });
        }
      }

      // Step 3: Execute in correct order to prevent foreign key violations

      // A. Decrement stock for batches that will be kept
      for (const b of batchesToDecrement) {
        await tx.batchStock.update({
          where: { id: b.id },
          data: { availableQty: { decrement: b.qty } },
        });
      }

      // B. Delete purchase (Prisma cascade delete automatically removes related PurchaseItem records)
      await tx.purchase.delete({
        where: { id: purchaseId },
      });

      // C. Delete unused BatchStock records (now safe since PurchaseItem references have been deleted)
      for (const batchStockId of batchesToDelete) {
        await tx.batchStock.delete({
          where: { id: batchStockId },
        });
      }
    });

    return NextResponse.json({ success: true, message: "Purchase deleted successfully" });
  } catch (error: any) {
    console.error("Purchase DELETE error:", error);
    let errorMsg = error.message || String(error);
    
    // Check for Prisma foreign key constraint violation (P2003)
    if (error.code === "P2003") {
      const field = error.meta?.field_name || "batchStockId";
      let table = "InvoiceItem or PurchaseItem";
      if (field.toLowerCase().includes("purchase")) {
        table = "PurchaseItem";
      } else if (field.toLowerCase().includes("invoice")) {
        table = "InvoiceItem";
      }
      errorMsg = `Foreign key constraint failed on batchStockId. Referenced by: ${table}.`;
    }
    
    return NextResponse.json({ error: errorMsg }, { status: 400 });
  }
}
