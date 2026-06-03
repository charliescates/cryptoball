import { useQuery } from "@tanstack/react-query";
import { request } from "graphql-request";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useAccount } from "wagmi";
import { nativeTokenSymbol } from "../../config/network";
import FootballPlayerAvatar from "../avatar/FootballPlayerAvatar";
import { ReplayPositionCard } from "../formation-grid-parts/ReplayPositionCard";
import { getPlayerName } from "../utils/playerName";
import { getTeamKitTraitsFromAddress } from "../utils/teamKit";
import generateName from "../utils/teamName";
import {
  type MatchesResponse,
  type PlayedMatch,
  type PlayerMatchInfo,
  type TeamStatsCalculated,
  type TournamentMatchReplayResponse,
  type WinningsDistributed,
  matchResultsHeaders,
  matchResultsUrl,
  myMatchesQuery,
  playedMatchByMatchIdAndTournamentIdQuery,
  recentMatchesQuery,
  tournamentReplayScoreQuery,
} from "./matchResultsQuery";

type ShowMatchesProps = {
  embeddedMatchId?: string;
  embeddedTournamentId?: string;
  hideHeader?: boolean;
  onReplayComplete?: () => void;
};

function formatMatchTime(blockTimestamp: string) {
  const value = Number(blockTimestamp);

  if (Number.isNaN(value) || value <= 0) {
    return "Timestamp unavailable";
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value * 1000));
}

function normalizePlayerIds(playerIds: string[]) {
  return playerIds.filter((playerId) => playerId !== "0");
}

function buildFormation(attack: string[], midfield: string[], defense: string[]) {
  return {
    attack: normalizePlayerIds(attack),
    midfield: normalizePlayerIds(midfield),
    defense: normalizePlayerIds(defense),
  };
}

function getGoalTimeline(match: PlayedMatch) {
  const homePlayers = new Set([
    ...normalizePlayerIds(match.homeAttackingPlayers),
    ...normalizePlayerIds(match.homeMidfieldPlayers),
    ...normalizePlayerIds(match.homeDefensivePlayers),
  ]);
  const awayPlayers = new Set([
    ...normalizePlayerIds(match.awayAttackingPlayers),
    ...normalizePlayerIds(match.awayMidfieldPlayers),
    ...normalizePlayerIds(match.awayDefensivePlayers),
  ]);

  return [...match.playerScoreds]
    .sort((left, right) => left.goalOrder - right.goalOrder)
    .map((goal, index) => {
      const teamLabel: "Home" | "Away" | "Unknown" = homePlayers.has(goal.playerId)
        ? "Home"
        : awayPlayers.has(goal.playerId)
          ? "Away"
          : "Unknown";

      return {
        id: `${match.id}-${index}`,
        teamLabel,
        playerId: goal.playerId,
        playerName: getPlayerName(BigInt(goal.playerId)),
      };
    });
}

function hasExtraTime(match: PlayedMatch) {
  return (match.extraTimePlayeds?.length ?? 0) > 0;
}

function hasGoldenGoal(match: PlayedMatch) {
  return (match.goldenGoalPlayeds?.length ?? 0) > 0;
}

function getMatchTargetSeconds(match: PlayedMatch) {
  if (hasGoldenGoal(match)) return 26 * 60;
  if (hasExtraTime(match)) return 25 * 60;
  return 20 * 60;
}

function formatReplayClock(totalSeconds: number) {
  const clamped = Math.max(0, Math.floor(totalSeconds));
  const minutes = Math.floor(clamped / 60)
    .toString()
    .padStart(2, "0");
  const seconds = (clamped % 60).toString().padStart(2, "0");
  return `${minutes}:${seconds}`;
}

type RevealPhase = "hidden" | "animating" | "complete";
type TeamLabel = "Home" | "Away";
type TeamScopedLabel = TeamLabel | "Unknown";
type GoalEvent = {
  id: string;
  teamLabel: TeamScopedLabel;
  playerId: string;
  playerName: string;
  minute: number;
  isGoldenGoal: boolean;
};

type ReplayScriptEvent =
  | {
      id: string;
      kind: "intro-player";
      playerId: string;
      teamLabel: TeamLabel;
    }
  | {
      id: string;
      kind: "formation";
      teamLabel: TeamLabel;
    }
  | {
      id: string;
      kind: "team-stats";
      teamLabel: TeamLabel;
    }
  | {
      id: string;
      kind: "minute";
      minute: number;
      period: "regular" | "extra";
    }
  | {
      id: string;
      kind: "extra-time";
    }
  | {
      id: string;
      kind: "golden-goal";
      teamLabel: TeamScopedLabel;
    }
  | {
      id: string;
      kind: "goal";
      goal: GoalEvent;
    }
  | {
      id: string;
      kind: "winnings";
      winnings: WinningsDistributed;
    }
  | {
      id: string;
      kind: "fulltime";
    };

function buildGoalCounts(timeline: GoalEvent[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const goal of timeline) {
    if (goal.isGoldenGoal) continue;
    counts[goal.playerId] = (counts[goal.playerId] ?? 0) + 1;
  }
  return counts;
}

function seededRandom(seed: string): () => number {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    const char = seed.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }

  return function () {
    hash = (hash * 9301 + 49297) % 233280;
    return hash / 233280;
  };
}

function buildTimedGoalTimeline(match: PlayedMatch): GoalEvent[] {
  const baseTimeline = getGoalTimeline(match);
  const includeExtraTime = hasExtraTime(match);
  const includeGolden = hasGoldenGoal(match);
  const rng = seededRandom(match.id);
  type ReplayGoalSeed = Omit<GoalEvent, "minute" | "isGoldenGoal">;

  const placeGoalsWithinWindow = (goals: ReplayGoalSeed[], startMinute: number, endMinute: number) => {
    if (goals.length === 0) return [] as GoalEvent[];
    const slots = endMinute - startMinute + 1;

    return goals.map((goal, index) => {
      // Spread events deterministically across the available minute window.
      const slot = Math.floor(((index + 1) * slots) / (goals.length + 1));
      const minute = Math.min(endMinute, Math.max(startMinute, startMinute + slot));
      return {
        ...goal,
        minute,
        isGoldenGoal: false,
      };
    });
  };

  const shuffleGoals = <T,>(goals: T[]) => [...goals].sort(() => rng() - 0.5);

  let timedGoals: GoalEvent[] = [];

  if (!includeExtraTime) {
    const shuffledGoals = shuffleGoals(baseTimeline);
    timedGoals = placeGoalsWithinWindow(shuffledGoals, 0, 19);
  } else {
    const homeGoals = shuffleGoals(baseTimeline.filter((goal) => goal.teamLabel === "Home"));
    const awayGoals = shuffleGoals(baseTimeline.filter((goal) => goal.teamLabel === "Away"));
    const unknownGoals = shuffleGoals(baseTimeline.filter((goal) => goal.teamLabel === "Unknown"));

    const goalsPerSideInRegularTime = Math.min(homeGoals.length, awayGoals.length);
    const regularGoals: ReplayGoalSeed[] = [];

    for (let index = 0; index < goalsPerSideInRegularTime; index += 1) {
      const pair = [homeGoals[index], awayGoals[index]].filter((goal): goal is ReplayGoalSeed => !!goal);
      if (pair.length === 2 && rng() > 0.5) {
        pair.reverse();
      }
      regularGoals.push(...pair);
    }

    const remainingHomeGoals = homeGoals.slice(goalsPerSideInRegularTime);
    const remainingAwayGoals = awayGoals.slice(goalsPerSideInRegularTime);
    const extraTimeGoals = shuffleGoals([...remainingHomeGoals, ...remainingAwayGoals, ...unknownGoals]);

    timedGoals = [
      ...placeGoalsWithinWindow(regularGoals, 0, 19),
      ...placeGoalsWithinWindow(extraTimeGoals, 21, 25),
    ];
  }

  if (!includeGolden) {
    return timedGoals;
  }

  const finalHome = Number(match.homeScore);
  const finalAway = Number(match.awayScore);
  const playerGoalsHome = timedGoals.filter((goal) => goal.teamLabel === "Home").length;
  const playerGoalsAway = timedGoals.filter((goal) => goal.teamLabel === "Away").length;

  let goldenTeam: TeamScopedLabel = "Unknown";
  if (finalHome > playerGoalsHome) {
    goldenTeam = "Home";
  } else if (finalAway > playerGoalsAway) {
    goldenTeam = "Away";
  }

  timedGoals.push({
    id: `${match.id}-golden-goal`,
    teamLabel: goldenTeam,
    playerId: "golden-goal",
    playerName: "Golden Goal",
    minute: 26,
    isGoldenGoal: true,
  });

  return timedGoals;
}

