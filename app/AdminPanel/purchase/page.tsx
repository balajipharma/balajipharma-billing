"use client";
import { useState, useEffect } from "react";
import { Plus, Trash2, Save, Loader2, ShoppingCart, CheckCircle2 } from "lucide-react";
import { useRouter } from "next/navigation";

interface Supplier { id: number; name: string; }
interface Product { id: number; name: string; companyName: string; hsnCode: string; gstPercent: number; pack?: string; manufacturer?: string; }

interface PurchaseRow {
  productId: number;
  productName: string;
  hsnCode: string;
  batchNumber: string;
  expiryDate: string;
  mrp: string;
  purchaseRate: string;
  sellingRate: string;
  qty: string;
  freeQty: string;
  gstPercent: string;
}

const emptyRow = (): PurchaseRow => ({
  productId: 0, productName: "", hsnCode: "", batchNumber: "", expiryDate: "",
  mrp: "", purchaseRate: "", sellingRate: "", qty: "", freeQty: "0", gstPercent: "5"
});

const GST_OPTIONS = ["0", "5", "12", "18", "28"];

export default function PurchasePage() {
  const router = useRouter();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [supplierId, setSupplierId] = useState<string>("");
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split("T")[0]);
  const [rows, setRows] = useState<PurchaseRow[]>([emptyRow()]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [productSearch, setProductSearch] = useState<Record<number, string>>({});

  useEffect(() => {
    fetch("/api/suppliers?limit=200").then(r => r.json()).then(d => setSuppliers(d.suppliers || []));
    fetch("/api/products?limit=500").then(r => r.json()).then(d => setProducts(d.products || []));
  }, []);

  const updateRow = (idx: number, field: keyof PurchaseRow, val: string) => {
    setRows(prev => prev.map((r, i) => i === idx ? { ...r, [field]: val } : r));
  };

  const selectProduct = (idx: number, productId: number) => {
    const p = products.find(x => x.id === productId);
    if (!p) return;
    setRows(prev => prev.map((r, i) =>
      i === idx ? { ...r, productId: p.id, productName: p.name, hsnCode: p.hsnCode, gstPercent: String(p.gstPercent) } : r
    ));
    setProductSearch(prev => ({ ...prev, [idx]: "" }));
  };

  const addRow = () => setRows(prev => [...prev, emptyRow()]);
  const removeRow = (idx: number) => setRows(prev => prev.filter((_, i) => i !== idx));

  const calcTotals = () => {
    let taxable = 0, tax = 0;
    rows.forEach(r => {
      const q = parseFloat(r.qty) || 0;
      const rate = parseFloat(r.purchaseRate) || 0;
      const gst = parseFloat(r.gstPercent) || 0;
      const t = q * rate;
      taxable += t;
      tax += t * gst / 100;
    });
    return { taxable, tax, grand: taxable + tax };
  };

  const { taxable, tax, grand } = calcTotals();

  const handleSave = async () => {
    if (!supplierId) { setError("Please select a supplier"); return; }
    const valid = rows.filter(r => r.productId && r.batchNumber && r.qty && r.purchaseRate);
    if (valid.length === 0) { setError("Add at least one product with batch, qty and rate"); return; }

    setSaving(true); setError("");
    try {
      const res = await fetch("/api/purchase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          supplierId: parseInt(supplierId),
          invoiceNumber,
          invoiceDate,
          items: valid.map(r => ({
            productId: r.productId,
            batchNumber: r.batchNumber,
            expiryDate: r.expiryDate,
            mrp: parseFloat(r.mrp) || 0,
            purchaseRate: parseFloat(r.purchaseRate),
            sellingRate: parseFloat(r.sellingRate) || parseFloat(r.purchaseRate),
            qty: parseInt(r.qty),
            freeQty: parseInt(r.freeQty) || 0,
            gstPercent: parseFloat(r.gstPercent),
          })),
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Save failed"); return; }
      setSuccess(`Purchase ${data.purchaseNumber} saved! Stock updated.`);
      setTimeout(() => router.push("/AdminPanel/purchase/list"), 2000);
    } finally { setSaving(false); }
  };

  const filteredProducts = (idx: number) => {
    const q = productSearch[idx] || "";
    if (!q) return products.slice(0, 10);
    return products.filter(p =>
      p.name.toLowerCase().includes(q.toLowerCase()) ||
      p.companyName.toLowerCase().includes(q.toLowerCase())
    ).slice(0, 10);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-slate-800">Purchase Entry</h1>
          <p className="text-slate-500 mt-0.5">Record new stock purchase from supplier</p>
        </div>
        <a href="/AdminPanel/purchase/list" className="btn-secondary text-sm">View All Purchases</a>

      </div>

      {success && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-xl flex items-center gap-3">
          <CheckCircle2 size={20} className="text-green-600 flex-shrink-0" />
          <p className="text-green-700 font-medium">{success}</p>
        </div>
      )}
      {error && <div className="mb-4 p-3.5 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">{error}</div>}

      <div className="page-card p-6 space-y-6">
        {/* Header Info */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="form-label">Supplier *</label>
            <select className="form-input" value={supplierId ?? ""} onChange={e => setSupplierId(e.target.value)}>
              <option value="">-- Select Supplier --</option>
              {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div>
            <label className="form-label">Supplier Invoice No.</label>
            <input className="form-input" value={invoiceNumber ?? ""} onChange={e => setInvoiceNumber(e.target.value)} placeholder="e.g. GD986" />
          </div>
          <div>
            <label className="form-label">Invoice Date *</label>
            <input type="date" className="form-input" value={invoiceDate ?? ""} onChange={e => setInvoiceDate(e.target.value)} />
          </div>
        </div>

        {/* Products Table */}
        <div className="overflow-visible">
          <table className="data-table min-w-[1100px]">
            <thead>
              <tr>
                <th className="w-8">#</th>
                <th className="min-w-[200px]">Product</th>
                <th className="min-w-[110px]">Batch No.</th>
                <th className="min-w-[120px]">Expiry</th>
                <th className="min-w-[90px]">MRP</th>
                <th className="min-w-[100px]">Purchase Rate</th>
                <th className="min-w-[100px]">Selling Rate</th>
                <th className="min-w-[70px]">Qty</th>
                <th className="min-w-[70px]">Free</th>
                <th className="min-w-[80px]">GST %</th>
                <th className="min-w-[90px]">Amount</th>
                <th className="w-8"></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, idx) => {
                const amount = ((parseFloat(row.qty) || 0) * (parseFloat(row.purchaseRate) || 0));
                const gstAmt = amount * (parseFloat(row.gstPercent) || 0) / 100;
                return (
                  <tr key={idx}>
                    <td className="text-slate-400 text-xs">{idx + 1}</td>
                    <td>
                      <div className="relative">
                        <input
                          className="form-input text-xs"
                          placeholder="Search product..."
                          value={row.productId ? row.productName : (productSearch[idx] || "")}
                          onChange={e => {
                            setProductSearch(prev => ({ ...prev, [idx]: e.target.value }));
                            if (row.productId) updateRow(idx, "productId", "0");
                          }}
                        />
                        {!row.productId && (productSearch[idx] || "").length > 0 && (
                          <div className="absolute z-[9999] top-full left-0 right-0 bg-white border border-slate-200 rounded-lg shadow-lg max-h-48 overflow-y-auto mt-1">
                            {filteredProducts(idx).map(p => (
                              <button key={p.id} className="w-full text-left px-3 py-2 hover:bg-blue-50 text-sm" onClick={() => selectProduct(idx, p.id)}>
                                <p className="font-semibold text-slate-800">{p.name}</p>
                                <p className="text-xs text-slate-500">{p.companyName} | HSN: {p.hsnCode}</p>
                              </button>
                            ))}
                            {filteredProducts(idx).length === 0 && <p className="px-3 py-2 text-sm text-slate-400">No products found</p>}
                          </div>
                        )}
                      </div>
                    </td>
                    <td><input className="form-input text-xs" value={row.batchNumber ?? ""} onChange={e => updateRow(idx, "batchNumber", e.target.value)} placeholder="Batch" /></td>
                    <td><input type="month" className="form-input text-xs" value={row.expiryDate ? row.expiryDate.substring(0, 7) : ""} onChange={e => updateRow(idx, "expiryDate", e.target.value ? e.target.value + "-01" : "")} /></td>
                    <td><input type="number" className="form-input text-xs" value={row.mrp ?? ""} onChange={e => updateRow(idx, "mrp", e.target.value)} placeholder="0.00" /></td>
                    <td><input type="number" className="form-input text-xs" value={row.purchaseRate ?? ""} onChange={e => updateRow(idx, "purchaseRate", e.target.value)} placeholder="0.00" /></td>
                    <td><input type="number" className="form-input text-xs" value={row.sellingRate ?? ""} onChange={e => updateRow(idx, "sellingRate", e.target.value)} placeholder="0.00" /></td>
                    <td><input type="number" className="form-input text-xs" value={row.qty ?? ""} onChange={e => updateRow(idx, "qty", e.target.value)} placeholder="0" /></td>
                    <td><input type="number" className="form-input text-xs" value={row.freeQty ?? ""} onChange={e => updateRow(idx, "freeQty", e.target.value)} placeholder="0" /></td>
                    <td>
                      <select className="form-input text-xs" value={row.gstPercent ?? "5"} onChange={e => updateRow(idx, "gstPercent", e.target.value)}>
                        {GST_OPTIONS.map(g => <option key={g} value={g}>{g}%</option>)}
                      </select>
                    </td>
                    <td className="font-semibold text-slate-800 text-xs">
                      ₹{(amount + gstAmt).toFixed(2)}
                    </td>
                    <td>
                      {rows.length > 1 && (
                        <button onClick={() => removeRow(idx)} className="p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded"><Trash2 size={14} /></button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <button onClick={addRow} className="btn-secondary text-sm">
          <Plus size={15} /> Add Row
        </button>

        {/* Summary */}
        <div className="flex justify-end">
          <div className="w-full max-w-sm bg-slate-50 rounded-xl p-4 space-y-2">
            <div className="flex justify-between text-sm text-slate-600">
              <span>Taxable Amount</span>
              <span className="font-semibold">₹{taxable.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm text-slate-600">
              <span>Total GST</span>
              <span className="font-semibold">₹{tax.toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-bold text-slate-800 border-t border-slate-200 pt-2 text-base">
              <span>Grand Total</span>
              <span>₹{grand.toFixed(2)}</span>
            </div>
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <button onClick={() => router.back()} className="btn-secondary">Cancel</button>
          <button onClick={handleSave} disabled={saving} className="btn-success ml-auto">
            {saving ? <><Loader2 size={16} className="animate-spin" /> Saving...</> : <><Save size={16} /> Save Purchase</>}
          </button>
        </div>
      </div>
    </div>
  );
}
