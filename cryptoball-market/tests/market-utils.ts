import { newMockEvent } from "matchstick-as"
import { ethereum, BigInt, Address } from "@graphprotocol/graph-ts"
import {
  BidPlaced,
  BoughtNow,
  Finalized,
  Listed
} from "../generated/Market/Market"

export function createBidPlacedEvent(
  listingId: BigInt,
  bidder: Address,
  amount: BigInt
): BidPlaced {
  let bidPlacedEvent = changetype<BidPlaced>(newMockEvent())

  bidPlacedEvent.parameters = new Array()

  bidPlacedEvent.parameters.push(
    new ethereum.EventParam(
      "listingId",
      ethereum.Value.fromUnsignedBigInt(listingId)
    )
  )
  bidPlacedEvent.parameters.push(
    new ethereum.EventParam("bidder", ethereum.Value.fromAddress(bidder))
  )
  bidPlacedEvent.parameters.push(
    new ethereum.EventParam("amount", ethereum.Value.fromUnsignedBigInt(amount))
  )

  return bidPlacedEvent
}

export function createBoughtNowEvent(
  listingId: BigInt,
  buyer: Address,
  price: BigInt
): BoughtNow {
  let boughtNowEvent = changetype<BoughtNow>(newMockEvent())

  boughtNowEvent.parameters = new Array()

  boughtNowEvent.parameters.push(
    new ethereum.EventParam(
      "listingId",
      ethereum.Value.fromUnsignedBigInt(listingId)
    )
  )
  boughtNowEvent.parameters.push(
    new ethereum.EventParam("buyer", ethereum.Value.fromAddress(buyer))
  )
  boughtNowEvent.parameters.push(
    new ethereum.EventParam("price", ethereum.Value.fromUnsignedBigInt(price))
  )

  return boughtNowEvent
}

export function createFinalizedEvent(
  listingId: BigInt,
  winner: Address,
  amount: BigInt
): Finalized {
  let finalizedEvent = changetype<Finalized>(newMockEvent())

  finalizedEvent.parameters = new Array()

  finalizedEvent.parameters.push(
    new ethereum.EventParam(
      "listingId",
      ethereum.Value.fromUnsignedBigInt(listingId)
    )
  )
  finalizedEvent.parameters.push(
    new ethereum.EventParam("winner", ethereum.Value.fromAddress(winner))
  )
  finalizedEvent.parameters.push(
    new ethereum.EventParam("amount", ethereum.Value.fromUnsignedBigInt(amount))
  )

  return finalizedEvent
}

export function createListedEvent(
  listingId: BigInt,
  seller: Address,
  tokenId: BigInt,
  buyNowPrice: BigInt,
  minBid: BigInt
): Listed {
  let listedEvent = changetype<Listed>(newMockEvent())

  listedEvent.parameters = new Array()

  listedEvent.parameters.push(
    new ethereum.EventParam(
      "listingId",
      ethereum.Value.fromUnsignedBigInt(listingId)
    )
  )
  listedEvent.parameters.push(
    new ethereum.EventParam("seller", ethereum.Value.fromAddress(seller))
  )
  listedEvent.parameters.push(
    new ethereum.EventParam(
      "tokenId",
      ethereum.Value.fromUnsignedBigInt(tokenId)
    )
  )
  listedEvent.parameters.push(
    new ethereum.EventParam(
      "buyNowPrice",
      ethereum.Value.fromUnsignedBigInt(buyNowPrice)
    )
  )
  listedEvent.parameters.push(
    new ethereum.EventParam("minBid", ethereum.Value.fromUnsignedBigInt(minBid))
  )

  return listedEvent
}
