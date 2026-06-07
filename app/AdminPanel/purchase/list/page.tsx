"use client";
import { useState, useEffect, useCallback, Suspense } from "react";
import { ShoppingCart, Plus, Loader2, Eye, Edit, CheckCircle2, Printer, Trash2, FileDown } from "lucide-react";
import { downloadInvoicePdf } from "../../../lib/pdfGenerator";
import Pagination from "@/app/components/ui/Pagination";
import SearchInput from "@/app/components/ui/SearchInput";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

interface Purchase {
  id: number;
  purchaseNumber: string;
  invoiceDate: string;
  grandTotal: number;
  supplier: { name: string };
  items: unknown[];
}

function PurchaseListContent() {
  const searchParams = useSearchParams();
  const successMsg = searchParams.get("success");

  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [purchaseToDelete, setPurchaseToDelete] = useState<Purchase | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteSuccess, setDeleteSuccess] = useState("");
  const [deleteError, setDeleteError] = useState("");
  const [generatingPdfId, setGeneratingPdfId] = useState<number | null>(null);

  const handleDownloadPdf = async (purchaseId: number) => {
    setGeneratingPdfId(purchaseId);
    try {
      await downloadInvoicePdf(purchaseId, false);
    } catch (err: any) {
      alert(err.message || "Failed to download PDF");
    } finally {
      setGeneratingPdfId(null);
    }
  };

  const LIMIT = 20;

  const handleDelete = async () => {
    if (!purchaseToDelete) return;
    setDeleting(true);
    setDeleteError("");
    setDeleteSuccess("");
    try {
      const res = await fetch(`/api/purchase/${purchaseToDelete.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) {
        setDeleteError(data.error || "Delete failed");
        return;
      }
      setDeleteSuccess("Purchase deleted successfully.");
      setShowDeleteModal(false);
      setPurchaseToDelete(null);
      load();
    } catch (err: any) {
      setDeleteError(err.message || "An error occurred");
    } finally {
      setDeleting(false);
    }
  };

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/purchase?page=${page}&limit=${LIMIT}`);
    const data = await res.json();
    setPurchases(data.purchases || []);
    setTotal(data.total || 0);
    setLoading(false);
  }, [page]);

  useEffect(() => { load(); }, [load]);

  const filtered = purchases.filter(p =>
    p.purchaseNumber.toLowerCase().includes(search.toLowerCase()) ||
    p.supplier.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-slate-800">Purchase Records</h1>
          <p className="text-slate-500 mt-0.5">View all purchase entries</p>
        </div>
        <Link href="/AdminPanel/purchase" className="btn-primary"><Plus size={16} /> New Purchase</Link>
      </div>

      {(successMsg || deleteSuccess) && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-xl flex items-center gap-3">
          <CheckCircle2 size={20} className="text-green-600 flex-shrink-0" />
          <p className="text-green-700 font-medium">{deleteSuccess || successMsg}</p>
        </div>
      )}

      <div className="page-card">
        <div className="p-4 border-b border-slate-100 flex gap-3 items-center">
          <SearchInput value={search} onChange={setSearch} placeholder="Search purchases..." />
          <div className="text-sm text-slate-500 ml-auto">{total} records</div>
        </div>

        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr><th>#</th><th>Purchase No.</th><th>Supplier</th><th>Date</th><th>Items</th><th>Amount</th><th>Action</th></tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="text-center py-12"><Loader2 size={28} className="animate-spin mx-auto text-blue-600" /></td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-12 text-slate-400"><ShoppingCart size={40} className="mx-auto mb-2 opacity-30" /><p>No purchases found</p></td></tr>
              ) : (
                filtered.map((p, i) => (
                  <tr key={p.id}>
                    <td className="text-slate-400 text-xs">{(page - 1) * LIMIT + i + 1}</td>
                    <td><span className="font-bold text-blue-700">{p.purchaseNumber}</span></td>
                    <td className="font-medium">{p.supplier.name}</td>
                    <td className="text-slate-500">{new Date(p.invoiceDate).toLocaleDateString("en-IN")}</td>
                    <td><span className="badge badge-blue">{(p.items as unknown[]).length} items</span></td>
                    <td className="font-bold">₹{parseFloat(String(p.grandTotal)).toFixed(2)}</td>
                    <td className="flex gap-1">
                      <Link href={`/AdminPanel/purchase/${p.id}`} title="View Details" className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 transition inline-flex">
                        <Eye size={15} />
                      </Link>
                      <Link href={`/AdminPanel/purchase/edit/${p.id}`} title="Edit Purchase" className="p-1.5 rounded-lg text-amber-600 hover:bg-amber-50 transition inline-flex">
                        <Edit size={15} />
                      </Link>
                      <Link href={`/print/purchase/${p.id}`} target="_blank" title="Print Purchase Bill" className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-50 transition inline-flex">
                        <Printer size={15} />
                      </Link>
                      <button
                        onClick={() => handleDownloadPdf(p.id)}
                        disabled={generatingPdfId !== null}
                        title="Download PDF"
                        className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 disabled:opacity-50 transition inline-flex"
                      >
                        {generatingPdfId === p.id ? (
                          <Loader2 size={15} className="animate-spin text-blue-600" />
                        ) : (
                          <FileDown size={15} />
                        )}
                      </button>
                      <button
                        onClick={() => {
                          setPurchaseToDelete(p);
                          setShowDeleteModal(true);
                          setDeleteError("");
                          setDeleteSuccess("");
                        }}
                        title="Delete Purchase"
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

      {showDeleteModal && purchaseToDelete && (
        <div className="modal-overlay">
          <div className="modal-box max-w-sm p-6 space-y-4">
            <h3 className="text-lg font-bold text-slate-800">Delete Purchase</h3>
            <p className="text-sm text-slate-500">
              Are you sure you want to delete this purchase record?
            </p>
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs space-y-1">
              <p className="font-semibold text-amber-900">Deleting this purchase will:</p>
              <p>✓ Remove purchased stock</p>
              <p>✓ Update batch stock</p>
              <p>✓ Update current stock</p>
              <p>✓ Update product ledger</p>
            </div>

            {deleteError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs font-semibold">
                {deleteError}
              </div>
            )}

            <div className="flex gap-2 justify-end pt-2">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setPurchaseToDelete(null);
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
                {deleting ? "Deleting..." : "Delete Purchase"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function PurchaseListPage() {
  return (
    <Suspense fallback={<div className="py-12 text-center"><Loader2 size={28} className="animate-spin mx-auto text-blue-600" /></div>}>
      <PurchaseListContent />
    </Suspense>
  );
}
