import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { TaskBoard } from "@/app/tasks/_components/task-board";
import type { ActionResult, Task } from "@/lib/tasks/types";

const buyMilk: Task = {
  id: "task-1",
  title: "買い物",
  description: "牛乳を買う",
  status: "todo",
};
const writeCode: Task = {
  id: "task-2",
  title: "実装",
  description: "",
  status: "doing",
};
const review: Task = {
  id: "task-3",
  title: "レビュー",
  description: "PR を確認する",
  status: "done",
};

const ok: ActionResult = { ok: true };

function setup(tasks: Task[] = []) {
  const createTaskAction = vi.fn(async () => ok);
  const updateTaskAction = vi.fn(async () => ok);
  const deleteTaskAction = vi.fn(async () => ok);
  const view = render(
    <TaskBoard
      tasks={tasks}
      createTaskAction={createTaskAction}
      updateTaskAction={updateTaskAction}
      deleteTaskAction={deleteTaskAction}
    />,
  );
  const rerender = (nextTasks: Task[]) =>
    view.rerender(
      <TaskBoard
        tasks={nextTasks}
        createTaskAction={createTaskAction}
        updateTaskAction={updateTaskAction}
        deleteTaskAction={deleteTaskAction}
      />,
    );
  return { createTaskAction, updateTaskAction, deleteTaskAction, rerender };
}

function column(name: string) {
  return screen.getByRole("region", { name });
}

function fillForm(values: {
  title?: string;
  description?: string;
  status?: string;
}) {
  if (values.title !== undefined) {
    fireEvent.change(screen.getByLabelText("タイトル"), {
      target: { value: values.title },
    });
  }
  if (values.description !== undefined) {
    fireEvent.change(screen.getByLabelText("説明"), {
      target: { value: values.description },
    });
  }
  if (values.status !== undefined) {
    fireEvent.change(screen.getByLabelText("ステータス"), {
      target: { value: values.status },
    });
  }
}

describe("一覧表示", () => {
  test("タスクがステータスごとの列に振り分けて表示される", () => {
    setup([buyMilk, writeCode, review]);

    expect(within(column("未着手")).getByText("買い物")).toBeDefined();
    expect(within(column("進行中")).getByText("実装")).toBeDefined();
    expect(within(column("完了")).getByText("レビュー")).toBeDefined();
    expect(within(column("未着手")).queryByText("実装")).toBeNull();
  });

  test("説明があるタスクは説明も表示される", () => {
    setup([buyMilk]);

    expect(screen.getByText("牛乳を買う")).toBeDefined();
  });

  test("タスクが1件も無いときは、各列に「タスクはありません」と表示される", () => {
    setup([]);

    expect(screen.getAllByText("タスクはありません")).toHaveLength(3);
  });

  test("新しいタスク一覧が渡されると、表示が即座に入れ替わる", () => {
    const { rerender } = setup([buyMilk]);

    rerender([buyMilk, writeCode]);
    expect(within(column("進行中")).getByText("実装")).toBeDefined();

    rerender([writeCode]);
    expect(screen.queryByText("買い物")).toBeNull();
  });

  test("編集でステータスが変わったタスクは、別の列に移動して表示される", () => {
    const { rerender } = setup([buyMilk]);

    rerender([{ ...buyMilk, status: "done" }]);

    expect(within(column("完了")).getByText("買い物")).toBeDefined();
    expect(within(column("未着手")).queryByText("買い物")).toBeNull();
  });
});

