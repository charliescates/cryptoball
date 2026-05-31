import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { gql, request } from 'graphql-request'
import { formatEther } from 'viem'
import { useAccount, useReadContract, useWaitForTransactionReceipt, useWriteContract } from 'wagmi'
import { marketContract } from '../../contracts/marketContract'
import { activeChain } from '../../config/network'
import { nativeTokenSymbol } from '../../config/network'
import { getPlayerName } from '../utils/playerName'
import { MARKET_SUBGRAPH_URL, getGraphHeaders, mapListing, type Listing, type SubgraphListing } from './marketSubgraph'
import ListingPlayerInfo from './ListingPlayerInfo'

const ACTIVE_BIDS_QUERY = gql`
  query ActiveBids($bidder: Bytes!) {
    listings(
      where: { active: true, highestBidder: $bidder }
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

type ActiveBidsQueryResponse = {
  listings: SubgraphListing[]
}

type ListingTuple = [string, bigint, bigint, bigint, bigint, string, bigint, boolean]

function ActiveBidCard({
  listing,
  onAction,
  onWithdrawSuccess,
}: {
  listing: Listing
  onAction: () => void
  onWithdrawSuccess: (message: string) => void
}) {
  const { data: rawListing } = useReadContract({
    address: marketContract.address,
    abi: marketContract.abi,
    functionName: 'listings',
    args: [listing.listingId],
  })

  const listingOnChain = rawListing as ListingTuple | undefined
  const endTime = listingOnChain?.[6] ?? 0n
  const stillActive = listingOnChain?.[7] ?? listing.active
  const isEnded = Number(endTime) > 0 && Number(endTime) <= Math.floor(Date.now() / 1000)

  const {
    data: finalizeHash,
    isPending: isFinalizePending,
    writeContract,
    reset,
  } = useWriteContract()

  const { isLoading: isFinalizeConfirming, isSuccess: isFinalizeConfirmed } = useWaitForTransactionReceipt({
    hash: finalizeHash,
  })

  useEffect(() => {
    if (!isFinalizeConfirmed) return
    onWithdrawSuccess('Player claimed successfully. Check your Squad view in a few seconds.')
    onAction()
  }, [isFinalizeConfirmed, onAction, onWithdrawSuccess])

  function handleWithdrawPlayer() {
    reset()
    writeContract({
      address: marketContract.address,
      abi: marketContract.abi,
      functionName: 'finalize',
      chainId: activeChain.id,
      args: [listing.listingId],
    })
  }

  return (
    <li className="market-listing-card">
      <div className="market-listing-header">
        <span className="market-listing-player">{getPlayerName(listing.tokenId)}</span>
        <span className="market-listing-status">
          {isEnded ? (stillActive ? 'Ended - Claim Ready' : 'Settled') : 'Winning'}
        </span>
      </div>

      <ListingPlayerInfo tokenId={listing.tokenId} />

      <dl className="market-listing-details">
        <div>
          <dt>Listing</dt>
          <dd>#{listing.listingId.toString()}</dd>
        </div>
        <div>
          <dt>Your Bid</dt>
          <dd>{formatEther(listing.highestBid)} {nativeTokenSymbol}</dd>
        </div>
        <div>
          <dt>Buy Now</dt>
          <dd>{formatEther(listing.buyNowPrice)} {nativeTokenSymbol}</dd>
        </div>
      </dl>

      {isEnded && stillActive && (
        <button
          className="market-btn market-btn--finalize"
          type="button"
          onClick={handleWithdrawPlayer}
          disabled={isFinalizePending || isFinalizeConfirming}
        >
          {isFinalizePending || isFinalizeConfirming ? 'Claiming Player...' : 'Claim Player'}
        </button>
      )}
    </li>
  )
}

export default function ActiveBidsTab() {
  const { address } = useAccount()
  const headers = getGraphHeaders()
  const [withdrawSuccessMessage, setWithdrawSuccessMessage] = useState<string | null>(null)

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['market-active-bids', address?.toLowerCase()],
    enabled: !!address,
    queryFn: () =>
      request<ActiveBidsQueryResponse>(
        MARKET_SUBGRAPH_URL,
        ACTIVE_BIDS_QUERY,
        { bidder: address?.toLowerCase() },
        headers,
      ),
    refetchInterval: 30_000,
  })

  if (!address) {
    return <p className="market-empty">Connect your wallet to view your active bids.</p>
  }

  if (isLoading) return <p className="market-empty">Loading your active bids...</p>
  if (error) return <p className="market-empty">Failed to load active bids.</p>

  const activeBids = (data?.listings ?? []).map(mapListing)

  if (activeBids.length === 0) {
    return (
      <>
        {withdrawSuccessMessage && (
          <p className="market-step-label" role="status">{withdrawSuccessMessage}</p>
        )}
        <p className="market-empty">You are not currently the highest bidder on any active listing.</p>
      </>
    )
  }

  return (
    <section className="market-activity-section" aria-label="Listings where you are currently winning">
      <h3>Active Bids</h3>
      {withdrawSuccessMessage && (
        <p className="market-step-label" role="status">{withdrawSuccessMessage}</p>
      )}
      <ul className="market-listings-grid" aria-label="Listings where you are currently highest bidder">
        {activeBids.map((listing) => (
          <ActiveBidCard
            key={listing.id}
            listing={listing}
            onAction={refetch}
            onWithdrawSuccess={setWithdrawSuccessMessage}
          />
        ))}
      </ul>
    </section>
  )
}
