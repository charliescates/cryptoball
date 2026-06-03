import { fallback, http, type Chain, type Transport } from "wagmi";
import { hardhat, polygon } from "wagmi/chains";

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

export const nativeTokenSymbol = appNetwork === "localhost" ? "ETH" : "POL";

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
    player: "0x818cAFC9e8AE9fa9b4503772AeF90b00adE9E027",
    academy: "0x9d3616fCC1b1f4FD0C24327Fc658Ee4969856582",
    game: "0x666FC08efB36D6BA99AD13Ef9df2aA3B2B566b53",
    market: "0x6baCaEFAc11828c3d5e80fCEaBf857530389e81a",
    tournement: "0x6284c72097953821C9B6b2467EDD84D211f3B562",
  },
  localhost: {
    // Hardhat default deterministic deployment addresses when deployed from account[0].
    player: "0x5FbDB2315678afecb367f032d93F642f64180aa3",
    academy: "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512",
    game: "0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9",
    market: "0x610178dA211FEF7D417bC0e6FeD39F05609AD788",
    tournement: "0xa513E6E4b8f2a923D98304ec87F64353C4D5C853",
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
