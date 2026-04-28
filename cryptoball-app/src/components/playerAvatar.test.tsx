import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import PlayerAvatar from "./playerAvatar";

describe("PlayerAvatar", () => {
  it("renders the player layer stack with the computed sources", () => {
    render(<PlayerAvatar seed="alpha" size={180} primaryColor="#ff0000" />);

    const images = screen.getAllByRole("presentation");

    expect(images).toHaveLength(6);
    expect(images[0].getAttribute("src")).toMatch(/^\/player-layers\/body-/);
    expect(images[1]).toHaveAttribute("src", "/player-layers/kit-base.png");
    expect(images[2]).toHaveAttribute("src", "/player-layers/kit-overlay-ff0000.png");
    expect(images[3].getAttribute("src")).toMatch(/^\/player-layers\/faces\//);
    expect(images[4].getAttribute("src")).toMatch(/^\/player-layers\/hair\//);
    expect(images[5].getAttribute("src")).toMatch(/^\/player-layers\/boots\//);
  });
});
