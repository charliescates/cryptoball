import { request, gql } from 'graphql-request'
import { matchResultsHeaders, matchResultsUrl } from './matchResultsQuery'
import { TOURNAMENTS_SUBGRAPH_URL } from '../../config/subgraphs'

export type SubgraphTournamentCreated = {
  id: string
  tournamentId: string
  creator: string
  name: string
  rounds: number
  entryFee: string
  minAttack?: number
  minDefence?: number
  maxAttack?: number
  maxDefence?: number
  includeTypes?: number[]
  excludeTypes?: number[]
  blockNumber?: string
  blockTimestamp?: string
  transactionHash?: string
}

export type SubgraphTeamEntered = {
  id: string
  tournamentId: string
  player: string
  teamsEntered: number
  blockNumber: string
  blockTimestamp: string
  transactionHash: string
}

export type SubgraphTournamentMatchStarted = {
  id: string
  tournamentId: string
  tournamentMatchId: string
  round: number
  homeAddress: string
  awayAddress: string
  blockNumber: string
  blockTimestamp: string
  transactionHash: string
}

export type SubgraphTournamentCompleted = {
  id: string
  tournamentId: string
  champion: string
  championWinnings: string
  executorFees: string
  blockNumber: string
  blockTimestamp: string
  transactionHash: string
}

export type SubgraphTournamentRoundAdvanced = {
  id: string
  tournamentId: string
  completedRound: number
  nextRound: number
  teamsRemaining: number
  blockNumber: string
  blockTimestamp: string
  transactionHash: string
}

export type SubgraphTournamentReady = {
  id: string
  tournamentId: string
  teamsCount: number
  blockNumber: string
  blockTimestamp: string
  transactionHash: string
}

export type SubgraphTournamentCancelled = {
  id: string
  tournamentId: string
  cancelledBy: string
  blockNumber: string
  blockTimestamp: string
  transactionHash: string
}

export type SubgraphTournamentEntryRefunded = {
  id: string
  tournamentId: string
  entrant: string
  amount: string
  blockNumber: string
  blockTimestamp: string
  transactionHash: string
}

export type SubgraphTournamentRewardClaimed = {
  id: string
  tournamentId: string
  champion: string
  amount: string
  blockNumber: string
  blockTimestamp: string
  transactionHash: string
}

export type SubgraphTournamentExecutorCompensated = {
  id: string
  tournamentId: string
  executor: string
  executorFee: string
  blockNumber: string
  blockTimestamp: string
  transactionHash: string
}

export type SubgraphTournamentMatchPlayed = {
  id: string
  tournamentId: string
  tournamentMatchId: string
  round: number
  homeAddress: string
  awayAddress: string
  winner: string
  homeScore: number
  awayScore: number
  blockNumber: string
  blockTimestamp: string
  transactionHash: string
}

export function getGraphHeaders() {
  const apiKey = import.meta.env.VITE_GRAPH_API_KEY as string | undefined
  return apiKey ? ({ Authorization: `Bearer ${apiKey}` } as Record<string, string>) : undefined
}

const QUERY_ALL_TOURNAMENTS = gql`
  query GetAllTournaments {
    tournementCreateds(first: 1000, orderBy: tournamentId, orderDirection: desc) {
      id
      tournamentId
      creator
      name
      rounds
      entryFee
      minAttack
      minDefence
      maxAttack
      maxDefence
      includeTypes
      excludeTypes
      blockNumber
      blockTimestamp
      transactionHash
    }
    teamEntereds(first: 1000, orderBy: blockNumber, orderDirection: desc) {
      id
      tournamentId
      player
      teamsEntered
      blockNumber
      blockTimestamp
      transactionHash
    }
    tournementMatchStarteds(first: 1000, orderBy: blockNumber, orderDirection: desc) {
      id
      tournamentId
      tournamentMatchId
      round
      homeAddress
      awayAddress
      blockNumber
      blockTimestamp
      transactionHash
    }
    tournementCompleteds(first: 1000, orderBy: blockNumber, orderDirection: desc) {
      id
      tournamentId
      champion
      championWinnings
      executorFees
      blockNumber
      blockTimestamp
      transactionHash
    }
    tournementRoundAdvanceds(first: 1000, orderBy: blockNumber, orderDirection: desc) {
      id
      tournamentId
      completedRound
      nextRound
      teamsRemaining
      blockNumber
      blockTimestamp
      transactionHash
    }
    tournementReadies(first: 1000, orderBy: blockNumber, orderDirection: desc) {
      id
      tournamentId
      teamsCount
      blockNumber
      blockTimestamp
      transactionHash
    }
    tournementCancelleds(first: 1000, orderBy: blockNumber, orderDirection: desc) {
      id
      tournamentId
      cancelledBy
      blockNumber
      blockTimestamp
      transactionHash
    }
    tournementEntryRefundeds(first: 1000, orderBy: blockNumber, orderDirection: desc) {
      id
      tournamentId
      entrant
      amount
      blockNumber
      blockTimestamp
      transactionHash
    }
    tournementRewardClaimeds(first: 1000, orderBy: blockNumber, orderDirection: desc) {
      id
      tournamentId
      champion
      amount
      blockNumber
      blockTimestamp
      transactionHash
    }
    tournementExecutorCompensateds(first: 1000, orderBy: blockNumber, orderDirection: desc) {
      id
      tournamentId
      executor
      executorFee
      blockNumber
      blockTimestamp
      transactionHash
    }
  }
`

const QUERY_TOURNAMENT_MATCH_RESULTS = gql`
  query GetTournamentMatchResults {
    tournamentMatchPlayeds(first: 2000, orderBy: blockNumber, orderDirection: desc) {
      id
      tournamentId
      tournamentMatchId
      round
      homeAddress
      awayAddress
      winner
      homeScore
      awayScore
      blockNumber
      blockTimestamp
      transactionHash
    }
  }
`

export async function fetchTournamentsFromSubgraph() {
  try {
    console.log('Fetching tournaments from subgraph:', TOURNAMENTS_SUBGRAPH_URL)
    const data = await request<{
      tournementCreateds: SubgraphTournamentCreated[]
      teamEntereds: SubgraphTeamEntered[]
      tournementMatchStarteds: SubgraphTournamentMatchStarted[]
      tournementCompleteds: SubgraphTournamentCompleted[]
      tournementRoundAdvanceds: SubgraphTournamentRoundAdvanced[]
      tournementReadies: SubgraphTournamentReady[]
      tournementCancelleds: SubgraphTournamentCancelled[]
      tournementEntryRefundeds: SubgraphTournamentEntryRefunded[]
      tournementRewardClaimeds: SubgraphTournamentRewardClaimed[]
      tournementExecutorCompensateds: SubgraphTournamentExecutorCompensated[]
    }>(TOURNAMENTS_SUBGRAPH_URL, QUERY_ALL_TOURNAMENTS, {}, getGraphHeaders())

    console.log('Tournaments subgraph response:', data)
    return data
  } catch (error) {
    console.error('Error fetching tournaments from subgraph:', error)
    throw error
  }
}

export async function fetchTournamentMatchResultsFromSubgraph() {
  try {
    const data = await request<{
      tournamentMatchPlayeds: SubgraphTournamentMatchPlayed[]
    }>(matchResultsUrl, QUERY_TOURNAMENT_MATCH_RESULTS, {}, matchResultsHeaders)
    return data
  } catch (error) {
    console.error('Error fetching tournament match results from subgraph:', error)
    throw error
  }
}
