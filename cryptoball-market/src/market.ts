import {
  BidPlaced as BidPlacedEvent,
  BoughtNow as BoughtNowEvent,
  Finalized as FinalizedEvent,
  Listed as ListedEvent
} from "../generated/Market/Market"
import { BidPlaced, BoughtNow, Finalized, Listed, Listing } from "../generated/schema"
import { Address, BigInt, Bytes } from "@graphprotocol/graph-ts"

export function handleBidPlaced(event: BidPlacedEvent): void {
  let entity = new BidPlaced(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.listingId = event.params.listingId
  entity.bidder = event.params.bidder
  entity.amount = event.params.amount

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()

  // Update the mutable Listing entity
  let listing = Listing.load(event.params.listingId.toString())
  if (listing != null) {
    listing.highestBid = event.params.amount
    listing.highestBidder = event.params.bidder
    listing.save()
  }
}

export function handleBoughtNow(event: BoughtNowEvent): void {
  let entity = new BoughtNow(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.listingId = event.params.listingId
  entity.buyer = event.params.buyer
  entity.price = event.params.price

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()

  // Mark the listing as inactive
  let listing = Listing.load(event.params.listingId.toString())
  if (listing != null) {
    listing.active = false
    listing.save()
  }
}

export function handleFinalized(event: FinalizedEvent): void {
  let entity = new Finalized(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.listingId = event.params.listingId
  entity.winner = event.params.winner
  entity.amount = event.params.amount

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()

  // Mark the listing as inactive
  let listing = Listing.load(event.params.listingId.toString())
  if (listing != null) {
    listing.active = false
    listing.save()
  }
}

export function handleListed(event: ListedEvent): void {
  let entity = new Listed(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.listingId = event.params.listingId
  entity.seller = event.params.seller
  entity.tokenId = event.params.tokenId
  entity.buyNowPrice = event.params.buyNowPrice
  entity.minBid = event.params.minBid

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()

  // Create/update the mutable Listing entity
  let listing = new Listing(event.params.listingId.toString())
  listing.listingId = event.params.listingId
  listing.seller = event.params.seller
  listing.tokenId = event.params.tokenId
  listing.buyNowPrice = event.params.buyNowPrice
  listing.minBid = event.params.minBid
  listing.highestBid = BigInt.fromI32(0)
  listing.highestBidder = Address.zero()
  listing.active = true
  listing.blockTimestamp = event.block.timestamp
  listing.transactionHash = event.transaction.hash

  listing.save()
}
