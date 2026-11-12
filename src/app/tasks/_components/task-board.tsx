"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  taskStatuses,
  type ActionResult,
  type RawTaskInput,
  type Task,
  type TaskStatus,
} from "@/lib/tasks/types";
import { statusLabels } from "./status-labels";
import { TaskCard } from "./task-card";
import { TaskForm } from "./task-form";

type TaskBoardProps = {
  tasks: Task[];
  createTaskAction: (input: RawTaskInput) => Promise<ActionResult>;
  updateTaskAction: (id: string, input: RawTaskInput) => Promise<ActionResult>;
  deleteTaskAction: (id: string) => Promise<ActionResult>;
};

const columnAccents: Record<TaskStatus, string> = {
  todo: "bg-slate-400",
  doing: "bg-blue-500",
  done: "bg-emerald-500",
};

type FormState =
  | { mode: "closed" }
  | { mode: "create" }
  | { mode: "edit"; task: Task };

export function TaskBoard({
  tasks,
  createTaskAction,
  updateTaskAction,
  deleteTaskAction,
}: TaskBoardProps) {
  const [formState, setFormState] = useState<FormState>({ mode: "closed" });
  const [deleteError, setDeleteError] = useState<string | null>(null);

  function closeForm() {
    setFormState({ mode: "closed" });
  }

  async function handleDelete(task: Task) {
    if (!window.confirm(`「${task.title}」を削除しますか？`)) return;

    setDeleteError(null);
    try {
      const result = await deleteTaskAction(task.id);
      if (!result.ok) {
        setDeleteError(result.error);
      }
    } catch {
      setDeleteError("通信に失敗しました。もう一度お試しください");
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">タスクボード</h1>
        <Button
          type="button"
          onClick={() => {
            setDeleteError(null);
            setFormState({ mode: "create" });
          }}
        >
          <Plus />
          タスクを追加
        </Button>
      </div>

      {formState.mode === "create" && (
        <TaskForm
          key="create"
          onSubmit={createTaskAction}
          onClose={closeForm}
        />
      )}
      {formState.mode === "edit" && (
        <TaskForm
          key={formState.task.id}
          task={formState.task}
          onSubmit={(input) => updateTaskAction(formState.task.id, input)}
          onClose={closeForm}
        />
      )}

      {deleteError && (
        <Alert variant="destructive">{deleteError}</Alert>
      )}

      <div className="flex flex-1 items-stretch gap-4 overflow-x-auto pb-2 sm:gap-6">
        {taskStatuses.map((status) => {
          const columnTasks = tasks.filter((task) => task.status === status);
          const headingId = `column-${status}`;
          return (
            <section
              key={status}
              aria-labelledby={headingId}
              className="flex flex-col min-h-[60vh] min-w-72 flex-1 basis-0 gap-3 rounded-xl bg-muted p-4"
            >
              <div className="flex items-center gap-2 px-1">
                <span
                  aria-hidden="true"
                  className={`size-2.5 rounded-full ${columnAccents[status]}`}
                />
                <h2 id={headingId} className="text-sm font-semibold">
                  {statusLabels[status]}
                </h2>
                <Badge variant="secondary">{columnTasks.length}</Badge>
              </div>
              {columnTasks.length === 0 ? (
                <p className="rounded-lg border border-dashed py-6 text-center text-sm text-muted-foreground">
                  タスクはありません
                </p>
              ) : (
                columnTasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onEdit={(target) => {
                      setDeleteError(null);
                      setFormState({ mode: "edit", task: target });
                    }}
                    onDelete={handleDelete}
                  />
                ))
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}
