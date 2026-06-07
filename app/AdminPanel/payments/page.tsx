"use client";
import { useState, useEffect, useCallback, Suspense } from "react";
import {
  Wallet,
  Loader2,
  CheckCircle2,
  Eye,
  Printer,
  CreditCard,
  RotateCcw,
  AlertCircle,
  ArrowRightLeft,
} from "lucide-react";
import Pagination from "@/app/components/ui/Pagination";
import SearchInput from "@/app/components/ui/SearchInput";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

interface Invoice {
  id: number;
  invoiceNumber: string;
  invoiceDate: string;
  grandTotal: number;
  paidAmount: number;
  dueAmount: number;
  paymentStatus: string;
  customer: { storeName: string };
}

type PaymentStatus = "Unpaid" | "Partial Paid" | "Paid";
type ModalMode = "add" | "override";

const statusStyle: Record<string, string> = {
  Paid: "badge badge-green",
  Partial: "badge badge-yellow",
  "Partial Paid": "badge badge-yellow",
  Unpaid: "badge badge-red",
};

const STATUS_OPTIONS: PaymentStatus[] = ["Unpaid", "Partial Paid", "Paid"];

const STATUS_COLORS: Record<string, string> = {
  Unpaid: "text-red-600 bg-red-50 border-red-200",
  "Partial Paid": "text-amber-600 bg-amber-50 border-amber-200",
  Paid: "text-green-600 bg-green-50 border-green-200",
};

