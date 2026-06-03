import { MARKET_SUBGRAPH_URL as RESOLVED_MARKET_SUBGRAPH_URL } from "../../config/subgraphs"

export const MARKET_SUBGRAPH_URL = RESOLVED_MARKET_SUBGRAPH_URL

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
