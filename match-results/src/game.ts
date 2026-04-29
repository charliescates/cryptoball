import {
  MatchSnapshot as MatchSnapshotEvent,
  MatchPlayed as MatchPlayedEvent,
  NewMatch as NewMatchEvent,
  PlayerScored as PlayerScoredEvent
} from "../generated/Game/Game"
import { BigInt } from "@graphprotocol/graph-ts"
import { MatchPlayed, NewMatch, PlayerScored, PlayedMatch } from "../generated/schema"

function playedMatchId(matchId: BigInt): string {
  return matchId.toString()
}

export function handleMatchSnapshot(event: MatchSnapshotEvent): void {
  let entity = new PlayedMatch(playedMatchId(event.params.matchId))

  entity.matchId = event.params.matchId
  entity.homeScore = 0
  entity.awayScore = 0
  entity.homeAddress = event.params.homeAddress
  entity.awayAddress = event.params.awayAddress
  entity.homeAttackingPlayers = event.params.homeTeam.attackingPlayers
  entity.homeMidfieldPlayers = event.params.homeTeam.midfieldPlayers
  entity.homeDefensivePlayers = event.params.homeTeam.defensivePlayers
  entity.awayAttackingPlayers = event.params.awayTeam.attackingPlayers
  entity.awayMidfieldPlayers = event.params.awayTeam.midfieldPlayers
  entity.awayDefensivePlayers = event.params.awayTeam.defensivePlayers
  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

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

  let playedMatch = PlayedMatch.load(playedMatchId(event.params.matchId))
  if (playedMatch == null) {
    playedMatch = new PlayedMatch(playedMatchId(event.params.matchId))
    playedMatch.matchId = event.params.matchId
    playedMatch.homeAddress = event.address
    playedMatch.awayAddress = event.address
    playedMatch.homeAttackingPlayers = []
    playedMatch.homeMidfieldPlayers = []
    playedMatch.homeDefensivePlayers = []
    playedMatch.awayAttackingPlayers = []
    playedMatch.awayMidfieldPlayers = []
    playedMatch.awayDefensivePlayers = []
  }

  playedMatch.homeScore = event.params.homeScore
  playedMatch.awayScore = event.params.awayScore
  playedMatch.blockNumber = event.block.number
  playedMatch.blockTimestamp = event.block.timestamp
  playedMatch.transactionHash = event.transaction.hash

  playedMatch.save()
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
  entity.playedMatch = playedMatchId(event.params.matchId)
  entity.matchId = event.params.matchId
  entity.playerId = event.params.playerId
  entity.goalOrder = event.logIndex.toI32()

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}
