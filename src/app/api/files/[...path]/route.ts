import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { minioClient, BUCKET } from "@/lib/minio";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const session = await auth();
  if (!session) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { path } = await params;
  const objectName = path.join("/");

  try {
    const stat = await minioClient.statObject(BUCKET, objectName);
    const contentType =
      (stat.metaData?.["content-type"] as string | undefined) ?? "application/octet-stream";

    const stream = await minioClient.getObject(BUCKET, objectName);
    return new NextResponse(stream as unknown as BodyInit, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "private, max-age=3600"
      }
    });
  } catch {
    return new NextResponse("Not found", { status: 404 });
  }
}
