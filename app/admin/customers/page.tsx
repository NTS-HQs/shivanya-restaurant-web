"use client";

import { useEffect, useState } from "react";
import { getCustomerList } from "@/lib/actions/orders";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Loader2, Users, Search, Phone, ShoppingBag } from "lucide-react";

type Customer = Awaited<ReturnType<typeof getCustomerList>>[number];

const TYPE_LABELS: Record<string, string> = {
  DINE_IN: "Dine-In",
  TAKEAWAY: "Takeaway",
  DELIVERY: "Delivery",
};

const TYPE_COLORS: Record<string, string> = {
  DINE_IN: "bg-purple-100 text-purple-700",
  TAKEAWAY: "bg-blue-100 text-blue-700",
  DELIVERY: "bg-green-100 text-green-700",
};

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    getCustomerList()
      .then(setCustomers)
      .finally(() => setLoading(false));
  }, []);

  const filtered = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.phone.includes(search),
  );

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Users className="w-6 h-6 text-orange-500" />
            Customers
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            {customers.length} unique customer
            {customers.length !== 1 ? "s" : ""}
          </p>
        </div>
        {/* Search */}
        <div className="relative sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Search name or phone…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-slate-50 border-slate-200"
          />
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <Card className="p-4 border border-slate-100 shadow-sm">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Total Customers
          </p>
          <p className="text-3xl font-black text-slate-900 mt-1">
            {customers.length}
          </p>
        </Card>
        <Card className="p-4 border border-slate-100 shadow-sm">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Total Orders
          </p>
          <p className="text-3xl font-black text-slate-900 mt-1">
            {customers.reduce((s, c) => s + c.count, 0)}
          </p>
        </Card>
        <Card className="p-4 border border-slate-100 shadow-sm col-span-2 sm:col-span-1">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Total Revenue
          </p>
          <p className="text-3xl font-black text-slate-900 mt-1">
            ₹{customers.reduce((s, c) => s + c.totalSpent, 0).toLocaleString()}
          </p>
        </Card>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="text-center py-20 text-slate-400">
          <ShoppingBag className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium">No customers found</p>
        </div>
      ) : (
        <Card className="border border-slate-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="text-left px-5 py-3 font-semibold text-slate-500 text-xs uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="text-left px-5 py-3 font-semibold text-slate-500 text-xs uppercase tracking-wider">
                    Phone
                  </th>
                  <th className="text-left px-5 py-3 font-semibold text-slate-500 text-xs uppercase tracking-wider">
                    Order Types
                  </th>
                  <th className="text-right px-5 py-3 font-semibold text-slate-500 text-xs uppercase tracking-wider">
                    Orders
                  </th>
                  <th className="text-right px-5 py-3 font-semibold text-slate-500 text-xs uppercase tracking-wider">
                    Total Spent
                  </th>
                  <th className="text-right px-5 py-3 font-semibold text-slate-500 text-xs uppercase tracking-wider">
                    Last Order
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map((c, idx) => (
                  <tr
                    key={c.phone}
                    className={`hover:bg-slate-50/60 transition-colors ${
                      idx % 2 === 0 ? "" : "bg-slate-50/30"
                    }`}
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-orange-100 text-orange-700 flex items-center justify-center font-bold text-sm shrink-0">
                          {c.name.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-semibold text-slate-800 truncate max-w-35">
                          {c.name}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className="flex items-center gap-1.5 text-slate-600 font-medium">
                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                        {c.phone}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex flex-wrap gap-1.5">
                        {c.types.map((t) => (
                          <span
                            key={t}
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              TYPE_COLORS[t] ?? "bg-slate-100 text-slate-600"
                            }`}
                          >
                            {TYPE_LABELS[t] ?? t}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <Badge variant="secondary" className="ml-auto font-bold">
                        {c.count}
                      </Badge>
                    </td>
                    <td className="px-5 py-4 text-right font-bold text-slate-800">
                      ₹{c.totalSpent.toLocaleString()}
                    </td>
                    <td className="px-5 py-4 text-right text-slate-400 text-xs">
                      {new Date(c.lastOrder).toLocaleDateString("en-IN", {
                        day: "2-digit",
                        month: "short",
                        year: "2-digit",
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
