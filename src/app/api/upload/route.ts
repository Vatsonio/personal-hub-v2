import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { minioClient, BUCKET, ensureBucket } from "@/lib/minio";
import { sql } from "@/lib/db";
import { randomUUID } from "crypto";

const MAX_SIZE = 50 * 1024 * 1024; // 50 MB

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await req.formData();
  const file = formData.get("file") as File | null;

  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: "Файл завеликий (макс. 50 МБ)" }, { status: 413 });
  }

  const ext = file.name.includes(".") ? file.name.split(".").pop()!.toLowerCase() : "bin";
  const objectName = `${session.user.id}/${randomUUID()}.${ext}`;

  try {
    await ensureBucket();

    const buffer = Buffer.from(await file.arrayBuffer());
    await minioClient.putObject(BUCKET, objectName, buffer, buffer.length, {
      "Content-Type": file.type || "application/octet-stream"
    });
  } catch (err) {
    console.error("[upload] MinIO error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Storage error" },
      { status: 500 }
    );
  }

  await sql`
    UPDATE users SET storage_used_bytes = storage_used_bytes + ${file.size}
    WHERE id = ${session.user.id}
  `;

  const appUrl = process.env.AUTH_URL?.replace(/\/$/, "") ?? "";
  const publicUrl = `${appUrl}/api/files/${objectName}`;

  return NextResponse.json({ url: publicUrl, name: file.name, size: file.size });
}
