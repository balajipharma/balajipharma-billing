"use client";
import React from "react";
import { ShieldAlert, RefreshCw } from "lucide-react";

interface ErrorBoundaryCardProps {
  error?: Error;
  reset?: () => void;
  title?: string;
  subtitle?: string;
}

export default function ErrorBoundaryCard({
  error,
  reset,
  title = "Something went wrong",
  subtitle = "Please try again later"
}: ErrorBoundaryCardProps) {
  return (
    <div className="flex items-center justify-center p-6 min-h-[350px] w-full">
      <div className="bg-white/80 backdrop-blur border border-slate-100 p-8 rounded-2xl shadow-xl max-w-md w-full text-center space-y-6">
        <div className="w-16 h-16 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mx-auto shadow-inner border border-red-100">
          <ShieldAlert size={32} />
        </div>
        
        <div className="space-y-2">
          <h2 className="text-xl font-black text-slate-800 tracking-tight">{title}</h2>
          <p className="text-slate-500 text-sm font-medium leading-relaxed">{subtitle}</p>
          {error && (
            <p className="text-xs text-red-600 bg-red-50/50 p-2 rounded-lg border border-red-100/50 max-h-24 overflow-y-auto font-mono text-left select-text">
              {error.message || String(error)}
            </p>
          )}
        </div>

        {reset && (
          <button
            onClick={() => reset()}
            className="btn-primary mx-auto text-sm flex items-center gap-2 px-5 py-2.5 transition active:scale-95"
          >
            <RefreshCw size={15} />
            Try Again
          </button>
        )}
      </div>
    </div>
  );
}
