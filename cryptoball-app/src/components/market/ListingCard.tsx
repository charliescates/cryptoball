import { useEffect, useState } from 'react'
import { BaseError, formatEther, parseEther, zeroAddress } from 'viem'
import { useAccount, useReadContract, useWaitForTransactionReceipt, useWriteContract } from 'wagmi'
import { marketContract } from '../../contracts/marketContract'
import { activeChain } from '../../config/network'
import { nativeTokenSymbol } from '../../config/network'
import { getPlayerName } from '../utils/playerName'
import generateName from '../utils/teamName'
import ListingPlayerInfo from './ListingPlayerInfo'
import type { Listing } from './marketSubgraph'
import type { RawPlayer } from './ListingPlayerInfo'

type Props = {
  listing: Listing
  onAction: () => void
  playerData?: RawPlayer
}

type ListingTuple = [string, bigint, bigint, bigint, bigint, string, bigint, boolean]

function formatCountdown(endTime: bigint) {
  const remaining = Number(endTime) - Math.floor(Date.now() / 1000)
  if (remaining <= 0) return 'Ended'
  const d = Math.floor(remaining / 86400)
  const h = Math.floor((remaining % 86400) / 3600)
  const m = Math.floor((remaining % 3600) / 60)
  return d > 0 ? `${d}d ${h}h ${m}m remaining` : `${h}h ${m}m remaining`
}

function getErrorMessage(error: unknown) {
  if (error instanceof BaseError) {
    const details = [
      error.shortMessage,
      ...(error.metaMessages ?? []),
      error.details,
    ].filter(Boolean)
    return details.join(' | ')
  }
  if (error instanceof Error) return error.message
  return String(error)
}

