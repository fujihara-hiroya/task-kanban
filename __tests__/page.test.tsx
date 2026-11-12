import { beforeEach, expect, test, vi } from "vitest";

// 外部依存（Next.js のナビゲーション API）のみモックする
const mocks = vi.hoisted(() => ({ redirect: vi.fn() }));
vi.mock("next/navigation", () => ({ redirect: mocks.redirect }));

import Home from "@/app/page";

beforeEach(() => {
  mocks.redirect.mockClear();
});

test("ホームページを開くと、タスクボード（/tasks）へリダイレクトされる", () => {
  Home();

  expect(mocks.redirect).toHaveBeenCalledTimes(1);
  expect(mocks.redirect).toHaveBeenCalledWith("/tasks");
});
