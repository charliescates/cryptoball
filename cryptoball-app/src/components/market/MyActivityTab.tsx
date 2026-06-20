import { useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { gql } from 'graphql-request'
import { formatEther, zeroAddress } from 'viem'
import { useAccount, useReadContract, useWaitForTransactionReceipt, useWriteContract } from 'wagmi'
import { marketContract } from '../../contracts/marketContract'
import { activeChain } from '../../config/network'
import { nativeTokenSymbol } from '../../config/network'
import { getPlayerName } from '../utils/playerName'
import { mapListing, requestMarketSubgraph, type SubgraphListing } from './marketSubgraph'

const MY_ACTIVITY_QUERY = gql`
  query MyActivity($buyer: Bytes!, $winner: Bytes!, $bidder: Bytes!) {
    boughtNows(where: { buyer: $buyer }, orderBy: blockTimestamp, orderDirection: desc, first: 30) {
      id
      listingId
      price
      blockTimestamp
    }
    finalizeds(where: { winner: $winner }, orderBy: blockTimestamp, orderDirection: desc, first: 30) {
      id
      listingId
      amount
      blockTimestamp
    }
    winningListings: listings(
      where: { active: true, highestBidder: $bidder }
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
  }
`

type BuyNowRow = {
  id: string
  listingId: string
  price: string
  blockTimestamp: string
}

type FinalizedRow = {
  id: string
  listingId: string
  amount: string
  blockTimestamp: string
}

type ActivityResponse = {
  boughtNows: BuyNowRow[]
  finalizeds: FinalizedRow[]
  winningListings: SubgraphListing[]
}

function toDateLabel(unixSeconds: string) {
  const epochMs = Number(unixSeconds) * 1000
  if (Number.isNaN(epochMs)) return 'Unknown time'
  return new Date(epochMs).toLocaleString()
}

export default function MyActivityTab() {
  const { address } = useAccount()

  const { data, isLoading, error, refetch: refetchActivity } = useQuery({
    queryKey: ['market-my-activity', address?.toLowerCase()],
    enabled: !!address,
    queryFn: () =>
      requestMarketSubgraph<ActivityResponse>(
        MY_ACTIVITY_QUERY,
        {
          buyer: address?.toLowerCase(),
          winner: address?.toLowerCase(),
          bidder: address?.toLowerCase(),
        },
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
    void refetchActivity()
  }, [isWithdrawConfirmed, refetchActivity, refetchPending])

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
    return <p className="market-empty">Connect your wallet to view your market activity.</p>
  }

  if (isLoading) return <p className="market-empty">Loading your market activity...</p>
  if (error) return <p className="market-empty">Failed to load your market activity.</p>

  const boughtNowWins = data?.boughtNows ?? []
  const finalizedWins = data?.finalizeds ?? []
  const winningListings = (data?.winningListings ?? []).map(mapListing)

  const hasWins = boughtNowWins.length > 0 || finalizedWins.length > 0
  const hasWinning = winningListings.length > 0

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

      {!hasWins && !hasWinning && (
        <p className="market-empty">
          No active bids or wins found for this wallet. Any seller proceeds can still be withdrawn above.
        </p>
      )}

      {hasWinning && (
        <section className="market-activity-section" aria-label="Listings where you are currently winning">
          <h3>Currently Winning</h3>
          <ul className="market-listings-grid" aria-label="Listings where you are currently highest bidder">
            {winningListings.map((listing) => (
              <li key={`winning-${listing.id}`} className="market-listing-card">
                <div className="market-listing-header">
                  <span className="market-listing-player">{getPlayerName(listing.tokenId)}</span>
                  <span className="market-listing-status">Winning</span>
                </div>
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
              </li>
            ))}
          </ul>
        </section>
      )}

      {hasWins && (
        <section className="market-activity-section" aria-label="Listings you won">
          <h3>Won Listings</h3>
          <p className="market-step-label">
            Buy now and finalized auction wins transfer the player directly to your wallet. The withdraw button above is only for {nativeTokenSymbol} refunds/seller proceeds.
          </p>
          <ul className="market-activity-list" aria-label="Listings you won">
            {boughtNowWins.map((entry) => (
              <li key={`buy-now-${entry.id}`} className="market-activity-item">
                <div>
                  <strong>Buy Now Win • Listing #{entry.listingId}</strong>
                  <p>Paid {formatEther(BigInt(entry.price))} {nativeTokenSymbol} on {toDateLabel(entry.blockTimestamp)}</p>
                </div>
              </li>
            ))}

            {finalizedWins.map((entry) => (
              <li key={`finalized-${entry.id}`} className="market-activity-item">
                <div>
                  <strong>Auction Win • Listing #{entry.listingId}</strong>
                  <p>Finalized at {formatEther(BigInt(entry.amount))} {nativeTokenSymbol} on {toDateLabel(entry.blockTimestamp)}</p>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}
