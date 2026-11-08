import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { checkSupabaseConnection } from "@/lib/supabase/check-connection";

const testUrl = "https://example.supabase.co";
const testKey = "sb_publishable_test";

describe("checkSupabaseConnection", () => {
  beforeEach(() => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", testUrl);
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", testKey);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  test("Supabase が 200 を返すと接続成功と URL を返す", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response("{}", { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    const result = await checkSupabaseConnection();

    expect(result).toEqual({ ok: true, url: testUrl });
    const [requestUrl, init] = fetchMock.mock.calls[0];
    expect(String(requestUrl)).toBe(`${testUrl}/auth/v1/health`);
    expect(init.headers).toEqual({ apikey: testKey });
  });

  test("API キーが拒否される（401）と HTTP ステータスを含む失敗を返す", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response("", { status: 401, statusText: "Unauthorized" }),
      ),
    );

    const result = await checkSupabaseConnection();

    expect(result).toEqual({ ok: false, message: "HTTP 401 Unauthorized" });
  });

  test("ネットワークエラーが起きるとエラーメッセージを含む失敗を返す", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("fetch failed")));

    const result = await checkSupabaseConnection();

    expect(result).toEqual({ ok: false, message: "fetch failed" });
  });

  test("URL が未設定だと通信せずに未設定の変数名を含む失敗を返す", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const result = await checkSupabaseConnection();

    expect(result).toEqual({
      ok: false,
      message: "環境変数が設定されていません: NEXT_PUBLIC_SUPABASE_URL",
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  test("URL とキーが両方未設定だと両方の変数名を含む失敗を返す", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "");
    vi.stubGlobal("fetch", vi.fn());

    const result = await checkSupabaseConnection();

    expect(result).toEqual({
      ok: false,
      message:
        "環境変数が設定されていません: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
    });
  });
});
