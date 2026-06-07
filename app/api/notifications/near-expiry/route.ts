import { NextRequest, NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(_request: NextRequest) {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const maxDate = new Date(today);
    maxDate.setDate(maxDate.getDate() + 180);

    const batches = await prisma.batchStock.findMany({
      where: {
        availableQty: { gt: 0 },
        expiryDate: {
          lte: maxDate
        }
      },
      include: {
        product: {
          select: {
            name: true
          }
        }
      },
      orderBy: {
        expiryDate: "asc"
      }
    });

    const notifications = batches.map(b => {
      const expDate = new Date(b.expiryDate);
      const diffTime = expDate.getTime() - today.getTime();
      const remainingDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      let color = "yellow"; // 91-180 days = Yellow (Alert)
      if (remainingDays <= 30) {
        color = "red"; // 0-30 days = Red (Critical)
      } else if (remainingDays <= 90) {
        color = "orange"; // 31-90 days = Orange (Warning)
      }

      return {
        id: b.id,
        productName: b.product.name,
        batchNumber: b.batchNumber,
        expiryDate: expDate.toLocaleDateString("en-US", { month: "short", year: "numeric" }),
        remainingDays,
        color
      };
    });

    return NextResponse.json({ notifications, count: notifications.length });
  } catch (error) {
    console.error("Near expiry notifications error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
