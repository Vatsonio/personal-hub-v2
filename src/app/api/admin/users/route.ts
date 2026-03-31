import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { sql } from "@/lib/db";

export async function GET(request: Request) {
  const session = await auth();
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status"); // pending | active | banned | all

  const users =
    status && status !== "all"
      ? await sql`
        SELECT id, email, name, avatar_url, role, status,
               storage_limit_bytes, last_login_at, created_at,
               (SELECT COUNT(*) FROM saved_items si WHERE si.user_id = users.id AND si.deleted_at IS NULL) AS saved_count,
               (SELECT COALESCE(SUM((si.metadata->>'size')::BIGINT), 0) FROM saved_items si
                WHERE si.user_id = users.id AND si.deleted_at IS NULL
                AND si.content_type IN ('file', 'image', 'voice')) AS storage_used_bytes
        FROM users
        WHERE status = ${status}
        ORDER BY created_at DESC
      `
      : await sql`
        SELECT id, email, name, avatar_url, role, status,
               storage_limit_bytes, last_login_at, created_at,
               (SELECT COUNT(*) FROM saved_items si WHERE si.user_id = users.id AND si.deleted_at IS NULL) AS saved_count,
               (SELECT COALESCE(SUM((si.metadata->>'size')::BIGINT), 0) FROM saved_items si
                WHERE si.user_id = users.id AND si.deleted_at IS NULL
                AND si.content_type IN ('file', 'image', 'voice')) AS storage_used_bytes
        FROM users
        ORDER BY created_at DESC
      `;

  return NextResponse.json({ users });
}
