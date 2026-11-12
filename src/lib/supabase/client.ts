import { createBrowserClient } from "@supabase/ssr";
import { getSupabaseEnv } from "./env";

/** Client Component 用の Supabase クライアント */
export function createClient() {
  const { url, publishableKey } = getSupabaseEnv();
  return createBrowserClient(url, publishableKey);
}
