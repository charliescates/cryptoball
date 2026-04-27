import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import GameResult from "./GameResult";

describe("GameResult", () => {
  it("renders the final score", () => {
    render(<GameResult result={{ awayScore: 2, homeScore: 4 }} />);

    expect(screen.getByRole("heading", { name: /game result/i })).toBeInTheDocument();
    expect(screen.getByText("4")).toHaveClass("home-score");
    expect(screen.getByText("2")).toHaveClass("away-score");
    expect(screen.getByText("-")).toHaveClass("separator");
  });
});