function getPlayerOfMatch(timeline: GoalEvent[]) {
  const counts = buildGoalCounts(timeline);
  const topEntry = Object.entries(counts).sort(([, left], [, right]) => right - left)[0];

  if (!topEntry) {
    return null;
  }

  const [playerId, goals] = topEntry;
  return {
    goals,
    name: getPlayerName(BigInt(playerId)),
  };
}

function getPlayerInfoMap(match: PlayedMatch) {
  const map = new Map<string, PlayerMatchInfo>();
  for (const info of match.playerMatchInfos ?? []) {
    map.set(info.playerId, info);
  }
  return map;
}

function getTeamStatsMap(match: PlayedMatch) {
  const map = new Map<string, TeamStatsCalculated>();

  for (const stats of match.teamStatsCalculateds ?? []) {
    map.set(stats.team.toLowerCase(), stats);
  }

  return map;
}

function toTeamLabel(match: PlayedMatch, teamAddress: string): TeamLabel | null {
  const lowered = teamAddress.toLowerCase();
  if (lowered === match.homeAddress.toLowerCase()) return "Home";
  if (lowered === match.awayAddress.toLowerCase()) return "Away";
  return null;
}

function buildReplayScript(match: PlayedMatch): ReplayScriptEvent[] {
  const script: ReplayScriptEvent[] = [];
  const homeFormation = buildFormation(match.homeAttackingPlayers, match.homeMidfieldPlayers, match.homeDefensivePlayers);
  const awayFormation = buildFormation(match.awayAttackingPlayers, match.awayMidfieldPlayers, match.awayDefensivePlayers);
  const homePlayers = [...homeFormation.attack, ...homeFormation.midfield, ...homeFormation.defense];
  const awayPlayers = [...awayFormation.attack, ...awayFormation.midfield, ...awayFormation.defense];

  homePlayers.forEach((playerId, index) => {
    script.push({
      id: `${match.id}-home-intro-${playerId}-${index}`,
      kind: "intro-player",
      playerId,
      teamLabel: "Home",
    });
  });

  awayPlayers.forEach((playerId, index) => {
    script.push({
      id: `${match.id}-away-intro-${playerId}-${index}`,
      kind: "intro-player",
      playerId,
      teamLabel: "Away",
    });
  });

  script.push({ id: `${match.id}-home-formation`, kind: "formation", teamLabel: "Home" });
  script.push({ id: `${match.id}-away-formation`, kind: "formation", teamLabel: "Away" });

  const teamStats = getTeamStatsMap(match);
  const homeStats = teamStats.get(match.homeAddress.toLowerCase());
  const awayStats = teamStats.get(match.awayAddress.toLowerCase());

  if (homeStats) script.push({ id: `${match.id}-home-stats`, kind: "team-stats", teamLabel: "Home" });
  if (awayStats) script.push({ id: `${match.id}-away-stats`, kind: "team-stats", teamLabel: "Away" });

  const timedTimeline = buildTimedGoalTimeline(match);
  const goalsByMinute = new Map<number, GoalEvent[]>();
  for (const goal of timedTimeline) {
    const minuteGoals = goalsByMinute.get(goal.minute) ?? [];
    minuteGoals.push(goal);
    goalsByMinute.set(goal.minute, minuteGoals);
  }

  for (let minute = 0; minute < 20; minute++) {
    script.push({
      id: `${match.id}-minute-${minute}`,
      kind: "minute",
      minute,
      period: "regular",
    });

    for (const goal of goalsByMinute.get(minute) ?? []) {
      script.push({ id: `${match.id}-goal-${goal.id}`, kind: "goal", goal });
    }
  }

  if (hasExtraTime(match)) {
    script.push({ id: `${match.id}-extra-time-start`, kind: "extra-time" });

    for (let minute = 21; minute <= 25; minute++) {
      script.push({
        id: `${match.id}-minute-${minute}`,
        kind: "minute",
        minute,
        period: "extra",
      });

      for (const goal of goalsByMinute.get(minute) ?? []) {
        script.push({ id: `${match.id}-goal-${goal.id}`, kind: "goal", goal });
      }
    }
  }

  if (hasGoldenGoal(match)) {
    const goldenGoal = timedTimeline.find((goal) => goal.isGoldenGoal);
    if (goldenGoal) {
      script.push({
        id: `${match.id}-golden-goal-event`,
        kind: "golden-goal",
        teamLabel: goldenGoal.teamLabel,
      });
      script.push({ id: `${match.id}-goal-${goldenGoal.id}`, kind: "goal", goal: goldenGoal });
    }
  }

  for (const winnings of match.winningsDistributeds ?? []) {
    script.push({
      id: `${match.id}-winnings-${winnings.winner}-${winnings.executor}`,
      kind: "winnings",
      winnings,
    });
  }

  script.push({ id: `${match.id}-fulltime`, kind: "fulltime" });

  return script;
}

function getReplayDelay(nextEvent?: ReplayScriptEvent) {
  if (!nextEvent) return 700;

  if (nextEvent.kind === "intro-player") return 180;
  if (nextEvent.kind === "formation") return 220;
  if (nextEvent.kind === "team-stats") return 240;
  if (nextEvent.kind === "minute") return 1800;
  if (nextEvent.kind === "extra-time") return 900;
  if (nextEvent.kind === "golden-goal") return 900;
  if (nextEvent.kind === "goal") return nextEvent.goal.isGoldenGoal ? 700 : 420;
  if (nextEvent.kind === "winnings") return 700;
  if (nextEvent.kind === "fulltime") return 600;

  return 500;
}

const REPLAY_MINUTE_DURATION_MS = 1800;

