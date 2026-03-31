import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { sql } from "@/lib/db";
import { minioClient, BUCKET } from "@/lib/minio";

async function getStorageUsed(userId: string): Promise<number> {
  let total = 0;
  const stream = minioClient.listObjects(BUCKET, `${userId}/`, true);
  await new Promise<void>((resolve, reject) => {
    stream.on("data", (obj) => {
      total += obj.size ?? 0;
    });
    stream.on("end", resolve);
    stream.on("error", reject);
  });
  return total;
}

export async function GET(request: Request) {
  const session = await auth();
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");

  const rows =
    status && status !== "all"
      ? await sql`
        SELECT id, email, name, avatar_url, role, status,
               storage_limit_bytes, last_login_at, created_at,
               (SELECT COUNT(*) FROM saved_items si WHERE si.user_id = users.id AND si.deleted_at IS NULL) AS saved_count
        FROM users
        WHERE status = ${status}
        ORDER BY created_at DESC
      `
      : await sql`
        SELECT id, email, name, avatar_url, role, status,
               storage_limit_bytes, last_login_at, created_at,
               (SELECT COUNT(*) FROM saved_items si WHERE si.user_id = users.id AND si.deleted_at IS NULL) AS saved_count
        FROM users
        ORDER BY created_at DESC
      `;

  // Fetch real storage usage from MinIO for each user in parallel
  const users = await Promise.all(
    rows.map(async (u) => ({
      ...u,
      storage_used_bytes: await getStorageUsed(u.id as string).catch(() => 0)
    }))
  );

  return NextResponse.json({ users });
}
