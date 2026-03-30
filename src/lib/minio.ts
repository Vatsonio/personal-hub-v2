import { Client } from "minio";

if (!process.env.MINIO_ENDPOINT || !process.env.MINIO_ACCESS_KEY || !process.env.MINIO_SECRET_KEY) {
  console.warn("[minio] MINIO_ENDPOINT / MINIO_ACCESS_KEY / MINIO_SECRET_KEY not set");
}

export const minioClient = new Client({
  endPoint: process.env.MINIO_ENDPOINT ?? "minio",
  port: parseInt(process.env.MINIO_PORT ?? "9000"),
  useSSL: process.env.MINIO_USE_SSL === "true",
  accessKey: process.env.MINIO_ACCESS_KEY ?? "",
  secretKey: process.env.MINIO_SECRET_KEY ?? ""
});

export const BUCKET = process.env.MINIO_BUCKET ?? "personal-hub";

export async function ensureBucket() {
  const exists = await minioClient.bucketExists(BUCKET);
  if (!exists) {
    await minioClient.makeBucket(BUCKET);
  }
}