describe("タスクの追加", () => {
  test("初期状態では追加フォームは表示されていない", () => {
    setup();

    expect(screen.queryByRole("form", { name: "タスクフォーム" })).toBeNull();
  });

  test("「タスクを追加」を押すと、空のフォームが表示される", () => {
    setup();

    fireEvent.click(screen.getByRole("button", { name: "タスクを追加" }));

    expect(screen.getByRole("form", { name: "タスクフォーム" })).toBeDefined();
    expect(
      (screen.getByLabelText("タイトル") as HTMLInputElement).value,
    ).toBe("");
    expect(
      (screen.getByLabelText("ステータス") as HTMLSelectElement).value,
    ).toBe("todo");
  });

  test("入力して保存すると、入力値で追加処理が呼ばれ、フォームが閉じる", async () => {
    const { createTaskAction } = setup();
    fireEvent.click(screen.getByRole("button", { name: "タスクを追加" }));

    fillForm({ title: "買い物", description: "牛乳", status: "doing" });
    fireEvent.click(screen.getByRole("button", { name: "保存" }));

    await waitFor(() =>
      expect(createTaskAction).toHaveBeenCalledWith({
        title: "買い物",
        description: "牛乳",
        status: "doing",
      }),
    );
    await waitFor(() =>
      expect(screen.queryByRole("form", { name: "タスクフォーム" })).toBeNull(),
    );
  });

  test("追加が成功したあと新しい一覧が渡されると、追加したタスクが表示される", async () => {
    const { createTaskAction, rerender } = setup([]);
    fireEvent.click(screen.getByRole("button", { name: "タスクを追加" }));
    fillForm({ title: "買い物" });
    fireEvent.click(screen.getByRole("button", { name: "保存" }));
    await waitFor(() => expect(createTaskAction).toHaveBeenCalled());

    rerender([buyMilk]);

    expect(within(column("未着手")).getByText("買い物")).toBeDefined();
  });

  test("キャンセルを押すと、追加処理を呼ばずにフォームが閉じる", () => {
    const { createTaskAction } = setup();
    fireEvent.click(screen.getByRole("button", { name: "タスクを追加" }));

    fireEvent.click(screen.getByRole("button", { name: "キャンセル" }));

    expect(screen.queryByRole("form", { name: "タスクフォーム" })).toBeNull();
    expect(createTaskAction).not.toHaveBeenCalled();
  });

  test("タイトルが空のまま保存すると、エラーを表示して追加処理は呼ばれない", () => {
    const { createTaskAction } = setup();
    fireEvent.click(screen.getByRole("button", { name: "タスクを追加" }));

    fireEvent.click(screen.getByRole("button", { name: "保存" }));

    expect(screen.getByRole("alert").textContent).toBe(
      "タイトルを入力してください",
    );
    expect(createTaskAction).not.toHaveBeenCalled();
    expect(screen.getByRole("form", { name: "タスクフォーム" })).toBeDefined();
  });

  test("追加処理が失敗すると、エラーを表示し、フォームと入力値は残る", async () => {
    const { createTaskAction } = setup();
    createTaskAction.mockResolvedValueOnce({
      ok: false,
      error: "タスクの追加に失敗しました",
    });
    fireEvent.click(screen.getByRole("button", { name: "タスクを追加" }));
    fillForm({ title: "買い物" });

    fireEvent.click(screen.getByRole("button", { name: "保存" }));

    const alert = await screen.findByRole("alert");
    expect(alert.textContent).toBe("タスクの追加に失敗しました");
    expect(
      (screen.getByLabelText("タイトル") as HTMLInputElement).value,
    ).toBe("買い物");
  });

  test("保存処理の完了を待つあいだ、保存ボタンは無効になり二重送信できない", async () => {
    const { createTaskAction } = setup();
    let resolveAction: (value: ActionResult) => void = () => {};
    createTaskAction.mockReturnValueOnce(
      new Promise<ActionResult>((resolve) => {
        resolveAction = resolve;
      }),
    );
    fireEvent.click(screen.getByRole("button", { name: "タスクを追加" }));
    fillForm({ title: "買い物" });

    fireEvent.click(screen.getByRole("button", { name: "保存" }));

    await waitFor(() =>
      expect(
        (screen.getByRole("button", { name: /保存/ }) as HTMLButtonElement)
          .disabled,
      ).toBe(true),
    );
    resolveAction(ok);
    await waitFor(() =>
      expect(screen.queryByRole("form", { name: "タスクフォーム" })).toBeNull(),
    );
    expect(createTaskAction).toHaveBeenCalledTimes(1);
  });
});

