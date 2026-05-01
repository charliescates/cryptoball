import { gql } from "graphql-request";

export type PlayerScored = {
  playerId: string;
  goalOrder: number;
};

export type PlayedMatch = {
  id: string;
  matchId: string;
  homeScore: number;
  awayScore: number;
  blockTimestamp: string;
  homeAddress: string;
  awayAddress: string;
  homeAttackingPlayers: string[];
  homeMidfieldPlayers: string[];
  homeDefensivePlayers: string[];
  awayAttackingPlayers: string[];
  awayMidfieldPlayers: string[];
  awayDefensivePlayers: string[];
  playerScoreds: PlayerScored[];
};

export type MatchesResponse = {
  playedMatches: PlayedMatch[];
};

const playedMatchFields = `
  id
  matchId
  homeScore
  awayScore
  blockTimestamp
  homeAddress
  awayAddress
  homeAttackingPlayers
  homeMidfieldPlayers
  homeDefensivePlayers
  awayAttackingPlayers
  awayMidfieldPlayers
  awayDefensivePlayers
  playerScoreds {
    playerId
    goalOrder
  }
`;

export const recentMatchesQuery = gql`
  {
    playedMatches(first: 5, orderBy: blockTimestamp, orderDirection: desc) {
      ${playedMatchFields}
    }
  }
`;

export const playedMatchByMatchIdQuery = gql`
  query PlayedMatchByMatchId($matchId: String!) {
    playedMatches(first: 1, where: { matchId: $matchId }) {
      ${playedMatchFields}
    }
  }
`;

export const matchResultsUrl = "https://api.studio.thegraph.com/query/1747934/match-results/version/latest";
const graphApiKey = import.meta.env.VITE_GRAPH_API_KEY;
export const matchResultsHeaders = graphApiKey ? { Authorization: `Bearer ${graphApiKey}` } : undefined;
