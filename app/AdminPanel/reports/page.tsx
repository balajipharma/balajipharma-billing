"use client";
import { useState, useEffect } from "react";
import { BarChart3, Loader2, Download } from "lucide-react";

type ReportType = "sales" | "purchase" | "gst" | "stock" | "outstanding";

const TABS: { id: ReportType; label: string }[] = [
  { id: "sales", label: "Sales Report" },
  { id: "purchase", label: "Purchase Report" },
  { id: "gst", label: "GST Report" },
  { id: "stock", label: "Stock Report" },
  { id: "outstanding", label: "Outstanding" },
];

const FILTERS = [
  { label: "Today", value: "today" },
  { label: "This Month", value: "month" },
  { label: "Custom", value: "custom" },
];

interface InvoiceReport {
  id: number;
  invoiceNumber: string;
  invoiceDate: string;
  grandTotal: number;
  taxableAmt: number;
  totalCgst: number;
  totalSgst: number;
  paidAmount: number;
  dueAmount: number;
  paymentStatus: string;
  customer?: { storeName: string } | null;
}

interface PurchaseReport {
  id: number;
  purchaseNumber: string;
  invoiceDate: string;
  grandTotal: number;
  totalAmount: number;
  totalTax: number;
  supplier?: { name: string } | null;
}

interface StockReport {
  id: number;
  batchNumber: string;
  expiryDate: string;
  availableQty: number;
  product?: {
    name: string;
    companyName: string;
    hsnCode: string;
  } | null;
}

