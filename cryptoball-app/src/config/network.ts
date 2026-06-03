import { fallback, http, type Transport } from "wagmi";
import { hardhat, polygon } from "wagmi/chains";
import type { Chain } from "viem";

type SupportedNetwork = "polygon" | "localhost";
type ContractKey = "player" | "academy" | "game" | "market" | "tournement";

const DEFAULT_NETWORK: SupportedNetwork = "polygon";
const rawNetwork = (import.meta.env.VITE_APP_NETWORK ?? DEFAULT_NETWORK).trim().toLowerCase();

export const appNetwork: SupportedNetwork = rawNetwork === "localhost" ? "localhost" : "polygon";

const LOCALHOST_RPC_URL = (import.meta.env.VITE_LOCAL_RPC_URL ?? "http://127.0.0.1:8545").trim();
const DEFAULT_POLYGON_RPCS = [
  "https://polygon-bor-rpc.publicnode.com",
  "https://rpc.ankr.com/polygon",
  "https://polygon.llamarpc.com",
  "https://polygon.drpc.org",
];

export const activeChain: Chain =
  appNetwork === "localhost"
    ? {
        ...hardhat,
        rpcUrls: {
          default: { http: [LOCALHOST_RPC_URL] },
          public: { http: [LOCALHOST_RPC_URL] },
        },
      }
    : polygon;

export const nativeTokenSymbol = "POL";

export const getActiveTransport = (): Transport => {
  if (appNetwork === "localhost") {
    return http(LOCALHOST_RPC_URL);
  }

  return fallback(DEFAULT_POLYGON_RPCS.map((url) => http(url)), {
    rank: false,
  });
};

const configuredTournamentAddress =
  (import.meta.env.VITE_TOURNEMENT_CONTRACT_ADDRESS || import.meta.env.VITE_TOURNAMENT_CONTRACT_ADDRESS || "").trim();

const CONTRACT_ADDRESSES: Record<SupportedNetwork, Record<ContractKey, `0x${string}`>> = {
  polygon: {
    player: "0xDe2101ACc9e55c413579F97e8c81432F8cF490cE",
    academy: "0xb63FDBc4ab7751Ca9b9BED6bb2DDbB190cA0f001",
    game: "0xE6F5Bb7793eA55cf4F39b339D946745015Ab195B",
    market: "0x90Ddbe623970294089Ee58374d429702cF123A00",
    tournement: "0x306B81C762abB13cE1FB5eD9025a846c2C4a7381",
  },
  localhost: {
    // Hardhat default deterministic deployment addresses when deployed from account[0].
    player: "0xD0141E899a65C95a556fE2B27e5982A6DE7fDD7A",
    academy: "0x07882Ae1ecB7429a84f1D53048d35c4bB2056877",
    game: "0xfaAddC93baf78e89DCf37bA67943E1bE8F37Bb8c",
    market: "0x3aAde2dCD2Df6a8cAc689EE797591b2913658659",
    tournement: "0x3155755b79aA083bd953911C92705B7aA82a18F9",
  },
};

const getConfiguredAddress = (contract: ContractKey): `0x${string}` | undefined => {
  const envByContract: Partial<Record<ContractKey, string>> = {
    player: import.meta.env.VITE_PLAYER_CONTRACT_ADDRESS,
    academy: import.meta.env.VITE_ACADEMY_CONTRACT_ADDRESS,
    game: import.meta.env.VITE_GAME_CONTRACT_ADDRESS,
    market: import.meta.env.VITE_MARKET_CONTRACT_ADDRESS,
    tournement: configuredTournamentAddress || import.meta.env.VITE_TOURNEMENT_CONTRACT_ADDRESS,
  };

  const value = (envByContract[contract] || "").trim();
  return value ? (value as `0x${string}`) : undefined;
};

export const getContractAddress = (contract: ContractKey): `0x${string}` => {
  return getConfiguredAddress(contract) ?? CONTRACT_ADDRESSES[appNetwork][contract];
};
