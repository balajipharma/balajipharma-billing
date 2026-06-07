"use client";
import { useEffect, useState } from "react";
import { Bell, User } from "lucide-react";
import { useSidebar } from "@/app/context/SidebarContext";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface Notification {
  id: number;
  productName: string;
  batchNumber: string;
  expiryDate: string;
  remainingDays: number;
  color: string;
}

export function AdminNavbar() {
  const { isCollapsed } = useSidebar();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [count, setCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  const fetchNotifications = async () => {
    try {
      const res = await fetch("/api/notifications/near-expiry");
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
        setCount(data.count || 0);
      }
    } catch (err) {
      console.error("Failed to fetch notifications:", err);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 5000);
    return () => clearInterval(interval);
  }, [pathname]);

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      fetchNotifications();
    }
  };

  return (
    <header
      className={`fixed top-0 right-0 z-30 h-16 bg-white border-b border-slate-200 flex items-center px-6 transition-all duration-300 ${
        isCollapsed ? "left-20" : "left-72"
      }`}
    >
      <div className="flex-1">
        <h2 className="text-sm font-semibold text-slate-500">Pharma Wholesale Management</h2>
      </div>
      <div className="flex items-center gap-3">
        {/* Notification Bell */}
        <div className="relative">
          <button 
            onClick={toggleDropdown}
            className="relative p-2 rounded-xl hover:bg-slate-100 transition text-slate-500"
          >
            <Bell size={18} />
            {count > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center px-1 shadow-sm">
                {count}
              </span>
            )}
          </button>

          {/* Click outside overlay */}
          {isOpen && (
            <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          )}

          {/* Notifications Dropdown */}
          {isOpen && (
            <div className="absolute right-0 mt-2 w-80 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 overflow-hidden text-slate-800">
              <div className="px-4 py-3 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
                <span className="font-bold text-slate-700 text-sm">Near Expiry Alerts</span>
                {count > 0 && (
                  <span className="bg-red-50 text-red-700 text-[10px] font-bold px-1.5 py-0.5 rounded-full border border-red-200">
                    {count} Batches
                  </span>
                )}
              </div>
              <div className="max-h-72 overflow-y-auto divide-y divide-slate-100">
                {notifications.length === 0 ? (
                  <div className="px-4 py-8 text-center text-sm text-slate-400">
                    No notifications
                  </div>
                ) : (
                  notifications.map((n) => {
                    let badgeColor = "bg-yellow-50 text-yellow-700 border-yellow-200";
                    if (n.color === "red") badgeColor = "bg-red-50 text-red-700 border-red-200";
                    if (n.color === "orange") badgeColor = "bg-orange-50 text-orange-700 border-orange-200";

                    return (
                      <Link
                        key={n.id}
                        href="/AdminPanel/stock?tab=expiry"
                        onClick={() => setIsOpen(false)}
                        className="block px-4 py-3.5 hover:bg-slate-50 transition"
                      >
                        <div className="flex justify-between items-start gap-2">
                          <p className="font-semibold text-xs text-slate-800 line-clamp-1">{n.productName}</p>
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full border ${badgeColor} flex-shrink-0`}>
                            {n.remainingDays <= 0 ? "Expired" : `${n.remainingDays} Days`}
                          </span>
                        </div>
                        <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                          <span>Batch: <strong>{n.batchNumber}</strong></span>
                          <span>Expiry: <strong>{n.expiryDate}</strong></span>
                        </div>
                      </Link>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 pl-3 border-l border-slate-200">
          <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
            <User size={16} className="text-white" />
          </div>
          <div className="hidden sm:block">
            <p className="text-sm font-semibold text-slate-700">SMIT KHUNT</p>
            <p className="text-xs text-slate-400">Owner</p>
          </div>
        </div>
      </div>
    </header>
  );
}
