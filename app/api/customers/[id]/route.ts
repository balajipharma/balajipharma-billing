import { NextRequest, NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const customer = await prisma.customer.findUnique({ where: { id: parseInt(id) } });
    if (!customer) return NextResponse.json({ success: false, message: "Customer not found" }, { status: 404 });
    return NextResponse.json(customer);
  } catch (error) {
    console.error("Customer GET [id] error:", error);
    return NextResponse.json({ success: false, message: "Failed to fetch customer" }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const data = await request.json();
    const customer = await prisma.customer.update({
      where: { id: parseInt(id) },
      data: {
        storeName: data.storeName,
        gstNumber: data.gstNumber || null,
        dlNumber: data.dlNumber || null,
        mobile: data.mobile,
        address: data.address,
      },
    });
    return NextResponse.json(customer);
  } catch (error) {
    console.error("Customer PUT [id] error:", error);
    return NextResponse.json({ success: false, message: "Failed to update customer" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.customer.update({ where: { id: parseInt(id) }, data: { isActive: false } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Customer DELETE [id] error:", error);
    return NextResponse.json({ success: false, message: "Failed to delete customer" }, { status: 500 });
  }
}
