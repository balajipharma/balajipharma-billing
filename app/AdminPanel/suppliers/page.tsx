"use client";
import { useState, useEffect, useCallback } from "react";
import { Plus, Pencil, Trash2, Truck, Loader2 } from "lucide-react";
import Modal from "@/app/components/ui/Modal";
import SearchInput from "@/app/components/ui/SearchInput";
import Pagination from "@/app/components/ui/Pagination";

interface Supplier {
  id: number;
  name: string;
  gstNumber: string | null;
  mobile: string;
  address: string;
}

const emptyForm = { name: "", gstNumber: "", mobile: "", address: "" };

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
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
    const res = await fetch(`/api/suppliers?search=${encodeURIComponent(search)}&page=${page}&limit=${LIMIT}`);
    const data = await res.json();
    setSuppliers(data.suppliers || []);
    setTotal(data.total || 0);
    setLoading(false);
  }, [search, page]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { setPage(1); }, [search]);

  const openAdd = () => { setForm(emptyForm); setEditingId(null); setError(""); setModalOpen(true); };
  const openEdit = (s: Supplier) => {
    setForm({ name: s.name, gstNumber: s.gstNumber || "", mobile: s.mobile, address: s.address });
    setEditingId(s.id); setError(""); setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.mobile || !form.address) { setError("Name, Mobile and Address are required"); return; }
    setSaving(true); setError("");
    try {
      const url = editingId ? `/api/suppliers/${editingId}` : "/api/suppliers";
      const res = await fetch(url, { method: editingId ? "PUT" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      if (!res.ok) { const d = await res.json(); setError(d.error || "Save failed"); return; }
      setModalOpen(false); load();
    } finally { setSaving(false); }
  };

  const handleDelete = async (id: number) => { await fetch(`/api/suppliers/${id}`, { method: "DELETE" }); setDeleteId(null); load(); };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-black text-slate-800">Suppliers</h1>
          <p className="text-slate-500 mt-0.5">Manage your pharma suppliers and distributors</p>
        </div>
        <button onClick={openAdd} className="btn-primary"><Plus size={16} /> Add Supplier</button>
      </div>

      <div className="page-card">
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row gap-3 items-start sm:items-center">
          <SearchInput value={search} onChange={setSearch} placeholder="Search suppliers..." />
          <div className="text-sm text-slate-500 ml-auto">{total} supplier{total !== 1 ? "s" : ""}</div>
        </div>

        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr><th>#</th><th>Supplier Name</th><th>GST Number</th><th>Mobile</th><th>Address</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="text-center py-12"><Loader2 size={28} className="animate-spin mx-auto text-blue-600" /></td></tr>
              ) : suppliers.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-12 text-slate-400"><Truck size={40} className="mx-auto mb-2 opacity-30" /><p>No suppliers found</p></td></tr>
              ) : (
                suppliers.map((s, i) => (
                  <tr key={s.id}>
                    <td className="text-slate-400 text-xs">{(page - 1) * LIMIT + i + 1}</td>
                    <td><p className="font-semibold text-slate-800">{s.name}</p></td>
                    <td><span className="font-mono text-xs">{s.gstNumber || "—"}</span></td>
                    <td className="font-medium">{s.mobile}</td>
                    <td className="text-slate-500 max-w-xs truncate">{s.address}</td>
                    <td>
                      <div className="flex items-center gap-2">
                        <button onClick={() => openEdit(s)} className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 transition"><Pencil size={15} /></button>
                        <button onClick={() => setDeleteId(s.id)} className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 transition"><Trash2 size={15} /></button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="px-4 pb-4"><Pagination page={page} total={total} limit={LIMIT} onPageChange={setPage} /></div>
      </div>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editingId ? "Edit Supplier" : "Add Supplier"}>
        {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>}
        <div className="space-y-4">
          <div>
            <label className="form-label">Supplier Name *</label>
            <input className="form-input" value={form.name ?? ""} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Raviraj Medicines" />
          </div>
          <div>
            <label className="form-label">GST Number</label>
            <input className="form-input" value={form.gstNumber ?? ""} onChange={(e) => setForm({ ...form, gstNumber: e.target.value })} placeholder="e.g. 24ACVPP1743L1Z2" />
          </div>
          <div>
            <label className="form-label">Mobile Number *</label>
            <input className="form-input" value={form.mobile ?? ""} onChange={(e) => setForm({ ...form, mobile: e.target.value })} placeholder="9xxxxxxxxx" />
          </div>
          <div>
            <label className="form-label">Address *</label>
            <textarea className="form-input" rows={3} value={form.address ?? ""} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="Full address..." />
          </div>
          <div className="flex gap-3 pt-2">
            <button onClick={() => setModalOpen(false)} className="btn-secondary flex-1 justify-center">Cancel</button>
            <button onClick={handleSave} disabled={saving} className="btn-primary flex-1 justify-center">
              {saving ? <><Loader2 size={16} className="animate-spin" /> Saving...</> : (editingId ? "Update" : "Add Supplier")}
            </button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={deleteId !== null} onClose={() => setDeleteId(null)} title="Delete Supplier">
        <p className="text-slate-600 mb-6">Are you sure you want to delete this supplier?</p>
        <div className="flex gap-3">
          <button onClick={() => setDeleteId(null)} className="btn-secondary flex-1 justify-center">Cancel</button>
          <button onClick={() => deleteId && handleDelete(deleteId)} className="btn-danger flex-1 justify-center">Delete</button>
        </div>
      </Modal>
    </div>
  );
}
