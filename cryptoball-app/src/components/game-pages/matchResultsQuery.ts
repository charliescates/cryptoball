import { gql } from "graphql-request";

export type PlayerScored = {
  playerId: string;
  goalOrder: number;
};

export type PlayerMatchInfo = {
  playerId: string;
  owner: string;
  attack: string;
  defense: string;
  potential: string;
  gamesLeft: string;
  goals: string;
  playerType: number;
  position: string;
};

export type TeamStatsCalculated = {
  team: string;
  totalAttack: string;
  totalDefense: string;
};

export type PlayerStatsUpdated = {
  playerId: string;
  position: string;
};

export type WinningsDistributed = {
  winner: string;
  winnings: string;
  academy: string;
  academyShare: string;
  executor: string;
  executorFee: string;
};

export type ExtraTimePlayed = {
  homeScore: number;
  awayScore: number;
};

export type GoldenGoalPlayed = {
  homeScore: number;
  awayScore: number;
};

export type PlayedMatch = {
  id: string;
  matchId: string;
  pot?: string;
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
  playerMatchInfos?: PlayerMatchInfo[];
  teamStatsCalculateds?: TeamStatsCalculated[];
  playerStatsUpdateds?: PlayerStatsUpdated[];
  winningsDistributeds?: WinningsDistributed[];
  extraTimePlayeds?: ExtraTimePlayed[];
  goldenGoalPlayeds?: GoldenGoalPlayed[];
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
  playerScoreds(orderBy: goalOrder, orderDirection: asc) {
    playerId
    goalOrder
  }
  playerMatchInfos(orderBy: blockTimestamp, orderDirection: asc) {
    playerId
    owner
    attack
    defense
    potential
    gamesLeft
    goals
    playerType
    position
  }
  teamStatsCalculateds(orderBy: blockTimestamp, orderDirection: asc) {
    team
    totalAttack
    totalDefense
  }
  playerStatsUpdateds(orderBy: blockTimestamp, orderDirection: asc) {
    playerId
    position
  }
  winningsDistributeds(orderBy: blockTimestamp, orderDirection: asc) {
    winner
    winnings
    academy
    academyShare
    executor
    executorFee
  }
  extraTimePlayeds(orderBy: blockTimestamp, orderDirection: asc) {
    homeScore
    awayScore
  }
  goldenGoalPlayeds(orderBy: blockTimestamp, orderDirection: asc) {
    homeScore
    awayScore
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

export const myMatchesQuery = gql`
  query MyMatches($address: Bytes!) {
    playedMatches(
      first: 20
      orderBy: blockTimestamp
      orderDirection: desc
      where: { or: [{ homeAddress: $address }, { awayAddress: $address }] }
    ) {
      ${playedMatchFields}
    }
  }
`;

export const matchResultsUrl = "https://api.studio.thegraph.com/query/1747934/match-results/version/latest";
const graphApiKey = import.meta.env.VITE_GRAPH_API_KEY;
export const matchResultsHeaders = graphApiKey ? { Authorization: `Bearer ${graphApiKey}` } : undefined;
