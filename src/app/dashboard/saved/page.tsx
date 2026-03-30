import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { sql } from "@/lib/db";
import SavedClient from "./SavedClient";
import type { SavedItem } from "@/types/domain";

export const metadata = { title: "Saved — Personal Hub" };

export default async function SavedPage() {
  const session = await auth();
  if (!session) redirect("/login");

  let items: SavedItem[] = [];
  let dbError: string | null = null;

  let storageUsed = 0;
  let storageLimit = 0;

  try {
    const [rows, storageRows] = await Promise.all([
      sql`
        SELECT * FROM saved_items
        WHERE user_id = ${session.user.id} AND deleted_at IS NULL
        ORDER BY is_pinned DESC, created_at DESC
        LIMIT 100
      `,
      sql`SELECT storage_used_bytes, storage_limit_bytes FROM users WHERE id = ${session.user.id} LIMIT 1`
    ]);
    items = rows as unknown as SavedItem[];
    storageUsed = Number(storageRows[0]?.storage_used_bytes ?? 0);
    storageLimit = Number(storageRows[0]?.storage_limit_bytes ?? 0);
  } catch (e) {
    dbError = e instanceof Error ? e.message : "DB error";
    console.error("[SavedPage] DB error:", dbError);
  }

  return (
    <SavedClient
      initialItems={items}
      userId={session.user.id}
      dbError={dbError}
      storageUsed={storageUsed}
      storageLimit={storageLimit}
    />
  );
}
