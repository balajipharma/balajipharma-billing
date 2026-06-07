import { NextRequest, NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const invoice = await prisma.invoice.findUnique({
      where: { id: parseInt(id) },
      include: {
        customer: true,
        items: {
          include: {
            product: true,
            batchStock: true,
          },
        },
        paymentHistory: {
          orderBy: {
            createdAt: "desc",
          },
        },
      },
    });
    if (!invoice) return NextResponse.json({ success: false, message: "Invoice not found" }, { status: 404 });
    return NextResponse.json(invoice);
  } catch (error) {
    console.error("Billing GET [id] error:", error);
    return NextResponse.json({ success: false, message: "Failed to fetch invoice" }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const data = await request.json();
    const invoiceId = parseInt(id);

    const oldInvoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: { items: true },
    });
    if (!oldInvoice) return NextResponse.json({ error: "Not found" }, { status: 404 });

    // A. Full Invoice Edit
    if (data.items && Array.isArray(data.items)) {
      // Validation
      if (!data.customerId) {
        return NextResponse.json({ error: "Customer is required" }, { status: 400 });
      }
      if (data.items.length === 0) {
        return NextResponse.json({ error: "At least one item is required" }, { status: 400 });
      }
      for (const item of data.items) {
        if (!item.batchStockId) {
          return NextResponse.json({ error: "Batch is required for all items" }, { status: 400 });
        }
        if (!item.qty || item.qty <= 0) {
          return NextResponse.json({ error: "Quantity must be greater than 0" }, { status: 400 });
        }
      }

      // Calculate amounts
      let subTotal = 0;
      let totalDiscount = 0;
      let taxableAmt = 0;
      let totalCgst = 0;
      let totalSgst = 0;

      for (const item of data.items) {
        const gross = item.qty * item.rate;
        const discAmt = gross * (item.discount / 100);
        const taxable = gross - discAmt;
        const gstAmt = taxable * (item.gstPercent / 100);
        const cgst = gstAmt / 2;
        const sgst = gstAmt / 2;

        subTotal += gross;
        totalDiscount += discAmt;
        taxableAmt += taxable;
        totalCgst += cgst;
        totalSgst += sgst;
      }

      const rawTotal = taxableAmt + totalCgst + totalSgst;
      const roundOff = Math.round(rawTotal) - rawTotal;
      const grandTotal = rawTotal + roundOff;
      const paidAmount = parseFloat(oldInvoice.paidAmount.toString());
      const dueAmount = Math.max(0, grandTotal - paidAmount);
      const paymentStatus =
        paidAmount >= grandTotal ? "Paid" : paidAmount > 0 ? "Partial Paid" : "Unpaid";

      const updated = await prisma.$transaction(async (tx) => {
        // Step 1: Reverse old quantities back to BatchStock (both qty and freeQty)
        for (const oldItem of oldInvoice.items) {
          await tx.batchStock.update({
            where: { id: oldItem.batchStockId },
            data: { availableQty: { increment: oldItem.qty + (oldItem.freeQty || 0) } },
          });
        }

        // Step 2: Check stock availability for new quantities (both qty and freeQty)
        for (const item of data.items) {
          const batch = await tx.batchStock.findUnique({
            where: { id: item.batchStockId },
          });
          const requiredQty = item.qty + (item.freeQty || 0);
          if (!batch || batch.availableQty < requiredQty) {
            throw new Error(
              `Insufficient stock for batch ${item.batchNumber}. Available: ${batch?.availableQty || 0}`
            );
          }
        }

        // Step 3: Delete existing Invoice items
        await tx.invoiceItem.deleteMany({
          where: { invoiceId },
        });

        // Step 4: Update invoice record
        const invoice = await tx.invoice.update({
          where: { id: invoiceId },
          data: {
            customerId: data.customerId,
            invoiceDate: data.invoiceDate ? new Date(data.invoiceDate) : new Date(),
            subTotal,
            totalDiscount,
            taxableAmt,
            totalCgst,
            totalSgst,
            roundOff,
            grandTotal,
            paidAmount,
            dueAmount,
            paymentStatus,
            notes: data.notes || null,
          },
        });

        // Step 5: Create new InvoiceItems and reduce stock
        for (const item of data.items) {
          const gross = item.qty * item.rate;
          const discAmt = gross * (item.discount / 100);
          const taxable = gross - discAmt;
          const gstAmt = taxable * (item.gstPercent / 100);

          await tx.invoiceItem.create({
            data: {
              invoiceId,
              productId: item.productId,
              batchStockId: item.batchStockId,
              batchNumber: item.batchNumber,
              expiryDate: new Date(item.expiryDate),
              mrp: item.mrp,
              qty: item.qty,
              freeQty: item.freeQty || 0,
              rate: item.rate,
              discount: item.discount || 0,
              gstPercent: item.gstPercent,
              taxableAmt: taxable,
              cgst: gstAmt / 2,
              sgst: gstAmt / 2,
              amount: taxable + gstAmt,
            },
          });

          // Reduce stock (both qty and freeQty)
          await tx.batchStock.update({
            where: { id: item.batchStockId },
            data: { availableQty: { decrement: item.qty + (item.freeQty || 0) } },
          });
        }

        return invoice;
      });

      return NextResponse.json(updated);
    }

    return NextResponse.json(
      { error: "Direct payment updates are not allowed. Use the Payments page." },
      { status: 400 }
    );
  } catch (error) {
    console.error("Billing PUT error:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const invoiceId = parseInt(id);

    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: { items: true },
    });
    if (!invoice) return NextResponse.json({ error: "Invoice not found" }, { status: 404 });

    await prisma.$transaction(async (tx) => {
      // Step 1: Restore stock quantities to BatchStock (both qty and freeQty)
      for (const item of invoice.items) {
        await tx.batchStock.update({
          where: { id: item.batchStockId },
          data: {
            availableQty: { increment: item.qty + (item.freeQty || 0) },
          },
        });
      }

      // Step 2: Delete invoice (cascade delete handles invoice items deletion)
      await tx.invoice.delete({
        where: { id: invoiceId },
      });
    });

    return NextResponse.json({ success: true, message: "Invoice deleted and stock restored successfully" });
  } catch (error) {
    console.error("Billing DELETE error:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
