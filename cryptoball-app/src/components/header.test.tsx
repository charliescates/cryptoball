import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";

import Header from "./header";
import { activeChain } from "../config/network";

const connectSpy = vi.fn();
const disconnectSpy = vi.fn();
const switchChainSpy = vi.fn();

vi.mock("wagmi", () => ({
  useAccount: () => ({ status: "connected", chainId: activeChain.id, address: "0x1111111111111111111111111111111111111111" }),
  useConnect: () => ({
    connectors: [
      { name: "MetaMask", uid: "mask" },
      { name: "Rainbow", uid: "rainbow" },
    ],
    connect: connectSpy,
    error: undefined,
  }),
  useDisconnect: () => ({ disconnect: disconnectSpy }),
  useSwitchChain: () => ({
    switchChain: switchChainSpy,
    error: undefined,
    isPending: false,
  }),
}));

describe("Header", () => {
  it("toggles navigation and exposes wallet actions", async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <Header />
      </MemoryRouter>,
    );

    expect(screen.getByText("CryptoBalls")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /toggle menu/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /disconnect/i })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /toggle menu/i }));

    expect(screen.getByRole("link", { name: /squad/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /tournaments/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /disconnect/i })).toBeInTheDocument();
  });
});
