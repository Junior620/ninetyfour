import type { SupabaseClient } from "@supabase/supabase-js";

type Upload = { bucket: string; path: string; body: Buffer; contentType: string };
/** Only uploads created by this request are removed if persistence fails. */
export async function persistRecruitment(client: SupabaseClient, uploads: Upload[], row: Record<string, unknown>): Promise<string> {
  const created: Upload[] = [];
  try {
    for (const upload of uploads) {
      const result = await client.storage.from(upload.bucket).upload(upload.path, upload.body, { contentType: upload.contentType, upsert: false });
      if (result.error) throw new Error("upload_failed");
      created.push(upload);
    }
    const result = await client.from("recruitment_applications").insert(row).select("id").single();
    if (result.error || !result.data?.id) throw new Error("storage_failed");
    return String(result.data.id);
  } catch (error) {
    await Promise.allSettled(created.map(upload => client.storage.from(upload.bucket).remove([upload.path])));
    throw error;
  }
}
