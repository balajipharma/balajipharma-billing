"use client";
import { useEffect } from "react";
import ErrorBoundaryCard from "@/app/components/ui/ErrorBoundaryCard";

export default function SuppliersError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error("Suppliers Error:", error); }, [error]);
  return <ErrorBoundaryCard error={error} reset={reset} />;
}
