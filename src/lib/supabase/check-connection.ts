import { getSupabaseEnv } from "./env";

export type ConnectionResult =
  | { ok: true; url: string }
  | { ok: false; message: string };

/**
 * Supabase プロジェクトへ到達でき、API キーが受け付けられるかを確認する。
 * Auth のヘルスチェックエンドポイントに問い合わせる。
 */
export async function checkSupabaseConnection(): Promise<ConnectionResult> {
  let url: string;
  let publishableKey: string;
  try {
    ({ url, publishableKey } = getSupabaseEnv());
  } catch (error) {
    return { ok: false, message: toMessage(error) };
  }

  try {
    const response = await fetch(new URL("/auth/v1/health", url), {
      headers: { apikey: publishableKey },
      signal: AbortSignal.timeout(5000),
    });
    if (!response.ok) {
      return {
        ok: false,
        message: `HTTP ${response.status} ${response.statusText}`.trim(),
      };
    }
    return { ok: true, url };
  } catch (error) {
    return { ok: false, message: toMessage(error) };
  }
}

function toMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
