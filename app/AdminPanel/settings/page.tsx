"use client";
import { useState, useEffect } from "react";
import { Save, Loader2, CheckCircle2, Settings } from "lucide-react";

interface SettingsForm {
  companyName: string;
  gstin: string;
  dlNumber: string;
  address: string;
  mobile: string;
  email: string;
  fssaiNumber: string;
  bankName: string;
  accountNumber: string;
  ifscCode: string;
  upiId: string;
}

const emptyForm: SettingsForm = {
  companyName: "", gstin: "", dlNumber: "", address: "", mobile: "",
  email: "", fssaiNumber: "", bankName: "", accountNumber: "", ifscCode: "", upiId: ""
};

export default function SettingsPage() {
  const [form, setForm] = useState<SettingsForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/settings").then(r => r.json()).then(data => {
      if (data.companyName) setForm({ ...emptyForm, ...data });
    });
  }, []);

  const handleSave = async () => {
    if (!form.companyName || !form.gstin || !form.mobile) {
      setError("Company Name, GSTIN, and Mobile are required");
      return;
    }
    setSaving(true); setError(""); setSaved(false);
    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) { const d = await res.json(); setError(d.error || "Save failed"); return; }
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } finally { setSaving(false); }
  };

  const f = (field: keyof SettingsForm) => ({
    value: form[field] ?? "",
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm({ ...form, [field]: e.target.value }),
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-slate-800">Settings</h1>
          <p className="text-slate-500 mt-0.5">Configure company information for invoices</p>
        </div>
        {saved && (
          <div className="flex items-center gap-2 text-green-700 bg-green-50 border border-green-200 rounded-xl px-4 py-2">
            <CheckCircle2 size={16} />
            <span className="text-sm font-semibold">Settings saved!</span>
          </div>
        )}
      </div>

      {error && <div className="mb-4 p-3.5 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">{error}</div>}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Company Info */}
        <div className="page-card p-6">
          <div className="flex items-center gap-2 mb-5">
            <Settings size={18} className="text-blue-600" />
            <h2 className="font-bold text-slate-800">Company Information</h2>
          </div>
          <div className="space-y-4">
            <div>
              <label className="form-label">Company Name *</label>
              <input className="form-input" {...f("companyName")} placeholder="e.g. Balaji Pharma" />
            </div>
            <div>
              <label className="form-label">GSTIN *</label>
              <input className="form-input font-mono" {...f("gstin")} placeholder="24XXXXX0000X1ZX" />
            </div>
            <div>
              <label className="form-label">Drug License Number</label>
              <input className="form-input" {...f("dlNumber")} placeholder="e.g. 20 B RR 1466, 21 B RR 1394" />
            </div>
            <div>
              <label className="form-label">FSSAI Number</label>
              <input className="form-input" {...f("fssaiNumber")} placeholder="Optional" />
            </div>
            <div>
              <label className="form-label">Address</label>
              <textarea className="form-input" rows={3} {...f("address")} placeholder="Full company address..." />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="form-label">Mobile *</label>
                <input className="form-input" {...f("mobile")} placeholder="9xxxxxxxxx" />
              </div>
              <div>
                <label className="form-label">Email</label>
                <input type="email" className="form-input" {...f("email")} placeholder="example@email.com" />
              </div>
            </div>
          </div>
        </div>

        {/* Bank Details */}
        <div className="page-card p-6">
          <div className="flex items-center gap-2 mb-5">
            <Settings size={18} className="text-green-600" />
            <h2 className="font-bold text-slate-800">Bank Details</h2>
          </div>
          <div className="space-y-4">
            <div>
              <label className="form-label">Bank Name</label>
              <input className="form-input" {...f("bankName")} placeholder="e.g. Kotak Bank" />
            </div>
            <div>
              <label className="form-label">Account Number</label>
              <input className="form-input font-mono" {...f("accountNumber")} placeholder="Account number" />
            </div>
            <div>
              <label className="form-label">IFSC Code</label>
              <input className="form-input font-mono" {...f("ifscCode")} placeholder="e.g. KKBK0000831" />
            </div>
            {/* <div>
              <label className="form-label">UPI ID</label>
              <input className="form-input" {...f("upiId")} placeholder="e.g. business@kotak" />
            </div> */}

            {/* Preview */}
            {(form.bankName || form.accountNumber) && (
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 text-sm">
                <p className="font-bold text-slate-600 mb-2 uppercase text-xs tracking-wide">Invoice Preview</p>
                {form.bankName && <p><span className="text-slate-500">BANK :</span> {form.bankName}</p>}
                {form.accountNumber && <p><span className="text-slate-500">A/C NO :</span> {form.accountNumber}</p>}
                {form.ifscCode && <p><span className="text-slate-500">IFSC :</span> {form.ifscCode}</p>}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mt-6 flex justify-end">
        <button onClick={handleSave} disabled={saving} className="btn-primary">
          {saving ? <><Loader2 size={16} className="animate-spin" /> Saving...</> : <><Save size={16} /> Save Settings</>}
        </button>
      </div>
    </div>
  );
}