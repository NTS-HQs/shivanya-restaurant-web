// public/sw.js — Shivanya Restaurant Service Worker
// Handles web push notifications when the browser tab is closed.

// ── Push Notification Handler ────────────────────────────────────────────────
self.addEventListener("push", (event) => {
    let data = {};
    try {
        data = event.data ? event.data.json() : {};
    } catch {
        data = { title: "New Notification", body: event.data?.text() || "" };
    }

    const title = data.title || "Shivanya Restaurant";
    const options = {
        body: data.body || "",
        icon: data.icon || "/media/logo.png",
        badge: "/media/logo.png",
        data: { url: data.url || "/admin/orders" },
        requireInteraction: true,   // keeps notification until clicked
        tag: "shivanya-order",       // replaces previous notification of same tag
        renotify: true,
    };

    event.waitUntil(self.registration.showNotification(title, options));
});

// ── Notification Click Handler ───────────────────────────────────────────────
self.addEventListener("notificationclick", (event) => {
    event.notification.close();

    const targetUrl = event.notification.data?.url || "/admin/orders";

    event.waitUntil(
        clients
            .matchAll({ type: "window", includeUncontrolled: true })
            .then((windowClients) => {
                // Focus existing window if open
                for (const client of windowClients) {
                    if (
                        client.url.includes(self.location.origin) &&
                        "focus" in client
                    ) {
                        client.focus();
                        client.navigate(targetUrl);
                        return;
                    }
                }
                // Open new window
                if (clients.openWindow) {
                    return clients.openWindow(targetUrl);
                }
            })
    );
});

// ── Install / Activate (minimal caching) ────────────────────────────────────
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => {
    event.waitUntil(self.clients.claim());
});
