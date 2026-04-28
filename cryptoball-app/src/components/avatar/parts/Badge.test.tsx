import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Badge } from "./Badge";

describe("Badge", () => {
  it("renders the badge text in uppercase and truncates it", () => {
    const { container } = render(
      <svg>
        <Badge text="football" />
      </svg>,
    );

    expect(container.querySelector("text")).toHaveTextContent("FOO");
    expect(container.querySelectorAll("circle")).toHaveLength(2);
  });
});
