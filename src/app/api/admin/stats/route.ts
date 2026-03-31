import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { sql } from "@/lib/db";
import { minioClient, BUCKET } from "@/lib/minio";

async function getTotalStorageUsed(): Promise<number> {
  let total = 0;
  const stream = minioClient.listObjects(BUCKET, "", true);
  await new Promise<void>((resolve, reject) => {
    stream.on("data", (obj) => {
      total += obj.size ?? 0;
    });
    stream.on("end", resolve);
    stream.on("error", reject);
  });
  return total;
}

export async function GET() {
  const session = await auth();
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const [userStats, storageStats, itemStats, totalUsed] = await Promise.all([
    sql`
      SELECT
        COUNT(*) FILTER (WHERE status = 'active')  AS active,
        COUNT(*) FILTER (WHERE status = 'pending') AS pending,
        COUNT(*) FILTER (WHERE status = 'banned')  AS banned
      FROM users
    `,
    sql`SELECT COALESCE(SUM(storage_limit_bytes), 0) AS total_limit FROM users`,
    sql`SELECT COUNT(*) AS total FROM saved_items WHERE deleted_at IS NULL`,
    getTotalStorageUsed().catch(() => 0)
  ]);

  return NextResponse.json({
    users: userStats[0],
    storage: {
      total_used: totalUsed,
      total_limit: storageStats[0].total_limit
    },
    items: itemStats[0]
  });
}
