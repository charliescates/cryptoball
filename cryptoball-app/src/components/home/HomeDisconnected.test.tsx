import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import HomeDisconnected from "./HomeDisconnected";

describe("HomeDisconnected", () => {
  it("renders the disconnected landing state", () => {
    const { container } = render(<HomeDisconnected />);

    expect(screen.getByText("Futures FC")).toBeInTheDocument();
    expect(screen.getByText("Build Your Dream Team & Compete")).toBeInTheDocument();
    expect(screen.getByText(/connect your wallet to start building your squad/i)).toBeInTheDocument();
    expect(container.querySelector(".glow-orb")).toBeInTheDocument();
  });
});