export default function ReportsPage() {
  const [tab, setTab] = useState<ReportType>("sales");
  const [filter, setFilter] = useState("month");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [data, setData] = useState<(InvoiceReport | PurchaseReport | StockReport)[]>([]);
  const [loading, setLoading] = useState(false);

  const getDateRange = () => {
    const now = new Date();
    if (filter === "today") {
      const d = now.toISOString().split("T")[0];
      return { from: d, to: d };
    }
    if (filter === "month") {
      const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0];
      const end = now.toISOString().split("T")[0];
      return { from: start, to: end };
    }
    return { from, to };
  };

  const load = async () => {
    setLoading(true);
    const { from: f, to: t } = getDateRange();
    try {
      if (tab === "sales" || tab === "gst" || tab === "outstanding") {
        const params = new URLSearchParams({ limit: "200" });
        if (f) params.set("from", f);
        if (t) params.set("to", t);
        if (tab === "outstanding") params.set("status", "outstanding");
        const res = await fetch(`/api/billing?${params}`);
        const d = await res.json();
        setData(d.invoices || []);
      } else if (tab === "purchase") {
        const params = new URLSearchParams({ limit: "200" });
        if (f) params.set("from", f);
        if (t) params.set("to", t);
        const res = await fetch(`/api/purchase?${params}`);
        const d = await res.json();
        setData(d.purchases || []);
      } else {
        const res = await fetch("/api/stock?tab=report");
        const d = await res.json();
        console.log("Stock Report API response data:", d);
        setData(d.batches || []);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [tab, filter]);

  const salesData = data as InvoiceReport[];
  const purchaseData = data as PurchaseReport[];
  const stockData = data as StockReport[];

  if (tab === "stock") {
    console.log("Stock Report page rendering. stockData:", stockData);
  }

  const salesTotal = Array.isArray(salesData) ? salesData.reduce((s, i) => s + Number(i?.grandTotal || 0), 0) : 0;
  const cgstTotal = Array.isArray(salesData) ? salesData.reduce((s, i) => s + Number((i as InvoiceReport)?.totalCgst || 0), 0) : 0;
  const sgstTotal = Array.isArray(salesData) ? salesData.reduce((s, i) => s + Number((i as InvoiceReport)?.totalSgst || 0), 0) : 0;

  const fmt = (n: number) => `₹${Number(n).toFixed(2)}`;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-black text-slate-800">Reports</h1>
        <p className="text-slate-500 mt-0.5">Business analytics and summaries</p>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-1 mb-6 bg-white border border-slate-200 rounded-xl p-1.5 w-fit">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${tab === t.id ? "bg-blue-600 text-white shadow" : "text-slate-500 hover:text-slate-700"}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Filters */}
      {tab !== "stock" && (
        <div className="page-card p-4 mb-4">
          <div className="flex flex-wrap gap-4 items-end">
            <div>
              <label className="form-label">Period</label>
              <div className="flex gap-2">
                {FILTERS.map(f => (
                  <button key={f.value} onClick={() => setFilter(f.value)} className={`px-3 py-1.5 rounded-lg text-sm font-semibold border transition ${filter === f.value ? "bg-blue-600 text-white border-blue-600" : "border-slate-200 text-slate-600 hover:bg-slate-50"}`}>
                    {f.label}
                  </button>
                ))}
              </div>
            </div>
            {filter === "custom" && (
              <>
                <div>
                  <label className="form-label">From</label>
                  <input type="date" className="form-input" value={from} onChange={e => setFrom(e.target.value)} />
                </div>
                <div>
                  <label className="form-label">To</label>
                  <input type="date" className="form-input" value={to} onChange={e => setTo(e.target.value)} />
                </div>
                <button onClick={load} className="btn-primary">Apply</button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Summary Cards */}
      {(tab === "sales" || tab === "gst") && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
          {[
            { label: "Total Sales", value: fmt(salesTotal), color: "text-blue-600" },
            { label: "Taxable Amt", value: fmt(salesData.reduce((s, i) => s + Number((i as InvoiceReport).taxableAmt || 0), 0)), color: "text-slate-700" },
            { label: "Total CGST", value: fmt(cgstTotal), color: "text-purple-600" },
            { label: "Total SGST", value: fmt(sgstTotal), color: "text-green-600" },
          ].map(c => (
            <div key={c.label} className="page-card p-4">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">{c.label}</p>
              <p className={`text-xl font-black ${c.color}`}>{c.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Table */}
      <div className="page-card">
        <div className="flex items-center justify-between p-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <BarChart3 size={18} className="text-blue-600" />
            <span className="font-bold text-slate-800">
              {TABS.find(t => t.id === tab)?.label} — {data.length} records
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="py-12 text-center"><Loader2 size={28} className="animate-spin mx-auto text-blue-600" /></div>
          ) : tab === "sales" ? (
            <table className="data-table">
              <thead>
                <tr><th>#</th><th>Invoice</th><th>Customer</th><th>Date</th><th>Taxable</th><th>CGST</th><th>SGST</th><th>Total</th><th>Paid</th><th>Due</th><th>Status</th></tr>
              </thead>
              <tbody>
                {salesData.map((inv, i) => (
                  <tr key={inv.id}>
                    <td className="text-xs text-slate-400">{i + 1}</td>
                    <td><span className="font-bold text-blue-700">{inv.invoiceNumber}</span></td>
                    <td className="font-medium">{inv.customer?.storeName || "-"}</td>
                    <td className="text-slate-500">{new Date(inv.invoiceDate).toLocaleDateString("en-IN")}</td>
                    <td>{fmt(Number((inv as InvoiceReport).taxableAmt))}</td>
                    <td className="text-purple-700">{fmt(Number((inv as InvoiceReport).totalCgst))}</td>
                    <td className="text-green-700">{fmt(Number((inv as InvoiceReport).totalSgst))}</td>
                    <td className="font-bold">{fmt(Number(inv.grandTotal))}</td>
                    <td className="text-green-700">{fmt(Number((inv as InvoiceReport).paidAmount))}</td>
                    <td className={`font-medium ${Number((inv as InvoiceReport).dueAmount) > 0 ? "text-red-600" : "text-slate-400"}`}>{fmt(Number((inv as InvoiceReport).dueAmount))}</td>
                    <td>
                      <span className={`badge ${inv.paymentStatus === "Paid" ? "badge-green" : (inv.paymentStatus === "Partial" || inv.paymentStatus === "Partial Paid") ? "badge-yellow" : "badge-red"}`}>
                        {inv.paymentStatus}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : tab === "outstanding" ? (
            <table className="data-table">
              <thead>
                <tr><th>#</th><th>Invoice Number</th><th>Customer Name</th><th>Date</th><th>Grand Total</th><th>Paid Amount</th><th>Due Amount</th><th>Payment Status</th></tr>
              </thead>
              <tbody>
                {salesData.map((inv, i) => (
                  <tr key={inv.id}>
                    <td className="text-xs text-slate-400">{i + 1}</td>
                    <td><span className="font-bold text-blue-700">{inv.invoiceNumber}</span></td>
                    <td className="font-medium">{inv.customer?.storeName || "-"}</td>
                    <td className="text-slate-500">{new Date(inv.invoiceDate).toLocaleDateString("en-IN")}</td>
                    <td className="font-bold">{fmt(Number(inv.grandTotal))}</td>
                    <td className="text-green-700">{fmt(Number((inv as InvoiceReport).paidAmount))}</td>
                    <td className="font-semibold text-red-600">{fmt(Number((inv as InvoiceReport).dueAmount))}</td>
                    <td>
                      <span className={`badge ${inv.paymentStatus === "Paid" ? "badge-green" : (inv.paymentStatus === "Partial" || inv.paymentStatus === "Partial Paid") ? "badge-yellow" : "badge-red"}`}>
                        {inv.paymentStatus}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : tab === "gst" ? (
            <table className="data-table">
              <thead>
                <tr><th>#</th><th>Invoice</th><th>Customer</th><th>Date</th><th>Taxable Amt</th><th>CGST @2.5%</th><th>SGST @2.5%</th><th>CGST @6%</th><th>SGST @6%</th><th>Total GST</th></tr>
              </thead>
              <tbody>
                {salesData.map((inv, i) => (
                  <tr key={inv.id}>
                    <td className="text-xs text-slate-400">{i + 1}</td>
                    <td className="font-bold text-blue-700">{inv.invoiceNumber}</td>
                    <td>{inv.customer?.storeName || "-"}</td>
                    <td className="text-slate-500">{new Date(inv.invoiceDate).toLocaleDateString("en-IN")}</td>
                    <td>{fmt(Number((inv as InvoiceReport).taxableAmt))}</td>
                    <td className="text-purple-700">{fmt(Number((inv as InvoiceReport).totalCgst))}</td>
                    <td className="text-green-700">{fmt(Number((inv as InvoiceReport).totalSgst))}</td>
                    <td>—</td>
                    <td>—</td>
                    <td className="font-bold">{fmt(Number((inv as InvoiceReport).totalCgst) + Number((inv as InvoiceReport).totalSgst))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : tab === "purchase" ? (
            <table className="data-table">
              <thead>
                <tr><th>#</th><th>Purchase No.</th><th>Supplier</th><th>Date</th><th>Taxable Amt</th><th>Total GST</th><th>Grand Total</th></tr>
              </thead>
              <tbody>
                {purchaseData.map((p, i) => (
                  <tr key={p.id}>
                    <td className="text-xs text-slate-400">{i + 1}</td>
                    <td className="font-bold text-blue-700">{p.purchaseNumber}</td>
                    <td className="font-medium">{p.supplier?.name || "-"}</td>
                    <td className="text-slate-500">{new Date(p.invoiceDate).toLocaleDateString("en-IN")}</td>
                    <td>{fmt(Number(p.totalAmount))}</td>
                    <td>{fmt(Number(p.totalTax))}</td>
                    <td className="font-bold">{fmt(Number(p.grandTotal))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : tab === "stock" ? (
            <table className="data-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Product Name</th>
                  <th>Batch Number</th>
                  <th>Available Qty</th>
                  <th>Expiry Date</th>
                </tr>
              </thead>
              <tbody>
                {stockData.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-12 text-slate-400 font-semibold">
                      No stock records found
                    </td>
                  </tr>
                ) : (
                  stockData.map((item, i) => (
                    <tr key={item.id}>
                      <td className="text-xs text-slate-400">{i + 1}</td>
                      <td className="font-semibold text-slate-800">{item.product?.name || "—"}</td>
                      <td className="font-mono text-xs">{item.batchNumber}</td>
                      <td className="font-bold text-green-700">{item.availableQty}</td>
                      <td className="text-slate-500">
                        {item.expiryDate ? new Date(item.expiryDate).toLocaleDateString("en-IN", { month: "short", year: "numeric" }) : "—"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          ) : null}
        </div>
      </div>
    </div>
  );
}
