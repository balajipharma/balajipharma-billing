import { NextRequest, NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";

export const dynamic = "force-dynamic";

// POST /api/payments/[id]
// Add an incremental payment (records payment history entry)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const invoiceId = parseInt(id);
    if (isNaN(invoiceId)) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }

    const { receivedAmount, paymentMethod, note } = await request.json();
    const amt = parseFloat(receivedAmount);

    if (isNaN(amt) || amt <= 0) {
      return NextResponse.json({ error: "Received amount must be greater than 0" }, { status: 400 });
    }

    if (paymentMethod !== "CASH" && paymentMethod !== "UPI") {
      return NextResponse.json({ error: "Payment method must be CASH or UPI" }, { status: 400 });
    }

    const invoice = await prisma.invoice.findUnique({ where: { id: invoiceId } });
    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    const dueAmount = parseFloat(invoice.dueAmount.toString());
    if (amt > dueAmount + 0.01) {
      return NextResponse.json({
        error: `Payment amount ₹${amt.toFixed(2)} cannot exceed due amount ₹${dueAmount.toFixed(2)}`
      }, { status: 400 });
    }

    const updated = await prisma.$transaction(async (tx) => {
      const currentPaid = parseFloat(invoice.paidAmount.toString());
      const grandTotal = parseFloat(invoice.grandTotal.toString());

      const newPaidAmount = Math.min(grandTotal, currentPaid + amt);
      const newDueAmount = Math.max(0, grandTotal - newPaidAmount);
      const paymentStatus =
        newPaidAmount === 0 ? "Unpaid" : newDueAmount === 0 ? "Paid" : "Partial Paid";

      const inv = await tx.invoice.update({
        where: { id: invoiceId },
        data: { paidAmount: newPaidAmount, dueAmount: newDueAmount, paymentStatus },
      });

      await tx.paymentHistory.create({
        data: { invoiceId, amount: amt, paymentMethod, note: note || null },
      });

      return inv;
    });

    return NextResponse.json({ success: true, invoice: updated });
  } catch (error) {
    console.error("Payment POST error:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

// PUT /api/payments/[id]
// Override / correct payment status — allows any direction of status change.
// body: { newStatus, receivedAmount?, paymentMethod, note? }
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const invoiceId = parseInt(id);
    if (isNaN(invoiceId)) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }

    const { newStatus, receivedAmount, paymentMethod, note } = await request.json();

    const validStatuses = ["Unpaid", "Partial Paid", "Paid"];
    if (!validStatuses.includes(newStatus)) {
      return NextResponse.json({ error: "Invalid payment status" }, { status: 400 });
    }

    if (paymentMethod !== "CASH" && paymentMethod !== "UPI") {
      return NextResponse.json({ error: "Payment method must be CASH or UPI" }, { status: 400 });
    }

    const invoice = await prisma.invoice.findUnique({ where: { id: invoiceId } });
    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    const grandTotal = parseFloat(invoice.grandTotal.toString());
    const oldPaid = parseFloat(invoice.paidAmount.toString());

    let newPaidAmount: number;
    let newDueAmount: number;

    if (newStatus === "Unpaid") {
      newPaidAmount = 0;
      newDueAmount = grandTotal;
    } else if (newStatus === "Paid") {
      newPaidAmount = grandTotal;
      newDueAmount = 0;
    } else {
      // Partial Paid — user supplies the new total paid amount
      const amt = parseFloat(receivedAmount);
      if (isNaN(amt) || amt <= 0) {
        return NextResponse.json({ error: "Please enter a valid received amount greater than 0" }, { status: 400 });
      }
      if (amt >= grandTotal) {
        return NextResponse.json({ error: `Amount cannot equal or exceed invoice total ₹${grandTotal.toFixed(2)}. Use 'Paid' status instead.` }, { status: 400 });
      }
      newPaidAmount = amt;
      newDueAmount = Math.max(0, grandTotal - amt);
    }

    // Determine delta for audit history entry
    const delta = parseFloat((newPaidAmount - oldPaid).toFixed(2));
    const absAmt = Math.abs(delta);
    const historyNote = [
      delta > 0 ? `Payment correction (+₹${absAmt.toFixed(2)})` : delta < 0 ? `Payment reversal (-₹${absAmt.toFixed(2)})` : "Status override (no amount change)",
      note ? `— ${note}` : ""
    ].join(" ").trim();

    const updated = await prisma.$transaction(async (tx) => {
      const inv = await tx.invoice.update({
        where: { id: invoiceId },
        data: {
          paidAmount: newPaidAmount,
          dueAmount: newDueAmount,
          paymentStatus: newStatus,
        },
      });

      // Always log a history entry so there is an audit trail
      await tx.paymentHistory.create({
        data: {
          invoiceId,
          amount: newPaidAmount,
          paymentMethod,
          note: historyNote,
        },
      });

      return inv;
    });

    return NextResponse.json({ success: true, invoice: updated });
  } catch (error) {
    console.error("Payment PUT error:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
