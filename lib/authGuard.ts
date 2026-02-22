import { cookies } from "next/headers";
import { verifyToken } from "@/lib/jwt";

/**
 * Call at the top of every admin server action or API route handler.
 * Throws an Error (which Next.js propagates as a 500) if not authenticated.
 * For API routes, catch this and return 401 manually.
 */
export async function requireAdmin(): Promise<void> {
  const cookieStore = await cookies();
  const token = cookieStore.get("admin_token")?.value;
  const payload = token ? verifyToken(token) : null;
  if (!payload || (payload as Record<string, unknown>).role !== "admin") {
    throw new Error("Unauthorized");
  }
}
