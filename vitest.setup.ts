import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";

// globals を有効にしていないため、Testing Library の自動クリーンアップが働かない。
// テストごとに DOM をリセットする。
afterEach(() => {
  cleanup();
});
