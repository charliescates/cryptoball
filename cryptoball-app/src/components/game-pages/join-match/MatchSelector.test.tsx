import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import MatchSelector from "./MatchSelector";

const HOME_ADDRESS = "0x1111111111111111111111111111111111111111";
const AWAY_ADDRESS = "0x2222222222222222222222222222222222222222";

const makeMatchDetails = (overrides = {}) => ({
  homeAddress: HOME_ADDRESS,
  homeTeam: { attackingPlayers: [0n, 0n, 0n], midfieldPlayers: [0n, 0n, 0n], defensivePlayers: [0n, 0n, 0n] },
  awayAddress: AWAY_ADDRESS,
  awayTeam: { attackingPlayers: [0n, 0n, 0n], midfieldPlayers: [0n, 0n, 0n], defensivePlayers: [0n, 0n, 0n] },
  wagerRequired: 0n,
  pot: 0n,
  ...overrides,
});

describe("MatchSelector", () => {
  it("renders match cards and reports selection on click", async () => {
    const user = userEvent.setup();
    const onMatchChange = vi.fn();

    render(
      <MatchSelector
        matchesWithDetails={[
          { id: 3, details: makeMatchDetails() },
          { id: 8, details: makeMatchDetails() },
        ]}
        selectedMatchId={null}
        onMatchChange={onMatchChange}
        currentAddress={HOME_ADDRESS}
      />,
    );

    await user.click(screen.getByRole("button", { name: /Match 8/i }));

    expect(onMatchChange).toHaveBeenCalledWith(8);
  });

  it("shows team names and wager in match card", () => {
    render(
      <MatchSelector
        matchesWithDetails={[
          {
            id: 12,
            details: makeMatchDetails({ wagerRequired: 1000000000000000000n }),
          },
        ]}
        selectedMatchId={12}
        matchDetails={makeMatchDetails({
          wagerRequired: 1000000000000000000n,
          pot: 2500000000000000000n,
        })}
        onMatchChange={vi.fn()}
        currentAddress={HOME_ADDRESS}
      />,
    );

    expect(screen.getByText("Match Details")).toBeInTheDocument();
    expect(screen.getAllByText(/1 POL/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/2.5 POL/i)).toBeInTheDocument();
  });

  it("shows no-matches message when list is empty", () => {
    render(
      <MatchSelector matchesWithDetails={[]} selectedMatchId={null} onMatchChange={vi.fn()} />,
    );

    expect(screen.getByText(/no open matches/i)).toBeInTheDocument();
  });

  it("marks selected card with aria-pressed", () => {
    render(
      <MatchSelector
        matchesWithDetails={[{ id: 5, details: makeMatchDetails() }]}
        selectedMatchId={5}
        onMatchChange={vi.fn()}
        currentAddress={HOME_ADDRESS}
      />,
    );

    expect(screen.getByRole("button", { name: /Match 5/i })).toHaveAttribute("aria-pressed", "true");
  });
});
