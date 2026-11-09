import type { Metadata } from "next";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { getTasks } from "@/lib/tasks/queries";
import { createTask, deleteTask, updateTask } from "./actions";
import { TaskBoard } from "./_components/task-board";

export const metadata: Metadata = {
  title: "タスクボード",
};

// Supabase のクライアントは cookies() を使う動的処理のため、Suspense の内側で取得する
async function TaskBoardLoader() {
  const tasks = await getTasks();
  return (
    <TaskBoard
      tasks={tasks}
      createTaskAction={createTask}
      updateTaskAction={updateTask}
      deleteTaskAction={deleteTask}
    />
  );
}

export default function TasksPage() {
  return (
    <main className="flex w-full flex-1 flex-col bg-muted/30 px-4 py-6 sm:px-8 lg:px-12 [&>*]:flex-1">
      <Suspense
        fallback={
          <div className="grid grid-cols-3 gap-6" aria-busy>
            <Skeleton className="h-96 rounded-xl" />
            <Skeleton className="h-96 rounded-xl" />
            <Skeleton className="h-96 rounded-xl" />
          </div>
        }
      >
        <TaskBoardLoader />
      </Suspense>
    </main>
  );
}
