"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard, Package, Users, Truck, ShoppingCart, FileText,
  BarChart3, Settings, LogOut, ChevronLeft, ChevronRight, Pill, Boxes, Wallet
} from "lucide-react";
import { useSidebar } from "@/app/context/SidebarContext";

const navItems = [
  { href: "/AdminPanel", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/AdminPanel/billing", label: "Create New Bill", icon: FileText, exact: true, dividerBefore: true },
  { href: "/AdminPanel/billing/list", label: "Billing List", icon: FileText, exact: true },
  { href: "/AdminPanel/purchase", label: "Create Purchase Bill", icon: ShoppingCart, exact: true, dividerBefore: true },
  { href: "/AdminPanel/purchase/list", label: "Purchase List", icon: ShoppingCart, exact: true },
  { href: "/AdminPanel/payments", label: "Payments", icon: Wallet, dividerBefore: true },
  { href: "/AdminPanel/stock", label: "Stock", icon: Boxes, dividerBefore: true },
  { href: "/AdminPanel/reports", label: "Reports", icon: BarChart3, dividerBefore: true },
  { href: "/AdminPanel/products", label: "Products", icon: Package, dividerBefore: true },
  { href: "/AdminPanel/customers", label: "Customers", icon: Users, dividerBefore: true },
  { href: "/AdminPanel/suppliers", label: "Suppliers", icon: Truck, dividerBefore: true },
  { href: "/AdminPanel/settings", label: "Settings", icon: Settings, dividerBefore: true },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { isCollapsed, toggleCollapse } = useSidebar();

  const isActive = (href: string, exact?: boolean) => {
    if (exact) return pathname === href;
    return pathname.startsWith(href);
  };

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/auth/login");
  };

  return (
    <aside
      className={`fixed top-0 left-0 h-screen z-40 flex flex-col transition-all duration-300 bg-slate-900 border-r border-slate-800 ${
        isCollapsed ? "w-20" : "w-72"
      }`}
    >
      {/* Logo */}
      <div className="flex items-center px-5 h-16 border-b border-slate-800">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-blue-500/30">
            <Pill size={18} className="text-white" />
          </div>
          {!isCollapsed && (
            <div className="min-w-0">
              <p className="text-white font-bold text-sm leading-tight truncate">Balaji Pharma</p>
              <p className="text-blue-400 text-xs font-semibold">Wholesale System</p>
            </div>
          )}
        </div>
        <button
          onClick={toggleCollapse}
          className="ml-auto p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition flex-shrink-0"
        >
          {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-6 px-3 space-y-1.5">
        {navItems.map(({ href, label, icon: Icon, exact, dividerBefore }) => {
          const active = isActive(href, exact);
          return (
            <div key={href} className="w-full">
              {dividerBefore && (
                <div className="mx-4 my-1 h-px bg-gradient-to-r from-transparent via-slate-600/70 to-transparent" />
              )}
              <Link
                href={href}
                title={isCollapsed ? label : undefined}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 text-sm ${
                  active
                    ? "bg-blue-600 text-white font-semibold shadow-lg shadow-blue-600/20"
                    : "text-slate-400 hover:text-slate-100 hover:bg-slate-800/50 font-medium"
                } ${isCollapsed ? "justify-center px-0 w-12 h-12 mx-auto" : "mx-2"}`}
              >
                <Icon size={18} className={`flex-shrink-0 ${active ? "text-white" : "text-slate-400 group-hover:text-slate-100"}`} />
                {!isCollapsed && <span>{label}</span>}
              </Link>
            </div>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="p-4 border-t border-slate-800">
        <button
          onClick={handleLogout}
          className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 text-slate-400 hover:text-red-400 hover:bg-red-500/10 ${
            isCollapsed ? "justify-center px-0 w-12 h-12 mx-auto" : "mx-2 w-[calc(100%-1rem)]"
          }`}
        >
          <LogOut size={18} className="flex-shrink-0" />
          {!isCollapsed && <span>Logout</span>}
        </button>
      </div>
    </aside>
  );
}