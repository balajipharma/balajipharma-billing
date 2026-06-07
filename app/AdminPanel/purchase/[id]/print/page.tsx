"use client";
import { useEffect, useState, use } from "react";
import { Printer, ArrowLeft } from "lucide-react";
import Link from "next/link";

interface PurchaseItem {
  id: number;
  batchNumber: string;
  expiryDate: string;
  qty: number;
  freeQty: number;
  purchaseRate: number;
  sellingRate: number;
  mrp: number;
  gstPercent: number;
  taxableAmt: number;
  cgst: number;
  sgst: number;
  totalAmt: number;
  product: {
    name: string;
    hsnCode: string;
    companyName: string;
    pack: string | null;
  };
}

interface PurchaseData {
  id: number;
  purchaseNumber: string;
  invoiceNumber: string | null;
  invoiceDate: string;
  totalAmount: number;
  totalTax: number;
  grandTotal: number;
  notes: string | null;
  supplier: {
    name: string;
    mobile: string;
    address: string;
    gstNumber: string | null;
  };
  items: PurchaseItem[];
}

interface CompanySettings {
  companyName: string;
  gstin: string;
  dlNumber: string;
  address: string;
  mobile: string;
  email: string | null;
  fssaiNumber: string | null;
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

export default function PurchasePrintPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [purchase, setPurchase] = useState<PurchaseData | null>(null);
  const [company, setCompany] = useState<CompanySettings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch(`/api/purchase/${id}`).then(r => r.json()),
      fetch("/api/settings").then(r => r.json()),
    ]).then(([pur, comp]) => {
      setPurchase(pur);
      setCompany(comp?.companyName ? comp : {
        companyName: "Balaji Pharma",
        gstin: "24XXXXX0000X1ZX",
        dlNumber: "20 B RR 0000",
        address: "Your Address, City, State - PIN",
        mobile: "9000000000",
        email: null,
        fssaiNumber: null,
      });
      setLoading(false);
    });
  }, [id]);

  useEffect(() => {
    if (!loading && purchase) {
      const timer = setTimeout(() => {
        window.print();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [loading, purchase]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-white text-slate-500">
        <p>Loading purchase bill details...</p>
      </div>
    );
  }

  if (!purchase) {
    return <div className="p-8 text-red-505 bg-white">Purchase record not found</div>;
  }

  const grandTotal = Math.round(Number(purchase.grandTotal));
  const amountWords = numberToWords(grandTotal) + " Only";

  return (
    <div className="min-h-screen bg-slate-100 py-8">
      {/* Controls - hidden on print */}
      <div className="no-print fixed top-4 left-4 right-4 z-50 flex items-center justify-between bg-white/90 backdrop-blur border border-slate-200 rounded-xl px-5 py-3 shadow-lg">
        <Link href={`/AdminPanel/purchase/${purchase.id}`} className="btn-secondary text-sm">
          <ArrowLeft size={15} /> Back to Details
        </Link>
        <p className="font-semibold text-slate-700">{purchase.purchaseNumber}</p>
        <button onClick={() => window.print()} className="btn-primary text-sm">
          <Printer size={15} /> Print Purchase Bill
        </button>
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
          {/* Purchase Details */}
          <div style={{ textAlign: "center", borderLeft: "1px solid black", borderRight: "1px solid black", padding: "0 8px", minWidth: "140px" }}>
            <div style={{ fontSize: "10px", fontWeight: "bold" }}>Inward Inventory</div>
            <div style={{ fontSize: "9px", color: "#555" }}>Original Copy</div>
            <div style={{ fontSize: "13px", fontWeight: "900", margin: "2px 0" }}>PURCHASE BILL</div>
            <div style={{ fontSize: "9.5px" }}>Pur No. <strong>{purchase.purchaseNumber}</strong></div>
            <div style={{ fontSize: "9.5px" }}>Date. <strong>{new Date(purchase.invoiceDate).toLocaleDateString("en-IN")}</strong></div>
          </div>
          {/* Supplier Info */}
          <div style={{ flex: 1, paddingLeft: "10px", minWidth: "0" }}>
            <div style={{ fontSize: "9.5px", color: "#555" }}>Supplier:</div>
            <div style={{ fontSize: "12px", fontWeight: "bold", lineHeight: "1.1" }}>{purchase.supplier.name}</div>
            <div style={{ fontSize: "9.5px", whiteSpace: "pre-wrap", marginTop: "2px" }}>{purchase.supplier.address}</div>
            {purchase.supplier.gstNumber && <div style={{ fontSize: "9.5px", marginTop: "2px" }}>GST No. {purchase.supplier.gstNumber}</div>}
            {purchase.invoiceNumber && <div style={{ fontSize: "9.5px" }}>Supplier Inv No: <strong>{purchase.invoiceNumber}</strong></div>}
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
                <th style={thStyle}>Mfg/Comp</th>
                <th style={thStyle}>MRP</th>
                <th style={thStyle}>Batch</th>
                <th style={thStyle}>Expiry</th>
                <th style={thStyle}>Qty</th>
                <th style={thStyle}>Free</th>
                <th style={thStyle}>Rate</th>
                <th style={thStyle}>GST%</th>
                <th style={thStyle}>Amount</th>
              </tr>
            </thead>
            <tbody>
              {purchase.items.map((item, i) => (
                <tr key={item.id}>
                  <td style={tdStyle}>{i + 1}</td>
                  <td style={tdStyle}>{item.product.hsnCode}</td>
                  <td style={{ ...tdStyle, textAlign: "left", fontWeight: "bold" }}>{item.product.name}</td>
                  <td style={tdStyle}>{item.product.pack || "—"}</td>
                  <td style={tdStyle}>{item.product.companyName.substring(0, 8)}</td>
                  <td style={tdStyle}>{Number(item.mrp).toFixed(2)}</td>
                  <td style={tdStyle}>{item.batchNumber}</td>
                  <td style={tdStyle}>{new Date(item.expiryDate).toLocaleDateString("en-IN", { month: "2-digit", year: "2-digit" })}</td>
                  <td style={tdStyle}>{item.qty}</td>
                  <td style={tdStyle}>{item.freeQty}</td>
                  <td style={tdStyle}>{Number(item.purchaseRate).toFixed(2)}</td>
                  <td style={tdStyle}>{Number(item.gstPercent).toFixed(2)}</td>
                  <td style={{ ...tdStyle, fontWeight: "bold" }}>{Number(item.totalAmt).toFixed(2)}</td>
                </tr>
              ))}
              {/* Empty rows to fill space */}
              {Array.from({ length: Math.max(0, 8 - purchase.items.length) }).map((_, i) => (
                <tr key={`empty-${i}`}>
                  {Array.from({ length: 13 }).map((_, j) => (
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
              <td style={{ ...tdStyle, width: "70%", border: "none" }} colSpan={9}></td>
              <td style={{ ...tdStyle, textAlign: "right", fontWeight: "bold", border: "none" }} colSpan={3}>Sub total</td>
              <td style={{ ...tdStyle, fontWeight: "bold", border: "1px solid #aaa" }}>{Number(purchase.totalAmount).toFixed(2)}</td>
            </tr>
          </tbody>
        </table>

        {/* Footer */}
        <div style={{ display: "flex", gap: "8px", marginTop: "4px" }}>
          {/* Notes & Amount in Words */}
          <div style={{ flex: 1, minWidth: "0" }}>
            <div style={{ border: "1px solid black", padding: "4px", fontSize: "8.5px", lineHeight: "1.2", minHeight: "50px" }}>
              <strong>Notes:</strong>
              <div style={{ marginTop: "2px", color: "#444" }}>{purchase.notes || "No additional remarks."}</div>
            </div>
            <div style={{ marginTop: "6px", fontSize: "8.5px", lineHeight: "1.2" }}>
              <strong>Rupees:</strong> {amountWords}
            </div>
          </div>

          {/* Amount Summary */}
          <div style={{ width: "180px", flexShrink: 0 }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "8.5px", border: "1px solid black" }}>
              <tbody>
                <tr>
                  <td style={{ ...tdStyle, textAlign: "left" }}>Taxable Amount</td>
                  <td style={{ ...tdStyle, textAlign: "right" }}>{Number(purchase.totalAmount).toFixed(2)}</td>
                </tr>
                <tr>
                  <td style={{ ...tdStyle, textAlign: "left" }}>Total GST</td>
                  <td style={{ ...tdStyle, textAlign: "right" }}>{Number(purchase.totalTax).toFixed(2)}</td>
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
              <div style={{ marginTop: "25px", borderTop: "1px solid black", paddingTop: "2px", textAlign: "center" }}>Authorized Inward Checker</div>
            </div>
          </div>
        </div>
      </div>
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
