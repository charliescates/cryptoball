import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { gql } from 'graphql-request'
import { formatEther, zeroAddress } from 'viem'
import { useAccount, useReadContract, useWaitForTransactionReceipt, useWriteContract } from 'wagmi'
import { marketContract } from '../../contracts/marketContract'
import { activeChain } from '../../config/network'
import { nativeTokenSymbol } from '../../config/network'
import { getPlayerName } from '../utils/playerName'
import ListingCard from './ListingCard'
import { mapListing, requestMarketSubgraph, type SubgraphListing } from './marketSubgraph'

const SELLING_QUERY = gql`
  query SellingListings($seller: Bytes!) {
    activeListings: listings(
      where: { active: true, seller: $seller }
      orderBy: blockTimestamp
      orderDirection: desc
      first: 30
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
    closedListings: listings(
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
    boughtNows(orderBy: blockTimestamp, orderDirection: desc, first: 1000) {
      listingId
      price
    }
  }
`

type SellingQueryResponse = {
  activeListings: SubgraphListing[]
  closedListings: SubgraphListing[]
  boughtNows: Array<{
    listingId: string
    price: string
  }>
}

export default function SellingTab() {
  const { address } = useAccount()
  const [withdrawSuccessMessage, setWithdrawSuccessMessage] = useState<string | null>(null)

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['market-selling', address?.toLowerCase()],
    enabled: !!address,
    queryFn: () =>
      requestMarketSubgraph<SellingQueryResponse>(
        SELLING_QUERY,
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
    setWithdrawSuccessMessage('Withdraw successful. Funds are now in your wallet.')
    void refetchPending()
    void refetch()
  }, [isWithdrawConfirmed, refetchPending, refetch])

  function handleWithdrawFunds() {
    setWithdrawSuccessMessage(null)
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
    return <p className="market-empty">Connect your wallet to manage your selling activity.</p>
  }

  if (isLoading) return <p className="market-empty">Loading your selling activity...</p>
  if (error) return <p className="market-empty">Failed to load selling activity.</p>

  const activeListings = (data?.activeListings ?? []).map(mapListing)
  const closedListings = (data?.closedListings ?? []).map(mapListing)
  const boughtNowByListingId = new Map(
    (data?.boughtNows ?? []).map((entry) => [entry.listingId, BigInt(entry.price)]),
  )

  return (
    <div className="market-activity-layout">
      <div className="market-withdraw-amount">
        <span>Available to withdraw</span>
        <strong>{formatEther(pendingAmount)} {nativeTokenSymbol}</strong>
      </div>

      <button
        className="market-btn market-btn--primary"
        type="button"
        onClick={handleWithdrawFunds}
        disabled={pendingAmount === 0n || isWithdrawPending || isWithdrawConfirming}
      >
        {isWithdrawPending || isWithdrawConfirming ? 'Withdrawing...' : 'Withdraw Funds'}
      </button>

      {withdrawSuccessMessage && (
        <p className="market-step-label" role="status">{withdrawSuccessMessage}</p>
      )}

      <section className="market-activity-section" aria-label="Your active listings">
        <h3>Active Listings</h3>
        {activeListings.length === 0 ? (
          <p className="market-empty">You do not have any active listings right now.</p>
        ) : (
          <ul className="market-listings-grid" aria-label="Your active listings">
            {activeListings.map((listing) => (
              <ListingCard key={listing.id} listing={listing} onAction={refetch} />
            ))}
          </ul>
        )}
      </section>

      <section className="market-activity-section" aria-label="Your closed listings">
        <h3>Sold and Closed Listings</h3>
        {closedListings.length === 0 ? (
          <p className="market-empty">No sold or closed listings found for this wallet yet.</p>
        ) : (
          <ul className="market-listings-grid" aria-label="Your sold and closed listings">
            {closedListings.map((listing) => {
              const boughtNowPrice = boughtNowByListingId.get(listing.listingId.toString())
              const settlementValue = boughtNowPrice ?? (listing.highestBid > 0n ? listing.highestBid : listing.buyNowPrice)

              return (
                <li key={listing.id} className="market-listing-card">
                  <div className="market-listing-header">
                    <span className="market-listing-player">{getPlayerName(listing.tokenId)}</span>
                    <span className="market-listing-status">Closed</span>
                  </div>

                  <dl className="market-listing-details">
                    <div>
                      <dt>Listing</dt>
                      <dd>#{listing.listingId.toString()}</dd>
                    </div>
                    <div>
                      <dt>Token</dt>
                      <dd>#{listing.tokenId.toString()}</dd>
                    </div>
                    <div>
                      <dt>Buy Now</dt>
                      <dd>{formatEther(listing.buyNowPrice)} {nativeTokenSymbol}</dd>
                    </div>
                    <div>
                      <dt>{boughtNowPrice ? 'Bought For' : 'Final Bid'}</dt>
                      <dd>
                        {boughtNowPrice
                          ? `${formatEther(boughtNowPrice)} ${nativeTokenSymbol}`
                          : listing.highestBid > 0n
                            ? `${formatEther(listing.highestBid)} ${nativeTokenSymbol}`
                            : 'No bids'}
                      </dd>
                    </div>
                    {!boughtNowPrice && (
                      <div>
                        <dt>Settlement Value</dt>
                        <dd>{formatEther(settlementValue)} {nativeTokenSymbol}</dd>
                      </div>
                    )}
                  </dl>
                </li>
              )
            })}
          </ul>
        )}
      </section>
    </div>
  )
}
