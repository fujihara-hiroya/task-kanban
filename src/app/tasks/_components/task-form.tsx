"use client";

import { useId, useState, type FormEvent } from "react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import {
  taskStatuses,
  type ActionResult,
  type RawTaskInput,
  type Task,
} from "@/lib/tasks/types";
import { validateTaskInput } from "@/lib/tasks/validation";
import { statusLabels } from "./status-labels";

type TaskFormProps = {
  /** 編集対象。未指定なら新規追加 */
  task?: Task;
  onSubmit: (input: RawTaskInput) => Promise<ActionResult>;
  /** 保存に成功したとき、またはキャンセルされたときに呼ばれる */
  onClose: () => void;
};

export function TaskForm({ task, onSubmit, onClose }: TaskFormProps) {
  const formId = useId();
  const [title, setTitle] = useState(task?.title ?? "");
  const [description, setDescription] = useState(task?.description ?? "");
  const [status, setStatus] = useState<string>(task?.status ?? "todo");
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isPending) return;

    const validation = validateTaskInput({ title, description, status });
    if (!validation.ok) {
      setError(validation.error);
      return;
    }

    setError(null);
    setIsPending(true);
    try {
      const result = await onSubmit(validation.value);
      if (result.ok) {
        onClose();
        return;
      }
      setError(result.error);
    } catch {
      setError("通信に失敗しました。もう一度お試しください");
    }
    setIsPending(false);
  }

  return (
    <form aria-label="タスクフォーム" noValidate onSubmit={handleSubmit}>
      <Card className="shadow-sm">
        <CardContent className="flex flex-col gap-4">
          <p className="text-base font-medium">
            {task ? "タスクを編集" : "新しいタスク"}
          </p>
          <div className="flex flex-col gap-2">
            <Label htmlFor={`${formId}-title`}>タイトル</Label>
            <Input
              id={`${formId}-title`}
              value={title}
              onChange={(event) => setTitle(event.target.value)}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor={`${formId}-description`}>説明</Label>
            <Textarea
              id={`${formId}-description`}
              rows={3}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor={`${formId}-status`}>ステータス</Label>
            <NativeSelect
              id={`${formId}-status`}
              className="w-full sm:w-48"
              value={status}
              onChange={(event) => setStatus(event.target.value)}
            >
              {taskStatuses.map((value) => (
                <NativeSelectOption key={value} value={value}>
                  {statusLabels[value]}
                </NativeSelectOption>
              ))}
            </NativeSelect>
          </div>
          {error && <Alert variant="destructive">{error}</Alert>}
        </CardContent>
        <CardFooter className="justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose}>
            キャンセル
          </Button>
          <Button type="submit" disabled={isPending}>
            {isPending ? "保存中…" : "保存"}
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
}
