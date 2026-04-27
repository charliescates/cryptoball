import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import ShowMatches from "./show-matches";

vi.mock("wagmi", () => ({
  useAccount: vi.fn(),
  useReadContract: vi.fn(),
  useWatchContractEvent: vi.fn(),
}));

vi.mock("@tanstack/react-query", () => ({
  useQuery: vi.fn(),
}));

vi.mock("graphql-request", () => ({
  gql: (strings: TemplateStringsArray) => strings[0],
  request: vi.fn(),
}));

vi.mock("react-dnd", () => ({
  DndProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock("react-dnd-html5-backend", () => ({
  HTML5Backend: {},
}));

const { useQuery } = await import("@tanstack/react-query");

describe("ShowMatches", () => {
  it("shows loading, error, and success states", () => {
    vi.mocked(useQuery).mockReturnValueOnce({ status: "pending" } as never);

    const { rerender } = render(<ShowMatches />);
    expect(screen.getByText("Loading...")).toBeInTheDocument();

    vi.mocked(useQuery).mockReturnValueOnce({ status: "error" } as never);
    rerender(<ShowMatches />);
    expect(screen.getByText(/error ocurred querying the subgraph/i)).toBeInTheDocument();

    vi.mocked(useQuery).mockReturnValueOnce({ status: "success", data: { matchPlayeds: [], newMatches: [] } } as never);
    rerender(<ShowMatches />);
    expect(screen.getByText(/"matchPlayeds":\[\]/i)).toBeInTheDocument();
  });
});
