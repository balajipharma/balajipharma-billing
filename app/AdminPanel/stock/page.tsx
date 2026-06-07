"use client";
import { useState, useEffect, useCallback, Suspense } from "react";
import { Boxes, Loader2 } from "lucide-react";
import SearchInput from "@/app/components/ui/SearchInput";
import { useSearchParams } from "next/navigation";

type TabType = "current" | "batch" | "expiry" | "ledger";

interface Product {
  id: number;
  name: string;
  companyName: string;
  hsnCode: string;
  batches: Batch[];
}

interface Batch {
  id: number;
  batchNumber: string;
  expiryDate: string;
  mrp: number;
  sellingRate: number;
  availableQty: number;
  product?: { name: string; hsnCode: string; companyName: string };
}

interface LedgerEntry {
  date: string;
  type: string;
  ref: string;
  batch: string;
  qty: number;
  balance: number;
}

const TABS: { id: TabType; label: string }[] = [
  { id: "current", label: "Current Stock" },
  { id: "batch", label: "Batch Wise" },
  { id: "expiry", label: "Expiry Wise" },
  { id: "ledger", label: "Product Ledger" },
];

export default function StockPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin text-blue-600" size={32} />
      </div>
    }>
      <StockContent />
    </Suspense>
  );
}

function StockContent() {
  const searchParams = useSearchParams();
  const [tab, setTab] = useState<TabType>("current");

  useEffect(() => {
    const t = searchParams.get("tab");
    if (t === "expiry" || t === "current" || t === "batch" || t === "ledger") {
      setTab(t);
    }
  }, [searchParams]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [ledger, setLedger] = useState<LedgerEntry[]>([]);
  const [ledgerProduct, setLedgerProduct] = useState<Product | null>(null);
  const [ledgerProductId, setLedgerProductId] = useState<string>("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      if (tab === "expiry") {
        const res = await fetch(`/api/stock?tab=expiry&search=${encodeURIComponent(search)}`);
        const data = await res.json();
        setBatches(data.batches || []);
      } else if (tab === "ledger" && ledgerProductId) {
        const res = await fetch(`/api/stock?tab=ledger&productId=${ledgerProductId}`);
        const data = await res.json();
        setLedger(data.ledger || []);
        setLedgerProduct(data.product);
      } else if (tab !== "ledger") {
        const res = await fetch(`/api/stock?tab=${tab}&search=${encodeURIComponent(search)}`);
        const data = await res.json();
        setProducts(data.products || []);
      }
    } finally {
      setLoading(false);
    }
  }, [tab, search, ledgerProductId]);

  useEffect(() => { load(); }, [load]);

  const now = new Date();
  const soon = new Date(); soon.setMonth(soon.getMonth() + 3);

  const expiryBadge = (expiry: string) => {
    const d = new Date(expiry);
    if (d < now) return "badge badge-red";
    if (d < soon) return "badge badge-yellow";
    return "badge badge-green";
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-black text-slate-800">Stock Management</h1>
        <p className="text-slate-500 mt-0.5">Track inventory across all batches</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-white border border-slate-200 rounded-xl p-1.5 w-fit">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
              tab === t.id ? "bg-blue-600 text-white shadow" : "text-slate-500 hover:text-slate-700"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "ledger" ? (
        <div>
          <div className="page-card p-4 mb-4">
            <div className="flex gap-4 items-end">
              <div className="flex-1 max-w-xs">
                <label className="form-label">Select Product</label>
                <select className="form-input" value={ledgerProductId} onChange={e => setLedgerProductId(e.target.value)}>
                  <option value="">-- Select Product --</option>
                  {products.length === 0 && <option disabled>Load current stock first</option>}
                  {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              {ledgerProductId && (
                <button onClick={load} className="btn-primary">Load Ledger</button>
              )}
            </div>
          </div>

          {ledgerProduct && (
            <div className="page-card">
              <div className="p-4 border-b border-slate-100">
                <h2 className="font-bold text-slate-800">{ledgerProduct.name}</h2>
                <p className="text-sm text-slate-500">{ledgerProduct.companyName} | HSN: {ledgerProduct.hsnCode}</p>
              </div>
              <div className="overflow-x-auto">
                <table className="data-table">
                  <thead>
                    <tr><th>Date</th><th>Type</th><th>Reference</th><th>Batch</th><th>Qty</th><th>Balance</th></tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td colSpan={4} className="font-semibold text-slate-600">Opening Stock</td>
                      <td>—</td>
                      <td className="font-bold text-blue-600">0</td>
                    </tr>
                    {loading ? (
                      <tr><td colSpan={6} className="text-center py-8"><Loader2 size={24} className="animate-spin mx-auto text-blue-600" /></td></tr>
                    ) : ledger.map((entry, i) => (
                      <tr key={i}>
                        <td className="text-slate-500">{new Date(entry.date).toLocaleDateString("en-IN")}</td>
                        <td>
                          <span className={`badge ${entry.type === "Purchase" ? "badge-green" : "badge-red"}`}>
                            {entry.type}
                          </span>
                        </td>
                        <td className="font-mono text-xs text-blue-700">{entry.ref}</td>
                        <td className="font-mono text-xs">{entry.batch}</td>
                        <td className={`font-bold ${entry.qty > 0 ? "text-green-600" : "text-red-600"}`}>
                          {entry.qty > 0 ? `+${entry.qty}` : entry.qty}
                        </td>
                        <td className="font-bold text-slate-800">{entry.balance}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div>
          <div className="mb-4">
            <SearchInput value={search} onChange={setSearch} placeholder={tab === "expiry" ? "Search by product..." : "Search..."} />
          </div>

          {tab === "expiry" ? (
            <div className="page-card">
              <div className="overflow-x-auto">
                <table className="data-table">
                  <thead>
                    <tr><th>#</th><th>Product</th><th>HSN</th><th>Batch</th><th>Expiry Date</th><th>MRP</th><th>Selling Rate</th><th>Stock</th><th>Status</th></tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr><td colSpan={9} className="text-center py-12"><Loader2 size={28} className="animate-spin mx-auto text-blue-600" /></td></tr>
                    ) : batches.length === 0 ? (
                      <tr><td colSpan={9} className="text-center py-12 text-slate-400"><Boxes size={40} className="mx-auto mb-2 opacity-30" /><p>No data</p></td></tr>
                    ) : batches.map((b, i) => (
                      <tr key={b.id}>
                        <td className="text-slate-400 text-xs">{i + 1}</td>
                        <td className="font-semibold text-slate-800">{b.product?.name}</td>
                        <td><span className="font-mono text-xs bg-slate-100 px-1.5 py-0.5 rounded">{b.product?.hsnCode}</span></td>
                        <td className="font-mono text-xs">{b.batchNumber}</td>
                        <td className="font-medium">{new Date(b.expiryDate).toLocaleDateString("en-IN", { month: "short", year: "numeric" })}</td>
                        <td>₹{Number(b.mrp).toFixed(2)}</td>
                        <td>₹{Number(b.sellingRate).toFixed(2)}</td>
                        <td className="font-bold text-slate-800">{b.availableQty}</td>
                        <td><span className={expiryBadge(b.expiryDate)}>{new Date(b.expiryDate) < now ? "Expired" : new Date(b.expiryDate) < soon ? "Expiring Soon" : "OK"}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="page-card">
              <div className="overflow-x-auto">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Product</th>
                      <th>Company</th>
                      <th>HSN</th>
                      {tab === "batch" && <><th>Batch</th><th>Expiry</th><th>MRP</th><th>Rate</th></>}
                      <th>Stock</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr><td colSpan={9} className="text-center py-12"><Loader2 size={28} className="animate-spin mx-auto text-blue-600" /></td></tr>
                    ) : products.length === 0 ? (
                      <tr><td colSpan={9} className="text-center py-12 text-slate-400"><Boxes size={40} className="mx-auto mb-2 opacity-30" /><p>No stock data</p></td></tr>
                    ) : (
                      tab === "current" ? (
                        products.map((p, i) => {
                          const totalStock = p.batches.reduce((s, b) => s + b.availableQty, 0);
                          return (
                            <tr key={p.id}>
                              <td className="text-slate-400 text-xs">{i + 1}</td>
                              <td className="font-semibold text-slate-800">{p.name}</td>
                              <td className="text-slate-600">{p.companyName}</td>
                              <td><span className="font-mono text-xs bg-slate-100 px-1.5 py-0.5 rounded">{p.hsnCode}</span></td>
                              <td>
                                <span className={`font-bold text-lg ${totalStock > 0 ? "text-green-700" : "text-red-600"}`}>
                                  {totalStock}
                                </span>
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        products.flatMap((p, pi) =>
                          p.batches.map((b, bi) => (
                            <tr key={`${p.id}-${b.id}`}>
                              {bi === 0 && <td className="text-slate-400 text-xs" rowSpan={p.batches.length}>{pi + 1}</td>}
                              {bi === 0 && <td className="font-semibold text-slate-800" rowSpan={p.batches.length}>{p.name}</td>}
                              {bi === 0 && <td className="text-slate-600" rowSpan={p.batches.length}>{p.companyName}</td>}
                              {bi === 0 && <td rowSpan={p.batches.length}><span className="font-mono text-xs bg-slate-100 px-1.5 py-0.5 rounded">{p.hsnCode}</span></td>}
                              <td className="font-mono text-xs">{b.batchNumber}</td>
                              <td>{new Date(b.expiryDate).toLocaleDateString("en-IN", { month: "short", year: "numeric" })}</td>
                              <td>₹{Number(b.mrp).toFixed(2)}</td>
                              <td>₹{Number(b.sellingRate).toFixed(2)}</td>
                              <td className={`font-bold ${b.availableQty > 0 ? "text-green-700" : "text-red-600"}`}>{b.availableQty}</td>
                            </tr>
                          ))
                        )
                      )
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
