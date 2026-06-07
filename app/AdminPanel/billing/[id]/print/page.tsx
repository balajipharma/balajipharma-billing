"use client";
import { useEffect, useState } from "react";
import { Printer, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { use } from "react";

interface InvoiceData {
  id: number;
  invoiceNumber: string;
  invoiceDate: string;
  subTotal: number;
  totalDiscount: number;
  taxableAmt: number;
  totalCgst: number;
  totalSgst: number;
  roundOff: number;
  grandTotal: number;
  paidAmount: number;
  dueAmount: number;
  paymentStatus: string;
  customer: {
    storeName: string;
    gstNumber: string | null;
    dlNumber: string | null;
    mobile: string;
    address: string;
  };
  items: Array<{
    id: number;
    batchNumber: string;
    expiryDate: string;
    mrp: number;
    qty: number;
    freeQty: number;
    rate: number;
    discount: number;
    gstPercent: number;
    taxableAmt: number;
    cgst: number;
    sgst: number;
    amount: number;
    product: {
      name: string;
      hsnCode: string;
      pack: string | null;
      manufacturer: string | null;
      companyName: string;
    };
  }>;
}

interface CompanySettings {
  companyName: string;
  gstin: string;
  dlNumber: string;
  address: string;
  mobile: string;
  email: string | null;
  fssaiNumber: string | null;
  bankName: string | null;
  accountNumber: string | null;
  ifscCode: string | null;
  upiId: string | null;
}

function numberToWords(num: number): string {
  const ones = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine",
    "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
  const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

  const n = Math.round(num);
  if (n === 0) return "Zero";
  if (n < 20) return ones[n];
  if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 ? " " + ones[n % 10] : "");
  if (n < 1000) return ones[Math.floor(n / 100)] + " Hundred" + (n % 100 ? " " + numberToWords(n % 100) : "");
  if (n < 100000) return numberToWords(Math.floor(n / 1000)) + " Thousand" + (n % 1000 ? " " + numberToWords(n % 1000) : "");
  if (n < 10000000) return numberToWords(Math.floor(n / 100000)) + " Lakh" + (n % 100000 ? " " + numberToWords(n % 100000) : "");
  return numberToWords(Math.floor(n / 10000000)) + " Crore" + (n % 10000000 ? " " + numberToWords(n % 10000000) : "");
}

