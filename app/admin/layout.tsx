"use client";

import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard,
  UtensilsCrossed,
  ClipboardList,
  Settings,
  LogOut,
  Menu,
  X,
  ShoppingCart,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const navItems = [
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/orders", label: "Orders", icon: ClipboardList },
  { href: "/admin/pos", label: "Take Order", icon: ShoppingCart },
  { href: "/admin/menu", label: "Menu", icon: UtensilsCrossed },
  { href: "/admin/customers", label: "Customers", icon: Users },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Auth is enforced server-side by middleware.ts (verifies HttpOnly admin_token cookie).
  // No client-side localStorage check needed.

  const handleLogout = async () => {
    await fetch("/api/admin/login", { method: "DELETE" });
    router.push("/admin/login");
  };

  if (pathname.includes("/login")) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-white border-b z-40 flex items-center justify-between px-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setSidebarOpen(!sidebarOpen)}
        >
          <Menu className="w-6 h-6" />
        </Button>
        <h1 className="font-bold text-lg">Shivanya Admin</h1>
        <div className="w-10" />
      </div>

      {/* Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
        fixed top-0 left-0 h-full w-64 bg-white border-r border-slate-200 z-50 transition-transform duration-300
        lg:translate-x-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
      `}
      >
        <div className="p-6 h-16 flex items-center border-b border-slate-100">
          <h1 className="font-bold text-xl tracking-tight text-slate-900">
            Shivanya
          </h1>
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden ml-auto"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        <nav className="p-4 space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`
                  flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-sm font-medium
                  ${
                    isActive
                      ? "bg-slate-100 text-slate-900"
                      : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
                  }
                `}
              >
                <item.icon
                  className={`w-4 h-4 ${
                    isActive ? "text-slate-900" : "text-slate-400"
                  }`}
                />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-100">
          <Button
            onClick={handleLogout}
            variant="ghost"
            className="w-full justify-start text-slate-500 hover:text-red-600 hover:bg-red-50 text-sm font-medium"
          >
            <LogOut className="w-4 h-4 mr-3" />
            Logout
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="lg:ml-64 min-h-screen pt-16 lg:pt-0">{children}</main>
    </div>
  );
}
