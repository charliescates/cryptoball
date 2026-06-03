import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";

import Tournaments from "./tournaments";

vi.mock("./game-pages/tournement-replays", () => ({
  default: ({ section }: { section: "create" | "open" | "live" | "completed" }) => <div>Tournament {section} section</div>,
}));

describe("Tournaments", () => {
  it("redirects the index route to the create tab", () => {
    render(
      <MemoryRouter initialEntries={["/tournaments"]}>
        <Routes>
          <Route path="/tournaments/*" element={<Tournaments />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText("Tournament create section")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /create tournament/i })).toHaveClass("active");
  });

  it("switches to the open tournaments tab", async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter initialEntries={["/tournaments/create"]}>
        <Routes>
          <Route path="/tournaments/*" element={<Tournaments />} />
        </Routes>
      </MemoryRouter>,
    );

    await user.click(screen.getByRole("link", { name: /join open/i }));

    expect(screen.getByText("Tournament open section")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /join open/i })).toHaveClass("active");
  });

  it("switches to the live tab", async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter initialEntries={["/tournaments/create"]}>
        <Routes>
          <Route path="/tournaments/*" element={<Tournaments />} />
        </Routes>
      </MemoryRouter>,
    );

    await user.click(screen.getByRole("link", { name: /live brackets/i }));

    expect(screen.getByText("Tournament live section")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /live brackets/i })).toHaveClass("active");
  });

  it("switches to the completed tab", async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter initialEntries={["/tournaments/create"]}>
        <Routes>
          <Route path="/tournaments/*" element={<Tournaments />} />
        </Routes>
      </MemoryRouter>,
    );

    await user.click(screen.getByRole("link", { name: /completed/i }));

    expect(screen.getByText("Tournament completed section")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /completed/i })).toHaveClass("active");
  });
});
