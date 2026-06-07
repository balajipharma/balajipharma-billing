import { NextRequest, NextResponse } from "next/server";
import puppeteer from "puppeteer";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const prisma = (await import("@/app/lib/prisma")).default;
    const invoice = await prisma.invoice.findUnique({
      where: { id: parseInt(id) }
    });
    
    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    const filename = `INV-${invoice.invoiceNumber}.pdf`;

    // Production-safe standard Puppeteer launch configuration (works on Windows, Linux, AWS, Vercel VMs)
    const browser = await puppeteer.launch({
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-gpu"
      ]
    });

    const page = await browser.newPage();

    // Mock window.print to do nothing to prevent print prompt and redirections
    await page.evaluateOnNewDocument(() => {
      window.print = () => {};
    });

    const pharmaSession = req.cookies.get("pharma_session")?.value;
    const origin = req.nextUrl.origin;

    if (pharmaSession) {
      await page.setCookie({
        name: "pharma_session",
        value: pharmaSession,
        domain: req.nextUrl.hostname,
        path: "/"
      });
    }

    const printUrl = `${origin}/print/invoice/${id}`;
    await page.goto(printUrl, {
      waitUntil: "networkidle0"
    });

    // Ensure the invoice-print selector has rendered
    await page.waitForSelector("#invoice-print");

    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: {
        top: "8mm",
        bottom: "8mm",
        left: "8mm",
        right: "8mm"
      }
    });

    await browser.close();

    return new NextResponse(pdfBuffer as any, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`
      }
    });

  } catch (error) {
    console.error("PDF generation endpoint error:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