export default function PrintPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [invoice, setInvoice] = useState<InvoiceData | null>(null);
  const [company, setCompany] = useState<CompanySettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [newPaidAmount, setNewPaidAmount] = useState("");
  const [updatingPayment, setUpdatingPayment] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch(`/api/billing/${id}`).then(r => r.json()),
      fetch("/api/settings").then(r => r.json()),
    ]).then(([inv, comp]) => {
      setInvoice(inv);
      setCompany(comp?.companyName ? comp : {
        companyName: "Balaji Pharma",
        gstin: "24XXXXX0000X1ZX",
        dlNumber: "20 B RR 0000",
        address: "Your Address, City, State - PIN",
        mobile: "9000000000",
        email: null,
        fssaiNumber: null,
        bankName: "Your Bank",
        accountNumber: "XXXXXXXX",
        ifscCode: "XXXX0000000",
        upiId: null,
      });
      setLoading(false);
    });
  }, [id]);

  useEffect(() => {
    if (invoice) {
      setNewPaidAmount(String(invoice.paidAmount));
    }
  }, [invoice]);

  const handleUpdatePayment = async () => {
    const amt = parseFloat(newPaidAmount);
    if (isNaN(amt) || amt < 0) {
      alert("Please enter a valid paid amount");
      return;
    }
    setUpdatingPayment(true);
    try {
      const res = await fetch(`/api/billing/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paidAmount: amt }),
      });
      if (!res.ok) {
        throw new Error("Failed to update payment");
      }
      const updatedInvoice = await res.json();
      setInvoice(prev => prev ? {
        ...prev,
        paidAmount: updatedInvoice.paidAmount,
        dueAmount: updatedInvoice.dueAmount,
        paymentStatus: updatedInvoice.paymentStatus
      } : null);
      setShowPaymentModal(false);
    } catch (err: any) {
      alert(err.message || "Error updating payment");
    } finally {
      setUpdatingPayment(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-screen">
      <p className="text-slate-500">Loading invoice...</p>
    </div>
  );

  if (!invoice) return <div className="p-8 text-red-500">Invoice not found</div>;

  // GST slab summary
  const gstSlabs = Array.from(new Set(invoice.items.map(i => Number(i.gstPercent)))).sort();
  const gstSummary = gstSlabs.map(gst => {
    const items = invoice.items.filter(i => Number(i.gstPercent) === gst);
    const taxable = items.reduce((s, i) => s + Number(i.taxableAmt), 0);
    const cgst = items.reduce((s, i) => s + Number(i.cgst), 0);
    const sgst = items.reduce((s, i) => s + Number(i.sgst), 0);
    return { gst, taxable, cgst, sgst, cgstRate: gst / 2, sgstRate: gst / 2 };
  });

  const grandTotal = Math.round(Number(invoice.grandTotal));
  const amountWords = numberToWords(grandTotal) + " Only";

  return (
    <div className="min-h-screen bg-slate-100 py-8">
      {/* Controls - hidden on print */}
      <div className="no-print fixed top-4 left-4 right-4 z-50 flex items-center justify-between bg-white/90 backdrop-blur border border-slate-200 rounded-xl px-5 py-3 shadow-lg">
        <Link href={`/AdminPanel/billing/list`} className="btn-secondary text-sm">
          <ArrowLeft size={15} /> Back to Billing
        </Link>
        <p className="font-semibold text-slate-700">{invoice.invoiceNumber}</p>
        <div className="flex gap-2">
          <button onClick={() => setShowPaymentModal(true)} className="btn-secondary text-sm">
            Update Payment
          </button>
          <button onClick={() => window.print()} className="btn-primary text-sm">
            <Printer size={15} /> Print Invoice
          </button>
        </div>
      </div>

      {/* A4 Print Area */}
      <div className="invoice-page bg-white text-black">

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "2px solid black", paddingBottom: "4px", marginBottom: "4px" }}>
          {/* Company Info */}
          <div style={{ flex: 1, minWidth: "0" }}>
            <div style={{ fontSize: "15px", fontWeight: "900", marginBottom: "2px", lineHeight: "1.1" }}>{company?.companyName}</div>
            <div style={{ fontSize: "9.5px", lineHeight: "1.2" }}>{company?.address}</div>
            <div style={{ fontSize: "9.5px", marginTop: "2px" }}>MO: {company?.mobile}</div>
            <div style={{ fontSize: "9.5px" }}>GST No. {company?.gstin}</div>
            <div style={{ fontSize: "9.5px" }}>D L No. {company?.dlNumber}</div>
            {company?.fssaiNumber && <div style={{ fontSize: "9.5px" }}>FSSAI No. {company.fssaiNumber}</div>}
          </div>
          {/* Invoice Details */}
          <div style={{ textAlign: "center", borderLeft: "1px solid black", borderRight: "1px solid black", padding: "0 8px", minWidth: "130px" }}>
            <div style={{ fontSize: "10px", fontWeight: "bold" }}>GST Tax Invoice</div>
            <div style={{ fontSize: "9px", color: "#555" }}>Original</div>
            <div style={{ fontSize: "13px", fontWeight: "900", margin: "2px 0" }}>TAX INVOICE</div>
            <div style={{ fontSize: "9.5px" }}>Bill No. <strong>{invoice.invoiceNumber}</strong></div>
            <div style={{ fontSize: "9.5px" }}>Bill Dt. <strong>{new Date(invoice.invoiceDate).toLocaleDateString("en-IN")}</strong></div>
          </div>
          {/* Customer Info */}
          <div style={{ flex: 1, paddingLeft: "10px", minWidth: "0" }}>
            <div style={{ fontSize: "9.5px", color: "#555" }}>M/s.</div>
            <div style={{ fontSize: "12px", fontWeight: "bold", lineHeight: "1.1" }}>{invoice.customer.storeName}</div>
            <div style={{ fontSize: "9.5px", whiteSpace: "pre-wrap", marginTop: "2px" }}>{invoice.customer.address}</div>
            {invoice.customer.dlNumber && <div style={{ fontSize: "9.5px", marginTop: "2px" }}>DL No. {invoice.customer.dlNumber}</div>}
            {invoice.customer.gstNumber && <div style={{ fontSize: "9.5px" }}>GST No. {invoice.customer.gstNumber}</div>}
          </div>
        </div>

        {/* Products Table */}
        <div style={{ overflowX: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "8.5px", marginBottom: "4px" }}>
            <thead>
              <tr style={{ background: "#f0f0f0" }}>
                <th style={thStyle}>Sr.</th>
                <th style={thStyle}>HSN</th>
                <th style={{ ...thStyle, textAlign: "left", minWidth: "120px" }}>Product Name</th>
                <th style={thStyle}>Pack</th>
                <th style={thStyle}>Mfg</th>
                <th style={thStyle}>MRP</th>
                <th style={thStyle}>Batch</th>
                <th style={thStyle}>Expiry</th>
                <th style={thStyle}>Qty</th>
                <th style={thStyle}>Free</th>
                <th style={thStyle}>Rate</th>
                <th style={thStyle}>Disc</th>
                <th style={thStyle}>GST%</th>
                <th style={thStyle}>Amount</th>
              </tr>
            </thead>
            <tbody>
              {invoice.items.map((item, i) => (
                <tr key={item.id}>
                  <td style={tdStyle}>{i + 1}</td>
                  <td style={tdStyle}>{item.product.hsnCode}</td>
                  <td style={{ ...tdStyle, textAlign: "left", fontWeight: "bold" }}>{item.product.name}</td>
                  <td style={tdStyle}>{item.product.pack || "—"}</td>
                  <td style={tdStyle}>{item.product.manufacturer || item.product.companyName.substring(0, 6)}</td>
                  <td style={tdStyle}>{Number(item.mrp).toFixed(2)}</td>
                  <td style={tdStyle}>{item.batchNumber}</td>
                  <td style={tdStyle}>{new Date(item.expiryDate).toLocaleDateString("en-IN", { month: "2-digit", year: "2-digit" })}</td>
                  <td style={tdStyle}>{item.qty}</td>
                  <td style={tdStyle}>{item.freeQty}</td>
                  <td style={tdStyle}>{Number(item.rate).toFixed(2)}</td>
                  <td style={tdStyle}>{Number(item.discount).toFixed(2)}</td>
                  <td style={tdStyle}>{Number(item.gstPercent).toFixed(2)}</td>
                  <td style={{ ...tdStyle, fontWeight: "bold" }}>{Number(item.amount).toFixed(2)}</td>
                </tr>
              ))}
              {/* Empty rows to fill space */}
              {Array.from({ length: Math.max(0, 8 - invoice.items.length) }).map((_, i) => (
                <tr key={`empty-${i}`}>
                  {Array.from({ length: 14 }).map((_, j) => (
                    <td key={j} style={{ ...tdStyle, height: "15px" }}>&nbsp;</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals Row */}
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "8.5px", borderTop: "1px solid black" }}>
          <tbody>
            <tr>
              <td style={{ ...tdStyle, width: "70%", border: "none" }} colSpan={10}></td>
              <td style={{ ...tdStyle, textAlign: "right", fontWeight: "bold", border: "none" }} colSpan={3}>Sub total</td>
              <td style={{ ...tdStyle, fontWeight: "bold", border: "1px solid #aaa" }}>{Number(invoice.subTotal).toFixed(2)}</td>
            </tr>
          </tbody>
        </table>

        {/* Footer */}
        <div style={{ display: "flex", gap: "8px", marginTop: "4px" }}>
          {/* GST Summary */}
          <div style={{ flex: 1, minWidth: "0" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "8px", border: "1px solid black" }}>
              <thead>
                <tr style={{ background: "#f0f0f0" }}>
                  <th style={thStyle}>Taxable</th>
                  <th style={thStyle}>SGST%</th>
                  <th style={thStyle}>CGST%</th>
                  <th style={thStyle}>SGST</th>
                  <th style={thStyle}>CGST</th>
                  <th style={thStyle}>IGST%</th>
                </tr>
              </thead>
              <tbody>
                {gstSummary.map(s => (
                  <tr key={s.gst}>
                    <td style={tdStyle}>{s.taxable.toFixed(2)}</td>
                    <td style={tdStyle}>{s.sgstRate}</td>
                    <td style={tdStyle}>{s.cgstRate}</td>
                    <td style={tdStyle}>{s.sgst.toFixed(2)}</td>
                    <td style={tdStyle}>{s.cgst.toFixed(2)}</td>
                    <td style={tdStyle}>0.00</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {/* Bank + Amount in Words */}
            <div style={{ border: "1px solid black", marginTop: "4px", padding: "3px", fontSize: "8.5px", lineHeight: "1.2" }}>
              {company?.bankName && <div><strong>BANK:</strong> {company.bankName}</div>}
              {company?.accountNumber && <div><strong>A/C NO:</strong> {company.accountNumber}</div>}
              {company?.ifscCode && <div><strong>IFSC:</strong> {company.ifscCode}</div>}
            </div>
            <div style={{ marginTop: "4px", fontSize: "8.5px", lineHeight: "1.2" }}>
              <strong>Rupees:</strong> {amountWords}
            </div>
            <div style={{ marginTop: "2px", fontSize: "8px", color: "#555" }}>E. &amp; O.E. &nbsp; Subject to Rajkot Jurisdiction</div>
            <div style={{ marginTop: "4px", fontSize: "9px", fontWeight: "bold" }}>
              Outstanding: ₹{Number(invoice.dueAmount).toFixed(2)} {invoice.paymentStatus === "Paid" ? "(PAID)" : "DB"}
            </div>
          </div>

          {/* Amount Summary */}
          <div style={{ width: "180px", flexShrink: 0 }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "8.5px", border: "1px solid black" }}>
              <tbody>
                <tr>
                  <td style={{ ...tdStyle, textAlign: "left" }}>Discount</td>
                  <td style={{ ...tdStyle, textAlign: "right" }}>{Number(invoice.totalDiscount).toFixed(2)}</td>
                </tr>
                <tr>
                  <td style={{ ...tdStyle, textAlign: "left" }}>CGST</td>
                  <td style={{ ...tdStyle, textAlign: "right" }}>{Number(invoice.totalCgst).toFixed(2)}</td>
                </tr>
                <tr>
                  <td style={{ ...tdStyle, textAlign: "left" }}>SGST</td>
                  <td style={{ ...tdStyle, textAlign: "right" }}>{Number(invoice.totalSgst).toFixed(2)}</td>
                </tr>
                <tr>
                  <td style={{ ...tdStyle, textAlign: "left" }}>Round Off</td>
                  <td style={{ ...tdStyle, textAlign: "right" }}>{Number(invoice.roundOff).toFixed(2)}</td>
                </tr>
                <tr style={{ background: "#000", color: "#fff" }}>
                  <td style={{ ...tdStyle, fontWeight: "bold", color: "#fff", borderColor: "#000", textAlign: "left" }}>Grand Total</td>
                  <td style={{ ...tdStyle, textAlign: "right", fontWeight: "bold", fontSize: "11px", color: "#fff", borderColor: "#000" }}>
                    {grandTotal.toFixed(2)}
                  </td>
                </tr>
              </tbody>
            </table>
            <div style={{ marginTop: "15px", textAlign: "right", fontSize: "8.5px" }}>
              <div>For, <strong>{company?.companyName}</strong></div>
              <div style={{ marginTop: "25px", borderTop: "1px solid black", paddingTop: "2px", textAlign: "center" }}>Authorized Signatory</div>
            </div>
          </div>
        </div>
      </div>

      {showPaymentModal && (
        <div className="modal-overlay text-slate-805">
          <div className="modal-box max-w-sm p-6 space-y-4">
            <h3 className="text-lg font-bold text-slate-800">Update Payment</h3>
            <p className="text-sm text-slate-500">Invoice: <strong>{invoice.invoiceNumber}</strong></p>
            
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Grand Total:</span>
                <span className="font-bold">₹{Number(invoice.grandTotal).toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Current Paid:</span>
                <span className="font-semibold text-green-700">₹{Number(invoice.paidAmount).toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Current Due:</span>
                <span className="font-semibold text-red-600">₹{Number(invoice.dueAmount).toFixed(2)}</span>
              </div>
            </div>

            <div>
              <label className="form-label">New Paid Amount *</label>
              <input
                type="number"
                step="0.01"
                className="form-input"
                value={newPaidAmount}
                onChange={e => setNewPaidAmount(e.target.value)}
                placeholder="Enter paid amount"
              />
            </div>

            <div className="flex gap-2 justify-end pt-2">
              <button onClick={() => setShowPaymentModal(false)} className="btn-secondary text-sm">Cancel</button>
              <button onClick={handleUpdatePayment} disabled={updatingPayment} className="btn-primary text-sm">
                {updatingPayment ? "Updating..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const thStyle: React.CSSProperties = {
  border: "1px solid black",
  padding: "1px 2px",
  textAlign: "center",
  fontWeight: "bold",
  fontSize: "7.5px",
  whiteSpace: "nowrap",
};

const tdStyle: React.CSSProperties = {
  border: "1px solid #aaa",
  padding: "2px 2px",
  textAlign: "center",
  fontSize: "8px",
};
