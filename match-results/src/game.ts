import {
  ExtraTimePlayed as ExtraTimePlayedEvent,
  GoldenGoalPlayed as GoldenGoalPlayedEvent,
  MatchSnapshot as MatchSnapshotEvent,
  MatchPlayed as MatchPlayedEvent,
  NewMatch as NewMatchEvent,
  PlayerMatchInfo as PlayerMatchInfoEvent,
  PlayerScored as PlayerScoredEvent,
  TeamStatsCalculated as TeamStatsCalculatedEvent,
  WinningsDistributed as WinningsDistributedEvent
} from "../generated/Game/Game"
  import { TournamentMatchPlayed as TournamentMatchPlayedEvent } from "../generated/Game/Game"
import { Address, BigInt } from "@graphprotocol/graph-ts"
import {
  ExtraTimePlayed,
  GoldenGoalPlayed,
  MatchPlayed,
  NewMatch,
  PlayerMatchInfo,
  PlayerScored,
  PlayedMatch,
  TeamStatsCalculated,
  WinningsDistributed
} from "../generated/schema"
  import { TournamentMatchPlayed } from "../generated/schema"

function positionLabelFromCode(positionCode: i32): string {
  if (positionCode == 0) {
    return "attacking"
  }
  if (positionCode == 1) {
    return "midfield"
  }
  return "defensive"
}

function playedMatchId(matchId: BigInt, tournamentId: BigInt): string {
  return matchId.toString() + '-' + tournamentId.toString()
}

function getOrCreatePlayedMatch(matchId: BigInt, tournamentId: BigInt, fallbackAddress: Address): PlayedMatch {
  let existing = PlayedMatch.load(playedMatchId(matchId, tournamentId))
  if (existing != null) {
    return existing
  }

  let created = new PlayedMatch(playedMatchId(matchId, tournamentId))
  created.matchId = matchId
  created.tournamentId = tournamentId
  created.homeScore = 0
  created.awayScore = 0
  created.homeAddress = fallbackAddress
  created.awayAddress = fallbackAddress
  created.homeAttackingPlayers = []
  created.homeMidfieldPlayers = []
  created.homeDefensivePlayers = []
  created.awayAttackingPlayers = []
  created.awayMidfieldPlayers = []
  created.awayDefensivePlayers = []
  created.blockNumber = BigInt.zero()
  created.blockTimestamp = BigInt.zero()
  created.transactionHash = fallbackAddress
  created.save()

  return created
}

export function handleMatchSnapshot(event: MatchSnapshotEvent): void {
  let entity = new PlayedMatch(playedMatchId(event.params.matchId, event.params.tournamentId))

  entity.matchId = event.params.matchId
  entity.tournamentId = event.params.tournamentId
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

export function handleTournamentMatchPlayed(event: TournamentMatchPlayedEvent): void {
  let entity = new TournamentMatchPlayed(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.tournamentId = event.params.tournamentId
  entity.tournamentMatchId = event.params.tournamentMatchId
  entity.round = event.params.round
  entity.homeAddress = event.params.homeAddress
  entity.awayAddress = event.params.awayAddress
  entity.winner = event.params.winner
  entity.homeScore = event.params.homeScore
  entity.awayScore = event.params.awayScore

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

  let playedMatch = getOrCreatePlayedMatch(event.params.matchId, BigInt.zero(), event.address)

  playedMatch.homeScore = event.params.homeScore
  playedMatch.awayScore = event.params.awayScore
  playedMatch.blockNumber = event.block.number
  playedMatch.blockTimestamp = event.block.timestamp
  playedMatch.transactionHash = event.transaction.hash

  playedMatch.save()
}

export function handleExtraTimePlayed(event: ExtraTimePlayedEvent): void {
  let playedMatch = getOrCreatePlayedMatch(event.params.matchId, event.params.tournamentId, event.address)

  let entity = new ExtraTimePlayed(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.playedMatch = playedMatchId(event.params.matchId, event.params.tournamentId)
  entity.matchId = event.params.matchId
  entity.tournamentId = event.params.tournamentId
  entity.homeScore = event.params.homeScore
  entity.awayScore = event.params.awayScore
  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash
  entity.save()

  playedMatch.homeScore = event.params.homeScore
  playedMatch.awayScore = event.params.awayScore
  playedMatch.blockNumber = event.block.number
  playedMatch.blockTimestamp = event.block.timestamp
  playedMatch.transactionHash = event.transaction.hash
  playedMatch.save()
}

export function handleGoldenGoalPlayed(event: GoldenGoalPlayedEvent): void {
  let playedMatch = getOrCreatePlayedMatch(event.params.matchId, event.params.tournamentId, event.address)

  let entity = new GoldenGoalPlayed(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.playedMatch = playedMatchId(event.params.matchId, event.params.tournamentId)
  entity.matchId = event.params.matchId
  entity.tournamentId = event.params.tournamentId
  entity.homeScore = event.params.homeScore
  entity.awayScore = event.params.awayScore
  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash
  entity.save()

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
  getOrCreatePlayedMatch(event.params.matchId, event.params.tournamentId, event.address)

  let entity = new PlayerScored(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.playedMatch = playedMatchId(event.params.matchId, event.params.tournamentId)
  entity.matchId = event.params.matchId
  entity.tournamentId = event.params.tournamentId
  entity.playerId = event.params.playerId
  entity.goalOrder = event.logIndex.toI32()

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handlePlayerMatchInfo(event: PlayerMatchInfoEvent): void {
  getOrCreatePlayedMatch(event.params.matchId, event.params.tournamentId, event.address)

  let entity = new PlayerMatchInfo(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.playedMatch = playedMatchId(event.params.matchId, event.params.tournamentId)
  entity.matchId = event.params.matchId
  entity.tournamentId = event.params.tournamentId
  entity.playerId = event.params.playerId
  entity.owner = event.params.owner
  entity.attack = event.params.attack
  entity.defense = event.params.defense
  entity.potential = event.params.potential
  entity.gamesLeft = event.params.gamesLeft
  entity.goals = event.params.goals
  entity.playerType = event.params.playerType
  entity.position = positionLabelFromCode(event.params.position)

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}
export function handleTeamStatsCalculated(event: TeamStatsCalculatedEvent): void {
  getOrCreatePlayedMatch(event.params.matchId, event.params.tournamentId, event.address)

  let entity = new TeamStatsCalculated(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.playedMatch = playedMatchId(event.params.matchId, event.params.tournamentId)
  entity.matchId = event.params.matchId
  entity.tournamentId = event.params.tournamentId
  entity.team = event.params.team
  entity.totalAttack = event.params.totalAttack
  entity.totalDefense = event.params.totalDefense

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleWinningsDistributed(event: WinningsDistributedEvent): void {
  getOrCreatePlayedMatch(event.params.matchId, BigInt.zero(), event.address)

  let entity = new WinningsDistributed(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.playedMatch = playedMatchId(event.params.matchId, BigInt.zero())
  entity.matchId = event.params.matchId
  entity.winner = event.params.winner
  entity.winnings = event.params.winnings
  entity.academy = event.params.academy
  entity.academyShare = event.params.academyShare
  entity.executor = event.params.executor
  entity.executorFee = event.params.executorFee

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}
