import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import StartGamePage from "./start-game-page";

vi.mock("../actions/playGame", () => ({
  default: () => <div>Play Game Form</div>,
}));

describe("StartGamePage", () => {
  it("renders the start game hero and form", () => {
    render(<StartGamePage />);

    expect(screen.getByRole("heading", { name: /match control/i })).toBeInTheDocument();
    expect(screen.getByText(/games desk/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/match format/i)).toHaveTextContent("1v1");
    expect(screen.getByText("Play Game Form")).toBeInTheDocument();
  });
});
