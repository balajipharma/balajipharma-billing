"use client";
import { useEffect } from "react";
import ErrorBoundaryCard from "@/app/components/ui/ErrorBoundaryCard";

export default function ReportsError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error("Reports Error:", error); }, [error]);
  return <ErrorBoundaryCard error={error} reset={reset} />;
}
