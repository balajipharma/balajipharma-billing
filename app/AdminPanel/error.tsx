"use client";
import React, { useEffect } from "react";
import ErrorBoundaryCard from "@/app/components/ui/ErrorBoundaryCard";

export default function AdminPanelErrorBoundaryPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("AdminPanel Error Intercepted:", error);
  }, [error]);

  return <ErrorBoundaryCard error={error} reset={reset} />;
}
