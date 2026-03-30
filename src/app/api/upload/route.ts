import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { minioClient, BUCKET, ensureBucket } from "@/lib/minio";
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

  await ensureBucket();

  const buffer = Buffer.from(await file.arrayBuffer());
  await minioClient.putObject(BUCKET, objectName, buffer, buffer.length, {
    "Content-Type": file.type || "application/octet-stream"
  });

  const publicUrl = `${process.env.MINIO_PUBLIC_URL ?? ""}/${BUCKET}/${objectName}`;

  return NextResponse.json({ url: publicUrl, name: file.name, size: file.size });
}
