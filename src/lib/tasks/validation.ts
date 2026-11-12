import { isTaskStatus, type RawTaskInput, type TaskInput } from "./types";

export const titleMaxLength = 100;
export const descriptionMaxLength = 1000;

export type ValidationResult =
  | { ok: true; value: TaskInput }
  | { ok: false; error: string };

/** コードポイント単位の文字数（DB の char_length と揃える） */
function countCharacters(text: string): number {
  return Array.from(text).length;
}

export function validateTaskInput(input: RawTaskInput): ValidationResult {
  const title = input.title.trim();
  const description = input.description.trim();

  if (title === "") {
    return { ok: false, error: "タイトルを入力してください" };
  }
  if (countCharacters(title) > titleMaxLength) {
    return {
      ok: false,
      error: `タイトルは${titleMaxLength}文字以内で入力してください`,
    };
  }
  if (countCharacters(description) > descriptionMaxLength) {
    return {
      ok: false,
      error: `説明は${descriptionMaxLength}文字以内で入力してください`,
    };
  }
  if (!isTaskStatus(input.status)) {
    return { ok: false, error: "ステータスが不正です" };
  }

  return { ok: true, value: { title, description, status: input.status } };
}
