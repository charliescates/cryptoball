import { newMockEvent } from "matchstick-as"
import { ethereum, BigInt, Address } from "@graphprotocol/graph-ts"
import { MatchPlayed, MatchSnapshot, NewMatch, PlayerScored } from "../generated/Game/Game"

function bigIntArray(values: i32[]): BigInt[] {
  const result = new Array<BigInt>(values.length)
  for (let i = 0; i < values.length; i++) {
    result[i] = BigInt.fromI32(values[i])
  }
  return result
}

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

export function createMatchSnapshotEvent(matchId: BigInt): MatchSnapshot {
  let matchSnapshotEvent = changetype<MatchSnapshot>(newMockEvent())

  matchSnapshotEvent.parameters = new Array()

  matchSnapshotEvent.parameters.push(
    new ethereum.EventParam(
      "matchId",
      ethereum.Value.fromUnsignedBigInt(matchId)
    )
  )
  matchSnapshotEvent.parameters.push(
    new ethereum.EventParam(
      "homeAddress",
      ethereum.Value.fromAddress(Address.fromString("0x0000000000000000000000000000000000000001"))
    )
  )
  matchSnapshotEvent.parameters.push(
    new ethereum.EventParam(
      "awayAddress",
      ethereum.Value.fromAddress(Address.fromString("0x0000000000000000000000000000000000000002"))
    )
  )
  matchSnapshotEvent.parameters.push(
    new ethereum.EventParam(
      "homeTeam",
      ethereum.Value.fromTuple(changetype<ethereum.Tuple>([
        ethereum.Value.fromUnsignedBigIntArray(bigIntArray([1, 0, 2])),
        ethereum.Value.fromUnsignedBigIntArray(bigIntArray([0, 3, 0])),
        ethereum.Value.fromUnsignedBigIntArray(bigIntArray([4, 0, 5]))
      ]))
    )
  )
  matchSnapshotEvent.parameters.push(
    new ethereum.EventParam(
      "awayTeam",
      ethereum.Value.fromTuple(changetype<ethereum.Tuple>([
        ethereum.Value.fromUnsignedBigIntArray(bigIntArray([6, 0, 7])),
        ethereum.Value.fromUnsignedBigIntArray(bigIntArray([0, 8, 0])),
        ethereum.Value.fromUnsignedBigIntArray(bigIntArray([9, 0, 10]))
      ]))
    )
  )

  return matchSnapshotEvent
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
