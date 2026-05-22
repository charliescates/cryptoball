import {
  TournementCompleted as TournementCompletedEvent,
  TournementCreated as TournementCreatedEvent,
  TournementMatchStarted as TournementMatchStartedEvent
} from "../generated/tournement/tournement"
import {
  TournementCompleted,
  TournementCreated,
  TournementMatchStarted
} from "../generated/schema"

export function handleTournementCompleted(
  event: TournementCompletedEvent
): void {
  let entity = new TournementCompleted(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.tournementId = event.params.tournementId
  entity.champion = event.params.champion

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleTournementCreated(event: TournementCreatedEvent): void {
  let entity = new TournementCreated(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.tournementId = event.params.tournementId
  entity.rounds = event.params.rounds
  entity.entryFee = event.params.entryFee
  entity.minAttack = event.params.minAttack
  entity.minDefence = event.params.minDefence
  entity.maxAttack = event.params.maxAttack
  entity.maxDefence = event.params.maxDefence
  entity.includeTypes = event.params.includeTypes
  entity.excludeTypes = event.params.excludeTypes

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleTournementMatchStarted(
  event: TournementMatchStartedEvent
): void {
  let entity = new TournementMatchStarted(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.tournementId = event.params.tournementId
  entity.round = event.params.round
  entity.homeAddress = event.params.homeAddress
  entity.awayAddress = event.params.awayAddress

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}
