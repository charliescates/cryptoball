import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import FootballPlayerAvatar from "./FootballPlayerAvatar";

describe("FootballPlayerAvatar", () => {
  it("renders an accessible avatar and optional badge", () => {
    render(
      <FootballPlayerAvatar
        seed="alpha"
        showBadge
        badgeText="FC"
        traits={{
          facialHairStyle: "none",
          hairStyle: "short",
          bodyStyle: "athletic",
          kitStyle: "stripe",
        }}
      />,
    );

    expect(screen.getByRole("img", { name: "Football player avatar" })).toBeInTheDocument();
    expect(screen.getByText("FC")).toBeInTheDocument();
  });
});
