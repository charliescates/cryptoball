import { useQuery } from '@tanstack/react-query'
import { gql, request } from 'graphql-request'
import { useAccount } from 'wagmi'
import ListingCard from './ListingCard'
import { MARKET_SUBGRAPH_URL, getGraphHeaders, mapListing, type SubgraphListing } from './marketSubgraph'

const MY_ACTIVE_LISTINGS_QUERY = gql`
  query MyActiveListings($seller: Bytes!) {
    listings(
      where: { active: true, seller: $seller }
      orderBy: blockTimestamp
      orderDirection: desc
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

export default function MyListingsTab() {
  const { address } = useAccount()
  const headers = getGraphHeaders()

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['market-my-listings', address?.toLowerCase()],
    enabled: !!address,
    queryFn: () =>
      request<{ listings: SubgraphListing[] }>(
        MARKET_SUBGRAPH_URL,
        MY_ACTIVE_LISTINGS_QUERY,
        { seller: address?.toLowerCase() },
        headers,
      ),
    refetchInterval: 30_000,
  })

  if (!address) {
    return <p className="market-empty">Connect your wallet to view your active listings.</p>
  }

  if (isLoading) return <p className="market-empty">Loading your listings...</p>
  if (error) return <p className="market-empty">Failed to load your listings.</p>

  const listings = (data?.listings ?? []).map(mapListing)
  if (listings.length === 0) {
    return <p className="market-empty">You do not have any active listings right now.</p>
  }

  return (
    <ul className="market-listings-grid" aria-label="Your active listings">
      {listings.map((listing) => (
        <ListingCard key={listing.id} listing={listing} onAction={refetch} />
      ))}
    </ul>
  )
}
