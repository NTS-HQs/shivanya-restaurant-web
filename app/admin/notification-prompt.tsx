"use client";

import { useState, useEffect } from "react";
import { Bell, X } from "lucide-react";
import { Button } from "@/components/ui/button";

async function subscribeToPush(): Promise<boolean> {
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
    console.warn("Push not supported in this browser");
    return false;
  }

  try {
    const reg = await navigator.serviceWorker.register("/sw.js");
    await navigator.serviceWorker.ready;

    const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    if (!vapidKey) {
      console.error("NEXT_PUBLIC_VAPID_PUBLIC_KEY not set");
      return false;
    }

    const sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: vapidKey, // browsers accept base64url string directly
    });

    const res = await fetch("/api/push/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subscription: sub.toJSON(), userType: "admin" }),
    });

    return res.ok;
  } catch (err) {
    console.error("Push subscription failed:", err);
    return false;
  }
}

export function NotificationPrompt() {
  const [permission, setPermission] =
    useState<NotificationPermission>("default");
  const [isVisible, setIsVisible] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!("Notification" in window)) return;

    const perm = Notification.permission;
    setPermission(perm);

    // Check if already subscribed via service worker
    if (perm === "granted" && "serviceWorker" in navigator) {
      navigator.serviceWorker.ready.then(async (reg) => {
        const sub = await reg.pushManager.getSubscription();
        if (sub) {
          setIsSubscribed(true);
          setIsVisible(false);
        } else {
          // Granted but no subscription — re-subscribe silently
          subscribeToPush().then((ok) => {
            if (ok) setIsSubscribed(true);
          });
          setIsVisible(false);
        }
      });
    } else if (perm === "default") {
      setIsVisible(true);
    }
  }, []);

  const requestPermission = async () => {
    setIsLoading(true);
    try {
      const result = await Notification.requestPermission();
      setPermission(result);

      if (result === "granted") {
        const ok = await subscribeToPush();
        if (ok) {
          setIsSubscribed(true);
          console.log("✅ Push notifications enabled");
        }
      }
    } finally {
      setIsLoading(false);
      setIsVisible(false);
    }
  };

  if (!isVisible || !("Notification" in window)) return null;

  return (
    <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-4 py-3 rounded-xl shadow-lg mb-6 flex items-center justify-between animate-in slide-in-from-top-2">
      <div className="flex items-center gap-3">
        <div className="bg-white/20 p-2 rounded-full">
          <Bell className="w-5 h-5" />
        </div>
        <div>
          <p className="font-bold text-sm">Enable Order Notifications</p>
          <p className="text-xs text-orange-100">
            Get alerts even when this tab is in the background
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Button
          onClick={requestPermission}
          disabled={isLoading}
          variant="secondary"
          size="sm"
          className="bg-white text-orange-600 hover:bg-orange-50 font-bold"
        >
          {isLoading ? "Enabling..." : "Enable"}
        </Button>
        <button
          onClick={() => setIsVisible(false)}
          className="p-1 hover:bg-white/20 rounded-full transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
