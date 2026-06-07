"use client";
import { useState, useEffect, use } from "react";
import { Plus, Trash2, Save, Loader2, CheckCircle2 } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Customer { id: number; storeName: string; gstNumber: string | null; dlNumber: string | null; mobile: string; address: string; }
interface Product { id: number; name: string; companyName: string; hsnCode: string; gstPercent: number; pack?: string; manufacturer?: string; }
interface Batch { id: number; batchNumber: string; expiryDate: string; mrp: number; sellingRate: number; availableQty: number; }

interface BillingRow {
  productId: number;
  productName: string;
  hsnCode: string;
  pack: string;
  manufacturer: string;
  batchStockId: number;
  batchNumber: string;
  expiryDate: string;
  mrp: string;
  qty: string;
  freeQty: string;
  rate: string;
  discount: string;
  gstPercent: string;
  batches: Batch[];
}

const emptyRow = (): BillingRow => ({
  productId: 0, productName: "", hsnCode: "", pack: "", manufacturer: "",
  batchStockId: 0, batchNumber: "", expiryDate: "", mrp: "",
  qty: "", freeQty: "0", rate: "", discount: "0", gstPercent: "5", batches: []
});

export default function EditInvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [customerId, setCustomerId] = useState<string>("");
  const [invoiceDate, setInvoiceDate] = useState("");
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [paidAmount, setPaidAmount] = useState("0");
  const [notes, setNotes] = useState("");
  const [rows, setRows] = useState<BillingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [productSearch, setProductSearch] = useState<Record<number, string>>({});

  useEffect(() => {
    Promise.all([
      fetch("/api/customers?limit=200").then(r => r.json()),
      fetch("/api/products?limit=500").then(r => r.json()),
      fetch(`/api/billing/${id}`).then(r => {
        if (!r.ok) throw new Error("Invoice not found");
        return r.json();
      })
    ]).then(async ([cData, pData, inv]) => {
      setCustomers(cData.customers || []);
      setProducts(pData.products || []);
      setCustomerId(String(inv.customerId));
      setInvoiceDate(inv.invoiceDate ? new Date(inv.invoiceDate).toISOString().split("T")[0] : "");
      setInvoiceNumber(inv.invoiceNumber);
      setPaidAmount(String(inv.paidAmount));
      setNotes(inv.notes || "");

      const mappedRows = await Promise.all(inv.items.map(async (item: any) => {
        const batchRes = await fetch(`/api/batches?productId=${item.productId}`);
        const batchData = await batchRes.json();
        return {
          productId: item.productId,
          productName: item.product.name,
          hsnCode: item.product.hsnCode,
          pack: item.product.pack || "",
          manufacturer: item.product.manufacturer || "",
          batchStockId: item.batchStockId,
          batchNumber: item.batchNumber,
          expiryDate: item.expiryDate ? new Date(item.expiryDate).toISOString().split("T")[0] : "",
          mrp: String(item.mrp),
          qty: String(item.qty),
          freeQty: String(item.freeQty || "0"),
          rate: String(item.rate),
          discount: String(item.discount || "0"),
          gstPercent: String(item.gstPercent),
          batches: batchData.batches || []
        };
      }));

      setRows(mappedRows.length > 0 ? mappedRows : [emptyRow()]);
      setLoading(false);
    }).catch(err => {
      setError(err.message);
      setLoading(false);
    });
  }, [id]);

  const loadBatches = async (productId: number, idx: number) => {
    const res = await fetch(`/api/batches?productId=${productId}`);
    const data = await res.json();
    setRows(prev => prev.map((r, i) => i === idx ? { ...r, batches: data.batches || [] } : r));
  };

  const selectProduct = async (idx: number, product: Product) => {
    const res = await fetch(`/api/batches?productId=${product.id}`);
    const data = await res.json();
    const batches: Batch[] = data.batches || [];

    setRows(prev => prev.map((r, i) => {
      if (i !== idx) return r;
      const firstBatch = batches[0];
      return {
        ...r,
        productId: product.id,
        productName: product.name,
        hsnCode: product.hsnCode,
        pack: product.pack || "",
        manufacturer: product.manufacturer || "",
        gstPercent: String(product.gstPercent),
        batches,
        // Auto-populate first batch details if available
        batchStockId: firstBatch ? firstBatch.id : 0,
        batchNumber: firstBatch ? firstBatch.batchNumber : "",
        expiryDate: firstBatch ? firstBatch.expiryDate.split("T")[0] : "",
        mrp: firstBatch ? String(firstBatch.mrp) : "",
        rate: firstBatch ? String(firstBatch.sellingRate) : "",
      };
    }));
    setProductSearch(prev => ({ ...prev, [idx]: "" }));
  };

  const selectBatch = (idx: number, batch: Batch) => {
    setRows(prev => prev.map((r, i) => i === idx ? {
      ...r, batchStockId: batch.id, batchNumber: batch.batchNumber,
      expiryDate: batch.expiryDate.split("T")[0], mrp: String(batch.mrp), rate: String(batch.sellingRate)
    } : r));
  };

  const updateRow = (idx: number, field: keyof BillingRow, val: string) => {
    setRows(prev => prev.map((r, i) => i === idx ? { ...r, [field]: val } : r));
  };

  const filteredProducts = (idx: number) => {
    const q = productSearch[idx] || "";
    if (!q) return products.slice(0, 10);
    return products.filter(p =>
      p.name.toLowerCase().includes(q.toLowerCase()) ||
      p.companyName.toLowerCase().includes(q.toLowerCase())
    ).slice(0, 10);
  };

  const calcRow = (r: BillingRow) => {
    const qty = parseFloat(r.qty) || 0;
    const rate = parseFloat(r.rate) || 0;
    const disc = parseFloat(r.discount) || 0;
    const gst = parseFloat(r.gstPercent) || 0;
    const gross = qty * rate;
    const discAmt = gross * disc / 100;
    const taxable = gross - discAmt;
    const gstAmt = taxable * gst / 100;
    return { gross, discAmt, taxable, cgst: gstAmt / 2, sgst: gstAmt / 2, total: taxable + gstAmt };
  };

  const totals = rows.reduce((acc, r) => {
    const c = calcRow(r);
    return { taxable: acc.taxable + c.taxable, cgst: acc.cgst + c.cgst, sgst: acc.sgst + c.sgst, total: acc.total + c.total };
  }, { taxable: 0, cgst: 0, sgst: 0, total: 0 });

  const rawTotal = totals.taxable + totals.cgst + totals.sgst;
  const roundOff = Math.round(rawTotal) - rawTotal;
  const grandTotal = rawTotal + roundOff;
  const dueAmount = grandTotal - (parseFloat(paidAmount) || 0);

  const handleSave = async () => {
    if (!customerId) { setError("Please select a customer"); return; }
    const valid = rows.filter(r => r.productId && r.batchStockId && r.qty && r.rate);
    if (valid.length === 0) { setError("Add at least one product with batch, qty and rate"); return; }

    for (const r of valid) {
      const q = parseInt(r.qty);
      if (isNaN(q) || q <= 0) {
        setError(`Quantity for product "${r.productName}" must be greater than 0`);
        return;
      }
    }

    setSaving(true); setError("");
    try {
      const res = await fetch(`/api/billing/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId: parseInt(customerId),
          invoiceDate,
          paidAmount: parseFloat(paidAmount) || 0,
          notes: notes || null,
          items: valid.map(r => ({
            productId: r.productId,
            batchStockId: r.batchStockId,
            batchNumber: r.batchNumber,
            expiryDate: r.expiryDate,
            mrp: parseFloat(r.mrp) || 0,
            qty: parseInt(r.qty),
            freeQty: parseInt(r.freeQty) || 0,
            rate: parseFloat(r.rate),
            discount: parseFloat(r.discount) || 0,
            gstPercent: parseFloat(r.gstPercent),
          })),
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Save failed"); return; }
      setSuccess("Invoice updated successfully");
      setTimeout(() => router.push("/AdminPanel/billing/list?success=Invoice updated successfully"), 1500);
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally { setSaving(false); }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <Loader2 size={36} className="animate-spin text-blue-600 mb-4" />
        <p className="text-slate-500 font-medium">Loading invoice record...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-slate-800">Edit Invoice</h1>
          <p className="text-slate-500 mt-0.5">Update invoice: {invoiceNumber}</p>
        </div>
        <Link href="/AdminPanel/billing/list" className="btn-secondary text-sm">View All Invoices</Link>
      </div>

      {success && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-xl flex items-center gap-3">
          <CheckCircle2 size={20} className="text-green-600 flex-shrink-0" />
          <p className="text-green-700 font-medium">{success}</p>
        </div>
      )}
      {error && <div className="mb-4 p-3.5 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">{error}</div>}

      <div className="page-card p-6 space-y-6">
        {/* Customer + Date */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="col-span-2">
            <label className="form-label">Customer *</label>
            <select className="form-input" value={customerId ?? ""} onChange={e => setCustomerId(e.target.value)}>
              <option value="">-- Select Customer --</option>
              {customers.map(c => <option key={c.id} value={c.id}>{c.storeName}</option>)}
            </select>
            {customerId && (() => {
              const c = customers.find(x => x.id === parseInt(customerId));
              if (!c) return null;
              return (
                <div className="mt-2 p-3 bg-blue-50 rounded-lg text-xs text-blue-800 space-y-0.5">
                  {c.gstNumber && <p><span className="font-semibold">GST:</span> {c.gstNumber}</p>}
                  {c.dlNumber && <p><span className="font-semibold">DL:</span> {c.dlNumber}</p>}
                  <p><span className="font-semibold">Mob:</span> {c.mobile}</p>
                  <p>{c.address}</p>
                </div>
              );
            })()}
          </div>
          <div>
            <label className="form-label">Invoice Date</label>
            <input type="date" className="form-input" value={invoiceDate ?? ""} onChange={e => setInvoiceDate(e.target.value)} />
          </div>
        </div>

        {/* Products Table */}
        <div className="overflow-visible">
          <table className="data-table min-w-[1200px]">
            <thead>
              <tr>
                <th>#</th>
                <th className="min-w-[200px]">Product</th>
                <th className="min-w-[140px]">Batch</th>
                <th>Expiry</th>
                <th>MRP</th>
                <th>Qty</th>
                <th>Free</th>
                <th>Rate</th>
                <th>Disc%</th>
                <th>GST%</th>
                <th>Taxable</th>
                <th>CGST</th>
                <th>SGST</th>
                <th>Amount</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, idx) => {
                const c = calcRow(row);
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
                              <button key={p.id} className="w-full text-left px-3 py-2 hover:bg-blue-50 text-sm border-b border-slate-50 border-slate-100" onClick={() => selectProduct(idx, p)}>
                                <p className="font-semibold text-slate-800">{p.name}</p>
                                <p className="text-xs text-slate-500">{p.companyName} | HSN: {p.hsnCode}</p>
                              </button>
                            ))}
                            {filteredProducts(idx).length === 0 && <p className="px-3 py-2 text-sm text-slate-400">No products found</p>}
                          </div>
                        )}
                      </div>
                    </td>
                    <td>
                      {row.batches.length > 0 ? (
                        <select className="form-input text-xs" value={row.batchStockId ?? ""} onChange={e => {
                          const b = row.batches.find(x => x.id === parseInt(e.target.value));
                          if (b) selectBatch(idx, b);
                        }}>
                          <option value="">Select Batch</option>
                          {row.batches.map(b => (
                            <option key={b.id} value={b.id}>{b.batchNumber} (Qty: {b.availableQty})</option>
                          ))}
                        </select>
                      ) : (
                        <input className="form-input text-xs" placeholder="Batch" value={row.batchNumber ?? ""} onChange={e => updateRow(idx, "batchNumber", e.target.value)} />
                      )}
                    </td>
                    <td><input className="form-input text-xs w-24" type="date" value={row.expiryDate ?? ""} onChange={e => updateRow(idx, "expiryDate", e.target.value)} /></td>
                    <td><input type="number" className="form-input text-xs w-20" value={row.mrp ?? ""} onChange={e => updateRow(idx, "mrp", e.target.value)} placeholder="0" /></td>
                    <td><input type="number" className="form-input text-xs w-16" value={row.qty ?? ""} onChange={e => updateRow(idx, "qty", e.target.value)} placeholder="0" /></td>
                    <td><input type="number" className="form-input text-xs w-14" value={row.freeQty ?? ""} onChange={e => updateRow(idx, "freeQty", e.target.value)} placeholder="0" /></td>
                    <td><input type="number" className="form-input text-xs w-20" value={row.rate ?? ""} onChange={e => updateRow(idx, "rate", e.target.value)} placeholder="0.00" /></td>
                    <td><input type="number" className="form-input text-xs w-16" value={row.discount ?? ""} onChange={e => updateRow(idx, "discount", e.target.value)} placeholder="0" /></td>
                    <td>
                      <select className="form-input text-xs w-16" value={row.gstPercent ?? "5"} onChange={e => updateRow(idx, "gstPercent", e.target.value)}>
                        {["0","5","12","18","28"].map(g => <option key={g}>{g}</option>)}
                      </select>
                    </td>
                    <td className="text-xs font-medium">₹{c.taxable.toFixed(2)}</td>
                    <td className="text-xs text-blue-700">₹{c.cgst.toFixed(2)}</td>
                    <td className="text-xs text-green-700">₹{c.sgst.toFixed(2)}</td>
                    <td className="text-xs font-bold text-slate-800">₹{c.total.toFixed(2)}</td>
                    <td>{rows.length > 1 && <button onClick={() => setRows(prev => prev.filter((_, i) => i !== idx))} className="p-1 text-red-400 hover:text-red-600 rounded"><Trash2 size={13} /></button>}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <button onClick={() => setRows(prev => [...prev, emptyRow()])} className="btn-secondary text-sm">
          <Plus size={15} /> Add Row
        </button>

        {/* Summary */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* GST Summary */}
          <div>
            <h3 className="text-sm font-bold text-slate-600 mb-2 uppercase tracking-wide">GST Summary</h3>
            <table className="data-table text-sm">
              <thead><tr><th>GST %</th><th>Taxable</th><th>CGST</th><th>SGST</th></tr></thead>
              <tbody>
                {Array.from(new Set(rows.map(r => r.gstPercent))).filter(g => g).map(gst => {
                  const gstRows = rows.filter(r => r.gstPercent === gst);
                  const taxable = gstRows.reduce((s, r) => s + calcRow(r).taxable, 0);
                  const cgst = taxable * parseFloat(gst) / 100 / 2;
                  return (
                    <tr key={gst}>
                      <td>{gst}%</td>
                      <td>₹{taxable.toFixed(2)}</td>
                      <td>₹{cgst.toFixed(2)}</td>
                      <td>₹{cgst.toFixed(2)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Notes */}
            <div className="mt-4">
              <label className="form-label">Notes / Remarks</label>
              <textarea
                className="form-input text-xs h-20 resize-none"
                placeholder="Add internal notes or terms..."
                value={notes}
                onChange={e => setNotes(e.target.value)}
              />
            </div>
          </div>

          {/* Total */}
          <div className="bg-slate-50 rounded-xl p-5 space-y-2">
            <div className="flex justify-between text-sm text-slate-600"><span>Taxable Amount</span><span className="font-semibold">₹{totals.taxable.toFixed(2)}</span></div>
            <div className="flex justify-between text-sm text-slate-600"><span>CGST</span><span className="font-semibold">₹{totals.cgst.toFixed(2)}</span></div>
            <div className="flex justify-between text-sm text-slate-600"><span>SGST</span><span className="font-semibold">₹{totals.sgst.toFixed(2)}</span></div>
            <div className="flex justify-between text-sm text-slate-500"><span>Round Off</span><span>₹{roundOff.toFixed(2)}</span></div>
            <div className="flex justify-between font-bold text-slate-800 border-t border-slate-200 pt-2 text-lg"><span>Grand Total</span><span>₹{grandTotal.toFixed(2)}</span></div>

            <div className="pt-3 border-t border-slate-200">
              <label className="form-label">Paid Amount</label>
              <input type="number" className="form-input bg-slate-100 cursor-not-allowed" value={paidAmount ?? ""} readOnly placeholder="0.00" />
              <p className="text-[10px] text-slate-400 mt-1">Paid amount can only be modified via the Payments page.</p>
              <div className="flex justify-between mt-2 text-sm">
                <span className="text-slate-600">Due Amount</span>
                <span className={`font-bold ${dueAmount > 0 ? "text-red-600" : "text-green-600"}`}>₹{dueAmount.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <Link href="/AdminPanel/billing/list" className="btn-secondary flex items-center justify-center">Cancel</Link>
          <button onClick={handleSave} disabled={saving} className="btn-success ml-auto">
            {saving ? <><Loader2 size={16} className="animate-spin" /> Saving...</> : <><Save size={16} /> Save Invoice</>}
          </button>
        </div>
      </div>
    </div>
  );
}
