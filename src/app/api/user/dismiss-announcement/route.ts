import { auth } from "@/auth";
import { sql } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rows = await sql`
    SELECT dismissed_announcement_ids FROM users WHERE id = ${session.user.id} LIMIT 1
  `;
  return NextResponse.json({ ids: rows[0]?.dismissed_announcement_ids ?? [] });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  await sql`
    UPDATE users
    SET dismissed_announcement_ids = array_append(
      COALESCE(dismissed_announcement_ids, '{}'),
      ${id}::uuid
    )
    WHERE id = ${session.user.id}
      AND NOT (${id}::uuid = ANY(COALESCE(dismissed_announcement_ids, '{}')))
  `;
  return NextResponse.json({ ok: true });
}
