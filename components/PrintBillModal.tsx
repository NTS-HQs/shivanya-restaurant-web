"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { X, Printer } from "lucide-react";
import { getRestaurantProfile } from "@/lib/actions/menu";

type OrderItem = {
  id: string;
  name: string;
  price: number;
  quantity: number;
};

type Order = {
  id: string;
  orderIdString: string;
  customerName: string;
  customerMobile: string;
  type: string;
  status: string;
  tableNumber?: string | null;
  address?: string | null;
  totalAmount: number;
  items: OrderItem[];
  createdAt: Date;
};

type Profile = {
  name: string;
  ownerName: string;
  contact: string;
  address: string;
} | null;

interface PrintBillModalProps {
  order: Order;
  isOpen: boolean;
  onClose: () => void;
}

export default function PrintBillModal({
  order,
  isOpen,
  onClose,
}: PrintBillModalProps) {
  const [profile, setProfile] = useState<Profile>(null);

  useEffect(() => {
    if (isOpen) {
      getRestaurantProfile().then(setProfile);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  const formatPhone = (phone: string) => {
    if (!phone) return "";
    const cleaned = phone.replace(/\D/g, "");
    if (cleaned.length === 10) {
      return `+91 ${cleaned.slice(0, 5)} ${cleaned.slice(5)}`;
    }
    return phone;
  };

  const formatOrderType = (type: string) => {
    const typeMap: Record<string, string> = {
      DINE_IN: "Dine-In",
      TAKEAWAY: "Takeaway",
      DELIVERY: "Delivery",
    };
    return typeMap[type] || type;
  };

  // Generate receipt HTML for print window
  const generateReceiptHTML = () => {
    const itemsHTML = order.items
      .map(
        (item) => `
        <tr>
          <td style="text-align: left; padding: 2px 0;">${item.name}</td>
          <td style="text-align: center; padding: 2px 4px;">${
            item.quantity
          }</td>
          <td style="text-align: right; padding: 2px 0;">₹${(
            item.price * item.quantity
          ).toFixed(2)}</td>
        </tr>
      `
      )
      .join("");

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Bill - ${order.orderIdString}</title>
  <style>
    @page {
      size: 80mm auto;
      margin: 0;
    }
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: 'Courier New', Courier, monospace;
      font-size: 12px;
      line-height: 1.3;
      width: 80mm;
      padding: 3mm;
      background: white;
      color: black;
    }
    .header {
      text-align: center;
      border-bottom: 2px dashed #000;
      padding-bottom: 8px;
      margin-bottom: 8px;
    }
    .restaurant-name {
      font-size: 16px;
      font-weight: bold;
      text-transform: uppercase;
    }
    .address {
      font-size: 10px;
      margin-top: 4px;
    }
    .order-details {
      border-bottom: 1px dashed #000;
      padding-bottom: 6px;
      margin-bottom: 6px;
    }
    .row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 2px;
    }
    .items-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 6px;
    }
    .items-header {
      border-bottom: 1px solid #000;
      font-weight: bold;
      font-size: 10px;
    }
    .items-header td {
      padding-bottom: 4px;
    }
    .divider {
      border-top: 1px dashed #000;
      margin: 6px 0;
    }
    .total {
      display: flex;
      justify-content: space-between;
      font-weight: bold;
      font-size: 14px;
      border-top: 2px solid #000;
      border-bottom: 2px solid #000;
      padding: 6px 0;
      margin: 6px 0;
    }
    .footer {
      text-align: center;
      border-top: 1px dashed #000;
      padding-top: 8px;
      margin-top: 8px;
    }
    .thank-you {
      font-weight: bold;
    }
    .powered-by {
      font-size: 8px;
      color: #666;
      margin-top: 6px;
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="restaurant-name">${profile?.name || "Restaurant"}</div>
    <div class="address">${profile?.address || ""}</div>
    ${
      profile?.contact
        ? `<div class="address">Tel: ${formatPhone(profile.contact)}</div>`
        : ""
    }
  </div>

  <div class="order-details">
    <div class="row">
      <span>Order #:</span>
      <span><strong>${order.orderIdString
        .slice(-6)
        .toUpperCase()}</strong></span>
    </div>
    <div class="row">
      <span>Date:</span>
      <span>${formatDate(order.createdAt)}</span>
    </div>
    <div class="row">
      <span>Type:</span>
      <span>${formatOrderType(order.type)}</span>
    </div>
    ${
      order.tableNumber
        ? `<div class="row"><span>Table:</span><span>${order.tableNumber}</span></div>`
        : ""
    }
    <div class="row">
      <span>Customer:</span>
      <span>${order.customerName}</span>
    </div>
    <div class="row">
      <span>Phone:</span>
      <span>${formatPhone(order.customerMobile)}</span>
    </div>
    ${
      order.type === "DELIVERY" && order.address
        ? `
        <div class="divider"></div>
        <div style="font-size: 10px; margin-top: 4px;">
          <strong>DELIVERY ADDRESS:</strong><br/>
          ${order.address}
        </div>
        `
        : ""
    }
  </div>

  <table class="items-table">
    <tr class="items-header">
      <td style="text-align: left;">ITEM</td>
      <td style="text-align: center;">QTY</td>
      <td style="text-align: right;">AMT</td>
    </tr>
    ${itemsHTML}
  </table>

  <div class="divider"></div>

  <div class="total">
    <span>GRAND TOTAL</span>
    <span>₹${order.totalAmount.toFixed(2)}</span>
  </div>

  <div class="footer">
    <div class="thank-you">Thank you! Visit Again 🙏</div>
    <div style="margin: 4px 0;">━━━━━━━━━━━━━━━━</div>
    <div class="powered-by">Powered by Shivanya</div>
  </div>

  <script>
    window.onload = function() {
      window.print();
      window.onafterprint = function() {
        window.close();
      };
    };
  </script>
</body>
</html>
    `;
  };

  const handlePrint = () => {
    const printWindow = window.open("", "_blank", "width=320,height=600");
    if (printWindow) {
      printWindow.document.write(generateReceiptHTML());
      printWindow.document.close();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      {/* Modal Container */}
      <div className="bg-white rounded-lg shadow-xl max-w-sm w-full max-h-[90vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="sticky top-0 bg-white border-b px-4 py-3 flex justify-between items-center">
          <h2 className="text-lg font-semibold">Print Bill</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Receipt Preview */}
        <div className="p-4 font-mono text-xs bg-gray-50">
          {/* Restaurant Header */}
          <div className="text-center border-b-2 border-dashed border-black pb-3 mb-3 bg-white p-3 rounded">
            <h1 className="text-base font-bold uppercase">
              {profile?.name || "Restaurant"}
            </h1>
            <p className="text-[10px] text-gray-600 mt-1">
              {profile?.address || ""}
            </p>
            {profile?.contact && (
              <p className="text-[10px] text-gray-600">
                Tel: {formatPhone(profile.contact)}
              </p>
            )}
          </div>

          {/* Order Details */}
          <div className="bg-white p-3 rounded border-b border-dashed border-gray-400 mb-2">
            <div className="flex justify-between">
              <span>Order #:</span>
              <span className="font-semibold">
                {order.orderIdString.slice(-6).toUpperCase()}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Date:</span>
              <span>{formatDate(order.createdAt)}</span>
            </div>
            <div className="flex justify-between">
              <span>Type:</span>
              <span>{formatOrderType(order.type)}</span>
            </div>
            {order.tableNumber && (
              <div className="flex justify-between">
                <span>Table:</span>
                <span>{order.tableNumber}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span>Customer:</span>
              <span>{order.customerName}</span>
            </div>
            {order.type === "DELIVERY" && order.address && (
              <div className="mt-2 pt-2 border-t border-dashed border-gray-200">
                <span className="text-[10px] font-bold text-gray-400 block uppercase mb-1">
                  Delivery Address:
                </span>
                <p className="text-[10px] leading-tight text-gray-600">
                  {order.address}
                </p>
              </div>
            )}
          </div>

          {/* Items */}
          <div className="bg-white p-3 rounded mb-2">
            <div className="flex justify-between font-bold text-[10px] border-b border-black pb-1 mb-2">
              <span className="flex-1">ITEM</span>
              <span className="w-8 text-center">QTY</span>
              <span className="w-16 text-right">AMT</span>
            </div>
            {order.items.map((item) => (
              <div key={item.id} className="flex justify-between mb-1">
                <span className="flex-1 truncate pr-2">{item.name}</span>
                <span className="w-8 text-center">{item.quantity}</span>
                <span className="w-16 text-right">
                  ₹{(item.price * item.quantity).toFixed(2)}
                </span>
              </div>
            ))}
          </div>

          {/* Total */}
          <div className="bg-white p-3 rounded flex justify-between font-bold text-sm border-y-2 border-black">
            <span>GRAND TOTAL</span>
            <span>₹{order.totalAmount.toFixed(2)}</span>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="sticky bottom-0 bg-white border-t px-4 py-3">
          {/* Thermal Printer Tip */}
          <div className="text-[10px] text-gray-500 mb-3 bg-amber-50 p-2 rounded border border-amber-200">
            <strong>🖨️ KOT/Thermal Printer:</strong> In print dialog, click
            &quot;Print using the system dialog&quot; → Select your thermal
            printer → Choose 80mm paper size
          </div>
          <div className="flex gap-3 justify-end">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              onClick={handlePrint}
              className="bg-orange-600 hover:bg-orange-700"
            >
              <Printer className="w-4 h-4 mr-2" />
              Print Bill
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
