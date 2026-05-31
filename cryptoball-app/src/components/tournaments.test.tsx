import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";

import Tournaments from "./tournaments";

vi.mock("./game-pages/tournement-replays", () => ({
  default: ({ section }: { section: "start" | "open" | "replay" }) => <div>Tournament {section} section</div>,
}));

describe("Tournaments", () => {
  it("redirects the index route to the start tab", () => {
    render(
      <MemoryRouter initialEntries={["/tournaments"]}>
        <Routes>
          <Route path="/tournaments/*" element={<Tournaments />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText("Tournament start section")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /start tournament/i })).toHaveClass("active");
  });

  it("switches to the open tournaments tab", async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter initialEntries={["/tournaments/start"]}>
        <Routes>
          <Route path="/tournaments/*" element={<Tournaments />} />
        </Routes>
      </MemoryRouter>,
    );

    await user.click(screen.getByRole("link", { name: /open tournaments/i }));

    expect(screen.getByText("Tournament open section")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /open tournaments/i })).toHaveClass("active");
  });

  it("switches to the replay tab", async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter initialEntries={["/tournaments/start"]}>
        <Routes>
          <Route path="/tournaments/*" element={<Tournaments />} />
        </Routes>
      </MemoryRouter>,
    );

    await user.click(screen.getByRole("link", { name: /replays/i }));

    expect(screen.getByText("Tournament replay section")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /replays/i })).toHaveClass("active");
  });
});
