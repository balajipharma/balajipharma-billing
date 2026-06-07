"use client";
import { useEffect, useState, use } from "react";
import { ArrowLeft, Loader2, ShoppingCart, Calendar, FileText, User, Printer } from "lucide-react";
import Link from "next/link";

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

export default function PurchaseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [purchase, setPurchase] = useState<PurchaseData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`/api/purchase/${id}`)
      .then((r) => {
        if (!r.ok) throw new Error("Purchase record not found");
        return r.json();
      })
      .then(setPurchase)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  const fmt = (n: number) =>
    new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(n);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <Loader2 size={36} className="animate-spin text-blue-600 mb-4" />
        <p className="text-slate-500 font-medium">Loading purchase details...</p>
      </div>
    );
  }

  if (error || !purchase) {
    return (
      <div className="p-8 text-center max-w-md mx-auto">
        <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
          <FileText size={28} />
        </div>
        <h2 className="text-lg font-bold text-slate-800 mb-1">Error Loading Details</h2>
        <p className="text-slate-500 text-sm mb-6">{error || "Purchase record not found"}</p>
        <Link href="/AdminPanel/purchase/list" className="btn-primary">
          <ArrowLeft size={16} /> Back to Purchase List
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800">Purchase Details</h1>
          <p className="text-slate-500 mt-0.5">Record #{purchase.purchaseNumber}</p>
        </div>
        <div className="flex gap-2">
          <Link href={`/print/purchase/${purchase.id}`} target="_blank" className="btn-primary text-sm">
            <Printer size={16} /> Print Bill
          </Link>
          <Link href="/AdminPanel/purchase/list" className="btn-secondary text-sm">
            <ArrowLeft size={16} /> Back to Purchase List
          </Link>
        </div>
      </div>

      {/* Info Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Supplier details card */}
        <div className="page-card p-6 space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
            <div className="w-8 h-8 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
              <User size={16} />
            </div>
            <div>
              <h2 className="font-bold text-slate-800">Supplier Information</h2>
              <p className="text-xs text-slate-400">Supplier contact and business info</p>
            </div>
          </div>
          <div className="space-y-2.5 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-500 font-medium">Name:</span>
              <span className="text-slate-800 font-semibold">{purchase.supplier.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 font-medium">Mobile:</span>
              <span className="text-slate-800 font-mono">{purchase.supplier.mobile}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 font-medium">GSTIN:</span>
              <span className="text-slate-800 font-mono font-semibold">{purchase.supplier.gstNumber || "—"}</span>
            </div>
            <div className="flex flex-col pt-1">
              <span className="text-slate-500 font-medium">Address:</span>
              <span className="text-slate-700 bg-slate-50 p-2.5 rounded-lg border border-slate-100 mt-1 text-xs leading-relaxed whitespace-pre-wrap">
                {purchase.supplier.address}
              </span>
            </div>
          </div>
        </div>

        {/* Invoice metadata card */}
        <div className="page-card p-6 space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
            <div className="w-8 h-8 bg-purple-50 text-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
              <FileText size={16} />
            </div>
            <div>
              <h2 className="font-bold text-slate-800">Invoice Metadata</h2>
              <p className="text-xs text-slate-400">Reference bill and timestamps</p>
            </div>
          </div>
          <div className="space-y-2.5 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-500 font-medium">Invoice Number:</span>
              <span className="text-slate-800 font-semibold font-mono">{purchase.invoiceNumber || "—"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 font-medium">Invoice Date:</span>
              <span className="text-slate-800 font-medium flex items-center gap-1.5">
                <Calendar size={14} className="text-slate-400" />
                {new Date(purchase.invoiceDate).toLocaleDateString("en-IN", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric"
                })}
              </span>
            </div>
            <div className="flex flex-col pt-1">
              <span className="text-slate-500 font-medium">Notes / Remarks:</span>
              <span className="text-slate-700 bg-slate-50 p-2.5 rounded-lg border border-slate-100 mt-1 text-xs leading-relaxed min-h-[64px]">
                {purchase.notes || "No extra notes recorded."}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Items table card */}
      <div className="page-card">
        <div className="p-4 border-b border-slate-100 flex items-center gap-2">
          <ShoppingCart size={18} className="text-blue-600" />
          <span className="font-bold text-slate-800">Product Items ({purchase.items.length})</span>
        </div>
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>#</th>
                <th className="text-left w-[250px] min-w-[250px] max-w-[250px]">Product Name</th>
                <th>Pack</th>
                <th>Batch</th>
                <th>Expiry</th>
                <th className="text-right">Qty</th>
                <th className="text-right">Free</th>
                <th className="text-right">MRP</th>
                <th className="text-right">P. Rate</th>
                <th className="text-right">S. Rate</th>
                <th className="text-right">GST%</th>
                <th className="text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {purchase.items.map((item, i) => (
                <tr key={item.id} className="hover:bg-slate-50/50">
                  <td style={{ verticalAlign: "top" }} className="text-xs text-slate-400 w-8">{i + 1}</td>
                  <td style={{ verticalAlign: "top" }} className="font-semibold text-slate-800 text-left w-[250px] min-w-[250px] max-w-[250px] break-words">
                    <div>{item.product.name}</div>
                    <div className="text-[10px] text-slate-400 font-medium mt-0.5">HSN: {item.product.hsnCode}</div>
                  </td>
                  <td style={{ verticalAlign: "top" }} className="text-slate-500 text-xs text-center">{item.product.pack || "—"}</td>
                  <td style={{ verticalAlign: "top" }} className="font-mono text-xs text-center font-medium text-slate-700">{item.batchNumber}</td>
                  <td style={{ verticalAlign: "top" }} className="text-center font-medium text-slate-600">
                    {new Date(item.expiryDate).toLocaleDateString("en-IN", {
                      month: "short",
                      year: "numeric"
                    })}
                  </td>
                  <td style={{ verticalAlign: "top" }} className="font-bold text-slate-800 text-right">{item.qty}</td>
                  <td style={{ verticalAlign: "top" }} className="font-semibold text-slate-400 text-right">{item.freeQty || "—"}</td>
                  <td style={{ verticalAlign: "top" }} className="text-right text-slate-600">{fmt(Number(item.mrp))}</td>
                  <td style={{ verticalAlign: "top" }} className="text-right text-blue-700 font-medium">{fmt(Number(item.purchaseRate))}</td>
                  <td style={{ verticalAlign: "top" }} className="text-right text-green-700 font-medium">{fmt(Number(item.sellingRate))}</td>
                  <td style={{ verticalAlign: "top" }} className="text-right font-semibold text-purple-700">{Number(item.gstPercent)}%</td>
                  <td style={{ verticalAlign: "top" }} className="font-bold text-right text-slate-800">{fmt(Number(item.totalAmt))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Totals Summary */}
      <div className="flex justify-end">
        <div className="w-full sm:w-80 page-card p-5 space-y-3">
          <div className="flex justify-between items-center text-sm">
            <span className="text-slate-500 font-medium">Total Amount (Before Tax):</span>
            <span className="font-semibold text-slate-800">{fmt(Number(purchase.totalAmount))}</span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-slate-500 font-medium">Total GST / Tax:</span>
            <span className="font-semibold text-purple-700">{fmt(Number(purchase.totalTax))}</span>
          </div>
          <div className="border-t border-slate-100 pt-3 flex justify-between items-center">
            <span className="font-bold text-slate-800">Grand Total:</span>
            <span className="text-lg font-black text-blue-700">{fmt(Number(purchase.grandTotal))}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
