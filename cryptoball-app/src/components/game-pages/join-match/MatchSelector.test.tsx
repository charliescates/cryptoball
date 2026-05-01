import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import MatchSelector from "./MatchSelector";

describe("MatchSelector", () => {
  it("renders available matches and reports selection changes", async () => {
    const user = userEvent.setup();
    const onMatchChange = vi.fn();

    render(<MatchSelector matchList={[3, 8]} selectedMatchId={null} onMatchChange={onMatchChange} />);

    await user.selectOptions(screen.getByRole("combobox"), "8");

    expect(onMatchChange).toHaveBeenCalledWith(8);
  });

  it("shows formatted match details for the selected match", () => {
    render(
      <MatchSelector
        matchList={[12]}
        selectedMatchId={12}
        onMatchChange={vi.fn()}
        matchDetails={{
          homeAddress: "0x1111111111111111111111111111111111111111",
          homeTeam: { attackingPlayers: [0n, 0n, 0n], midfieldPlayers: [0n, 0n, 0n], defensivePlayers: [0n, 0n, 0n] },
          awayAddress: "",
          awayTeam: { attackingPlayers: [0n, 0n, 0n], midfieldPlayers: [0n, 0n, 0n], defensivePlayers: [0n, 0n, 0n] },
          wagerRequired: 1000000000000000000n,
          pot: 2500000000000000000n,
        }}
      />,
    );

    expect(screen.getByText("Match Details")).toBeInTheDocument();
    expect(screen.getByText(/0x1111\.\.\.1111/)).toBeInTheDocument();
    expect(screen.getByText(/available/i)).toBeInTheDocument();
    expect(screen.getByText(/1 ETH/i)).toBeInTheDocument();
    expect(screen.getByText(/2.5 ETH/i)).toBeInTheDocument();
  });
});
