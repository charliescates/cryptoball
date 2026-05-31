import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";

import Games from "./games";

vi.mock("./game-pages/start-game-page", () => ({
  default: () => <div>Start Game Page</div>,
}));

vi.mock("./game-pages/join-match-page", () => ({
  default: () => <div>Join Match Page</div>,
}));

vi.mock("./game-pages/show-matches", () => ({
  default: () => <div>Show Matches Page</div>,
}));

describe("Games", () => {
  it("redirects the index route to the start tab", async () => {
    render(
      <MemoryRouter initialEntries={["/games"]}>
        <Routes>
          <Route path="/games/*" element={<Games />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText("Start Game Page")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /start new game/i })).toHaveClass("active");
  });

  it("switches to the join tab", async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter initialEntries={["/games/start"]}>
        <Routes>
          <Route path="/games/*" element={<Games />} />
        </Routes>
      </MemoryRouter>,
    );

    await user.click(screen.getByRole("link", { name: /join match/i }));

    expect(screen.getByText("Join Match Page")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /join match/i })).toHaveClass("active");
  });

  it("switches to the recent matches tab", async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter initialEntries={["/games/start"]}>
        <Routes>
          <Route path="/games/*" element={<Games />} />
        </Routes>
      </MemoryRouter>,
    );

    await user.click(screen.getByRole("link", { name: /replays/i }));

    expect(screen.getByText("Show Matches Page")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /replays/i })).toHaveClass("active");
  });

});
