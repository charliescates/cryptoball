import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";

import WelcomeSection from "./WelcomeSection";

describe("WelcomeSection", () => {
  it("guides a connected user with no players toward the academy", () => {
    render(
      <MemoryRouter future={{ v7_relativeSplatPath: true, v7_startTransition: true }}>
        <WelcomeSection />
      </MemoryRouter>,
    );

    expect(screen.getByRole("heading", { name: /welcome to futures fc/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /no squad yet/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /visit academy/i })).toHaveAttribute("href", "/academy");
    expect(screen.getByText(/scout players/i)).toBeInTheDocument();
    expect(screen.getByText(/build teams/i)).toBeInTheDocument();
    expect(screen.getByText(/compete/i)).toBeInTheDocument();
  });
});
