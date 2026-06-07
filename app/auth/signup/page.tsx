"use client";

import { useRouter } from "next/navigation";

export default function Signup() {
  const router = useRouter();

  return (
    <div className="d-flex gap-3 justify-content-center mt-5">
      <button
        className="btn btn-primary"
        onClick={() => router.push("/AdminPanel")}
      >
        Admin Panel
      </button>

      <button
        className="btn btn-success"
        onClick={() => router.push("/UserPanel")}
      >
        User Panel
      </button>
    </div>
  );
}