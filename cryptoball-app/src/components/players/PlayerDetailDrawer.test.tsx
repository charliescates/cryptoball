import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { AcademyPlayer } from "../utils/playerUtils";
import PlayerDetailDrawer from "./PlayerDetailDrawer";

vi.mock("../avatar/FootballPlayerAvatar", () => ({
  default: () => <div data-testid="football-avatar" />,
}));

const academyPlayer: AcademyPlayer = {
  id: 1n,
  attack: 69n,
  defense: 63n,
  potential: 82n,
  value: 579000000000000000n,
  playerType: 3n,
};

describe("PlayerDetailDrawer", () => {
  it("closes from the button, backdrop, and Escape key", () => {
    const onClose = vi.fn();
    const { container } = render(<PlayerDetailDrawer kind="academy" player={academyPlayer} onClose={onClose} />);

    expect(screen.getByRole("dialog")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /close/i }));
    expect(onClose).toHaveBeenCalledTimes(1);

    const backdrop = container.querySelector(".player-detail-backdrop");
    expect(backdrop).not.toBeNull();
    fireEvent.mouseDown(backdrop as Element);
    expect(onClose).toHaveBeenCalledTimes(2);

    fireEvent.keyDown(document, { key: "Escape" });
    expect(onClose).toHaveBeenCalledTimes(3);
  });

  it("does not close when the drawer content itself is clicked", () => {
    const onClose = vi.fn();
    render(<PlayerDetailDrawer kind="academy" player={academyPlayer} onClose={onClose} />);

    fireEvent.mouseDown(screen.getByRole("dialog"));

    expect(onClose).not.toHaveBeenCalled();
  });
});
