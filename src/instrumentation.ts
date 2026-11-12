export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  const { checkSupabaseConnection } = await import(
    "@/lib/supabase/check-connection"
  );
  const result = await checkSupabaseConnection();

  if (!result.ok) {
    console.error(`[Supabase] 接続に失敗しました: ${result.message}`);
  }
}
