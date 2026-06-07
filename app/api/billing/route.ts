import { NextRequest, NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";

export const dynamic = "force-dynamic";

async function generateInvoiceNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `INV-${year}-`;
  const last = await prisma.invoice.findFirst({
    where: { invoiceNumber: { startsWith: prefix } },
    orderBy: { invoiceNumber: "desc" },
  });

  let seq = 1;
  if (last) {
    const lastSeq = parseInt(last.invoiceNumber.split("-")[2]);
    seq = lastSeq + 1;
  }

  return `${prefix}${String(seq).padStart(5, "0")}`;
}

// GET /api/billing
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const skip = (page - 1) * limit;
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    const status = searchParams.get("status");
    const search = searchParams.get("search") || "";

    const andConditions: any[] = [];

    if (status) {
      if (status === "outstanding") {
        andConditions.push({ dueAmount: { gt: 0 } });
      } else if (status.includes(",")) {
        const statuses = status.split(",").flatMap(s => s === "Partial Paid" ? ["Partial Paid", "Partial"] : [s]);
        andConditions.push({ paymentStatus: { in: statuses } });
      } else {
        const checkStatus = status === "Partial Paid" ? ["Partial Paid", "Partial"] : [status];
        andConditions.push({ paymentStatus: { in: checkStatus } });
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
          customer: { select: { storeName: true, mobile: true } },
          items: true,
        },
      }),
      prisma.invoice.count({ where }),
    ]);

    return NextResponse.json({ invoices, total, page, limit });
  } catch (error) {
    console.error("Billing GET error:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

// POST /api/billing
export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const invoiceNumber = await generateInvoiceNumber();

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
    const paidAmount = parseFloat(data.paidAmount || 0);
    const dueAmount = Math.max(0, grandTotal - paidAmount);
    const paymentStatus =
      paidAmount >= grandTotal ? "Paid" : paidAmount > 0 ? "Partial Paid" : "Unpaid";

    const invoice = await prisma.$transaction(async (tx) => {
      // Check stock availability
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

      const invoice = await tx.invoice.create({
        data: {
          invoiceNumber,
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

      if (paidAmount > 0) {
        await tx.paymentHistory.create({
          data: {
            invoiceId: invoice.id,
            amount: paidAmount,
            paymentMethod: "CASH",
            note: "Initial payment during invoice creation",
            paymentDate: invoice.invoiceDate,
          },
        });
      }


      for (const item of data.items) {
        const gross = item.qty * item.rate;
        const discAmt = gross * (item.discount / 100);
        const taxable = gross - discAmt;
        const gstAmt = taxable * (item.gstPercent / 100);

        await tx.invoiceItem.create({
          data: {
            invoiceId: invoice.id,
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

    return NextResponse.json(
      { success: true, invoiceNumber: invoice.invoiceNumber, id: invoice.id },
      { status: 201 }
    );
  } catch (error) {
    console.error("Billing POST error:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
