export const taskStatuses = ["todo", "doing", "done"] as const;

export type TaskStatus = (typeof taskStatuses)[number];

export type Task = {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  /** 追加・更新日時（ISO 8601）。追加直後は作成日時と同じ */
  updatedAt: string;
};

/** 検証前の入力値（ステータスは任意の文字列が来うる） */
export type RawTaskInput = {
  title: string;
  description: string;
  status: string;
};

/** 検証済みの入力値 */
export type TaskInput = {
  title: string;
  description: string;
  status: TaskStatus;
};

export type ActionResult = { ok: true } | { ok: false; error: string };

export function isTaskStatus(value: string): value is TaskStatus {
  return (taskStatuses as readonly string[]).includes(value);
}