function formatWei(value: string) {
  try {
    const wei = BigInt(value);
    const whole = wei / 10n ** 18n;
    const frac = ((wei % 10n ** 18n) / 10n ** 14n).toString().padStart(4, "0");
    return `${whole.toString()}.${frac}`;
  } catch {
    return value;
  }
}

function getVisibleGoals(consumedSteps: ReplayScriptEvent[]) {
  return consumedSteps.filter((step): step is Extract<ReplayScriptEvent, { kind: "goal" }> => step.kind === "goal").map((step) => step.goal);
}

function getRevealedPlayers(consumedSteps: ReplayScriptEvent[], teamLabel: TeamLabel) {
  return new Set(
    consumedSteps
      .filter(
        (step): step is Extract<ReplayScriptEvent, { kind: "intro-player" }> =>
          step.kind === "intro-player" && step.teamLabel === teamLabel,
      )
      .map((step) => step.playerId),
  );
}

function getVisibleWinnings(consumedSteps: ReplayScriptEvent[]) {
  return consumedSteps
    .filter((step): step is Extract<ReplayScriptEvent, { kind: "winnings" }> => step.kind === "winnings")
    .map((step) => step.winnings);
}

type ReplayClockAnchor = {
  baseSeconds: number;
  sourceStep: number;
  startedAtMs: number;
  freeze: boolean;
};

function getReplayClockSeconds(
  consumedSteps: ReplayScriptEvent[],
  match: PlayedMatch,
  phase: RevealPhase,
  clockAnchor?: ReplayClockAnchor,
  nowMs?: number,
) {
  if (phase === "complete") {
    return getMatchTargetSeconds(match);
  }

  if (consumedSteps.length === 0) {
    return 0;
  }

  if (clockAnchor) {
    if (clockAnchor.freeze || nowMs === undefined) {
      return clockAnchor.baseSeconds;
    }

    const elapsedMs = Math.max(0, nowMs - clockAnchor.startedAtMs);
    const secondsInMinute = Math.min(59, Math.floor((elapsedMs * 60) / REPLAY_MINUTE_DURATION_MS));
    return clockAnchor.baseSeconds + secondsInMinute;
  }

  const latestMinute = [...consumedSteps]
    .reverse()
    .find((step): step is Extract<ReplayScriptEvent, { kind: "minute" }> => step.kind === "minute");

  const hasGoldenGoalStep = consumedSteps.some(
    (step) => step.kind === "golden-goal" || (step.kind === "goal" && step.goal.isGoldenGoal),
  );

  if (hasGoldenGoalStep) {
    return 26 * 60;
  }

  if (latestMinute) {
    return latestMinute.minute * 60;
  }

  const hasExtraTimeStep = consumedSteps.some((step) => step.kind === "extra-time");
  if (hasExtraTimeStep) {
    return 20 * 60;
  }

  return 0;
}

function formatFormationString(attack: string[], midfield: string[], defense: string[]) {
  return `${attack.length}-${midfield.length}-${defense.length}`;
}

function renderFormationRow(
  label: string,
  playerIds: string[],
  goalCounts: Record<string, number>,
  latestScorer: string | null,
  teamAddress: string,
  teamColour: string,
  playerTypeMap: Map<string, string>,
  playerInfoMap: Map<string, PlayerMatchInfo>,
  revealedPlayers: Set<string>,
  isComplete: boolean,
) {
  if (playerIds.length === 0) return null;
  return (
    <div className="formation-row">
      <div className="position-label">{label}</div>
      <div className="formation-positions matches-history-formation-positions">
        {playerIds.map((id) => (
          <ReplayPositionCard
            key={id}
            playerId={id}
            playerType={playerTypeMap.get(id)}
            playerStats={
              playerInfoMap.get(id)
                ? {
                    attack: playerInfoMap.get(id)!.attack,
                    defense: playerInfoMap.get(id)!.defense,
                    potential: playerInfoMap.get(id)!.potential,
                    gamesLeft: playerInfoMap.get(id)!.gamesLeft,
                    goals: playerInfoMap.get(id)!.goals,
                    position: playerInfoMap.get(id)!.position,
                  }
                : undefined
            }
            goalCount={goalCounts[id] ?? 0}
            isLatestScorer={id === latestScorer}
            positionLabel={label}
            teamAddress={teamAddress}
            teamColour={teamColour}
            isRevealed={isComplete || revealedPlayers.has(id)}
          />
        ))}
      </div>
    </div>
  );
}

function getVisibleScore(visibleGoals: GoalEvent[]) {
  return {
    away: visibleGoals.filter((goal) => goal.teamLabel === "Away").length,
    home: visibleGoals.filter((goal) => goal.teamLabel === "Home").length,
  };
}

function ReplayBroadcastHeader({
  awayScore,
  awayTeamName,
  clockSeconds,
  extraTimeClockSeconds,
  homeScore,
  homeTeamName,
  isComplete,
}: {
  awayScore: number | string;
  awayTeamName: string;
  clockSeconds: number;
  extraTimeClockSeconds?: number;
  homeScore: number | string;
  homeTeamName: string;
  isComplete?: boolean;
}) {
  return (
    <section className="matches-history-broadcast" aria-label="Replay broadcast">
      <div className="matches-history-live-bar">
        {!isComplete && <span className="matches-history-live-dot" aria-hidden="true" />}
        <span>{isComplete ? "Full Time" : "Match Replay"}</span>
        <strong>{formatReplayClock(clockSeconds)}</strong>
        {extraTimeClockSeconds !== undefined && (
          <>
            <span className="matches-history-live-badge">ET</span>
            <strong>{formatReplayClock(extraTimeClockSeconds)}</strong>
          </>
        )}
      </div>
      <div className="matches-history-broadcast-score">
        <span>{homeTeamName}</span>
        <strong>
          {homeScore} - {awayScore}
        </strong>
        <span>{awayTeamName}</span>
      </div>
    </section>
  );
}

function TeamStatsPanel({
  teamAddress,
  teamLabel,
  teamStats,
}: {
  teamAddress: string;
  teamLabel: TeamLabel;
  teamStats?: TeamStatsCalculated;
}) {
  return (
    <section className="matches-history-team-stats" aria-label={`${teamLabel} team stats`}>
      <h4>{teamLabel} Team Stats</h4>
      <div>
        <span>Address</span>
        <strong>{generateName(teamAddress)}</strong>
      </div>
      <div>
        <span>Total attack</span>
        <strong>{teamStats?.totalAttack ?? "-"}</strong>
      </div>
      <div>
        <span>Total defense</span>
        <strong>{teamStats?.totalDefense ?? "-"}</strong>
      </div>
    </section>
  );
}

