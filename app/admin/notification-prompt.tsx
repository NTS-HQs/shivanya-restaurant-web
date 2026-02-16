"use client";

import { useState, useEffect } from "react";
import { Bell, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export function NotificationPrompt() {
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check current permission status
    if ("Notification" in window) {
      setPermission(Notification.permission);
      // Show prompt if not decided yet
      if (Notification.permission === "default") {
        setIsVisible(true);
      }
    }
  }, []);

  const requestPermission = async () => {
    if ("Notification" in window) {
      const result = await Notification.requestPermission();
      setPermission(result);
      if (result === "granted" || result === "denied") {
        setIsVisible(false);
      }
    }
  };

  const dismiss = () => {
    setIsVisible(false);
  };

  // Don't show if notifications not supported or already decided
  if (!isVisible || !("Notification" in window)) {
    return null;
  }

  return (
    <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-4 py-3 rounded-xl shadow-lg mb-6 flex items-center justify-between animate-in slide-in-from-top-2">
      <div className="flex items-center gap-3">
        <div className="bg-white/20 p-2 rounded-full">
          <Bell className="w-5 h-5" />
        </div>
        <div>
          <p className="font-bold text-sm">Enable Order Notifications</p>
          <p className="text-xs text-orange-100">
            Get instant alerts when new orders arrive
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Button
          onClick={requestPermission}
          variant="secondary"
          size="sm"
          className="bg-white text-orange-600 hover:bg-orange-50 font-bold"
        >
          Enable
        </Button>
        <button
          onClick={dismiss}
          className="p-1 hover:bg-white/20 rounded-full transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