describe("タスクの編集", () => {
  test("「編集」を押すと、そのタスクの内容が入ったフォームが表示される", () => {
    setup([buyMilk]);

    fireEvent.click(screen.getByRole("button", { name: "買い物を編集" }));

    expect(
      (screen.getByLabelText("タイトル") as HTMLInputElement).value,
    ).toBe("買い物");
    expect(
      (screen.getByLabelText("説明") as HTMLTextAreaElement).value,
    ).toBe("牛乳を買う");
    expect(
      (screen.getByLabelText("ステータス") as HTMLSelectElement).value,
    ).toBe("todo");
  });

  test("内容を変えて保存すると、対象 id と入力値で更新処理が呼ばれ、フォームが閉じる", async () => {
    const { updateTaskAction } = setup([buyMilk]);
    fireEvent.click(screen.getByRole("button", { name: "買い物を編集" }));

    fillForm({ title: "掃除", status: "doing" });
    fireEvent.click(screen.getByRole("button", { name: "保存" }));

    await waitFor(() =>
      expect(updateTaskAction).toHaveBeenCalledWith("task-1", {
        title: "掃除",
        description: "牛乳を買う",
        status: "doing",
      }),
    );
    await waitFor(() =>
      expect(screen.queryByRole("form", { name: "タスクフォーム" })).toBeNull(),
    );
  });

  test("キャンセルを押すと、更新処理を呼ばずにフォームが閉じる", () => {
    const { updateTaskAction } = setup([buyMilk]);
    fireEvent.click(screen.getByRole("button", { name: "買い物を編集" }));

    fireEvent.click(screen.getByRole("button", { name: "キャンセル" }));

    expect(screen.queryByRole("form", { name: "タスクフォーム" })).toBeNull();
    expect(updateTaskAction).not.toHaveBeenCalled();
  });

  test("タイトルを空にして保存すると、エラーを表示して更新処理は呼ばれない", () => {
    const { updateTaskAction } = setup([buyMilk]);
    fireEvent.click(screen.getByRole("button", { name: "買い物を編集" }));

    fillForm({ title: "" });
    fireEvent.click(screen.getByRole("button", { name: "保存" }));

    expect(screen.getByRole("alert").textContent).toBe(
      "タイトルを入力してください",
    );
    expect(updateTaskAction).not.toHaveBeenCalled();
  });

  test("更新処理が失敗すると、エラーを表示してフォームは残る", async () => {
    const { updateTaskAction } = setup([buyMilk]);
    updateTaskAction.mockResolvedValueOnce({
      ok: false,
      error: "タスクの更新に失敗しました",
    });
    fireEvent.click(screen.getByRole("button", { name: "買い物を編集" }));

    fireEvent.click(screen.getByRole("button", { name: "保存" }));

    const alert = await screen.findByRole("alert");
    expect(alert.textContent).toBe("タスクの更新に失敗しました");
    expect(screen.getByRole("form", { name: "タスクフォーム" })).toBeDefined();
  });
});

describe("タスクの削除", () => {
  let confirmSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    confirmSpy = vi.spyOn(window, "confirm");
  });

  afterEach(() => {
    confirmSpy.mockRestore();
  });

  test("「削除」を押すと、タスク名入りの確認ダイアログが表示される", () => {
    confirmSpy.mockReturnValue(false);
    setup([buyMilk]);

    fireEvent.click(screen.getByRole("button", { name: "買い物を削除" }));

    expect(confirmSpy).toHaveBeenCalledWith("「買い物」を削除しますか？");
  });

  test("確認ダイアログで OK を選ぶと、対象 id で削除処理が呼ばれる", async () => {
    confirmSpy.mockReturnValue(true);
    const { deleteTaskAction } = setup([buyMilk, writeCode]);

    fireEvent.click(screen.getByRole("button", { name: "買い物を削除" }));

    await waitFor(() =>
      expect(deleteTaskAction).toHaveBeenCalledWith("task-1"),
    );
    expect(deleteTaskAction).toHaveBeenCalledTimes(1);
  });

  test("確認ダイアログでキャンセルすると、削除処理は呼ばれない", () => {
    confirmSpy.mockReturnValue(false);
    const { deleteTaskAction } = setup([buyMilk]);

    fireEvent.click(screen.getByRole("button", { name: "買い物を削除" }));

    expect(deleteTaskAction).not.toHaveBeenCalled();
    expect(screen.getByText("買い物")).toBeDefined();
  });

  test("削除が成功したあと新しい一覧が渡されると、タスクが一覧から消える", async () => {
    confirmSpy.mockReturnValue(true);
    const { deleteTaskAction, rerender } = setup([buyMilk, writeCode]);
    fireEvent.click(screen.getByRole("button", { name: "買い物を削除" }));
    await waitFor(() => expect(deleteTaskAction).toHaveBeenCalled());

    rerender([writeCode]);

    expect(screen.queryByText("買い物")).toBeNull();
    expect(screen.getByText("実装")).toBeDefined();
  });

  test("削除処理が失敗すると、エラーを表示し、タスクは一覧に残る", async () => {
    confirmSpy.mockReturnValue(true);
    const { deleteTaskAction } = setup([buyMilk]);
    deleteTaskAction.mockResolvedValueOnce({
      ok: false,
      error: "タスクの削除に失敗しました",
    });

    fireEvent.click(screen.getByRole("button", { name: "買い物を削除" }));

    const alert = await screen.findByRole("alert");
    expect(alert.textContent).toBe("タスクの削除に失敗しました");
    expect(screen.getByText("買い物")).toBeDefined();
  });
});
