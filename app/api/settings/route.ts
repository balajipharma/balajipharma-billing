import { NextRequest, NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";

// GET /api/settings
export async function GET() {
  try {
    const settings = await prisma.companySettings.findFirst();
    return NextResponse.json(settings || {});
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

// POST /api/settings
export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const existing = await prisma.companySettings.findFirst();

    const payload = {
      companyName: data.companyName,
      gstin: data.gstin,
      dlNumber: data.dlNumber,
      address: data.address,
      mobile: data.mobile,
      email: data.email || null,
      fssaiNumber: data.fssaiNumber || null,
      bankName: data.bankName || null,
      accountNumber: data.accountNumber || null,
      ifscCode: data.ifscCode || null,
      upiId: data.upiId || null,
    };

    const settings = existing
      ? await prisma.companySettings.update({ where: { id: existing.id }, data: payload })
      : await prisma.companySettings.create({ data: payload });

    return NextResponse.json(settings);
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
