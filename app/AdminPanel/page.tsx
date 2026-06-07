"use client";
import { useEffect, useState } from "react";
import {
  Package, Users, Truck, Boxes, TrendingUp, AlertCircle, FileText, Printer, Eye
} from "lucide-react";
import StatCard from "@/app/components/ui/StatCard";
import Link from "next/link";

interface DashboardData {
  totalProducts: number;
  totalCustomers: number;
  totalSuppliers: number;
  totalStock: number;
  todaySales: number;
  todayInvoiceCount: number;
  pendingAmount: number;
  pendingCount: number;
  nearExpiryCount: number;
  recentInvoices: Array<{
    id: number;
    invoiceNumber: string;
    invoiceDate: string;
    grandTotal: number;
    paymentStatus: string;
    customer: { storeName: string };
  }>;
}

const statusStyle: Record<string, string> = {
  Paid: "badge badge-green",
  Partial: "badge badge-yellow",
  "Partial Paid": "badge badge-yellow",
  Unpaid: "badge badge-red",
};

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/dashboard")
      .then((r) => r.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  const fmt = (n: number) =>
    new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="spinner mx-auto mb-3" style={{ borderTopColor: "#2563eb", borderColor: "#e2e8f0", width: 40, height: 40 }} />
          <p className="text-slate-500 text-sm">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!data) return <div className="text-red-500 p-4">Failed to load dashboard data</div>;

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-black text-slate-800">Dashboard</h1>
        <p className="text-slate-500 mt-1">Welcome to Balaji Pharma Wholesale System</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-5 mb-8">
        <StatCard
          title="Total Products"
          value={data.totalProducts}
          icon={Package}
          color="blue"
          subtitle="Active products"
        />
        <StatCard
          title="Total Customers"
          value={data.totalCustomers}
          icon={Users}
          color="green"
          subtitle="Active customers"
        />
        <StatCard
          title="Total Suppliers"
          value={data.totalSuppliers}
          icon={Truck}
          color="purple"
          subtitle="Active suppliers"
        />
        <StatCard
          title="Total Stock"
          value={data.totalStock.toLocaleString("en-IN")}
          icon={Boxes}
          color="teal"
          subtitle="Units available"
        />
        <StatCard
          title="Near Expiry Products"
          value={data.nearExpiryCount}
          icon={AlertCircle}
          color="red"
          subtitle="Expiry in 180 days"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-8">
        <StatCard
          title="Today's Sales"
          value={fmt(data.todaySales)}
          icon={TrendingUp}
          color="green"
          subtitle={`${data.todayInvoiceCount} invoices today`}
          trend="↑ Today's revenue"
        />
        <StatCard
          title="Pending Payments"
          value={fmt(data.pendingAmount)}
          icon={AlertCircle}
          color="red"
          subtitle={`${data.pendingCount} unpaid invoices`}
          trend="Outstanding dues"
        />
      </div>

      {/* Recent Invoices */}
      <div className="page-card">
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <FileText size={18} className="text-blue-600" />
            <h2 className="text-base font-bold text-slate-800">Recent Invoices</h2>
          </div>
          <Link href="/AdminPanel/billing/list" className="text-sm font-semibold text-blue-600 hover:text-blue-700">
            View All →
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Invoice #</th>
                <th>Customer</th>
                <th>Date</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {data.recentInvoices.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-slate-400">
                    <FileText size={40} className="mx-auto mb-2 opacity-30" />
                    <p>No invoices yet</p>
                  </td>
                </tr>
              ) : (
                data.recentInvoices.map((inv) => (
                  <tr key={inv.id}>
                    <td>
                      <span className="font-semibold text-blue-700">{inv.invoiceNumber}</span>
                    </td>
                    <td className="font-medium text-slate-700">{inv.customer.storeName}</td>
                    <td className="text-slate-500">
                      {new Date(inv.invoiceDate).toLocaleDateString("en-IN")}
                    </td>
                    <td className="font-semibold text-slate-800">{fmt(inv.grandTotal)}</td>
                    <td>
                      <span className={statusStyle[inv.paymentStatus] || "badge"}>
                        {inv.paymentStatus}
                      </span>
                    </td>
                    <td className="flex gap-1">
                      <Link href={`/AdminPanel/billing/${inv.id}`} title="View Invoice" className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 transition inline-flex">
                        <Eye size={15} />
                      </Link>
                      <Link href={`/print/invoice/${inv.id}`} target="_blank" title="Print Invoice" className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-50 transition inline-flex">
                        <Printer size={15} />
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
