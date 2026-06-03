type SubgraphSource = "local" | "prod";

const DEFAULT_SOURCE: SubgraphSource = "prod";

const rawSource = (import.meta.env.VITE_SUBGRAPH_SOURCE ?? DEFAULT_SOURCE).trim().toLowerCase();

export const subgraphSource: SubgraphSource = rawSource === "local" ? "local" : "prod";

const PROD_DEFAULTS = {
  market: "https://api.studio.thegraph.com/query/1747934/cryptoball-market/version/latest",
  matchResults: "https://api.studio.thegraph.com/query/1747934/match-results/version/latest",
  tournaments: "https://api.studio.thegraph.com/query/1747934/tournements/version/latest",
};

const LOCAL_DEFAULTS = {
  market: "http://127.0.0.1:8000/subgraphs/name/cryptoball-market",
  matchResults: "http://127.0.0.1:8000/subgraphs/name/match-results",
  tournaments: "http://127.0.0.1:8000/subgraphs/name/tournements",
};

const resolveSubgraphUrl = (key: keyof typeof PROD_DEFAULTS): string => {
  if (subgraphSource === "local") {
    const localOverrides: Record<keyof typeof LOCAL_DEFAULTS, string | undefined> = {
      market: import.meta.env.VITE_LOCAL_MARKET_SUBGRAPH_URL,
      matchResults: import.meta.env.VITE_LOCAL_MATCH_RESULTS_SUBGRAPH_URL,
      tournaments: import.meta.env.VITE_LOCAL_TOURNAMENTS_SUBGRAPH_URL,
    };

    return (localOverrides[key] ?? LOCAL_DEFAULTS[key]).trim();
  }

  const prodOverrides: Record<keyof typeof PROD_DEFAULTS, string | undefined> = {
    market: import.meta.env.VITE_MARKET_SUBGRAPH_URL,
    matchResults: import.meta.env.VITE_MATCH_RESULTS_SUBGRAPH_URL,
    tournaments: import.meta.env.VITE_TOURNAMENTS_SUBGRAPH_URL,
  };

  return (prodOverrides[key] ?? PROD_DEFAULTS[key]).trim();
};

export const MARKET_SUBGRAPH_URL = resolveSubgraphUrl("market");
export const MATCH_RESULTS_SUBGRAPH_URL = resolveSubgraphUrl("matchResults");
export const TOURNAMENTS_SUBGRAPH_URL = resolveSubgraphUrl("tournaments");
