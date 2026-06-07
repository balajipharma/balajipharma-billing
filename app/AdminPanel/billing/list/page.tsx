"use client";
import { useState, useEffect, useCallback, Suspense } from "react";
import { FileText, Loader2, Plus, Printer, Edit, CheckCircle2, Trash2, Eye, FileDown } from "lucide-react";
import { downloadInvoicePdf } from "../../../lib/pdfGenerator";
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
  items: unknown[];
}

const statusStyle: Record<string, string> = {
  Paid: "badge badge-green",
  Partial: "badge badge-yellow",
  "Partial Paid": "badge badge-yellow",
  Unpaid: "badge badge-red",
};

function BillingListContent() {
  const searchParams = useSearchParams();
  const successMsg = searchParams.get("success");

  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [invoiceToDelete, setInvoiceToDelete] = useState<Invoice | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteSuccess, setDeleteSuccess] = useState("");
  const [deleteError, setDeleteError] = useState("");
  const [generatingPdfId, setGeneratingPdfId] = useState<number | null>(null);

  const handleDownloadPdf = async (invoiceId: number) => {
    setGeneratingPdfId(invoiceId);
    try {
      await downloadInvoicePdf(invoiceId, true);
    } catch (err: any) {
      alert(err.message || "Failed to download PDF");
    } finally {
      setGeneratingPdfId(null);
    }
  };

  const LIMIT = 20;

  const handleDelete = async () => {
    if (!invoiceToDelete) return;
    setDeleting(true);
    setDeleteError("");
    setDeleteSuccess("");
    try {
      const res = await fetch(`/api/billing/${invoiceToDelete.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) {
        setDeleteError(data.error || "Delete failed");
        return;
      }
      setDeleteSuccess("Invoice deleted and stock restored successfully.");
      setShowDeleteModal(false);
      setInvoiceToDelete(null);
      load();
    } catch (err: any) {
      setDeleteError(err.message || "An error occurred");
    } finally {
      setDeleting(false);
    }
  };

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: String(LIMIT) });
    if (search) params.set("search", search);
    if (status) params.set("status", status);
    const res = await fetch(`/api/billing?${params}`);
    const data = await res.json();
    setInvoices(data.invoices || []);
    setTotal(data.total || 0);
    setLoading(false);
  }, [page, search, status]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { setPage(1); }, [search, status]);

  const fmt = (n: number) =>
    new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(n);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-slate-800">Invoices</h1>
          <p className="text-slate-500 mt-0.5">All GST tax invoices</p>
        </div>
        <Link href="/AdminPanel/billing" className="btn-primary"><Plus size={16} /> New Invoice</Link>
      </div>

      {(successMsg || deleteSuccess) && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-xl flex items-center gap-3">
          <CheckCircle2 size={20} className="text-green-600 flex-shrink-0" />
          <p className="text-green-700 font-medium">{deleteSuccess || successMsg}</p>
        </div>
      )}

      <div className="page-card">
        <div className="p-4 border-b border-slate-100 flex flex-wrap gap-3 items-center">
          <SearchInput value={search} onChange={setSearch} placeholder="Search invoice or customer..." />
          <select className="form-input w-36" value={status} onChange={e => setStatus(e.target.value)}>
            <option value="">All Status</option>
            <option>Paid</option>
            <option value="Partial Paid">Partial Paid</option>
            <option>Unpaid</option>
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
                <th>Items</th>
                <th>Grand Total</th>
                <th>Paid</th>
                <th>Due</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={10} className="text-center py-12"><Loader2 size={28} className="animate-spin mx-auto text-blue-600" /></td></tr>
              ) : invoices.length === 0 ? (
                <tr><td colSpan={10} className="text-center py-12 text-slate-400"><FileText size={40} className="mx-auto mb-2 opacity-30" /><p>No invoices found</p></td></tr>
              ) : (
                invoices.map((inv, i) => (
                  <tr key={inv.id}>
                    <td className="text-slate-400 text-xs">{(page - 1) * LIMIT + i + 1}</td>
                    <td><span className="font-bold text-blue-700">{inv.invoiceNumber}</span></td>
                    <td className="font-medium text-slate-800">{inv.customer.storeName}</td>
                    <td className="text-slate-500">{new Date(inv.invoiceDate).toLocaleDateString("en-IN")}</td>
                    <td><span className="badge badge-blue">{(inv.items as unknown[]).length}</span></td>
                    <td className="font-bold text-slate-800">{fmt(Number(inv.grandTotal))}</td>
                    <td className="text-green-700 font-medium">{fmt(Number(inv.paidAmount))}</td>
                    <td className={`font-medium ${Number(inv.dueAmount) > 0 ? "text-red-600" : "text-slate-400"}`}>
                      {fmt(Number(inv.dueAmount))}
                    </td>
                    <td><span className={statusStyle[inv.paymentStatus] || "badge"}>{inv.paymentStatus}</span></td>
                    <td className="flex gap-1">
                      <Link href={`/AdminPanel/billing/${inv.id}`} title="View Invoice" className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 transition inline-flex">
                        <Eye size={15} />
                      </Link>
                      <Link href={`/AdminPanel/billing/edit/${inv.id}`} title="Edit Invoice" className="p-1.5 rounded-lg text-amber-600 hover:bg-amber-50 transition inline-flex">
                        <Edit size={15} />
                      </Link>
                      <Link href={`/print/invoice/${inv.id}`} target="_blank" title="Print Invoice" className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-50 transition inline-flex">
                        <Printer size={15} />
                      </Link>
                      <button
                        onClick={() => handleDownloadPdf(inv.id)}
                        disabled={generatingPdfId !== null}
                        title="Download PDF"
                        className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 disabled:opacity-50 transition inline-flex"
                      >
                        {generatingPdfId === inv.id ? (
                          <Loader2 size={15} className="animate-spin text-blue-600" />
                        ) : (
                          <FileDown size={15} />
                        )}
                      </button>
                      <button
                        onClick={() => {
                          setInvoiceToDelete(inv);
                          setShowDeleteModal(true);
                          setDeleteError("");
                          setDeleteSuccess("");
                        }}
                        title="Delete Invoice"
                        className="p-1.5 rounded-lg text-red-600 hover:bg-red-50 transition inline-flex font-semibold"
                      >
                        <Trash2 size={15} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="px-4 pb-4"><Pagination page={page} total={total} limit={LIMIT} onPageChange={setPage} /></div>
      </div>

      {showDeleteModal && invoiceToDelete && (
        <div className="modal-overlay">
          <div className="modal-box max-w-sm p-6 space-y-4">
            <h3 className="text-lg font-bold text-slate-800">Delete Invoice</h3>
            <p className="text-sm text-slate-500">
              Are you sure you want to delete invoice <strong>{invoiceToDelete.invoiceNumber}</strong>?
            </p>
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs">
              <p className="font-semibold">Important:</p>
              <p>This action will restore all items and their quantities (including free quantities) back to batch stock, and delete the invoice record permanently.</p>
            </div>

            {deleteError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs">
                {deleteError}
              </div>
            )}

            <div className="flex gap-2 justify-end pt-2">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setInvoiceToDelete(null);
                }}
                className="btn-secondary text-sm"
                disabled={deleting}
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="btn-danger text-sm"
                disabled={deleting}
              >
                {deleting ? "Deleting..." : "Delete Invoice"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function BillingListPage() {
  return (
    <Suspense fallback={<div className="py-12 text-center"><Loader2 size={28} className="animate-spin mx-auto text-blue-600" /></div>}>
      <BillingListContent />
    </Suspense>
  );
}
