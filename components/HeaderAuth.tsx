"use client";

import Link from "next/link";
import { User, LogOut } from "lucide-react";
import { useAuthStore } from "@/lib/stores/authStore";
import { useEffect, useState } from "react";
import { Button } from "./ui/button";

export function HeaderAuth() {
  const [mounted, setMounted] = useState(false);
  const { isAuthenticated, user, logout } = useAuthStore();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="w-[70px] h-[32px]"></div>; // Placeholder
  }

  if (isAuthenticated && user) {
    return (
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5 px-3 py-1 bg-slate-100 rounded-full border border-slate-200">
          <User className="w-4 h-4 text-slate-600" />
          <span className="text-xs font-bold text-slate-700 max-w-[80px] truncate">
            {user.name?.replace(/^User \\d{4}$/, "User") || "User"}
          </span>
        </div>
        <button
          onClick={() => {
            logout();
            window.location.reload();
          }}
          className="flex items-center justify-center p-1.5 rounded-full bg-red-50 text-red-600 hover:bg-red-100 transition-colors tooltip tooltip-bottom"
          title="Logout"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <Link
      href="/login"
      className="px-4 py-1.5 rounded-full bg-slate-900 text-white font-bold text-sm shadow-md hover:bg-slate-800 transition-colors"
    >
      Login
    </Link>
  );
}
