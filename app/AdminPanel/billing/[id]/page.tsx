"use client";
import { useEffect, useState, use } from "react";
import { ArrowLeft, Loader2, ShoppingCart, Calendar, FileText, User, Printer, Edit } from "lucide-react";
import Link from "next/link";

interface InvoiceItem {
  id: number;
  batchNumber: string;
  expiryDate: string;
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
    companyName: string;
  };
}

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
  notes: string | null;
  customer: {
    storeName: string;
    mobile: string;
    address: string;
    gstNumber: string | null;
  };
  items: InvoiceItem[];
  paymentHistory?: Array<{
    id: number;
    amount: number;
    paymentMethod: "CASH" | "UPI";
    note: string | null;
    paymentDate: string;
    createdAt: string;
  }>;
}

const statusStyle: Record<string, string> = {
  Paid: "badge badge-green",
  Partial: "badge badge-yellow",
  "Partial Paid": "badge badge-yellow",
  Unpaid: "badge badge-red",
};

export default function BillingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [invoice, setInvoice] = useState<InvoiceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`/api/billing/${id}`)
      .then((r) => {
        if (!r.ok) throw new Error("Invoice record not found");
        return r.json();
      })
      .then(setInvoice)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  const fmt = (n: number) =>
    new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(n);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <Loader2 size={36} className="animate-spin text-blue-600 mb-4" />
        <p className="text-slate-500 font-medium">Loading invoice details...</p>
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="p-8 text-center max-w-md mx-auto">
        <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
          <FileText size={28} />
        </div>
        <h2 className="text-lg font-bold text-slate-800 mb-1">Error Loading Details</h2>
        <p className="text-slate-500 text-sm mb-6">{error || "Invoice record not found"}</p>
        <Link href="/AdminPanel/billing/list" className="btn-primary">
          <ArrowLeft size={16} /> Back to Billing List
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800">Invoice Details</h1>
          <p className="text-slate-500 mt-0.5">Invoice #{invoice.invoiceNumber}</p>
        </div>
        <div className="flex gap-2">
          <Link href={`/AdminPanel/billing/edit/${invoice.id}`} className="btn-secondary text-sm flex items-center gap-1.5">
            <Edit size={16} /> Edit Invoice
          </Link>
          <Link href={`/print/invoice/${invoice.id}`} target="_blank" className="btn-primary text-sm flex items-center gap-1.5">
            <Printer size={16} /> Print Invoice
          </Link>
          <Link href="/AdminPanel/billing/list" className="btn-secondary text-sm flex items-center gap-1.5">
            <ArrowLeft size={16} /> Back to List
          </Link>
        </div>
      </div>

      {/* Info Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Customer details card */}
        <div className="page-card p-6 space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
            <div className="w-8 h-8 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
              <User size={16} />
            </div>
            <div>
              <h2 className="font-bold text-slate-800">Customer Information</h2>
              <p className="text-xs text-slate-400">Customer contact and business info</p>
            </div>
          </div>
          <div className="space-y-2.5 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-500 font-medium">Name:</span>
              <span className="text-slate-800 font-semibold">{invoice.customer.storeName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 font-medium">Mobile:</span>
              <span className="text-slate-800 font-mono">{invoice.customer.mobile}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 font-medium">GSTIN:</span>
              <span className="text-slate-800 font-mono font-semibold">{invoice.customer.gstNumber || "—"}</span>
            </div>
            <div className="flex flex-col pt-1">
              <span className="text-slate-500 font-medium">Address:</span>
              <span className="text-slate-700 bg-slate-50 p-2.5 rounded-lg border border-slate-100 mt-1 text-xs leading-relaxed whitespace-pre-wrap">
                {invoice.customer.address}
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
              <h2 className="font-bold text-slate-800">Invoice Information</h2>
              <p className="text-xs text-slate-400">Reference bill, payment status, and remarks</p>
            </div>
          </div>
          <div className="space-y-2.5 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-500 font-medium">Invoice Number:</span>
              <span className="text-slate-800 font-semibold font-mono">{invoice.invoiceNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 font-medium">Invoice Date:</span>
              <span className="text-slate-800 font-medium flex items-center gap-1.5">
                <Calendar size={14} className="text-slate-400" />
                {new Date(invoice.invoiceDate).toLocaleDateString("en-IN", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric"
                })}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 font-medium">Payment Status:</span>
              <span className={statusStyle[invoice.paymentStatus] || "badge"}>
                {invoice.paymentStatus}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 font-medium">Paid Amount:</span>
              <span className="text-green-700 font-bold">{fmt(Number(invoice.paidAmount))}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 font-medium">Due Amount:</span>
              <span className="text-red-600 font-bold">{fmt(Number(invoice.dueAmount))}</span>
            </div>
            <div className="flex flex-col pt-1">
              <span className="text-slate-500 font-medium">Notes / Remarks:</span>
              <span className="text-slate-700 bg-slate-50 p-2.5 rounded-lg border border-slate-100 mt-1 text-xs leading-relaxed min-h-[48px]">
                {invoice.notes || "No extra notes recorded."}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Payment History */}
      <div className="page-card">
        <div className="p-4 border-b border-slate-100 flex items-center gap-2">
          <FileText size={18} className="text-blue-600" />
          <span className="font-bold text-slate-800">Payment History</span>
        </div>
        <div className="overflow-x-auto">
          {!invoice.paymentHistory || invoice.paymentHistory.length === 0 ? (
            <p className="text-slate-500 text-sm p-6 text-center font-medium">No payment transactions recorded yet.</p>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th className="w-12 text-center">#</th>
                  <th className="text-left">Date</th>
                  <th className="text-right">Amount</th>
                  <th className="text-center">Method</th>
                  <th className="text-left">Notes / Remarks</th>
                </tr>
              </thead>
              <tbody>
                {invoice.paymentHistory.map((pt, i) => (
                  <tr key={pt.id} className="hover:bg-slate-50/50">
                    <td className="text-xs text-slate-400 w-12 text-center">{i + 1}</td>
                    <td className="text-slate-700 text-sm font-medium">
                      {new Date(pt.paymentDate).toLocaleString("en-IN", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td className="font-bold text-right text-green-700">{fmt(Number(pt.amount))}</td>
                    <td className="text-center">
                      <span className={`badge ${pt.paymentMethod === "CASH" ? "badge-green" : "badge-blue"}`}>
                        {pt.paymentMethod}
                      </span>
                    </td>
                    <td className="text-slate-600 text-xs">{pt.note || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>


      {/* Items table card */}
      <div className="page-card">
        <div className="p-4 border-b border-slate-100 flex items-center gap-2">
          <ShoppingCart size={18} className="text-blue-600" />
          <span className="font-bold text-slate-800">Product Items ({invoice.items.length})</span>
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
                <th className="text-right">Rate</th>
                <th className="text-right">Disc%</th>
                <th className="text-right">GST%</th>
                <th className="text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {invoice.items.map((item, i) => (
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
                  <td style={{ verticalAlign: "top" }} className="text-right text-blue-700 font-medium">{fmt(Number(item.rate))}</td>
                  <td style={{ verticalAlign: "top" }} className="text-right text-slate-600">{Number(item.discount)}%</td>
                  <td style={{ verticalAlign: "top" }} className="text-right font-semibold text-purple-700">{Number(item.gstPercent)}%</td>
                  <td style={{ verticalAlign: "top" }} className="font-bold text-right text-slate-800">{fmt(Number(item.amount))}</td>
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
            <span className="text-slate-500 font-medium">Taxable Amount:</span>
            <span className="font-semibold text-slate-800">{fmt(Number(invoice.taxableAmt))}</span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-slate-500 font-medium">CGST:</span>
            <span className="font-semibold text-purple-700">{fmt(Number(invoice.totalCgst))}</span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-slate-500 font-medium">SGST:</span>
            <span className="font-semibold text-purple-700">{fmt(Number(invoice.totalSgst))}</span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-slate-500 font-medium">Round Off:</span>
            <span className="font-semibold text-slate-500">{fmt(Number(invoice.roundOff))}</span>
          </div>
          <div className="border-t border-slate-100 pt-3 flex justify-between items-center">
            <span className="font-bold text-slate-800">Grand Total:</span>
            <span className="text-lg font-black text-blue-700">{fmt(Number(invoice.grandTotal))}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
