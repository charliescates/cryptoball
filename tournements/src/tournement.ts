import {
  TournementCompleted as TournementCompletedEvent,
  TournementCreated as TournementCreatedEvent,
  TeamEntered as TeamEnteredEvent,
  TournementMatchStarted as TournementMatchStartedEvent
} from "../generated/tournement/tournement"
  import {
    TournementCompletedSummary as TournementCompletedEvent,
    TournementCreated as TournementCreatedEvent,
    TeamEntered as TeamEnteredEvent,
    TournementMatchStarted as TournementMatchStartedEvent,
    TournementRoundAdvanced as TournementRoundAdvancedEvent,
    TournementReady as TournementReadyEvent,
    TournementCancelled as TournementCancelledEvent,
    TournementEntryRefunded as TournementEntryRefundedEvent,
    TournementExecutorCompensated as TournementExecutorCompensatedEvent,
    TournementRewardClaimed as TournementRewardClaimedEvent
  } from "../generated/tournement/tournement"
import {
  TournementCompleted,
  TournementCreated,
  TeamEntered,
  TournementMatchStarted
} from "../generated/schema"
  import {
    TournementRoundAdvanced,
    TournementReady,
    TournementCancelled,
    TournementEntryRefunded,
    TournementExecutorCompensated,
    TournementRewardClaimed
  } from "../generated/schema"

export function handleTournementCompleted(
  event: TournementCompletedEvent
): void {
  let entity = new TournementCompleted(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
    entity.tournamentId = event.params.tournamentId
    entity.champion = event.params.champion
    entity.championWinnings = event.params.championWinnings
    entity.executorFees = event.params.executorFees

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleTournementCreated(event: TournementCreatedEvent): void {
  let entity = new TournementCreated(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
    entity.tournamentId = event.params.tournamentId
    entity.creator = event.params.creator
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
    entity.tournamentId = event.params.tournamentId
    entity.tournamentMatchId = event.params.tournamentMatchId
    entity.round = event.params.round
  entity.homeAddress = event.params.homeAddress
  entity.awayAddress = event.params.awayAddress

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleTeamEntered(event: TeamEnteredEvent): void {
  let entity = new TeamEntered(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
    entity.tournamentId = event.params.tournamentId
    entity.player = event.params.player
  entity.teamsEntered = event.params.teamsEntered

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

  export function handleTournementRoundAdvanced(event: TournementRoundAdvancedEvent): void {
    let entity = new TournementRoundAdvanced(
      event.transaction.hash.concatI32(event.logIndex.toI32())
    )
    entity.tournamentId = event.params.tournamentId
    entity.completedRound = event.params.completedRound
    entity.nextRound = event.params.nextRound
    entity.teamsRemaining = event.params.teamsRemaining

    entity.blockNumber = event.block.number
    entity.blockTimestamp = event.block.timestamp
    entity.transactionHash = event.transaction.hash

    entity.save()
  }

  export function handleTournementReady(event: TournementReadyEvent): void {
    let entity = new TournementReady(
      event.transaction.hash.concatI32(event.logIndex.toI32())
    )
    entity.tournamentId = event.params.tournamentId
    entity.teamsCount = event.params.teamsCount

    entity.blockNumber = event.block.number
    entity.blockTimestamp = event.block.timestamp
    entity.transactionHash = event.transaction.hash

    entity.save()
  }

  export function handleTournementCancelled(event: TournementCancelledEvent): void {
    let entity = new TournementCancelled(
      event.transaction.hash.concatI32(event.logIndex.toI32())
    )
    entity.tournamentId = event.params.tournamentId
    entity.cancelledBy = event.params.cancelledBy

    entity.blockNumber = event.block.number
    entity.blockTimestamp = event.block.timestamp
    entity.transactionHash = event.transaction.hash

    entity.save()
  }

  export function handleTournementEntryRefunded(event: TournementEntryRefundedEvent): void {
    let entity = new TournementEntryRefunded(
      event.transaction.hash.concatI32(event.logIndex.toI32())
    )
    entity.tournamentId = event.params.tournamentId
    entity.entrant = event.params.entrant
    entity.amount = event.params.amount

    entity.blockNumber = event.block.number
    entity.blockTimestamp = event.block.timestamp
    entity.transactionHash = event.transaction.hash

    entity.save()
  }

  export function handleTournementExecutorCompensated(event: TournementExecutorCompensatedEvent): void {
    let entity = new TournementExecutorCompensated(
      event.transaction.hash.concatI32(event.logIndex.toI32())
    )
    entity.tournamentId = event.params.tournamentId
    entity.executor = event.params.executor
    entity.executorFee = event.params.executorFee

    entity.blockNumber = event.block.number
    entity.blockTimestamp = event.block.timestamp
    entity.transactionHash = event.transaction.hash

    entity.save()
  }

  export function handleTournementRewardClaimed(event: TournementRewardClaimedEvent): void {
    let entity = new TournementRewardClaimed(
      event.transaction.hash.concatI32(event.logIndex.toI32())
    )
    entity.tournamentId = event.params.tournamentId
    entity.champion = event.params.champion
    entity.amount = event.params.amount

    entity.blockNumber = event.block.number
    entity.blockTimestamp = event.block.timestamp
    entity.transactionHash = event.transaction.hash

    entity.save()
  }