function PaymentsContent() {
  useSearchParams(); // consumed for routing awareness

  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<ModalMode>("add");
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  // Shared fields
  const [paymentMethod, setPaymentMethod] = useState<"CASH" | "UPI">("CASH");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // "Add Payment" mode
  const [receivedAmount, setReceivedAmount] = useState("");

  // "Override/Correct" mode
  const [newStatus, setNewStatus] = useState<PaymentStatus>("Unpaid");
  const [overrideAmount, setOverrideAmount] = useState("");

  const LIMIT = 20;

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: String(LIMIT) });
    if (search) params.set("search", search);
    if (status) params.set("status", status);
    try {
      const res = await fetch(`/api/payments?${params}`);
      const data = await res.json();
      setInvoices(data.invoices || []);
      setTotal(data.total || 0);
    } catch (err) {
      console.error("Failed to load payments", err);
    } finally {
      setLoading(false);
    }
  }, [page, search, status]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { setPage(1); }, [search, status]);

  const resetModal = () => {
    setErrorMsg("");
    setSuccessMsg("");
    setNote("");
    setPaymentMethod("CASH");
    setReceivedAmount("");
    setOverrideAmount("");
  };

  const openAddModal = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setModalMode("add");
    setReceivedAmount(Number(invoice.dueAmount) > 0 ? Number(invoice.dueAmount).toFixed(2) : "");
    resetModal();
    setShowModal(true);
  };

  const openOverrideModal = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setModalMode("override");
    const current = invoice.paymentStatus as PaymentStatus;
    setNewStatus(current);
    setOverrideAmount(Number(invoice.paidAmount).toFixed(2));
    resetModal();
    setShowModal(true);
  };

  // Derived preview for override modal
  const previewPaid = (() => {
    if (!selectedInvoice) return 0;
    const grand = Number(selectedInvoice.grandTotal);
    if (newStatus === "Unpaid") return 0;
    if (newStatus === "Paid") return grand;
    const v = parseFloat(overrideAmount);
    return isNaN(v) ? 0 : Math.min(v, grand);
  })();
  const previewDue = selectedInvoice ? Math.max(0, Number(selectedInvoice.grandTotal) - previewPaid) : 0;

  const handleAddPayment = async () => {
    if (!selectedInvoice) return;
    setErrorMsg(""); setSuccessMsg("");

    const amt = parseFloat(receivedAmount);
    if (isNaN(amt) || amt <= 0) { setErrorMsg("Please enter a valid amount greater than 0"); return; }
    const due = Number(selectedInvoice.dueAmount);
    if (amt > due + 0.01) { setErrorMsg(`Amount cannot exceed outstanding due of ₹${due.toFixed(2)}`); return; }

    setSaving(true);
    try {
      const res = await fetch(`/api/payments/${selectedInvoice.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ receivedAmount: amt, paymentMethod, note }),
      });
      const data = await res.json();
      if (!res.ok) { setErrorMsg(data.error || "Failed to save payment"); return; }
      setSuccessMsg("Payment recorded successfully!");
      setTimeout(() => { setShowModal(false); setSelectedInvoice(null); load(); }, 1000);
    } catch (err: any) {
      setErrorMsg(err.message || "An unexpected error occurred");
    } finally {
      setSaving(false);
    }
  };

  const handleOverridePayment = async () => {
    if (!selectedInvoice) return;
    setErrorMsg(""); setSuccessMsg("");

    if (newStatus === "Partial Paid") {
      const amt = parseFloat(overrideAmount);
      if (isNaN(amt) || amt <= 0) { setErrorMsg("Please enter a valid paid amount greater than 0"); return; }
      const grand = Number(selectedInvoice.grandTotal);
      if (amt >= grand) { setErrorMsg(`Amount must be less than invoice total ₹${grand.toFixed(2)}. Use 'Paid' status instead.`); return; }
    }

    setSaving(true);
    try {
      const res = await fetch(`/api/payments/${selectedInvoice.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          newStatus,
          receivedAmount: newStatus === "Partial Paid" ? parseFloat(overrideAmount) : undefined,
          paymentMethod,
          note,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setErrorMsg(data.error || "Failed to update payment"); return; }
      setSuccessMsg("Payment status updated successfully!");
      setTimeout(() => { setShowModal(false); setSelectedInvoice(null); load(); }, 1000);
    } catch (err: any) {
      setErrorMsg(err.message || "An unexpected error occurred");
    } finally {
      setSaving(false);
    }
  };

  const handleReversePayment = async () => {
    if (!selectedInvoice) return;
    if (!confirm(`Reverse all payments for ${selectedInvoice.invoiceNumber}? This will set status to Unpaid.`)) return;

    setErrorMsg(""); setSuccessMsg("");
    setSaving(true);
    try {
      const res = await fetch(`/api/payments/${selectedInvoice.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          newStatus: "Unpaid",
          paymentMethod,
          note: `Payment reversed${note ? ` — ${note}` : ""}`,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setErrorMsg(data.error || "Reversal failed"); return; }
      setSuccessMsg("Payment reversed. Invoice is now Unpaid.");
      setTimeout(() => { setShowModal(false); setSelectedInvoice(null); load(); }, 1200);
    } catch (err: any) {
      setErrorMsg(err.message || "An unexpected error occurred");
    } finally {
      setSaving(false);
    }
  };

  const fmt = (n: number) =>
    new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(n);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-slate-800">Payments</h1>
          <p className="text-slate-500 mt-0.5">Manage customer invoice payments and statuses</p>
        </div>
      </div>

      <div className="page-card">
        <div className="p-4 border-b border-slate-100 flex flex-wrap gap-3 items-center">
          <SearchInput value={search} onChange={setSearch} placeholder="Search invoice or customer..." />
          <select className="form-input w-44" value={status} onChange={e => setStatus(e.target.value)}>
            <option value="">All Statuses</option>
            <option value="outstanding">Outstanding Dues</option>
            <option value="Paid">Paid</option>
            <option value="Partial Paid">Partial Paid</option>
            <option value="Unpaid">Unpaid</option>
          </select>
          <div className="text-sm text-slate-500 ml-auto">{total} invoices</div>
        </div>

        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Invoice No.</th>
                <th>Customer</th>
                <th>Date</th>
                <th>Bill Amount</th>
                <th>Paid Amount</th>
                <th>Due Amount</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={9} className="text-center py-12">
                    <Loader2 size={28} className="animate-spin mx-auto text-blue-600" />
                  </td>
                </tr>
              ) : invoices.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-12 text-slate-400">
                    <Wallet size={40} className="mx-auto mb-2 opacity-30" />
                    <p>No invoices found</p>
                  </td>
                </tr>
              ) : (
                invoices.map((inv, i) => (
                  <tr key={inv.id}>
                    <td className="text-slate-400 text-xs">{(page - 1) * LIMIT + i + 1}</td>
                    <td>
                      <span className="font-bold text-blue-700">{inv.invoiceNumber}</span>
                    </td>
                    <td className="font-medium text-slate-800">{inv.customer.storeName}</td>
                    <td className="text-slate-500">
                      {new Date(inv.invoiceDate).toLocaleDateString("en-IN")}
                    </td>
                    <td className="font-bold text-slate-800">{fmt(Number(inv.grandTotal))}</td>
                    <td className="text-green-700 font-medium">{fmt(Number(inv.paidAmount))}</td>
                    <td className={`font-medium ${Number(inv.dueAmount) > 0 ? "text-red-600" : "text-slate-400"}`}>
                      {fmt(Number(inv.dueAmount))}
                    </td>
                    <td>
                      <span className={statusStyle[inv.paymentStatus] || "badge"}>
                        {inv.paymentStatus}
                      </span>
                    </td>
                    <td>
                      <div className="flex gap-1.5 items-center">
                        <Link
                          href={`/AdminPanel/billing/${inv.id}`}
                          title="View Details"
                          className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 transition inline-flex"
                        >
                          <Eye size={15} />
                        </Link>
                        <Link
                          href={`/print/invoice/${inv.id}`}
                          target="_blank"
                          title="Print Invoice"
                          className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-50 transition inline-flex"
                        >
                          <Printer size={15} />
                        </Link>
                        {/* Add Payment — only shown when there is outstanding due */}
                        {Number(inv.dueAmount) > 0 && (
                          <button
                            onClick={() => openAddModal(inv)}
                            title="Add Payment"
                            className="text-xs px-2.5 py-1.5 rounded-lg font-semibold flex items-center gap-1 transition bg-blue-50 text-blue-700 hover:bg-blue-100"
                          >
                            <CreditCard size={13} />
                            Add
                          </button>
                        )}
                        {/* Update / Correct Payment — always visible */}
                        <button
                          onClick={() => openOverrideModal(inv)}
                          title="Correct / Override Payment Status"
                          className="text-xs px-2.5 py-1.5 rounded-lg font-semibold flex items-center gap-1 transition bg-slate-100 text-slate-600 hover:bg-slate-200"
                        >
                          <ArrowRightLeft size={13} />
                          Correct
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {total > LIMIT && (
          <div className="p-4 border-t border-slate-100">
            <Pagination page={page} total={total} limit={LIMIT} onPageChange={setPage} />
          </div>
        )}
      </div>

      {/* ─── MODAL ────────────────────────────────────────── */}
      {showModal && selectedInvoice && (
        <div className="modal-overlay text-slate-800">
          <div className="modal-box max-w-lg p-0 overflow-hidden">
            {/* Header */}
            <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-blue-50 to-indigo-50">
              <div className="w-9 h-9 bg-blue-600 text-white rounded-xl flex items-center justify-center shadow">
                {modalMode === "override" ? <ArrowRightLeft size={17} /> : <Wallet size={17} />}
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-800">
                  {modalMode === "override" ? "Correct / Override Payment" : "Record Received Payment"}
                </h3>
                <p className="text-xs text-slate-500">Invoice: <span className="font-semibold text-blue-700">{selectedInvoice.invoiceNumber}</span> · {selectedInvoice.customer.storeName}</p>
              </div>
              {/* Mode tabs */}
              <div className="ml-auto flex gap-1 bg-white border border-slate-200 rounded-lg p-1">
                <button
                  onClick={() => { setModalMode("add"); resetModal(); setReceivedAmount(Number(selectedInvoice.dueAmount) > 0 ? Number(selectedInvoice.dueAmount).toFixed(2) : ""); }}
                  disabled={Number(selectedInvoice.dueAmount) <= 0}
                  className={`text-xs px-2.5 py-1 rounded-md font-semibold transition ${modalMode === "add" ? "bg-blue-600 text-white shadow" : "text-slate-500 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"}`}
                >
                  Add
                </button>
                <button
                  onClick={() => { setModalMode("override"); resetModal(); setNewStatus(selectedInvoice.paymentStatus as PaymentStatus); setOverrideAmount(Number(selectedInvoice.paidAmount).toFixed(2)); }}
                  className={`text-xs px-2.5 py-1 rounded-md font-semibold transition ${modalMode === "override" ? "bg-indigo-600 text-white shadow" : "text-slate-500 hover:bg-slate-50"}`}
                >
                  Correct
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              {/* Alerts */}
              {errorMsg && (
                <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-xs font-semibold">
                  <AlertCircle size={15} className="mt-0.5 shrink-0" />
                  {errorMsg}
                </div>
              )}
              {successMsg && (
                <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 text-green-600 rounded-lg text-xs font-semibold">
                  <CheckCircle2 size={15} />
                  {successMsg}
                </div>
              )}

              {/* Invoice summary */}
              <div className="grid grid-cols-3 gap-3 text-xs bg-slate-50 border border-slate-100 p-3.5 rounded-xl">
                <div>
                  <p className="text-slate-500">Bill Amount</p>
                  <p className="text-sm font-bold text-slate-800 mt-0.5">{fmt(Number(selectedInvoice.grandTotal))}</p>
                </div>
                <div>
                  <p className="text-slate-500">
                    {modalMode === "override" ? "Preview Paid" : "Paid To Date"}
                  </p>
                  <p className={`text-sm font-bold mt-0.5 ${modalMode === "override" ? "text-indigo-700" : "text-green-700"}`}>
                    {modalMode === "override" ? fmt(previewPaid) : fmt(Number(selectedInvoice.paidAmount))}
                  </p>
                </div>
                <div>
                  <p className="text-slate-500">
                    {modalMode === "override" ? "Preview Due" : "Remaining Due"}
                  </p>
                  <p className={`text-sm font-bold mt-0.5 ${(modalMode === "override" ? previewDue : Number(selectedInvoice.dueAmount)) > 0 ? "text-red-600" : "text-slate-400"}`}>
                    {modalMode === "override" ? fmt(previewDue) : fmt(Number(selectedInvoice.dueAmount))}
                  </p>
                </div>
              </div>

              {/* ── ADD PAYMENT MODE ── */}
              {modalMode === "add" && (
                <div className="space-y-3">
                  <div>
                    <label className="form-label text-xs">Received Amount *</label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-slate-400 font-semibold">₹</span>
                      <input
                        type="number"
                        step="0.01"
                        className="form-input pl-8"
                        value={receivedAmount}
                        onChange={e => setReceivedAmount(e.target.value)}
                        placeholder="0.00"
                        disabled={saving}
                        autoFocus
                      />
                    </div>
                    <p className="text-xs text-slate-400 mt-1">Max: {fmt(Number(selectedInvoice.dueAmount))}</p>
                  </div>
                  <div>
                    <label className="form-label text-xs">Payment Method *</label>
                    <select className="form-input" value={paymentMethod} onChange={e => setPaymentMethod(e.target.value as "CASH" | "UPI")} disabled={saving}>
                      <option value="CASH">Cash</option>
                      <option value="UPI">UPI</option>
                    </select>
                  </div>
                  <div>
                    <label className="form-label text-xs">Notes / Reference (Optional)</label>
                    <textarea
                      className="form-input min-h-[60px] py-2 leading-relaxed"
                      value={note}
                      onChange={e => setNote(e.target.value)}
                      placeholder="e.g. Transaction ID, Check No..."
                      disabled={saving}
                    />
                  </div>
                </div>
              )}

              {/* ── OVERRIDE MODE ── */}
              {modalMode === "override" && (
                <div className="space-y-3">
                  {/* Status selector */}
                  <div>
                    <label className="form-label text-xs">Set Payment Status *</label>
                    <div className="grid grid-cols-3 gap-2 mt-1">
                      {STATUS_OPTIONS.map(s => (
                        <button
                          key={s}
                          onClick={() => { setNewStatus(s); if (s !== "Partial Paid") setOverrideAmount(""); }}
                          disabled={saving}
                          className={`py-2 px-2 rounded-lg text-xs font-bold border transition ${newStatus === s ? STATUS_COLORS[s] + " ring-2 ring-offset-1 " + (s === "Unpaid" ? "ring-red-400" : s === "Partial Paid" ? "ring-amber-400" : "ring-green-400") : "border-slate-200 text-slate-500 hover:bg-slate-50"}`}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                    {/* Status descriptions */}
                    <p className="text-xs text-slate-400 mt-1.5">
                      {newStatus === "Unpaid" && "Paid amount → ₹0.00 · Due amount → Full invoice amount"}
                      {newStatus === "Paid" && "Paid amount → Full invoice total · Due amount → ₹0.00"}
                      {newStatus === "Partial Paid" && "Enter the new total paid amount below"}
                    </p>
                  </div>

                  {/* Amount input — only for Partial Paid */}
                  {newStatus === "Partial Paid" && (
                    <div>
                      <label className="form-label text-xs">Total Paid Amount (New Value) *</label>
                      <div className="relative">
                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-slate-400 font-semibold">₹</span>
                        <input
                          type="number"
                          step="0.01"
                          className="form-input pl-8"
                          value={overrideAmount}
                          onChange={e => setOverrideAmount(e.target.value)}
                          placeholder="0.00"
                          disabled={saving}
                          autoFocus
                        />
                      </div>
                      <p className="text-xs text-slate-400 mt-1">Must be less than {fmt(Number(selectedInvoice.grandTotal))}</p>
                    </div>
                  )}

                  <div>
                    <label className="form-label text-xs">Payment Method *</label>
                    <select className="form-input" value={paymentMethod} onChange={e => setPaymentMethod(e.target.value as "CASH" | "UPI")} disabled={saving}>
                      <option value="CASH">Cash</option>
                      <option value="UPI">UPI</option>
                    </select>
                  </div>
                  <div>
                    <label className="form-label text-xs">Correction Reason / Notes (Optional)</label>
                    <textarea
                      className="form-input min-h-[60px] py-2 leading-relaxed"
                      value={note}
                      onChange={e => setNote(e.target.value)}
                      placeholder="e.g. Data entry correction, customer dispute..."
                      disabled={saving}
                    />
                  </div>
                </div>
              )}

              {/* Footer actions */}
              <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                {/* Reverse payment button — only in override mode when invoice is not already Unpaid */}
                {modalMode === "override" && selectedInvoice.paymentStatus !== "Unpaid" && (
                  <button
                    onClick={handleReversePayment}
                    disabled={saving}
                    className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg font-semibold text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 transition"
                  >
                    <RotateCcw size={13} />
                    Reverse Payment
                  </button>
                )}

                <div className="flex gap-2 ml-auto">
                  <button onClick={() => setShowModal(false)} disabled={saving} className="btn-secondary text-sm">
                    Cancel
                  </button>
                  <button
                    onClick={modalMode === "add" ? handleAddPayment : handleOverridePayment}
                    disabled={saving || (modalMode === "add" && !receivedAmount)}
                    className={`text-sm flex items-center gap-1.5 font-semibold px-4 py-2 rounded-lg transition ${
                      modalMode === "override"
                        ? "bg-indigo-600 hover:bg-indigo-700 text-white"
                        : "btn-primary"
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {saving ? (
                      <><Loader2 size={15} className="animate-spin" /> Saving...</>
                    ) : modalMode === "override" ? (
                      "Apply Changes"
                    ) : (
                      "Record Payment"
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function PaymentsPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center py-24">
        <Loader2 size={36} className="animate-spin text-blue-600 mb-4" />
        <p className="text-slate-500 font-medium">Loading payments module...</p>
      </div>
    }>
      <PaymentsContent />
    </Suspense>
  );
}
