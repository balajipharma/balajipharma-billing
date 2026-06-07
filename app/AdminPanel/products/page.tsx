"use client";
import { useState, useEffect, useCallback } from "react";
import { Plus, Pencil, Trash2, Package, Loader2 } from "lucide-react";
import Modal from "@/app/components/ui/Modal";
import SearchInput from "@/app/components/ui/SearchInput";
import Pagination from "@/app/components/ui/Pagination";

interface Product {
  id: number;
  name: string;
  companyName: string;
  hsnCode: string;
  pack: string | null;
  manufacturer: string | null;
  gstPercent: number;
  totalStock: number;
  isActive: boolean;
}

const emptyForm = {
  name: "", companyName: "", hsnCode: "", pack: "", manufacturer: "", gstPercent: "5"
};

const GST_OPTIONS = ["0", "5", "12", "18", "28"];

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const LIMIT = 20;

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/products?search=${encodeURIComponent(search)}&page=${page}&limit=${LIMIT}`);
    const data = await res.json();
    setProducts(data.products || []);
    setTotal(data.total || 0);
    setLoading(false);
  }, [search, page]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { setPage(1); }, [search]);

  const openAdd = () => {
    setForm(emptyForm);
    setEditingId(null);
    setError("");
    setModalOpen(true);
  };

  const openEdit = (p: Product) => {
    setForm({
      name: p.name,
      companyName: p.companyName,
      hsnCode: p.hsnCode,
      pack: p.pack || "",
      manufacturer: p.manufacturer || "",
      gstPercent: String(p.gstPercent),
    });
    setEditingId(p.id);
    setError("");
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.companyName || !form.hsnCode) {
      setError("Name, Company, and HSN Code are required");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const url = editingId ? `/api/products/${editingId}` : "/api/products";
      const method = editingId ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const d = await res.json();
        setError(d.error || "Save failed");
        return;
      }
      setModalOpen(false);
      load();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    await fetch(`/api/products/${id}`, { method: "DELETE" });
    setDeleteId(null);
    load();
  };

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-black text-slate-800">Products</h1>
          <p className="text-slate-500 mt-0.5">Manage your pharmaceutical products</p>
        </div>
        <button onClick={openAdd} className="btn-primary">
          <Plus size={16} /> Add Product
        </button>
      </div>

      {/* Search + Table */}
      <div className="page-card">
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row gap-3 items-start sm:items-center">
          <SearchInput value={search} onChange={setSearch} placeholder="Search products..." />
          <div className="text-sm text-slate-500 ml-auto">
            {total} product{total !== 1 ? "s" : ""}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Product Name</th>
                <th>Company</th>
                <th>HSN Code</th>
                <th>Pack</th>
                <th>Manufacturer</th>
                <th>GST %</th>
                <th>Total Stock</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={9} className="text-center py-12">
                    <Loader2 size={28} className="animate-spin mx-auto text-blue-600 mb-2" />
                    <p className="text-slate-400 text-sm">Loading products...</p>
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-12 text-slate-400">
                    <Package size={40} className="mx-auto mb-2 opacity-30" />
                    <p>No products found</p>
                  </td>
                </tr>
              ) : (
                products.map((p, i) => (
                  <tr key={p.id}>
                    <td className="text-slate-400 text-xs">{(page - 1) * LIMIT + i + 1}</td>
                    <td>
                      <p className="font-semibold text-slate-800">{p.name}</p>
                    </td>
                    <td className="text-slate-600">{p.companyName}</td>
                    <td>
                      <span className="font-mono text-xs bg-slate-100 px-2 py-0.5 rounded">{p.hsnCode}</span>
                    </td>
                    <td className="text-slate-500">{p.pack || "—"}</td>
                    <td className="text-slate-500">{p.manufacturer || "—"}</td>
                    <td>
                      <span className="badge badge-blue">{p.gstPercent}%</span>
                    </td>
                    <td>
                      <span className={`font-bold ${p.totalStock > 0 ? "text-green-700" : "text-red-600"}`}>
                        {p.totalStock}
                      </span>
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openEdit(p)}
                          className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 transition"
                          title="Edit"
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          onClick={() => setDeleteId(p.id)}
                          className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 transition"
                          title="Delete"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="px-4 pb-4">
          <Pagination page={page} total={total} limit={LIMIT} onPageChange={setPage} />
        </div>
      </div>

      {/* Add/Edit Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingId ? "Edit Product" : "Add Product"}
      >
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>
        )}
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="form-label">Product Name *</label>
              <input
                className="form-input"
                value={form.name ?? ""}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Aqualube Eye Drops"
              />
            </div>
            <div className="col-span-2">
              <label className="form-label">Company Name *</label>
              <input
                className="form-input"
                value={form.companyName ?? ""}
                onChange={(e) => setForm({ ...form, companyName: e.target.value })}
                placeholder="e.g. Cipla Ltd"
              />
            </div>
            <div>
              <label className="form-label">HSN Code *</label>
              <input
                className="form-input"
                value={form.hsnCode ?? ""}
                onChange={(e) => setForm({ ...form, hsnCode: e.target.value })}
                placeholder="e.g. 30049099"
              />
            </div>
            <div>
              <label className="form-label">GST %</label>
              <select
                className="form-input"
                value={form.gstPercent ?? "5"}
                onChange={(e) => setForm({ ...form, gstPercent: e.target.value })}
              >
                {GST_OPTIONS.map((g) => (
                  <option key={g} value={g}>{g}%</option>
                ))}
              </select>
            </div>
            <div>
              <label className="form-label">Pack</label>
              <input
                className="form-input"
                value={form.pack ?? ""}
                onChange={(e) => setForm({ ...form, pack: e.target.value })}
                placeholder="e.g. 10ML, 1×10"
              />
            </div>
            <div>
              <label className="form-label">Manufacturer</label>
              <input
                className="form-input"
                value={form.manufacturer ?? ""}
                onChange={(e) => setForm({ ...form, manufacturer: e.target.value })}
                placeholder="e.g. CIPLA"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button onClick={() => setModalOpen(false)} className="btn-secondary flex-1 justify-center">
              Cancel
            </button>
            <button onClick={handleSave} disabled={saving} className="btn-primary flex-1 justify-center">
              {saving ? <><Loader2 size={16} className="animate-spin" /> Saving...</> : (editingId ? "Update" : "Add Product")}
            </button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirm */}
      <Modal isOpen={deleteId !== null} onClose={() => setDeleteId(null)} title="Delete Product">
        <p className="text-slate-600 mb-6">
          Are you sure you want to delete this product? This action cannot be undone.
        </p>
        <div className="flex gap-3">
          <button onClick={() => setDeleteId(null)} className="btn-secondary flex-1 justify-center">Cancel</button>
          <button onClick={() => deleteId && handleDelete(deleteId)} className="btn-danger flex-1 justify-center">
            Delete
          </button>
        </div>
      </Modal>
    </div>
  );
}
