import { createClient, type SupabaseClient } from "@supabase/supabase-js";

function getEnv(name: string): string {
  const v = process.env[name];
  if (!v) {
    throw new Error(`Missing environment variable: ${name}`);
  }
  return v;
}

let adminClient: SupabaseClient | null = null;

export function getSupabaseAdminClient(): SupabaseClient {
  if (adminClient) return adminClient;

  const url = getEnv("NEXT_PUBLIC_SUPABASE_URL");
  const serviceRoleKey = getEnv("SUPABASE_SERVICE_ROLE_KEY");

  adminClient = createClient(url, serviceRoleKey, {
    auth: { persistSession: false },
  });

  return adminClient;
}

export async function uploadFileToBucket({
  bucket,
  file,
  destinationPath,
  contentType,
  upsert = true,
}: {
  bucket: string;
  file: File | Blob;
  destinationPath: string;
  contentType?: string;
  upsert?: boolean;
}) {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(destinationPath, file, {
      contentType,
      upsert,
    });

  if (error) throw error;
  return data;
}

export function getSignedUrl({
  bucket,
  filePath,
  expiresInSeconds = 60 * 60,
}: {
  bucket: string;
  filePath: string;
  expiresInSeconds?: number;
}) {
  const supabase = getSupabaseAdminClient();
  return supabase.storage.from(bucket).createSignedUrl(filePath, expiresInSeconds);
}