function WagerEventsPanel({
  match,
  winnings,
}: {
  match: PlayedMatch;
  winnings: WinningsDistributed[];
}) {
  const inferredPot =
    match.pot ??
    (winnings.length > 0
      ? (BigInt(winnings[0].winnings) + BigInt(winnings[0].academyShare) + BigInt(winnings[0].executorFee)).toString()
      : undefined);
  const perPlayerStake = inferredPot ? (BigInt(inferredPot) / 2n).toString() : undefined;

  return (
    <section className="matches-history-wager-events" aria-label={`Match ${match.matchId} wager payouts`}>
      <h4>Wager Distribution</h4>
      <div className="matches-history-wager-pot">
        Each player's stake: {perPlayerStake ? `${formatWei(perPlayerStake)} ${nativeTokenSymbol}` : "Unavailable in subgraph payload"}
      </div>
      {winnings.length === 0 ? (
        <p>No payout event revealed yet.</p>
      ) : (
        <ul>
          {winnings.map((entry, index) => (
            <li key={`${entry.winner}-${entry.executor}-${index}`}>
              <strong>{generateName(entry.winner)}</strong>
              <span>Winner: {formatWei(entry.winnings)} {nativeTokenSymbol}</span>
              <span>Academy: {formatWei(entry.academyShare)} {nativeTokenSymbol}</span>
              <span>Executor: {formatWei(entry.executorFee)} {nativeTokenSymbol}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function GoalEventsPanel({
  goals,
  title,
  homeTeamName,
  awayTeamName,
}: {
  goals: GoalEvent[];
  title: string;
  homeTeamName: string;
  awayTeamName: string;
}) {
  const getGoalTimeLabel = (goal: GoalEvent) => {
    if (goal.isGoldenGoal) return "Golden Goal";
    if (goal.minute > 20) return "ET";
    return `${goal.minute}'`;
  };

  return (
    <section className="matches-history-goals-panel" aria-label={title}>
      <h3>{title}</h3>
      {goals.length === 0 ? (
        <p>No goals scored.</p>
      ) : (
        <ol className="matches-history-goal-list">
          {goals.map((goal, index) => (
            <li className="matches-history-goal-item" key={goal.id}>
              <span className="matches-history-goal-index">{index + 1}</span>
              <div>
                <strong>{goal.playerName}</strong>
                <p>
                  {getGoalTimeLabel(goal)} |{" "}
                  {goal.teamLabel === "Home" ? homeTeamName : goal.teamLabel === "Away" ? awayTeamName : "Unknown Team"}
                </p>
              </div>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

function LiveMiniPlayerCard({
  playerId,
  playerType,
  playerInfo,
  teamAddress,
  teamColour,
  goalCount,
  isLatestScorer,
  isRevealed,
}: {
  playerId: string;
  playerType?: string;
  playerInfo?: PlayerMatchInfo;
  teamAddress: string;
  teamColour: string;
  goalCount: number;
  isLatestScorer: boolean;
  isRevealed: boolean;
}) {
  const name = getPlayerName(BigInt(playerId));
  const teamKitTraits = getTeamKitTraitsFromAddress(teamAddress);

  return (
    <div
      className={[
        "matches-history-mini-card",
        teamColour === "#32ff7e" ? "matches-history-mini-card--home" : "matches-history-mini-card--away",
        !isRevealed ? "matches-history-mini-card--hidden" : "",
        goalCount > 0 ? "matches-history-mini-card--scored" : "",
        isLatestScorer ? "matches-history-mini-card--latest" : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div className="matches-history-mini-card-avatar">
        <FootballPlayerAvatar
          seed={playerType !== undefined ? `${playerId}-${playerType}` : playerId}
          size={32}
          showBadge={false}
          traits={
            teamKitTraits ?? {
              primaryKitColor: teamColour,
              secondaryKitColor: "#ffffff",
            }
          }
        />
      </div>
      <div className="matches-history-mini-card-body">
        <strong>{isRevealed ? name : "Undisclosed"}</strong>
        <span>{playerInfo?.position ?? "Player"}</span>
        <span className="matches-history-mini-card-goal">{goalCount > 0 ? `Goals x${goalCount}` : ""}</span>
      </div>
    </div>
  );
}

function renderCompactPlayerCards({
  playerIds,
  playerTypeMap,
  playerInfoMap,
  revealedPlayers,
  teamAddress,
  teamColour,
  goalCounts,
  latestScorer,
  isComplete,
}: {
  playerIds: string[];
  playerTypeMap: Map<string, string>;
  playerInfoMap: Map<string, PlayerMatchInfo>;
  revealedPlayers: Set<string>;
  teamAddress: string;
  teamColour: string;
  goalCounts: Record<string, number>;
  latestScorer: string | null;
  isComplete: boolean;
}) {
  return playerIds.map((playerId) => (
    <LiveMiniPlayerCard
      key={playerId}
      playerId={playerId}
      playerType={playerTypeMap.get(playerId)}
      playerInfo={playerInfoMap.get(playerId)}
      teamAddress={teamAddress}
      teamColour={teamColour}
      goalCount={goalCounts[playerId] ?? 0}
      isLatestScorer={playerId === latestScorer}
      isRevealed={isComplete || revealedPlayers.has(playerId)}
    />
  ));
}

function LiveMiniFormationPanel({
  homeFormation,
  awayFormation,
  homeTeamName,
  awayTeamName,
  homeAddress,
  awayAddress,
  playerTypeMap,
  playerInfoMap,
  revealedHomePlayers,
  revealedAwayPlayers,
  goalCounts,
  latestScorer,
  isComplete,
}: {
  homeFormation: ReturnType<typeof buildFormation>;
  awayFormation: ReturnType<typeof buildFormation>;
  homeTeamName: string;
  awayTeamName: string;
  homeAddress: string;
  awayAddress: string;
  playerTypeMap: Map<string, string>;
  playerInfoMap: Map<string, PlayerMatchInfo>;
  revealedHomePlayers: Set<string>;
  revealedAwayPlayers: Set<string>;
  goalCounts: Record<string, number>;
  latestScorer: string | null;
  isComplete: boolean;
}) {
  const columns: Array<{ label: string; playerIds: string[]; teamLabel: "Home" | "Away" }> = [
    { label: "home defense", playerIds: homeFormation.defense, teamLabel: "Home" },
    { label: "home mid", playerIds: homeFormation.midfield, teamLabel: "Home" },
    { label: "home att", playerIds: homeFormation.attack, teamLabel: "Home" },
    { label: "away att", playerIds: awayFormation.attack, teamLabel: "Away" },
    { label: "away mid", playerIds: awayFormation.midfield, teamLabel: "Away" },
    { label: "away def", playerIds: awayFormation.defense, teamLabel: "Away" },
  ];

  return (
    <section className="matches-history-mini-formations" aria-label={`Live formations for ${homeTeamName} vs ${awayTeamName}`}>
      <div className="matches-history-mini-formations-header">
        <h4>{homeTeamName}</h4>
        <span>Live formation</span>
        <h4>{awayTeamName}</h4>
      </div>
      <div className="matches-history-mini-pitch">
        {columns.map((column) => (
          <div className="matches-history-mini-column" key={column.label}>
            <div className="matches-history-mini-column-header">{column.label}</div>
            <div className={`matches-history-mini-cards matches-history-mini-cards--${column.teamLabel.toLowerCase()}`}>
              {renderCompactPlayerCards({
                playerIds: column.playerIds,
                playerTypeMap,
                playerInfoMap,
                revealedPlayers: column.teamLabel === "Home" ? revealedHomePlayers : revealedAwayPlayers,
                teamAddress: column.teamLabel === "Home" ? homeAddress : awayAddress,
                teamColour: column.teamLabel === "Home" ? "#32ff7e" : "#1e90ff",
                goalCounts,
                latestScorer,
                isComplete,
              })}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function getRematchLink(match: PlayedMatch, currentAddress?: string) {
  const current = currentAddress?.toLowerCase();
  const isAwayManager = current === match.awayAddress.toLowerCase();
  const home = isAwayManager ? match.awayAddress : currentAddress || match.homeAddress;
  const away = isAwayManager ? match.homeAddress : match.awayAddress;
  const searchParams = new URLSearchParams({
    away,
    home,
    rematch: "1",
    rematchFrom: match.matchId,
  });

  return `/games/start?${searchParams.toString()}`;
}

function RematchPanel({ currentAddress, match }: { currentAddress?: string; match: PlayedMatch }) {
  const current = currentAddress?.toLowerCase();
  const isKnownManager = current === match.homeAddress.toLowerCase() || current === match.awayAddress.toLowerCase();
  const opponentAddress =
    current === match.awayAddress.toLowerCase()
      ? match.homeAddress
      : current === match.homeAddress.toLowerCase()
        ? match.awayAddress
        : match.awayAddress;

  return (
    <section className="rematch-panel" aria-label="Post-match actions">
      <div>
        <span>Run it back</span>
        <strong>Play again vs {generateName(opponentAddress)}</strong>
        <p>
          {isKnownManager
            ? "Creates a new fixture with this opponent prefilled."
            : "Prefills a new fixture from this replay."}
        </p>
      </div>
      <Link className="matches-history-reveal-button rematch-button" to={getRematchLink(match, currentAddress)}>
        Play Again
      </Link>
    </section>
  );
}

export default function ShowMatches({
  embeddedMatchId,
  embeddedTournamentId,
  hideHeader = false,
  onReplayComplete,
}: ShowMatchesProps = {}) {
  const [searchParams] = useSearchParams();
  const { address } = useAccount();
  const [revealPhases, setRevealPhases] = useState<Record<string, RevealPhase>>({});
  const [animSteps, setAnimSteps] = useState<Record<string, number>>({});
  const [replayScripts, setReplayScripts] = useState<Record<string, ReplayScriptEvent[]>>({});
  const [replayClockAnchors, setReplayClockAnchors] = useState<Record<string, ReplayClockAnchor>>({});
  const [clockNowMs, setClockNowMs] = useState(() => Date.now());
  const [fullScreenMatchId, setFullScreenMatchId] = useState<string | null>(null);
  const [myGamesOnly, setMyGamesOnly] = useState(false);
  const notifiedReplayCompletionIdsRef = useRef<Set<string>>(new Set());
  const autoplayMatchId = embeddedMatchId ?? searchParams.get("matchId");
  const tournamentReplayId = embeddedTournamentId ?? searchParams.get("tournamentId");
  const shouldAutoplay = embeddedMatchId !== undefined ? true : searchParams.get("autoplay") === "1";
  const isPinnedTournamentReplay = !!autoplayMatchId && !!tournamentReplayId;
  const pinnedTournamentReplayEntityId =
    autoplayMatchId && tournamentReplayId ? `${autoplayMatchId}-${tournamentReplayId}` : undefined;

  const isRequestedReplayMatch = useCallback(
    (match: PlayedMatch) => {
      const resolvedTournamentId = match.tournamentId ?? "0";
      return match.matchId === autoplayMatchId && (tournamentReplayId ? resolvedTournamentId === tournamentReplayId : resolvedTournamentId === "0");
    },
    [autoplayMatchId, tournamentReplayId],
  );

  const { data, status, error } = useQuery<MatchesResponse>({
    queryKey: isPinnedTournamentReplay
      ? ["tournament-match", autoplayMatchId, tournamentReplayId]
      : myGamesOnly && address
        ? ["my-matches", address]
        : ["recent-matches"],
    async queryFn() {
      if (isPinnedTournamentReplay && autoplayMatchId && tournamentReplayId) {
        const [playedMatchResponse, tournamentReplayResponse] = await Promise.all([
          request<MatchesResponse>(
            matchResultsUrl,
            playedMatchByMatchIdAndTournamentIdQuery,
            { id: pinnedTournamentReplayEntityId },
            matchResultsHeaders,
          ),
          request<TournamentMatchReplayResponse>(
            matchResultsUrl,
            tournamentReplayScoreQuery,
            { tournamentId: tournamentReplayId, tournamentMatchId: autoplayMatchId },
            matchResultsHeaders,
          ),
        ]);

        const replayScore = tournamentReplayResponse.tournamentMatchPlayeds?.[0];
        if (!replayScore || !playedMatchResponse.playedMatches?.length) {
          return playedMatchResponse;
        }

        return {
          playedMatches: playedMatchResponse.playedMatches.map((match) => ({
            ...match,
            homeScore: replayScore.homeScore,
            awayScore: replayScore.awayScore,
          })),
        } satisfies MatchesResponse;
      }

      if (myGamesOnly && address) {
        return await request(matchResultsUrl, myMatchesQuery, { address: address.toLowerCase() }, matchResultsHeaders);
      }
      return await request(matchResultsUrl, recentMatchesQuery, {}, matchResultsHeaders);
    },
    refetchInterval: shouldAutoplay && autoplayMatchId ? 4000 : false,
  });

  const matches = data?.playedMatches ?? [];

  const playerTypeMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const match of matches) {
      for (const info of match.playerMatchInfos ?? []) {
        map.set(info.playerId, String(info.playerType));
      }
    }
    return map;
  }, [matches]);

  const orderedMatches = useMemo(() => {
    if (!autoplayMatchId) return matches;
    const prioritized = matches.find(isRequestedReplayMatch);
    if (!prioritized) return matches;
    return [prioritized, ...matches.filter((match) => match.id !== prioritized.id)];
  }, [autoplayMatchId, isRequestedReplayMatch, matches]);

  useEffect(() => {
    const animating = Object.entries(revealPhases).filter(([, phase]) => phase === "animating");
    if (animating.length === 0) return;

    const timers = animating.map(([matchId]) => {
      const match = matches.find((m) => m.id === matchId);
      const script = replayScripts[matchId] ?? (match ? buildReplayScript(match) : []);
      const step = animSteps[matchId] ?? 0;
      const delay = getReplayDelay(script[step]);

      return setTimeout(() => {
        if (step >= script.length) {
          setRevealPhases((prev) => ({ ...prev, [matchId]: "complete" }));
        } else {
          setAnimSteps((prev) => ({ ...prev, [matchId]: step + 1 }));
        }
      }, delay);
    });

    return () => timers.forEach(clearTimeout);
  }, [revealPhases, animSteps, matches, replayScripts]);

  useEffect(() => {
    const hasAnimating = Object.values(revealPhases).some((phase) => phase === "animating");
    if (!hasAnimating) return;

    const interval = setInterval(() => {
      setClockNowMs(Date.now());
    }, 120);

    return () => clearInterval(interval);
  }, [revealPhases]);

  useEffect(() => {
    setReplayClockAnchors((prev) => {
      let changed = false;
      const next = { ...prev };
      const now = Date.now();

      for (const [matchId, phase] of Object.entries(revealPhases)) {
        if (phase === "hidden") {
          if (next[matchId]) {
            delete next[matchId];
            changed = true;
          }
          continue;
        }

        const match = matches.find((entry) => entry.id === matchId);
        if (!match) continue;

        const script = replayScripts[matchId] ?? buildReplayScript(match);
        const step = animSteps[matchId] ?? 0;
        const consumed = step > 0 ? script[step - 1] : undefined;

        if (phase === "complete") {
          const targetSeconds = getMatchTargetSeconds(match);
          const prevAnchor = next[matchId];
          if (!prevAnchor || prevAnchor.baseSeconds !== targetSeconds || !prevAnchor.freeze || prevAnchor.sourceStep !== step) {
            next[matchId] = {
              baseSeconds: targetSeconds,
              sourceStep: step,
              startedAtMs: now,
              freeze: true,
            };
            changed = true;
          }
          continue;
        }

        if (!consumed) {
          const prevAnchor = next[matchId];
          if (!prevAnchor || prevAnchor.baseSeconds !== 0 || prevAnchor.sourceStep !== 0 || prevAnchor.freeze) {
            next[matchId] = {
              baseSeconds: 0,
              sourceStep: 0,
              startedAtMs: now,
              freeze: false,
            };
            changed = true;
          }
          continue;
        }

        let nextBaseSeconds: number | null = null;
        let freeze = false;

        if (consumed.kind === "minute") {
          nextBaseSeconds = consumed.minute * 60;
        } else if (consumed.kind === "extra-time") {
          nextBaseSeconds = 20 * 60;
        } else if (consumed.kind === "golden-goal" || (consumed.kind === "goal" && consumed.goal.isGoldenGoal)) {
          nextBaseSeconds = 26 * 60;
          freeze = true;
        } else if (consumed.kind === "intro-player" || consumed.kind === "formation" || consumed.kind === "team-stats") {
          nextBaseSeconds = 0;
          freeze = true;
        }

        if (nextBaseSeconds === null) {
          continue;
        }

        const prevAnchor = next[matchId];
        if (!prevAnchor || prevAnchor.sourceStep !== step || prevAnchor.baseSeconds !== nextBaseSeconds || prevAnchor.freeze !== freeze) {
          next[matchId] = {
            baseSeconds: nextBaseSeconds,
            sourceStep: step,
            startedAtMs: now,
            freeze,
          };
          changed = true;
        }
      }

      return changed ? next : prev;
    });
  }, [animSteps, matches, replayScripts, revealPhases]);

  useEffect(() => {
    if (typeof document === "undefined") return;

    const className = "matches-history-body--replay-lock";
    if (fullScreenMatchId) {
      document.body.classList.add(className);
    } else {
      document.body.classList.remove(className);
    }

    return () => {
      document.body.classList.remove(className);
    };
  }, [fullScreenMatchId]);

  const startReveal = useCallback(
    (matchId: string) => {
      const match = matches.find((m) => m.id === matchId);
      const script = match ? buildReplayScript(match) : [];
      setReplayScripts((prev) => ({ ...prev, [matchId]: script }));
      setRevealPhases((prev) => ({ ...prev, [matchId]: "animating" }));
      setAnimSteps((prev) => ({ ...prev, [matchId]: 0 }));
      setReplayClockAnchors((prev) => ({
        ...prev,
        [matchId]: {
          baseSeconds: 0,
          sourceStep: 0,
          startedAtMs: Date.now(),
          freeze: false,
        },
      }));
      setFullScreenMatchId(matchId);
    },
    [matches],
  );

  function skipToReveal(matchId: string) {
    const match = matches.find((m) => m.id === matchId);
    const script = replayScripts[matchId] ?? (match ? buildReplayScript(match) : []);
    setAnimSteps((prev) => ({ ...prev, [matchId]: script.length }));
    setRevealPhases((prev) => ({ ...prev, [matchId]: "complete" }));
  }

  function hideMatch(matchId: string) {
    setRevealPhases((prev) => ({ ...prev, [matchId]: "hidden" }));
    setAnimSteps((prev) => ({ ...prev, [matchId]: 0 }));
    setReplayScripts((prev) => ({ ...prev, [matchId]: [] }));
    setReplayClockAnchors((prev) => {
      const next = { ...prev };
      delete next[matchId];
      return next;
    });
    setFullScreenMatchId((prev) => (prev === matchId ? null : prev));
  }

  function toggleFullscreen(matchId: string) {
    setFullScreenMatchId((prev) => (prev === matchId ? null : matchId));
  }

  useEffect(() => {
    if (!shouldAutoplay || !autoplayMatchId) return;
    const targetMatch = matches.find(isRequestedReplayMatch);
    if (!targetMatch) return;
    if ((revealPhases[targetMatch.id] ?? "hidden") !== "hidden") return;
    startReveal(targetMatch.id);
  }, [autoplayMatchId, isRequestedReplayMatch, matches, revealPhases, shouldAutoplay, startReveal]);

  useEffect(() => {
    if (!onReplayComplete) {
      return;
    }

    const targetMatch = matches.find(isRequestedReplayMatch);
    if (!targetMatch) {
      return;
    }

    const phase = revealPhases[targetMatch.id] ?? "hidden";
    if (phase !== "complete") {
      return;
    }

    if (notifiedReplayCompletionIdsRef.current.has(targetMatch.id)) {
      return;
    }

    notifiedReplayCompletionIdsRef.current.add(targetMatch.id);
    onReplayComplete();
  }, [isRequestedReplayMatch, matches, onReplayComplete, revealPhases]);

  const errorCode = typeof error === "object" && error !== null && "code" in error ? error.code : undefined;

  return (
    <main className="matches-history-panel">
      {!hideHeader && (
        <div className="matches-history-header">
          <span className="section-kicker">Replays</span>
          <h2>
            {isPinnedTournamentReplay
              ? `Tournament Match #${autoplayMatchId} Replay`
              : autoplayMatchId
                ? `Match #${autoplayMatchId} Replay`
                : "Match Replays"}
          </h2>
          <p>
            {isPinnedTournamentReplay
              ? "The selected tournament match is pinned here and will reveal automatically when indexed."
              : autoplayMatchId
                ? "The selected match is pinned here and will reveal automatically when ready."
                : myGamesOnly
                  ? "Showing only matches you played."
                  : "Recent completed fixtures with replay reveals and goal events."}
          </p>
          {!autoplayMatchId && address && (
            <button
              type="button"
              className={`matches-filter-toggle ${myGamesOnly ? "matches-filter-toggle--active" : ""}`}
              onClick={() => setMyGamesOnly((prev) => !prev)}
            >
              {myGamesOnly ? "All Replays" : "My Games"}
            </button>
          )}
        </div>
      )}

      {status === "pending" ? (
        <div className="matches-history-state">
          {isPinnedTournamentReplay ? "Loading tournament match replay..." : "Loading recent matches..."}
        </div>
      ) : null}
      {status === "error" && errorCode ? (
        <div className="matches-history-state">Error ocurred querying the Subgraph</div>
      ) : status === "error" ? (
        <div className="matches-history-state">No games found.</div>
      ) : null}

      {status === "success" && matches.length === 0 ? (
        <div className="matches-history-state">
          {isPinnedTournamentReplay
            ? "No tournament match replay found yet."
            : myGamesOnly
              ? "No completed matches found for your address."
              : "No completed matches found yet."}
        </div>
      ) : null}

      {status === "success" &&
      shouldAutoplay &&
      autoplayMatchId &&
      !matches.some(isRequestedReplayMatch) ? (
        <div className="matches-history-state">
          {isPinnedTournamentReplay
            ? "Waiting for the completed tournament match replay to index..."
            : "Waiting for the completed match replay to index..."}
        </div>
      ) : null}

      {status === "success" && orderedMatches.length > 0 ? (
        <ol className="matches-history-list" aria-label="Match replays">
          {orderedMatches.map((match) => {
            const phase = revealPhases[match.id] ?? "hidden";
            const step = animSteps[match.id] ?? 0;
            const timeline = buildTimedGoalTimeline(match);
            const playerOfMatch = getPlayerOfMatch(timeline);
            const homeTeamName = generateName(match.homeAddress);
            const awayTeamName = generateName(match.awayAddress);
            const playerInfoMap = getPlayerInfoMap(match);
            const teamStatsMap = getTeamStatsMap(match);
            const script = replayScripts[match.id] ?? buildReplayScript(match);
            const consumedSteps = script.slice(0, step);
            const visibleGoals = getVisibleGoals(consumedSteps);
            const latestScorer = visibleGoals.length > 0 ? visibleGoals[visibleGoals.length - 1].playerId : null;
            const visibleScore = getVisibleScore(visibleGoals);
            const visibleWinnings = getVisibleWinnings(consumedSteps);
            const homeFormation = buildFormation(
              match.homeAttackingPlayers,
              match.homeMidfieldPlayers,
              match.homeDefensivePlayers,
            );
            const awayFormation = buildFormation(
              match.awayAttackingPlayers,
              match.awayMidfieldPlayers,
              match.awayDefensivePlayers,
            );
            const revealedHomePlayers =
              phase === "complete" ? new Set([...homeFormation.attack, ...homeFormation.midfield, ...homeFormation.defense]) : getRevealedPlayers(consumedSteps, "Home");
            const revealedAwayPlayers =
              phase === "complete" ? new Set([...awayFormation.attack, ...awayFormation.midfield, ...awayFormation.defense]) : getRevealedPlayers(consumedSteps, "Away");
            const homeStats = teamStatsMap.get(match.homeAddress.toLowerCase());
            const awayStats = teamStatsMap.get(match.awayAddress.toLowerCase());
            const isFullScreen = fullScreenMatchId === match.id;
            const liveClockSeconds = getReplayClockSeconds(
              consumedSteps,
              match,
              phase,
              replayClockAnchors[match.id],
              clockNowMs,
            );
            const showExtraTimeClock =
              hasExtraTime(match) &&
              (phase === "complete" ||
                consumedSteps.some(
                  (event) =>
                    event.kind === "extra-time" ||
                    (event.kind === "minute" && event.period === "extra") ||
                    event.kind === "golden-goal" ||
                    (event.kind === "goal" && event.goal.minute > 20),
                ));
            const extraTimeClockSeconds = showExtraTimeClock ? Math.max(0, liveClockSeconds - 20 * 60) : undefined;
            const formationLabelHome = formatFormationString(
              homeFormation.attack,
              homeFormation.midfield,
              homeFormation.defense,
            );
            const formationLabelAway = formatFormationString(
              awayFormation.attack,
              awayFormation.midfield,
              awayFormation.defense,
            );

            return (
              <li
                className={`matches-history-item matches-history-item-reveal${isFullScreen ? " matches-history-item-reveal--fullscreen" : ""}`}
                key={match.id}
              >
                <div className="matches-history-item-header">
                  <div>
                    <span className="matches-history-match-id">Match #{match.matchId}</span>
                    <p className="matches-history-timestamp">{formatMatchTime(match.blockTimestamp)}</p>
                  </div>
                  {(phase === "animating" || phase === "complete") && (
                    <button className="matches-history-reveal-button" onClick={() => toggleFullscreen(match.id)} type="button">
                      {isFullScreen ? "Exit Full Screen" : "Full Screen"}
                    </button>
                  )}
                  {phase === "hidden" && (
                    <button
                      className="matches-history-reveal-button"
                      onClick={() => startReveal(match.id)}
                      type="button"
                    >
                      Reveal Replay
                    </button>
                  )}
                  {phase === "animating" && (
                    <button
                      className="matches-history-reveal-button matches-history-reveal-button--skip"
                      onClick={() => skipToReveal(match.id)}
                      type="button"
                    >
                      Skip
                    </button>
                  )}
                  {phase === "complete" && (
                    <button className="matches-history-reveal-button" onClick={() => hideMatch(match.id)} type="button">
                      Hide Replay
                    </button>
                  )}
                </div>

                {phase === "hidden" && <div className="matches-history-concealed">Replay hidden until reveal.</div>}

                {phase === "animating" && (
                  <div className="matches-history-animation-body">
                    <ReplayBroadcastHeader
                      awayScore={visibleScore.away}
                      awayTeamName={awayTeamName}
                      clockSeconds={liveClockSeconds}
                      extraTimeClockSeconds={extraTimeClockSeconds}
                      homeScore={visibleScore.home}
                      homeTeamName={homeTeamName}
                      isComplete={false}
                    />

                    <LiveMiniFormationPanel
                      awayAddress={match.awayAddress}
                      awayFormation={awayFormation}
                      awayTeamName={awayTeamName}
                      goalCounts={buildGoalCounts(visibleGoals)}
                      homeAddress={match.homeAddress}
                      homeFormation={homeFormation}
                      homeTeamName={homeTeamName}
                      isComplete={false}
                      latestScorer={latestScorer}
                      playerInfoMap={playerInfoMap}
                      playerTypeMap={playerTypeMap}
                      revealedAwayPlayers={revealedAwayPlayers}
                      revealedHomePlayers={revealedHomePlayers}
                    />

                    <GoalEventsPanel
                      goals={visibleGoals}
                      title="Events"
                      homeTeamName={homeTeamName}
                      awayTeamName={awayTeamName}
                    />

                    <div className="matches-history-replay-teams">
                      <section
                        className="matches-history-team-card matches-history-team-card--replay"
                        aria-label={`${homeTeamName} formation for match ${match.matchId}`}
                      >
                        <h3>{homeTeamName}</h3>
                        <div className="formation-grid-wrapper">
                          {renderFormationRow(
                            "ATTACK",
                            homeFormation.attack,
                            buildGoalCounts(visibleGoals),
                            latestScorer,
                            match.homeAddress,
                            "#32ff7e",
                            playerTypeMap,
                            playerInfoMap,
                            revealedHomePlayers,
                            false,
                          )}
                          {renderFormationRow(
                            "MIDFIELD",
                            homeFormation.midfield,
                            buildGoalCounts(visibleGoals),
                            latestScorer,
                            match.homeAddress,
                            "#32ff7e",
                            playerTypeMap,
                            playerInfoMap,
                            revealedHomePlayers,
                            false,
                          )}
                          {renderFormationRow(
                            "DEFENSE",
                            homeFormation.defense,
                            buildGoalCounts(visibleGoals),
                            latestScorer,
                            match.homeAddress,
                            "#32ff7e",
                            playerTypeMap,
                            playerInfoMap,
                            revealedHomePlayers,
                            false,
                          )}
                        </div>
                      </section>

                      <section
                        className="matches-history-team-card matches-history-team-card--replay"
                        aria-label={`${awayTeamName} formation for match ${match.matchId}`}
                      >
                        <h3>{awayTeamName}</h3>
                        <div className="formation-grid-wrapper">
                          {renderFormationRow(
                            "ATTACK",
                            awayFormation.attack,
                            buildGoalCounts(visibleGoals),
                            latestScorer,
                            match.awayAddress,
                            "#1e90ff",
                            playerTypeMap,
                            playerInfoMap,
                            revealedAwayPlayers,
                            false,
                          )}
                          {renderFormationRow(
                            "MIDFIELD",
                            awayFormation.midfield,
                            buildGoalCounts(visibleGoals),
                            latestScorer,
                            match.awayAddress,
                            "#1e90ff",
                            playerTypeMap,
                            playerInfoMap,
                            revealedAwayPlayers,
                            false,
                          )}
                          {renderFormationRow(
                            "DEFENSE",
                            awayFormation.defense,
                            buildGoalCounts(visibleGoals),
                            latestScorer,
                            match.awayAddress,
                            "#1e90ff",
                            playerTypeMap,
                            playerInfoMap,
                            revealedAwayPlayers,
                            false,
                          )}
                        </div>
                      </section>
                    </div>

                    <section className="match-centre-summary" aria-label={`Match ${match.matchId} tactical summary`}>
                      <div>
                        <span>Home formation</span>
                        <strong>{formationLabelHome}</strong>
                      </div>
                      <div>
                        <span>Away formation</span>
                        <strong>{formationLabelAway}</strong>
                      </div>
                      <div>
                        <span>Replay stage</span>
                        <strong>{consumedSteps.length} / {script.length}</strong>
                      </div>
                    </section>

                    <div className="matches-history-team-stats-grid">
                      <TeamStatsPanel teamAddress={match.homeAddress} teamLabel={toTeamLabel(match, match.homeAddress) ?? "Home"} teamStats={homeStats} />
                      <TeamStatsPanel teamAddress={match.awayAddress} teamLabel={toTeamLabel(match, match.awayAddress) ?? "Away"} teamStats={awayStats} />
                    </div>

                    <WagerEventsPanel match={match} winnings={visibleWinnings} />

                  </div>
                )}

                {phase === "complete" && (
                  <div className="matches-history-reveal-body">
                    <ReplayBroadcastHeader
                      awayScore={match.awayScore}
                      awayTeamName={awayTeamName}
                      clockSeconds={liveClockSeconds}
                      extraTimeClockSeconds={extraTimeClockSeconds}
                      homeScore={match.homeScore}
                      homeTeamName={homeTeamName}
                      isComplete
                    />

                    <GoalEventsPanel
                      goals={timeline}
                      title="Events"
                      homeTeamName={homeTeamName}
                      awayTeamName={awayTeamName}
                    />

                    <section className="match-centre-summary" aria-label={`Match ${match.matchId} centre`}>
                      <div>
                        <span>Final score</span>
                        <strong>
                          {match.homeScore} - {match.awayScore}
                        </strong>
                      </div>
                      <div>
                        <span>Goals</span>
                        <strong>{timeline.length}</strong>
                      </div>
                      <div>
                        <span>Player of match</span>
                        <strong>
                          {playerOfMatch ? `${playerOfMatch.name} (${playerOfMatch.goals})` : "No scorer"}
                        </strong>
                      </div>
                      <div>
                        <span>Formation</span>
                        <strong>{formationLabelHome} vs {formationLabelAway}</strong>
                      </div>
                    </section>

                    <WagerEventsPanel match={match} winnings={match.winningsDistributeds ?? []} />

                    <div className="matches-history-team-stats-grid">
                      <TeamStatsPanel teamAddress={match.homeAddress} teamLabel={toTeamLabel(match, match.homeAddress) ?? "Home"} teamStats={homeStats} />
                      <TeamStatsPanel teamAddress={match.awayAddress} teamLabel={toTeamLabel(match, match.awayAddress) ?? "Away"} teamStats={awayStats} />
                    </div>

                    <div className="matches-history-scoreboard">
                      <div className="matches-history-team-summary">
                        <span className="matches-history-side-label">Home Team</span>
                      </div>
                      <strong className="matches-history-score matches-history-score--revealed">
                        {match.homeScore} - {match.awayScore}
                      </strong>
                      <div className="matches-history-team-summary matches-history-team-summary-away">
                        <span className="matches-history-side-label">Away Team</span>
                      </div>
                    </div>

                    <div className="matches-history-replay-teams">
                      {(() => {
                        const fullCounts = buildGoalCounts(timeline);
                        return (
                          <>
                            <section
                              className="matches-history-team-card matches-history-team-card--replay"
                              aria-label={`${homeTeamName} formation for match ${match.matchId}`}
                            >
                              <h3>{homeTeamName}</h3>
                              <div className="formation-grid-wrapper">
                                {renderFormationRow(
                                  "ATTACK",
                                  homeFormation.attack,
                                  fullCounts,
                                  null,
                                  match.homeAddress,
                                  "#32ff7e",
                                  playerTypeMap,
                                  playerInfoMap,
                                  revealedHomePlayers,
                                  true,
                                )}
                                {renderFormationRow(
                                  "MIDFIELD",
                                  homeFormation.midfield,
                                  fullCounts,
                                  null,
                                  match.homeAddress,
                                  "#32ff7e",
                                  playerTypeMap,
                                  playerInfoMap,
                                  revealedHomePlayers,
                                  true,
                                )}
                                {renderFormationRow(
                                  "DEFENSE",
                                  homeFormation.defense,
                                  fullCounts,
                                  null,
                                  match.homeAddress,
                                  "#32ff7e",
                                  playerTypeMap,
                                  playerInfoMap,
                                  revealedHomePlayers,
                                  true,
                                )}
                              </div>
                            </section>
                            <section
                              className="matches-history-team-card matches-history-team-card--replay"
                              aria-label={`${awayTeamName} formation for match ${match.matchId}`}
                            >
                              <h3>{awayTeamName}</h3>
                              <div className="formation-grid-wrapper">
                                {renderFormationRow(
                                  "ATTACK",
                                  awayFormation.attack,
                                  fullCounts,
                                  null,
                                  match.awayAddress,
                                  "#1e90ff",
                                  playerTypeMap,
                                  playerInfoMap,
                                  revealedAwayPlayers,
                                  true,
                                )}
                                {renderFormationRow(
                                  "MIDFIELD",
                                  awayFormation.midfield,
                                  fullCounts,
                                  null,
                                  match.awayAddress,
                                  "#1e90ff",
                                  playerTypeMap,
                                  playerInfoMap,
                                  revealedAwayPlayers,
                                  true,
                                )}
                                {renderFormationRow(
                                  "DEFENSE",
                                  awayFormation.defense,
                                  fullCounts,
                                  null,
                                  match.awayAddress,
                                  "#1e90ff",
                                  playerTypeMap,
                                  playerInfoMap,
                                  revealedAwayPlayers,
                                  true,
                                )}
                              </div>
                            </section>
                          </>
                        );
                      })()}
                    </div>

                    <RematchPanel currentAddress={address} match={match} />
                  </div>
                )}
              </li>
            );
          })}
        </ol>
      ) : null}
    </main>
  );
}
