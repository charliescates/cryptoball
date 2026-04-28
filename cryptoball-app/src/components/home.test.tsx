import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import Home from "./home";

vi.mock("wagmi", () => ({
  useAccount: vi.fn(),
  useReadContract: vi.fn(),
}));

vi.mock("./home/HomeDisconnected", () => ({
  default: () => <div>Disconnected State</div>,
}));

vi.mock("./home/WelcomeSection", () => ({
  default: () => <div>Welcome State</div>,
}));

vi.mock("./home/SquadDashboard", () => ({
  default: ({ playerCount }: { playerCount: number }) => <div>Dashboard {playerCount}</div>,
}));

const { useAccount, useReadContract } = await import("wagmi");

type MockAccount = {
  address?: string;
  isConnected: boolean;
};

type MockReadContractResult = {
  data: unknown;
};

describe("Home", () => {
  it("shows the disconnected state when the wallet is not connected", () => {
    vi.mocked(useAccount).mockReturnValue({ address: undefined, isConnected: false } as MockAccount as never);
    vi.mocked(useReadContract).mockReturnValue({ data: undefined } as MockReadContractResult as never);

    render(<Home />);

    expect(screen.getByText("Disconnected State")).toBeInTheDocument();
  });

  it("shows the welcome state for a connected wallet with no players", () => {
    vi.mocked(useAccount).mockReturnValue({ address: "0xabc", isConnected: true } as MockAccount as never);
    vi.mocked(useReadContract).mockReturnValue({ data: [] } as MockReadContractResult as never);

    render(<Home />);

    expect(screen.getByText("Welcome State")).toBeInTheDocument();
  });

  it("shows the dashboard when the wallet owns players", () => {
    vi.mocked(useAccount).mockReturnValue({ address: "0xabc", isConnected: true } as MockAccount as never);
    vi.mocked(useReadContract).mockReturnValue({ data: [{}, {}, {}] } as MockReadContractResult as never);

    render(<Home />);

    expect(screen.getByText("Dashboard 3")).toBeInTheDocument();
  });
});
