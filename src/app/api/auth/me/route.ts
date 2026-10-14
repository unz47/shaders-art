import { NextResponse } from "next/server";
import { getAuthConfig } from "@/lib/server/oauth";
import { getSession } from "@/lib/server/session";

// GET /api/auth/me → { configured, user: { email } | null }
// ヘッダーの Sign in / Sign out の出し分けに使う。人ごとに違うので CDN にキャッシュさせない。
export async function GET() {
  const session = await getSession();
  return NextResponse.json(
    { configured: getAuthConfig() !== null, user: session ? { email: session.email } : null },
    { headers: { "Cache-Control": "private, no-store" } },
  );
}
