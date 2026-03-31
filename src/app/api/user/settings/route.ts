import { auth } from "@/auth";
import { sql } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rows = await sql`SELECT settings FROM users WHERE id = ${session.user.id} LIMIT 1`;
  return NextResponse.json(rows[0]?.settings ?? {});
}

export async function PUT(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();

  await sql`
    UPDATE users SET settings = ${sql.json(body)}, updated_at = now()
    WHERE id = ${session.user.id}
  `;
  return NextResponse.json({ ok: true });
}
