import { useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { gql } from 'graphql-request'
import { formatEther, zeroAddress } from 'viem'
import { useAccount, useReadContract, useWaitForTransactionReceipt, useWriteContract } from 'wagmi'
import { marketContract } from '../../contracts/marketContract'
import { activeChain } from '../../config/network'
import { nativeTokenSymbol } from '../../config/network'
import { getPlayerName } from '../utils/playerName'
import { isVisiblePlayerId } from '../utils/playerVisibility'
import { mapListing, requestMarketSubgraph, type Listing, type SubgraphListing } from './marketSubgraph'
import ListingPlayerInfo from './ListingPlayerInfo'

const MY_INACTIVE_LISTINGS_QUERY = gql`
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

function SoldItemCard({ listing }: { listing: Listing }) {
  const settlementValue = listing.highestBid > 0n ? listing.highestBid : listing.buyNowPrice

  return (
    <li className="market-listing-card">
      <div className="market-listing-header">
        <span className="market-listing-player">{getPlayerName(listing.tokenId)}</span>
        <span className="market-listing-status">Closed</span>
      </div>

      <ListingPlayerInfo tokenId={listing.tokenId} />

      <dl className="market-listing-details">
        <div>
          <dt>Listing</dt>
          <dd>#{listing.listingId.toString()}</dd>
        </div>
        <div>
          <dt>Buy Now</dt>
          <dd>{formatEther(listing.buyNowPrice)} {nativeTokenSymbol}</dd>
        </div>
        <div>
          <dt>Final Bid</dt>
          <dd>{listing.highestBid > 0n ? `${formatEther(listing.highestBid)} ${nativeTokenSymbol}` : 'No bids'}</dd>
        </div>
        <div>
          <dt>Settlement Value</dt>
          <dd>{formatEther(settlementValue)} {nativeTokenSymbol}</dd>
        </div>
      </dl>
    </li>
  )
}

export default function SoldItemsTab() {
  const { address } = useAccount()

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['market-my-sold-items', address?.toLowerCase()],
    enabled: !!address,
    queryFn: () =>
      requestMarketSubgraph<{ listings: SubgraphListing[] }>(
        MY_INACTIVE_LISTINGS_QUERY,
        { seller: address?.toLowerCase() },
      ),
    refetchInterval: 30_000,
  })

  const { data: pending, refetch: refetchPending } = useReadContract({
    address: marketContract.address,
    abi: marketContract.abi,
    functionName: 'pendingWithdrawals',
    args: [address ?? zeroAddress],
    query: { enabled: !!address },
  })

  const pendingAmount = (pending as bigint | undefined) ?? 0n

  const { data: withdrawHash, isPending: isWithdrawPending, writeContract, reset } = useWriteContract()
  const { isLoading: isWithdrawConfirming, isSuccess: isWithdrawConfirmed } = useWaitForTransactionReceipt({
    hash: withdrawHash,
  })

  useEffect(() => {
    if (!isWithdrawConfirmed) return
    void refetchPending()
    void refetch()
  }, [isWithdrawConfirmed, refetchPending, refetch])

  function handleWithdraw() {
    reset()
    writeContract({
      address: marketContract.address,
      abi: marketContract.abi,
      functionName: 'withdraw',
      chainId: activeChain.id,
      gas: 80_000n,
    })
  }

  if (!address) {
    return <p className="market-empty">Connect your wallet to view your sold items.</p>
  }

  if (isLoading) return <p className="market-empty">Loading your sold items...</p>
  if (error) return <p className="market-empty">Failed to load sold items.</p>

  const soldItems = (data?.listings ?? []).map(mapListing).filter((listing) => isVisiblePlayerId(listing.tokenId))

  return (
    <div className="market-activity-layout">
      <div className="market-withdraw-amount">
        <span>Available to withdraw</span>
        <strong>{formatEther(pendingAmount)} {nativeTokenSymbol}</strong>
      </div>

      <button
        className="market-btn market-btn--primary"
        type="button"
        onClick={handleWithdraw}
        disabled={pendingAmount === 0n || isWithdrawPending || isWithdrawConfirming}
      >
        {isWithdrawPending || isWithdrawConfirming ? 'Withdrawing...' : 'Withdraw Available Funds'}
      </button>

      {soldItems.length === 0 ? (
        <p className="market-empty">No sold or closed listings found for this wallet yet.</p>
      ) : (
        <section className="market-activity-section" aria-label="Sold and closed listings">
          <h3>Sold Items</h3>
          <ul className="market-listings-grid" aria-label="Your sold and closed listings">
            {soldItems.map((listing) => (
              <SoldItemCard key={listing.id} listing={listing} />
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}
