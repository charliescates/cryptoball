import { request } from 'graphql-request'
import { MARKET_SUBGRAPH_URL as RESOLVED_MARKET_SUBGRAPH_URL } from "../../config/subgraphs"

export const MARKET_SUBGRAPH_URL = RESOLVED_MARKET_SUBGRAPH_URL

const LOCAL_MARKET_SUBGRAPH_URL = (
  import.meta.env.VITE_LOCAL_MARKET_SUBGRAPH_URL ?? 'http://127.0.0.1:8000/subgraphs/name/cryptoball-market'
).trim()

export type Listing = {
  id: string
  listingId: bigint
  seller: `0x${string}`
  tokenId: bigint
  buyNowPrice: bigint
  minBid: bigint
  highestBid: bigint
  highestBidder: `0x${string}`
  active: boolean
}

export type SubgraphListing = {
  id: string
  listingId: string
  seller: string
  tokenId: string
  buyNowPrice: string
  minBid: string
  highestBid: string
  highestBidder: string
  active: boolean
}

export function getGraphHeaders() {
  const apiKey = import.meta.env.VITE_GRAPH_API_KEY as string | undefined
  return apiKey ? ({ Authorization: `Bearer ${apiKey}` } as Record<string, string>) : undefined
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message
  }

  return String(error)
}

function shouldRetryAgainstLocal(error: unknown) {
  const message = getErrorMessage(error).toLowerCase()

  return (
    message.includes('deployment') ||
    message.includes('does not exist') ||
    message.includes('not found') ||
    message.includes('failed to fetch')
  )
}

export async function requestMarketSubgraph<TResponse>(
  query: string,
  variables?: Record<string, unknown>,
): Promise<TResponse> {
  const headers = getGraphHeaders()

  try {
    return await request<TResponse>(
      MARKET_SUBGRAPH_URL,
      query,
      variables,
      headers,
    )
  } catch (error) {
    if (
      MARKET_SUBGRAPH_URL === LOCAL_MARKET_SUBGRAPH_URL ||
      !shouldRetryAgainstLocal(error)
    ) {
      throw error
    }

    return request<TResponse>(
      LOCAL_MARKET_SUBGRAPH_URL,
      query,
      variables,
    )
  }
}

export function mapListing(l: SubgraphListing): Listing {
  return {
    id: l.id,
    listingId: BigInt(l.listingId),
    seller: l.seller as `0x${string}`,
    tokenId: BigInt(l.tokenId),
    buyNowPrice: BigInt(l.buyNowPrice),
    minBid: BigInt(l.minBid),
    highestBid: BigInt(l.highestBid),
    highestBidder: l.highestBidder as `0x${string}`,
    active: l.active,
  }
}
