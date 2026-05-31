import { newMockEvent } from "matchstick-as"
import { ethereum, BigInt, Address } from "@graphprotocol/graph-ts"
import {
  TournementCompleted,
  TournementCreated,
  TournementMatchStarted
} from "../generated/tournement/tournement"

export function createTournementCompletedEvent(
  tournamentId: BigInt,
  champion: Address
): TournementCompleted {
  let tournementCompletedEvent = changetype<TournementCompleted>(newMockEvent())

  tournementCompletedEvent.parameters = new Array()

  tournementCompletedEvent.parameters.push(
    new ethereum.EventParam(
      "tournamentId",
      ethereum.Value.fromUnsignedBigInt(tournamentId)
    )
  )
  tournementCompletedEvent.parameters.push(
    new ethereum.EventParam("champion", ethereum.Value.fromAddress(champion))
  )

  return tournementCompletedEvent
}

export function createTournementCreatedEvent(
  tournamentId: BigInt,
  rounds: i32,
  entryFee: BigInt,
  minAttack: i32,
  minDefence: i32,
  maxAttack: i32,
  maxDefence: i32,
  includeTypes: Array<i32>,
  excludeTypes: Array<i32>
): TournementCreated {
  let tournementCreatedEvent = changetype<TournementCreated>(newMockEvent())

  tournementCreatedEvent.parameters = new Array()

  tournementCreatedEvent.parameters.push(
    new ethereum.EventParam(
      "tournamentId",
      ethereum.Value.fromUnsignedBigInt(tournamentId)
    )
  )
  tournementCreatedEvent.parameters.push(
    new ethereum.EventParam(
      "rounds",
      ethereum.Value.fromUnsignedBigInt(BigInt.fromI32(rounds))
    )
  )
  tournementCreatedEvent.parameters.push(
    new ethereum.EventParam(
      "entryFee",
      ethereum.Value.fromUnsignedBigInt(entryFee)
    )
  )
  tournementCreatedEvent.parameters.push(
    new ethereum.EventParam(
      "minAttack",
      ethereum.Value.fromUnsignedBigInt(BigInt.fromI32(minAttack))
    )
  )
  tournementCreatedEvent.parameters.push(
    new ethereum.EventParam(
      "minDefence",
      ethereum.Value.fromUnsignedBigInt(BigInt.fromI32(minDefence))
    )
  )
  tournementCreatedEvent.parameters.push(
    new ethereum.EventParam(
      "maxAttack",
      ethereum.Value.fromUnsignedBigInt(BigInt.fromI32(maxAttack))
    )
  )
  tournementCreatedEvent.parameters.push(
    new ethereum.EventParam(
      "maxDefence",
      ethereum.Value.fromUnsignedBigInt(BigInt.fromI32(maxDefence))
    )
  )
  tournementCreatedEvent.parameters.push(
    new ethereum.EventParam(
      "includeTypes",
      ethereum.Value.fromI32Array(includeTypes)
    )
  )
  tournementCreatedEvent.parameters.push(
    new ethereum.EventParam(
      "excludeTypes",
      ethereum.Value.fromI32Array(excludeTypes)
    )
  )

  return tournementCreatedEvent
}

export function createTournementMatchStartedEvent(
  tournamentId: BigInt,
  round: i32,
  homeAddress: Address,
  awayAddress: Address
): TournementMatchStarted {
  let tournementMatchStartedEvent =
    changetype<TournementMatchStarted>(newMockEvent())

  tournementMatchStartedEvent.parameters = new Array()

  tournementMatchStartedEvent.parameters.push(
    new ethereum.EventParam(
      "tournamentId",
      ethereum.Value.fromUnsignedBigInt(tournamentId)
    )
  )
  tournementMatchStartedEvent.parameters.push(
    new ethereum.EventParam(
      "round",
      ethereum.Value.fromUnsignedBigInt(BigInt.fromI32(round))
    )
  )
  tournementMatchStartedEvent.parameters.push(
    new ethereum.EventParam(
      "homeAddress",
      ethereum.Value.fromAddress(homeAddress)
    )
  )
  tournementMatchStartedEvent.parameters.push(
    new ethereum.EventParam(
      "awayAddress",
      ethereum.Value.fromAddress(awayAddress)
    )
  )

  return tournementMatchStartedEvent
}
