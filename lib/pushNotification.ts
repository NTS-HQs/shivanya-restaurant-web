import webpush from "web-push";

export type PushPayload = {
  title: string;
  body: string;
  url?: string;
  icon?: string;
};

/**
 * Send a push notification to all stored subscriptions of a given userType.
 * Silently removes expired/invalid subscriptions from DB.
 */
export async function sendPushNotification(
  payload: PushPayload,
  userType: "admin" | "user" = "admin",
) {
  // Configure VAPID lazily at runtime — never at build time
  webpush.setVapidDetails(
    process.env.VAPID_EMAIL!,
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!,
  );
  // Lazy import prisma to avoid circular deps
  const { prisma } = await import("@/lib/db");

  const subscriptions = await prisma.pushSubscription.findMany({
    where: { userType },
  });

  if (subscriptions.length === 0) {
    console.log(`📢  No ${userType} push subscriptions found`);
    return;
  }

  const notification = JSON.stringify({
    title: payload.title,
    body: payload.body,
    url: payload.url ?? "/admin/orders",
    icon: payload.icon ?? "/media/logo.png",
    badge: "/media/logo.png",
    timestamp: Date.now(),
  });

  const staleEndpoints: string[] = [];

  await Promise.allSettled(
    subscriptions.map(async (sub) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth },
          },
          notification,
        );
      } catch (err: any) {
        const status: number = err.statusCode ?? 0;
        if (
          status === 410 ||
          status === 404 ||
          status === 400 ||
          status === 401 ||
          // web-push throws this when the push service returns an unexpected
          // non-success status (e.g. the endpoint is gone but the service
          // doesn't return a proper 410). Treat as stale.
          (err.message as string)?.includes("unexpected response code")
        ) {
          staleEndpoints.push(sub.endpoint);
        } else {
          console.error(
            `📢  Push error for ${sub.endpoint.slice(-20)}:`,
            err.message,
          );
        }
      }
    }),
  );

  // Clean up stale subscriptions
  if (staleEndpoints.length > 0) {
    await prisma.pushSubscription
      .deleteMany({ where: { endpoint: { in: staleEndpoints } } })
      .catch(() => {});
    console.log(
      `🗑️  Removed ${staleEndpoints.length} stale push subscription(s)`,
    );
  }

  console.log(
    `📢  Push sent to ${subscriptions.length - staleEndpoints.length} ${userType} subscriber(s): "${payload.title}"`,
  );
}
