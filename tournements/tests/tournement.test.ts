import {
  assert,
  describe,
  test,
  clearStore,
  beforeAll,
  afterAll
} from "matchstick-as/assembly/index"
import { BigInt, Address } from "@graphprotocol/graph-ts"
import { TournementCompleted } from "../generated/schema"
import { TournementCompleted as TournementCompletedEvent } from "../generated/tournement/tournement"
import { handleTournementCompleted } from "../src/tournement"
import { createTournementCompletedEvent } from "./tournement-utils"

// Tests structure (matchstick-as >=0.5.0)
// https://thegraph.com/docs/en/subgraphs/developing/creating/unit-testing-framework/#tests-structure

describe("Describe entity assertions", () => {
  beforeAll(() => {
    let tournementId = BigInt.fromI32(234)
    let champion = Address.fromString(
      "0x0000000000000000000000000000000000000001"
    )
    let newTournementCompletedEvent = createTournementCompletedEvent(
      tournementId,
      champion
    )
    handleTournementCompleted(newTournementCompletedEvent)
  })

  afterAll(() => {
    clearStore()
  })

  // For more test scenarios, see:
  // https://thegraph.com/docs/en/subgraphs/developing/creating/unit-testing-framework/#write-a-unit-test

  test("TournementCompleted created and stored", () => {
    assert.entityCount("TournementCompleted", 1)

    // 0xa16081f360e3847006db660bae1c6d1b2e17ec2a is the default address used in newMockEvent() function
    assert.fieldEquals(
      "TournementCompleted",
      "0xa16081f360e3847006db660bae1c6d1b2e17ec2a-1",
      "tournementId",
      "234"
    )
    assert.fieldEquals(
      "TournementCompleted",
      "0xa16081f360e3847006db660bae1c6d1b2e17ec2a-1",
      "champion",
      "0x0000000000000000000000000000000000000001"
    )

    // More assert options:
    // https://thegraph.com/docs/en/subgraphs/developing/creating/unit-testing-framework/#asserts
  })
})
