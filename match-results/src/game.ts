import {
  MatchPlayed as MatchPlayedEvent,
  NewMatch as NewMatchEvent,
  PlayerScored as PlayerScoredEvent
} from "../generated/Game/Game"
import { MatchPlayed, NewMatch, PlayerScored } from "../generated/schema"

export function handleMatchPlayed(event: MatchPlayedEvent): void {
  let entity = new MatchPlayed(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.matchId = event.params.matchId
  entity.homeScore = event.params.homeScore
  entity.awayScore = event.params.awayScore

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleNewMatch(event: NewMatchEvent): void {
  let entity = new NewMatch(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.matchId = event.params.matchId

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handlePlayerScored(event: PlayerScoredEvent): void {
  let entity = new PlayerScored(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.matchId = event.params.matchId
  entity.playerId = event.params.playerId

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}
