import { gql } from "graphql-request"

const goalScoreerQuery = gql`
  query MyInactiveListings($seller: Bytes!) {
    listings(
      where: { active: false, seller: $seller }
      orderBy: blockTimestamp
      orderDirection: desc
      first: 60
    ) {
      id
      listingId
      seller
      tokenId
      buyNowPrice
      minBid
      highestBid
      highestBidder
      active
    }
  }
`

export async function getTopGoalScorers<TResponse>(
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