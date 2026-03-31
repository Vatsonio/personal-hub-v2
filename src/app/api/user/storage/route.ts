import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { minioClient, BUCKET } from "@/lib/minio";
import { sql } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [storageRows] = await Promise.all([
    sql`SELECT storage_limit_bytes FROM users WHERE id = ${session.user.id} LIMIT 1`
  ]);

  let used = 0;
  const stream = minioClient.listObjects(BUCKET, `${session.user.id}/`, true);
  await new Promise<void>((resolve, reject) => {
    stream.on("data", (obj) => {
      used += obj.size ?? 0;
    });
    stream.on("end", resolve);
    stream.on("error", reject);
  });

  return NextResponse.json({
    used,
    limit: Number(storageRows[0]?.storage_limit_bytes ?? 0)
  });
}
