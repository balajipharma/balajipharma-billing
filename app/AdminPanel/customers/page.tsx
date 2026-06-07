"use client";
import { useState, useEffect, useCallback } from "react";
import { Plus, Pencil, Trash2, Users, Loader2 } from "lucide-react";
import Modal from "@/app/components/ui/Modal";
import SearchInput from "@/app/components/ui/SearchInput";
import Pagination from "@/app/components/ui/Pagination";

interface Customer {
  id: number;
  storeName: string;
  gstNumber: string | null;
  dlNumber: string | null;
  mobile: string;
  address: string;
}

const emptyForm = { storeName: "", gstNumber: "", dlNumber: "", mobile: "", address: "" };

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
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
    const res = await fetch(`/api/customers?search=${encodeURIComponent(search)}&page=${page}&limit=${LIMIT}`);
    const data = await res.json();
    setCustomers(data.customers || []);
    setTotal(data.total || 0);
    setLoading(false);
  }, [search, page]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { setPage(1); }, [search]);

  const openAdd = () => { setForm(emptyForm); setEditingId(null); setError(""); setModalOpen(true); };
  const openEdit = (c: Customer) => {
    setForm({ storeName: c.storeName, gstNumber: c.gstNumber || "", dlNumber: c.dlNumber || "", mobile: c.mobile, address: c.address });
    setEditingId(c.id); setError(""); setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.storeName || !form.mobile || !form.address) { setError("Store Name, Mobile and Address are required"); return; }
    setSaving(true); setError("");
    try {
      const url = editingId ? `/api/customers/${editingId}` : "/api/customers";
      const res = await fetch(url, { method: editingId ? "PUT" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      if (!res.ok) { const d = await res.json(); setError(d.error || "Save failed"); return; }
      setModalOpen(false); load();
    } finally { setSaving(false); }
  };

  const handleDelete = async (id: number) => { await fetch(`/api/customers/${id}`, { method: "DELETE" }); setDeleteId(null); load(); };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-black text-slate-800">Customers</h1>
          <p className="text-slate-500 mt-0.5">Manage medical stores and customers</p>
        </div>
        <button onClick={openAdd} className="btn-primary"><Plus size={16} /> Add Customer</button>
      </div>

      <div className="page-card">
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row gap-3 items-start sm:items-center">
          <SearchInput value={search} onChange={setSearch} placeholder="Search customers..." />
          <div className="text-sm text-slate-500 ml-auto">{total} customer{total !== 1 ? "s" : ""}</div>
        </div>

        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr><th>#</th><th>Store Name</th><th>GST Number</th><th>DL Number</th><th>Mobile</th><th>Address</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="text-center py-12"><Loader2 size={28} className="animate-spin mx-auto text-blue-600" /></td></tr>
              ) : customers.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-12 text-slate-400"><Users size={40} className="mx-auto mb-2 opacity-30" /><p>No customers found</p></td></tr>
              ) : (
                customers.map((c, i) => (
                  <tr key={c.id}>
                    <td className="text-slate-400 text-xs">{(page - 1) * LIMIT + i + 1}</td>
                    <td><p className="font-semibold text-slate-800">{c.storeName}</p></td>
                    <td><span className="font-mono text-xs">{c.gstNumber || "—"}</span></td>
                    <td className="text-slate-500 text-xs">{c.dlNumber || "—"}</td>
                    <td className="font-medium">{c.mobile}</td>
                    <td className="text-slate-500 max-w-xs truncate">{c.address}</td>
                    <td>
                      <div className="flex items-center gap-2">
                        <button onClick={() => openEdit(c)} className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 transition"><Pencil size={15} /></button>
                        <button onClick={() => setDeleteId(c.id)} className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 transition"><Trash2 size={15} /></button>
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

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editingId ? "Edit Customer" : "Add Customer"}>
        {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>}
        <div className="space-y-4">
          <div>
            <label className="form-label">Medical Store Name *</label>
            <input className="form-input" value={form.storeName ?? ""} onChange={(e) => setForm({ ...form, storeName: e.target.value })} placeholder="e.g. S.S.S.D. Hospital" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="form-label">GST Number</label>
              <input className="form-input" value={form.gstNumber ?? ""} onChange={(e) => setForm({ ...form, gstNumber: e.target.value })} placeholder="e.g. 24AAITS..." />
            </div>
            <div>
              <label className="form-label">DL Number</label>
              <input className="form-input" value={form.dlNumber ?? ""} onChange={(e) => setForm({ ...form, dlNumber: e.target.value })} placeholder="e.g. 20 RR 2303" />
            </div>
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
              {saving ? <><Loader2 size={16} className="animate-spin" /> Saving...</> : (editingId ? "Update" : "Add Customer")}
            </button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={deleteId !== null} onClose={() => setDeleteId(null)} title="Delete Customer">
        <p className="text-slate-600 mb-6">Are you sure you want to delete this customer?</p>
        <div className="flex gap-3">
          <button onClick={() => setDeleteId(null)} className="btn-secondary flex-1 justify-center">Cancel</button>
          <button onClick={() => deleteId && handleDelete(deleteId)} className="btn-danger flex-1 justify-center">Delete</button>
        </div>
      </Modal>
    </div>
  );
}
