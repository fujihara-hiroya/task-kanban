import type { TaskStatus } from "@/lib/tasks/types";

export const statusLabels: Record<TaskStatus, string> = {
  todo: "未着手",
  doing: "進行中",
  done: "完了",
};
