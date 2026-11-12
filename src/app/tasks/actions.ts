"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { ActionResult, RawTaskInput } from "@/lib/tasks/types";
import { validateTaskInput } from "@/lib/tasks/validation";

type SupabaseClient = Awaited<ReturnType<typeof createClient>>;

const missingIdMessage = "対象のタスクが指定されていません";

/**
 * DB 操作を実行し、成功したら一覧を再検証する。
 * 例外・DB エラーはどちらも failureMessage の失敗結果にまとめる。
 */
async function mutate(
  failureMessage: string,
  operation: (supabase: SupabaseClient) => PromiseLike<{ error: unknown }>,
): Promise<ActionResult> {
  try {
    const supabase = await createClient();
    const { error } = await operation(supabase);
    if (error) {
      return { ok: false, error: failureMessage };
    }
  } catch {
    return { ok: false, error: failureMessage };
  }

  revalidatePath("/tasks");
  return { ok: true };
}

export async function createTask(input: RawTaskInput): Promise<ActionResult> {
  const validation = validateTaskInput(input);
  if (!validation.ok) {
    return validation;
  }

  return mutate("タスクの追加に失敗しました", (supabase) =>
    supabase.from("tasks").insert(validation.value),
  );
}

export async function updateTask(
  id: string,
  input: RawTaskInput,
): Promise<ActionResult> {
  if (id === "") {
    return { ok: false, error: missingIdMessage };
  }
  const validation = validateTaskInput(input);
  if (!validation.ok) {
    return validation;
  }

  return mutate("タスクの更新に失敗しました", (supabase) =>
    supabase.from("tasks").update(validation.value).eq("id", id),
  );
}

export async function deleteTask(id: string): Promise<ActionResult> {
  if (id === "") {
    return { ok: false, error: missingIdMessage };
  }

  return mutate("タスクの削除に失敗しました", (supabase) =>
    supabase.from("tasks").delete().eq("id", id),
  );
}
