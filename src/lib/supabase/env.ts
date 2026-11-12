export type SupabaseEnv = {
  url: string;
  publishableKey: string;
};

/**
 * Supabase の接続設定を環境変数から取得する。
 * 未設定の場合はエラーを投げる。
 */
export function getSupabaseEnv(): SupabaseEnv {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  const missing = [
    !url && "NEXT_PUBLIC_SUPABASE_URL",
    !publishableKey && "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
  ].filter((name): name is string => Boolean(name));

  if (!url || !publishableKey) {
    throw new Error(`環境変数が設定されていません: ${missing.join(", ")}`);
  }

  return { url, publishableKey };
}
