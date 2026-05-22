import { request, gql } from 'graphql-request'

// Update this URL with your actual deployed subgraph URL
// Find it in your .env.local as VITE_TOURNAMENTS_SUBGRAPH_URL
// Or after deploying: graph deploy --node https://api.studio.thegraph.com/deploy/ tournements
export const TOURNAMENTS_SUBGRAPH_URL =
  import.meta.env.VITE_TOURNAMENTS_SUBGRAPH_URL ||
  'https://api.studio.thegraph.com/query/1747934/tournements/version/latest'

export type SubgraphTournamentCreated = {
  id: string
  tournementId: string
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

export type SubgraphTournamentMatchStarted = {
  id: string
  tournementId: string
  round: number
  homeAddress: string
  awayAddress: string
  blockNumber: string
  blockTimestamp: string
  transactionHash: string
}

export type SubgraphTournamentCompleted = {
  id: string
  tournementId: string
  champion: string
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
    tournementCreateds(first: 1000, orderBy: tournementId, orderDirection: desc) {
      id
      tournementId
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
    tournementMatchStarteds(first: 1000, orderBy: blockNumber, orderDirection: desc) {
      id
      tournementId
      round
      homeAddress
      awayAddress
      blockNumber
      blockTimestamp
      transactionHash
    }
    tournementCompleteds(first: 1000, orderBy: blockNumber, orderDirection: desc) {
      id
      tournementId
      champion
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
      tournementMatchStarteds: SubgraphTournamentMatchStarted[]
      tournementCompleteds: SubgraphTournamentCompleted[]
    }>(TOURNAMENTS_SUBGRAPH_URL, QUERY_ALL_TOURNAMENTS, {}, getGraphHeaders())

    console.log('Tournaments subgraph response:', data)
    return data
  } catch (error) {
    console.error('Error fetching tournaments from subgraph:', error)
    throw error
  }
}
