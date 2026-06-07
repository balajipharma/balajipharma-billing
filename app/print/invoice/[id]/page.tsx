"use client";
import { useEffect, useState } from "react";
import { Printer, ArrowLeft, Pill } from "lucide-react";
import Link from "next/link";
import { use } from "react";
import BillingPrintTemplate from "../../../components/print/BillingPrintTemplate";

interface InvoiceData {
  id: number;
  invoiceNumber: string;
  invoiceDate: string;
  subTotal: number;
  totalDiscount: number;
  taxableAmt: number;
  totalCgst: number;
  totalSgst: number;
  roundOff: number;
  grandTotal: number;
  paidAmount: number;
  dueAmount: number;
  paymentStatus: string;
  customer: {
    storeName: string;
    gstNumber: string | null;
    dlNumber: string | null;
    mobile: string;
    address: string;
  };
  items: Array<{
    id: number;
    batchNumber: string;
    expiryDate: string;
    mrp: number;
    qty: number;
    freeQty: number;
    rate: number;
    discount: number;
    gstPercent: number;
    taxableAmt: number;
    cgst: number;
    sgst: number;
    amount: number;
    product: {
      name: string;
      hsnCode: string;
      pack: string | null;
      manufacturer: string | null;
      companyName: string;
    };
  }>;
}

interface CompanySettings {
  companyName: string;
  gstin: string;
  dlNumber: string;
  address: string;
  mobile: string;
  email: string | null;
  fssaiNumber: string | null;
  bankName: string | null;
  accountNumber: string | null;
  ifscCode: string | null;
  upiId: string | null;
}


export default function InvoicePrintPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [invoice, setInvoice] = useState<InvoiceData | null>(null);
  const [company, setCompany] = useState<CompanySettings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch(`/api/billing/${id}`).then(r => r.json()),
      fetch("/api/settings").then(r => r.json()),
    ]).then(([inv, comp]) => {
      setInvoice(inv);
      setCompany(comp?.companyName ? comp : {
        companyName: "Balaji Pharma",
        gstin: "24XXXXX0000X1ZX",
        dlNumber: "20 B RR 0000",
        address: "Your Address, City, State - PIN",
        mobile: "9000000000",
        email: null,
        fssaiNumber: null,
        bankName: "Your Bank",
        accountNumber: "XXXXXXXX",
        ifscCode: "XXXX0000000",
        upiId: null,
      });
      setLoading(false);
    });
  }, [id]);

  // Auto-print after loading completes
  useEffect(() => {
    if (!loading && invoice) {
      const timer = setTimeout(() => {
        window.print();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [loading, invoice]);

  if (loading) return (
    <div className="flex items-center justify-center h-screen bg-white text-slate-500">
      <p>Loading invoice...</p>
    </div>
  );

  if (!invoice) return <div className="p-8 text-red-500 bg-white">Invoice not found</div>;

  return (
    <div className="min-h-screen bg-slate-100 py-8">
      {/* Controls - hidden on print */}
      <div className="no-print fixed top-4 left-4 right-4 z-50 flex items-center justify-between bg-white/90 backdrop-blur border border-slate-200 rounded-xl px-5 py-3 shadow-lg">
        <Link href={`/AdminPanel/billing/list`} className="btn-secondary text-sm">
          <ArrowLeft size={15} /> Back to Billing
        </Link>
        <p className="font-semibold text-slate-700">{invoice.invoiceNumber}</p>
        <div className="flex gap-2">
          <button onClick={() => window.print()} className="btn-primary text-sm">
            <Printer size={15} /> Print Invoice
          </button>
        </div>
      </div>

      {/* A4 Print Area */}
      <BillingPrintTemplate invoice={invoice} company={company!} />
    </div>
  );
}

