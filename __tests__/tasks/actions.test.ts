import { beforeEach, describe, expect, test, vi } from "vitest";

// 外部依存（Supabase・Next.js のキャッシュ API）のみモックする
const mocks = vi.hoisted(() => {
  const result = { error: null as { message: string } | null };
  const insert = vi.fn(async () => result);
  const eq = vi.fn(async () => result);
  const update = vi.fn(() => ({ eq }));
  const remove = vi.fn(() => ({ eq }));
  const from = vi.fn(() => ({ insert, update, delete: remove }));
  return { result, insert, eq, update, remove, from, revalidatePath: vi.fn() };
});

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({ from: mocks.from })),
}));
vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidatePath }));

import { createTask, deleteTask, updateTask } from "@/app/tasks/actions";

const validInput = { title: "買い物", description: "牛乳", status: "todo" };

beforeEach(() => {
  vi.clearAllMocks();
  mocks.result.error = null;
});

describe("createTask", () => {
  test("妥当な入力なら tasks に追加し、一覧を再検証して成功を返す", async () => {
    const result = await createTask(validInput);

    expect(result).toEqual({ ok: true });
    expect(mocks.from).toHaveBeenCalledWith("tasks");
    expect(mocks.insert).toHaveBeenCalledWith({
      title: "買い物",
      description: "牛乳",
      status: "todo",
    });
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/tasks");
  });

  test("入力の前後の空白は取り除いて保存する", async () => {
    await createTask({ ...validInput, title: "  買い物  " });

    expect(mocks.insert).toHaveBeenCalledWith(
      expect.objectContaining({ title: "買い物" }),
    );
  });

  test("タイトルが空だと、DB に問い合わせず検証エラーを返す", async () => {
    const result = await createTask({ ...validInput, title: "" });

    expect(result).toEqual({ ok: false, error: "タイトルを入力してください" });
    expect(mocks.insert).not.toHaveBeenCalled();
    expect(mocks.revalidatePath).not.toHaveBeenCalled();
  });

  test("DB がエラーを返すと、失敗を返し一覧は再検証しない", async () => {
    mocks.result.error = { message: "db error" };

    const result = await createTask(validInput);

    expect(result).toEqual({
      ok: false,
      error: "タスクの追加に失敗しました",
    });
    expect(mocks.revalidatePath).not.toHaveBeenCalled();
  });
});

describe("updateTask", () => {
  test("妥当な入力なら対象 id の行を更新し、一覧を再検証して成功を返す", async () => {
    const result = await updateTask("task-1", {
      title: "掃除",
      description: "",
      status: "doing",
    });

    expect(result).toEqual({ ok: true });
    expect(mocks.update).toHaveBeenCalledWith({
      title: "掃除",
      description: "",
      status: "doing",
    });
    expect(mocks.eq).toHaveBeenCalledWith("id", "task-1");
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/tasks");
  });

  test("ステータスが不正だと、DB に問い合わせず検証エラーを返す", async () => {
    const result = await updateTask("task-1", {
      ...validInput,
      status: "archived",
    });

    expect(result).toEqual({ ok: false, error: "ステータスが不正です" });
    expect(mocks.update).not.toHaveBeenCalled();
  });

  test("id が空だと、DB に問い合わせず失敗を返す", async () => {
    const result = await updateTask("", validInput);

    expect(result).toEqual({
      ok: false,
      error: "対象のタスクが指定されていません",
    });
    expect(mocks.update).not.toHaveBeenCalled();
  });

  test("DB がエラーを返すと、失敗を返し一覧は再検証しない", async () => {
    mocks.result.error = { message: "db error" };

    const result = await updateTask("task-1", validInput);

    expect(result).toEqual({
      ok: false,
      error: "タスクの更新に失敗しました",
    });
    expect(mocks.revalidatePath).not.toHaveBeenCalled();
  });
});

describe("deleteTask", () => {
  test("対象 id の行を削除し、一覧を再検証して成功を返す", async () => {
    const result = await deleteTask("task-1");

    expect(result).toEqual({ ok: true });
    expect(mocks.remove).toHaveBeenCalled();
    expect(mocks.eq).toHaveBeenCalledWith("id", "task-1");
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/tasks");
  });

  test("id が空だと、DB に問い合わせず失敗を返す", async () => {
    const result = await deleteTask("");

    expect(result).toEqual({
      ok: false,
      error: "対象のタスクが指定されていません",
    });
    expect(mocks.remove).not.toHaveBeenCalled();
  });

  test("DB がエラーを返すと、失敗を返し一覧は再検証しない", async () => {
    mocks.result.error = { message: "db error" };

    const result = await deleteTask("task-1");

    expect(result).toEqual({
      ok: false,
      error: "タスクの削除に失敗しました",
    });
    expect(mocks.revalidatePath).not.toHaveBeenCalled();
  });
});
