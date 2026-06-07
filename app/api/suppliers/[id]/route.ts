import { NextRequest, NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supplier = await prisma.supplier.findUnique({ where: { id: parseInt(id) } });
    if (!supplier) return NextResponse.json({ success: false, message: "Supplier not found" }, { status: 404 });
    return NextResponse.json(supplier);
  } catch (error) {
    console.error("Supplier GET [id] error:", error);
    return NextResponse.json({ success: false, message: "Failed to fetch supplier" }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const data = await request.json();
    const supplier = await prisma.supplier.update({
      where: { id: parseInt(id) },
      data: {
        name: data.name,
        gstNumber: data.gstNumber || null,
        mobile: data.mobile,
        address: data.address,
      },
    });
    return NextResponse.json(supplier);
  } catch (error) {
    console.error("Supplier PUT [id] error:", error);
    return NextResponse.json({ success: false, message: "Failed to update supplier" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.supplier.update({ where: { id: parseInt(id) }, data: { isActive: false } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Supplier DELETE [id] error:", error);
    return NextResponse.json({ success: false, message: "Failed to delete supplier" }, { status: 500 });
  }
}
