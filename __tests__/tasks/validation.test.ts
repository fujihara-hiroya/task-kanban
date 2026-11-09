import { describe, expect, test } from "vitest";
import { validateTaskInput } from "@/lib/tasks/validation";

describe("validateTaskInput", () => {
  describe("正常系", () => {
    test("タイトル・説明・ステータスが妥当なら、そのまま値を返す", () => {
      const result = validateTaskInput({
        title: "買い物",
        description: "牛乳を買う",
        status: "doing",
      });

      expect(result).toEqual({
        ok: true,
        value: { title: "買い物", description: "牛乳を買う", status: "doing" },
      });
    });

    test("説明が空文字でも通る", () => {
      const result = validateTaskInput({
        title: "買い物",
        description: "",
        status: "todo",
      });

      expect(result.ok).toBe(true);
    });

    test("タイトルと説明の前後の空白は取り除かれる", () => {
      const result = validateTaskInput({
        title: "  買い物  ",
        description: "  牛乳  ",
        status: "done",
      });

      expect(result).toEqual({
        ok: true,
        value: { title: "買い物", description: "牛乳", status: "done" },
      });
    });
  });

  describe("異常系", () => {
    test("タイトルが空文字だと、タイトル未入力のエラーになる", () => {
      const result = validateTaskInput({
        title: "",
        description: "",
        status: "todo",
      });

      expect(result).toEqual({
        ok: false,
        error: "タイトルを入力してください",
      });
    });

    test("タイトルが空白だけだと、タイトル未入力のエラーになる", () => {
      const result = validateTaskInput({
        title: "   ",
        description: "",
        status: "todo",
      });

      expect(result).toEqual({
        ok: false,
        error: "タイトルを入力してください",
      });
    });

    test("未定義のステータスだと、ステータス不正のエラーになる", () => {
      const result = validateTaskInput({
        title: "買い物",
        description: "",
        status: "archived",
      });

      expect(result).toEqual({
        ok: false,
        error: "ステータスが不正です",
      });
    });
  });

  describe("境界値", () => {
    test("タイトルが100文字なら通る", () => {
      const result = validateTaskInput({
        title: "あ".repeat(100),
        description: "",
        status: "todo",
      });

      expect(result.ok).toBe(true);
    });

    test("タイトルが101文字だと、文字数超過のエラーになる", () => {
      const result = validateTaskInput({
        title: "あ".repeat(101),
        description: "",
        status: "todo",
      });

      expect(result).toEqual({
        ok: false,
        error: "タイトルは100文字以内で入力してください",
      });
    });

    test("説明が1000文字なら通る", () => {
      const result = validateTaskInput({
        title: "買い物",
        description: "あ".repeat(1000),
        status: "todo",
      });

      expect(result.ok).toBe(true);
    });

    test("説明が1001文字だと、文字数超過のエラーになる", () => {
      const result = validateTaskInput({
        title: "買い物",
        description: "あ".repeat(1001),
        status: "todo",
      });

      expect(result).toEqual({
        ok: false,
        error: "説明は1000文字以内で入力してください",
      });
    });
  });
});
