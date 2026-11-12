import { createClient } from "@/lib/supabase/server";
import { isTaskStatus, type Task } from "./types";

/** タスクを作成日時の古い順に取得する */
export async function getTasks(): Promise<Task[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tasks")
    .select("id, title, description, status")
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error("タスクの取得に失敗しました");
  }

  return data.map((row) => ({
    id: row.id,
    title: row.title,
    description: row.description,
    // DB の CHECK 制約で保証されているが、型としては string なので絞り込む
    status: isTaskStatus(row.status) ? row.status : "todo",
  }));
}