export default function ListingCard({ listing, onAction, playerData }: Props) {
  const { address, chainId } = useAccount()
  const [bid, setBid] = useState('')
  const [actionError, setActionError] = useState<string | null>(null)

  // endTime is not in the subgraph — fetch it directly from the contract
  const { data: rawListing } = useReadContract({
    address: marketContract.address,
    abi: marketContract.abi,
    functionName: 'listings',
    args: [listing.listingId],
  })
  const listingOnChain = rawListing as ListingTuple | undefined
  const endTime: bigint = listingOnChain?.[6] ?? 0n
  const activeOnChain = listingOnChain?.[7] ?? listing.active

  const isEnded = Number(endTime) > 0 && Number(endTime) <= Math.floor(Date.now() / 1000)
  const isOwner = address?.toLowerCase() === listing.seller.toLowerCase()
  const isHighestBidder =
    !!address &&
    listing.highestBidder !== zeroAddress &&
    address.toLowerCase() === listing.highestBidder.toLowerCase()
  const canFinalize = isEnded && activeOnChain && (isOwner || isHighestBidder)

  const { data: hash, isPending, writeContract, reset, error: writeError } = useWriteContract()
  const {
    data: receipt,
    isLoading: isConfirming,
    isSuccess: isConfirmed,
    isError: isReceiptError,
    error: receiptError,
  } = useWaitForTransactionReceipt({ hash })

  useEffect(() => {
    if (!writeError) return
    const message = getErrorMessage(writeError)
    setActionError(message)
    console.error('[ListingCard] transaction submission failed', {
      listingId: listing.listingId.toString(),
      tokenId: listing.tokenId.toString(),
      chainId,
      buyNowPrice: listing.buyNowPrice.toString(),
      error: writeError,
      parsedMessage: message,
    })
  }, [writeError, listing.listingId, listing.tokenId, chainId, listing.buyNowPrice])

  useEffect(() => {
    if (!isReceiptError || !receiptError) return
    const message = getErrorMessage(receiptError)
    setActionError(message)
    console.error('[ListingCard] transaction reverted or receipt polling failed', {
      listingId: listing.listingId.toString(),
      tokenId: listing.tokenId.toString(),
      hash,
      chainId,
      error: receiptError,
      parsedMessage: message,
    })
  }, [isReceiptError, receiptError, listing.listingId, listing.tokenId, hash, chainId])

  useEffect(() => {
    if (!isConfirmed) return
    console.log('[ListingCard] transaction confirmed', {
      listingId: listing.listingId.toString(),
      tokenId: listing.tokenId.toString(),
      hash,
      chainId,
      status: receipt?.status,
      blockNumber: receipt?.blockNumber?.toString(),
    })
    onAction()
  }, [isConfirmed, listing.listingId, listing.tokenId, hash, chainId, receipt, onAction])

  function handleBuyNow() {
    reset()
    setActionError(null)

    if (listingOnChain) {
      const [, , onChainBuyNowPrice, , , , onChainEndTime, onChainActive] = listingOnChain
      if (!onChainActive) {
        setActionError('This listing is no longer active on-chain. Refresh listings and try again.')
        return
      }
      if (Number(onChainEndTime) <= Math.floor(Date.now() / 1000)) {
        setActionError('This auction has already ended on-chain. Try finalizing instead.')
        return
      }
      if (onChainBuyNowPrice !== listing.buyNowPrice) {
        console.warn('[ListingCard] subgraph buyNow price differs from on-chain value', {
          listingId: listing.listingId.toString(),
          subgraphBuyNow: listing.buyNowPrice.toString(),
          onChainBuyNow: onChainBuyNowPrice.toString(),
        })
      }
    }

    writeContract({
      address: marketContract.address,
      abi: marketContract.abi,
      functionName: 'buyNow',
      chainId: activeChain.id,
      args: [listing.listingId],
      value: listing.buyNowPrice,
    })
  }

  function handlePlaceBid() {
    if (!bid) return
    reset()
    setActionError(null)
    writeContract({
      address: marketContract.address,
      abi: marketContract.abi,
      functionName: 'placeBid',
      chainId: activeChain.id,
      args: [listing.listingId],
      value: parseEther(bid),
    })
  }

  function handleFinalize() {
    reset()
    setActionError(null)
    writeContract({
      address: marketContract.address,
      abi: marketContract.abi,
      functionName: 'finalize',
      chainId: activeChain.id,
      args: [listing.listingId],
    })
  }

  const bidFloor = listing.highestBid > 0n ? listing.highestBid : listing.minBid

  return (
    <li className="market-listing-card">
      <div className="market-listing-header">
        <span className="market-listing-player">{getPlayerName(listing.tokenId)}</span>
        <span className={`market-listing-status ${isEnded ? 'market-listing-status--ended' : ''}`}>
          {endTime === 0n ? '…' : isEnded ? 'Ended' : formatCountdown(endTime)}
        </span>
      </div>

      <ListingPlayerInfo tokenId={listing.tokenId} playerData={playerData} />

      <dl className="market-listing-details">
        <div>
          <dt>Seller</dt>
          <dd>{generateName(listing.seller)}</dd>
        </div>
        <div>
          <dt>Buy Now</dt>
          <dd>{formatEther(listing.buyNowPrice)} {nativeTokenSymbol}</dd>
        </div>
        <div>
          <dt>Min Bid</dt>
          <dd>{formatEther(listing.minBid)} {nativeTokenSymbol}</dd>
        </div>
        <div>
          <dt>Highest Bid</dt>
          <dd>
            {listing.highestBid > 0n
              ? `${formatEther(listing.highestBid)} ${nativeTokenSymbol} by ${generateName(listing.highestBidder)}`
              : 'No bids yet'}
          </dd>
        </div>
      </dl>

      {!isEnded && isOwner && (
        <p className="market-listing-owner-note">This is your listing.</p>
      )}

      {!isEnded && !isOwner && (
        <div className="market-listing-actions">
          <button
            className="market-btn market-btn--primary"
            type="button"
            onClick={handleBuyNow}
            disabled={isPending || isConfirming}
          >
            {isPending || isConfirming ? 'Confirming...' : `Buy Now — ${formatEther(listing.buyNowPrice)} ${nativeTokenSymbol}`}
          </button>

          <div className="market-bid-row">
            <input
              className="market-bid-input"
              type="number"
              step="0.001"
              min={formatEther(bidFloor)}
              placeholder={`Min ${formatEther(bidFloor)} ${nativeTokenSymbol}`}
              value={bid}
              onChange={(e) => setBid(e.target.value)}
            />
            <button
              className="market-btn market-btn--secondary"
              type="button"
              onClick={handlePlaceBid}
              disabled={!bid || isPending || isConfirming}
            >
              Place Bid
            </button>
          </div>
        </div>
      )}

      {canFinalize && (
        <button
          className="market-btn market-btn--finalize"
          type="button"
          onClick={handleFinalize}
          disabled={isPending || isConfirming}
        >
          {isPending || isConfirming
            ? 'Finalizing...'
            : isHighestBidder
              ? 'Claim Player'
              : 'Finalize Listing'}
        </button>
      )}

      {actionError && (
        <p className="market-error" role="alert">
          Transaction failed: {actionError}
        </p>
      )}

      {isConfirmed && <p className="market-step-label" role="status">Transaction confirmed.</p>}
    </li>
  )
}
