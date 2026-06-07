import React from "react";

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
  bankName: string | null;
  accountNumber: string | null;
  ifscCode: string | null;
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

const thStyle: React.CSSProperties = {
  border: "1px solid #666",
  padding: "3px 4px",
  textAlign: "center",
  fontWeight: "bold",
  fontSize: "10px",
  whiteSpace: "nowrap",
};

const tdStyle: React.CSSProperties = {
  border: "1px solid #777",
  padding: "4px 5px",
  textAlign: "center",
  fontSize: "10.5px",
};

export default function PurchasePrintTemplate({ purchase, company }: { purchase: PurchaseData; company: CompanySettings }) {
  const gstSlabs = Array.from(new Set(purchase.items.map(i => Number(i.gstPercent)))).sort();
  const gstSummary = gstSlabs.map(gst => {
    const items = purchase.items.filter(i => Number(i.gstPercent) === gst);
    const taxable = items.reduce((s, i) => s + Number(i.taxableAmt), 0);
    const cgst = items.reduce((s, i) => s + Number(i.cgst), 0);
    const sgst = items.reduce((s, i) => s + Number(i.sgst), 0);
    return { gst, taxable, cgst, sgst, cgstRate: gst / 2, sgstRate: gst / 2 };
  });

  const grandTotal = Math.round(Number(purchase.grandTotal));
  const amountWords = numberToWords(grandTotal) + " Only";

  return (
    <div id="invoice-print" className="invoice-page bg-white text-black">
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "2px solid black", paddingBottom: "6px", marginBottom: "6px" }}>
        {/* Company Info */}
        <div style={{ flex: 1, minWidth: "0" }}>
          <div style={{ fontSize: "18px", fontWeight: "950", marginBottom: "3px", lineHeight: "1.1" }}>{company?.companyName}</div>
          <div style={{ fontSize: "11.5px", lineHeight: "1.2" }}>{company?.address}</div>
          <div style={{ fontSize: "11.5px", marginTop: "3px" }}>MO: {company?.mobile}</div>
          <div style={{ fontSize: "11.5px" }}>GST No. {company?.gstin}</div>
          <div style={{ fontSize: "11.5px" }}>D L No. {company?.dlNumber}</div>
          {company?.fssaiNumber && <div style={{ fontSize: "11.5px" }}>FSSAI No. {company.fssaiNumber}</div>}
        </div>
        {/* Purchase Details */}
        <div style={{ textAlign: "center", borderLeft: "1px solid black", borderRight: "1px solid black", padding: "0 10px", minWidth: "150px" }}>
          <div style={{ fontSize: "11.5px", fontWeight: "bold" }}>Inward Inventory</div>
          <div style={{ fontSize: "10px", color: "#555" }}>Original Copy</div>
          <div style={{ fontSize: "15px", fontWeight: "900", margin: "3px 0" }}>PURCHASE BILL</div>
          <div style={{ fontSize: "11.5px" }}>Pur No. <strong>{purchase.purchaseNumber}</strong></div>
          <div style={{ fontSize: "11.5px" }}>Date. <strong>{new Date(purchase.invoiceDate).toLocaleDateString("en-IN")}</strong></div>
        </div>
        {/* Supplier Info */}
        <div style={{ flex: 1, paddingLeft: "12px", minWidth: "0" }}>
          <div style={{ fontSize: "11px", color: "#555" }}>Supplier:</div>
          <div style={{ fontSize: "13.5px", fontWeight: "bold", lineHeight: "1.1" }}>{purchase.supplier.name}</div>
          <div style={{ fontSize: "11.5px", whiteSpace: "pre-wrap", marginTop: "3px" }}>{purchase.supplier.address}</div>
          <div style={{ fontSize: "11.5px", marginTop: "3px" }}>MO: {purchase.supplier.mobile}</div>
          {purchase.supplier.gstNumber && <div style={{ fontSize: "11.5px" }}>GST No. {purchase.supplier.gstNumber}</div>}
          {purchase.invoiceNumber && <div style={{ fontSize: "11.5px", marginTop: "3px" }}>Supplier Inv No: <strong>{purchase.invoiceNumber}</strong></div>}
        </div>
      </div>

      {/* Products Table */}
      <div style={{ overflowX: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "10.5px", marginBottom: "6px" }}>
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
                  <td key={j} style={{ ...tdStyle, height: "18px" }}>&nbsp;</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Totals Row */}
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "11.5px", borderTop: "1px solid black" }}>
        <tbody>
          <tr>
            <td style={{ ...tdStyle, width: "70%", border: "none" }} colSpan={9}></td>
            <td style={{ ...tdStyle, textAlign: "right", fontWeight: "bold", border: "none" }} colSpan={3}>Sub total</td>
            <td style={{ ...tdStyle, fontWeight: "bold", border: "1px solid #777" }}>{Number(purchase.totalAmount).toFixed(2)}</td>
          </tr>
        </tbody>
      </table>

      {/* Footer */}
      <div style={{ display: "flex", gap: "10px", marginTop: "6px" }}>
        {/* GST Summary */}
        <div style={{ flex: 1, minWidth: "0" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "10px", border: "1px solid black" }}>
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

          {/* Notes & Amount in Words */}
          <div style={{ display: "flex", gap: "6px", marginTop: "6px" }}>
            <div style={{ flex: 1, border: "1px solid black", padding: "4px", fontSize: "10px", lineHeight: "1.2", minHeight: "42px" }}>
              <strong>Notes:</strong>
              <div style={{ marginTop: "1px", color: "#444" }}>{purchase.notes || "No additional remarks."}</div>
            </div>
            {company?.bankName && (
              <div style={{ flex: 1, border: "1px solid black", padding: "4px", fontSize: "10px", lineHeight: "1.2", minHeight: "42px" }}>
                <strong>BANK:</strong> {company.bankName}<br />
                <strong>A/C:</strong> {company.accountNumber}<br />
                <strong>IFSC:</strong> {company.ifscCode}
              </div>
            )}
          </div>

          <div style={{ marginTop: "6px", fontSize: "11.5px", lineHeight: "1.2" }}>
            <strong>Rupees:</strong> {amountWords}
          </div>
        </div>

        {/* Amount Summary */}
        <div style={{ width: "200px", flexShrink: 0 }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "11.5px", border: "1px solid black" }}>
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
                <td style={{ ...tdStyle, textAlign: "right", fontWeight: "bold", fontSize: "13.5px", color: "#fff", borderColor: "#000" }}>
                  {grandTotal.toFixed(2)}
                </td>
              </tr>
            </tbody>
          </table>
          <div style={{ marginTop: "20px", textAlign: "right", fontSize: "11.5px" }}>
            <div>For, <strong>{company?.companyName}</strong></div>
            <div style={{ marginTop: "35px", borderTop: "1px solid black", paddingTop: "3px", textAlign: "center" }}>Authorized Inward Checker</div>
          </div>
        </div>
      </div>
    </div>
  );
}
