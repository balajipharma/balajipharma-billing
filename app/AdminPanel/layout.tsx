"use client";
import React from 'react';
import { AdminSidebar } from '@/app/components/admin/sidebar';
import { AdminNavbar } from '@/app/components/admin/navbar';
import { SidebarProvider, useSidebar } from '@/app/context/SidebarContext';

function AdminLayoutContent({
    children,
}: {
    children: React.ReactNode;
}) {
    const { isCollapsed } = useSidebar();

    return (
        <div className="flex min-h-screen bg-[#F8FAFC]">
            <AdminSidebar />
            <main className={`flex-1 ${isCollapsed ? 'ml-20' : 'ml-72'} transition-all duration-300`}>
                <AdminNavbar />
                <div className="pt-24 px-8 pb-8">
                    {children}
                </div>
            </main>
        </div>
    );
}

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <SidebarProvider>
            <AdminLayoutContent>{children}</AdminLayoutContent>
        </SidebarProvider>
    );
}
