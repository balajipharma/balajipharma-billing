"use client";
import { useEffect, useState, use } from "react";
import { Printer, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import PurchasePrintTemplate from "../../../components/print/PurchasePrintTemplate";

interface PurchaseItem {
  id: number;
  batchNumber: string;
  expiryDate: string;
  qty: number;
  freeQty: number;
  purchaseRate: number;
  sellingRate: number;
  mrp: number;
  gstPercent: number;
  taxableAmt: number;
  cgst: number;
  sgst: number;
  totalAmt: number;
  product: {
    name: string;
    hsnCode: string;
    companyName: string;
    pack: string | null;
  };
}

interface PurchaseData {
  id: number;
  purchaseNumber: string;
  invoiceNumber: string | null;
  invoiceDate: string;
  totalAmount: number;
  totalTax: number;
  grandTotal: number;
  notes: string | null;
  supplier: {
    name: string;
    mobile: string;
    address: string;
    gstNumber: string | null;
  };
  items: PurchaseItem[];
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
}


export default function PurchasePrintPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [purchase, setPurchase] = useState<PurchaseData | null>(null);
  const [company, setCompany] = useState<CompanySettings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch(`/api/purchase/${id}`).then(r => r.json()),
      fetch("/api/settings").then(r => r.json()),
    ]).then(([pur, comp]) => {
      setPurchase(pur);
      setCompany(comp?.companyName ? comp : {
        companyName: "Balaji Pharma",
        gstin: "24XXXXX0000X1ZX",
        dlNumber: "20 B RR 0000",
        address: "Your Address, City, State - PIN",
        mobile: "9000000000",
        email: null,
        fssaiNumber: null,
        bankName: null,
        accountNumber: null,
        ifscCode: null,
      });
      setLoading(false);
    });
  }, [id]);



  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-white text-slate-500">
        <p>Loading purchase bill details...</p>
      </div>
    );
  }

  if (!purchase) {
    return <div className="p-8 text-red-500 bg-white">Purchase record not found</div>;
  }



  return (
    <div className="min-h-screen bg-slate-100 py-8">
      {/* Controls - hidden on print */}
      <div className="no-print fixed top-4 left-4 right-4 z-50 flex items-center justify-between bg-white/90 backdrop-blur border border-slate-200 rounded-xl px-5 py-3 shadow-lg">
        <Link href={`/AdminPanel/purchase/${purchase.id}`} className="btn-secondary text-sm">
          <ArrowLeft size={15} /> Back to Details
        </Link>
        <p className="font-semibold text-slate-700">{purchase.purchaseNumber}</p>
        <button onClick={() => window.print()} className="btn-primary text-sm">
          <Printer size={15} /> Print Purchase Bill
        </button>
      </div>

      {/* A4 Print Area */}
      <PurchasePrintTemplate purchase={purchase} company={company as any} />
    </div>
  );
}
