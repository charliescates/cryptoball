import {
  assert,
  describe,
  test,
  clearStore,
  beforeAll,
  afterAll
} from "matchstick-as/assembly/index"
import { BigInt } from "@graphprotocol/graph-ts"
import { handleMatchPlayed, handleMatchSnapshot, handlePlayerScored } from "../src/game"
import { createMatchPlayedEvent, createMatchSnapshotEvent, createPlayerScoredEvent } from "./game-utils"

// Tests structure (matchstick-as >=0.5.0)
// https://thegraph.com/docs/en/subgraphs/developing/creating/unit-testing-framework/#tests-structure

describe("Describe entity assertions", () => {
  beforeAll(() => {
    let matchId = BigInt.fromI32(234)
    let homeScore = 123
    let awayScore = 123
    let matchSnapshotEvent = createMatchSnapshotEvent(matchId)
    let newMatchPlayedEvent = createMatchPlayedEvent(
      matchId,
      homeScore,
      awayScore
    )
    let newPlayerScoredEvent = createPlayerScoredEvent(matchId, BigInt.fromI32(7))

    handleMatchSnapshot(matchSnapshotEvent)
    handleMatchPlayed(newMatchPlayedEvent)
    handlePlayerScored(newPlayerScoredEvent)
  })

  afterAll(() => {
    clearStore()
  })

  // For more test scenarios, see:
  // https://thegraph.com/docs/en/subgraphs/developing/creating/unit-testing-framework/#write-a-unit-test

  test("MatchPlayed created and stored", () => {
    assert.entityCount("MatchPlayed", 1)
    assert.entityCount("PlayedMatch", 1)
    assert.entityCount("PlayerScored", 1)

    assert.fieldEquals(
      "PlayedMatch",
      "234",
      "matchId",
      "234"
    )
    assert.fieldEquals(
      "PlayedMatch",
      "234",
      "homeScore",
      "123"
    )
    assert.fieldEquals(
      "PlayedMatch",
      "234",
      "awayScore",
      "123"
    )
    // More assert options:
    // https://thegraph.com/docs/en/subgraphs/developing/creating/unit-testing-framework/#asserts
  })
})
