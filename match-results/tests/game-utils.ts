import { newMockEvent } from "matchstick-as"
import { ethereum, BigInt } from "@graphprotocol/graph-ts"
import { MatchPlayed, NewMatch, PlayerScored } from "../generated/Game/Game"

export function createMatchPlayedEvent(
  matchId: BigInt,
  homeScore: i32,
  awayScore: i32
): MatchPlayed {
  let matchPlayedEvent = changetype<MatchPlayed>(newMockEvent())

  matchPlayedEvent.parameters = new Array()

  matchPlayedEvent.parameters.push(
    new ethereum.EventParam(
      "matchId",
      ethereum.Value.fromUnsignedBigInt(matchId)
    )
  )
  matchPlayedEvent.parameters.push(
    new ethereum.EventParam(
      "homeScore",
      ethereum.Value.fromUnsignedBigInt(BigInt.fromI32(homeScore))
    )
  )
  matchPlayedEvent.parameters.push(
    new ethereum.EventParam(
      "awayScore",
      ethereum.Value.fromUnsignedBigInt(BigInt.fromI32(awayScore))
    )
  )

  return matchPlayedEvent
}

export function createNewMatchEvent(matchId: BigInt): NewMatch {
  let newMatchEvent = changetype<NewMatch>(newMockEvent())

  newMatchEvent.parameters = new Array()

  newMatchEvent.parameters.push(
    new ethereum.EventParam(
      "matchId",
      ethereum.Value.fromUnsignedBigInt(matchId)
    )
  )

  return newMatchEvent
}

export function createPlayerScoredEvent(
  matchId: BigInt,
  playerId: BigInt
): PlayerScored {
  let playerScoredEvent = changetype<PlayerScored>(newMockEvent())

  playerScoredEvent.parameters = new Array()

  playerScoredEvent.parameters.push(
    new ethereum.EventParam(
      "matchId",
      ethereum.Value.fromUnsignedBigInt(matchId)
    )
  )
  playerScoredEvent.parameters.push(
    new ethereum.EventParam(
      "playerId",
      ethereum.Value.fromUnsignedBigInt(playerId)
    )
  )

  return playerScoredEvent
}
