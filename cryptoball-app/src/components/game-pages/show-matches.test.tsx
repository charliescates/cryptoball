import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import ShowMatches from "./show-matches";
import generateName from "../utils/teamName";

vi.mock("@tanstack/react-query", () => ({
  useQuery: vi.fn(),
}));

vi.mock("graphql-request", () => ({
  gql: (strings: TemplateStringsArray) => strings[0],
  request: vi.fn(),
}));

vi.mock("wagmi", () => ({
  useAccount: () => ({ address: "0x0000000000000000000000000000000000000001" }),
}));

const { useQuery } = await import("@tanstack/react-query");
const HOME_ADDRESS = "0x0000000000000000000000000000000000000001";
const AWAY_ADDRESS = "0x0000000000000000000000000000000000000002";

const renderShowMatches = (initialEntry = "/games/recent") =>
  render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <ShowMatches />
    </MemoryRouter>,
  );

describe("ShowMatches", () => {
  beforeEach(() => {
    vi.mocked(useQuery).mockReset();
  });

  it("shows loading, error, and success states", () => {
    vi.mocked(useQuery).mockReturnValueOnce({ status: "pending" } as never);

    const { rerender } = renderShowMatches();
    expect(screen.getByText("Loading recent matches...")).toBeInTheDocument();

    vi.mocked(useQuery).mockReturnValueOnce({ status: "error", error: { code: 403 } } as never);
    rerender(
      <MemoryRouter initialEntries={["/games/recent"]}>
        <ShowMatches />
      </MemoryRouter>,
    );
    expect(screen.getByText(/error ocurred querying the subgraph/i)).toBeInTheDocument();

    vi.mocked(useQuery).mockReturnValueOnce({ status: "error", error: {} } as never);
    rerender(
      <MemoryRouter initialEntries={["/games/recent"]}>
        <ShowMatches />
      </MemoryRouter>,
    );
    expect(screen.getByText(/no games found/i)).toBeInTheDocument();

    vi.mocked(useQuery).mockReturnValue({
      status: "success",
      data: {
        playedMatches: [
          {
            id: "17",
            matchId: "17",
            homeScore: 3,
            awayScore: 1,
            blockTimestamp: "1714300000",
            homeAddress: HOME_ADDRESS,
            awayAddress: AWAY_ADDRESS,
            homeAttackingPlayers: ["1", "0", "2"],
            homeMidfieldPlayers: ["0", "3", "0"],
            homeDefensivePlayers: ["4", "0", "5"],
            awayAttackingPlayers: ["6", "0", "7"],
            awayMidfieldPlayers: ["0", "8", "0"],
            awayDefensivePlayers: ["9", "0", "10"],
            playerScoreds: [
              { playerId: "9", goalOrder: 1 },
              { playerId: "10", goalOrder: 2 },
              { playerId: "6", goalOrder: 3 },
              { playerId: "7", goalOrder: 4 },
              { playerId: "7", goalOrder: 5 },
            ],
          },
        ],
      },
    } as never);
    rerender(
      <MemoryRouter initialEntries={["/games/recent"]}>
        <ShowMatches />
      </MemoryRouter>,
    );
    expect(screen.getByRole("heading", { name: /match replays/i })).toBeInTheDocument();
    expect(screen.getByRole("list", { name: /match replays/i })).toBeInTheDocument();
    expect(screen.getByText("Match #17")).toBeInTheDocument();
    expect(screen.getByText(/replay hidden until reveal/i)).toBeInTheDocument();
  });

  it("shows an empty state when no results are available", () => {
    vi.mocked(useQuery).mockReturnValueOnce({
      status: "success",
      data: { playedMatches: [] },
    } as never);

    renderShowMatches();

    expect(screen.getByText(/no completed matches found yet/i)).toBeInTheDocument();
  });

  it("reveals team lineups and goal events on demand", async () => {
    const user = userEvent.setup();

    vi.mocked(useQuery).mockReturnValue({
      status: "success",
      data: {
        playedMatches: [
          {
            id: "1",
            matchId: "1",
            homeScore: 0,
            awayScore: 5,
            blockTimestamp: "1714300000",
            homeAddress: HOME_ADDRESS,
            awayAddress: AWAY_ADDRESS,
            homeAttackingPlayers: ["1", "0", "2"],
            homeMidfieldPlayers: ["0", "3", "0"],
            homeDefensivePlayers: ["4", "0", "5"],
            awayAttackingPlayers: ["6", "0", "7"],
            awayMidfieldPlayers: ["0", "8", "0"],
            awayDefensivePlayers: ["9", "0", "10"],
            playerScoreds: [
              { playerId: "9", goalOrder: 1 },
              { playerId: "10", goalOrder: 2 },
              { playerId: "6", goalOrder: 3 },
              { playerId: "7", goalOrder: 4 },
              { playerId: "7", goalOrder: 5 },
            ],
          },
        ],
      },
    } as never);

    renderShowMatches();

    expect(screen.queryByText("0 - 5")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /reveal replay/i }));
    await user.click(screen.getByRole("button", { name: /skip/i }));

    expect(screen.getAllByText("0 - 5").length).toBeGreaterThan(0);
    expect(screen.getByLabelText(/match 1 centre/i)).toHaveTextContent("Player of match");
    expect(screen.getByRole("link", { name: /play again/i })).toHaveAttribute(
      "href",
      expect.stringContaining("/games/start?"),
    );
    expect(screen.getAllByText(generateName(HOME_ADDRESS)).length).toBeGreaterThan(0);
    expect(screen.getAllByText(generateName(AWAY_ADDRESS)).length).toBeGreaterThan(0);
  });

  it("auto-reveals the target match when launched from play match", () => {
    vi.mocked(useQuery).mockReturnValue({
      status: "success",
      data: {
        playedMatches: [
          {
            id: "17",
            matchId: "17",
            homeScore: 3,
            awayScore: 1,
            blockTimestamp: "1714300000",
            homeAddress: HOME_ADDRESS,
            awayAddress: AWAY_ADDRESS,
            homeAttackingPlayers: ["1", "0", "2"],
            homeMidfieldPlayers: ["0", "3", "0"],
            homeDefensivePlayers: ["4", "0", "5"],
            awayAttackingPlayers: ["6", "0", "7"],
            awayMidfieldPlayers: ["0", "8", "0"],
            awayDefensivePlayers: ["9", "0", "10"],
            playerScoreds: [{ playerId: "9", goalOrder: 1 }],
          },
        ],
      },
    } as never);

    renderShowMatches("/games/recent?matchId=17&autoplay=1");

    expect(screen.queryByText(/replay hidden until reveal/i)).not.toBeInTheDocument();
    expect(screen.getByText(/match replay/i)).toBeInTheDocument();
  });
});
