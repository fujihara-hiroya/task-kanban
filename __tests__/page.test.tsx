import { expect, test } from "vitest";
import { render, screen } from "@testing-library/react";
import Home from "@/app/page";

test("ホームページに見出しが表示される", () => {
  render(<Home />);
  expect(
    screen.getByRole("heading", { level: 1, name: /To get started/ }),
  ).toBeDefined();
});
