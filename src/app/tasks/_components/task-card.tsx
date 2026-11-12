"use client";

import { Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { Task } from "@/lib/tasks/types";

const updatedAtFormatter = new Intl.DateTimeFormat("ja-JP", {
  timeZone: "Asia/Tokyo",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
});

/** 追加・更新日時を表示用に整形する（サーバーとブラウザで差が出ないよう JST 固定） */
function formatUpdatedAt(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : updatedAtFormatter.format(date);
}

type TaskCardProps = {
  task: Task;
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
};

export function TaskCard({ task, onEdit, onDelete }: TaskCardProps) {
  return (
    <Card size="sm" className="shadow-sm transition-shadow hover:shadow-md">
      <CardHeader>
        <CardTitle className="break-words">
          <h3>{task.title}</h3>
        </CardTitle>
        {task.description !== "" && (
          <CardDescription className="break-words whitespace-pre-wrap">
            {task.description}
          </CardDescription>
        )}
        <CardAction className="flex gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label={`${task.title}を編集`}
            onClick={() => onEdit(task)}
          >
            <Pencil />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label={`${task.title}を削除`}
            className="text-muted-foreground hover:text-destructive"
            onClick={() => onDelete(task)}
          >
            <Trash2 />
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent>
        <time
          dateTime={task.updatedAt}
          className="text-xs text-muted-foreground"
        >
          更新: {formatUpdatedAt(task.updatedAt)}
        </time>
      </CardContent>
    </Card>
  );
}
