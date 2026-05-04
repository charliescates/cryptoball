import { useQuery } from "@tanstack/react-query";
import { request } from "graphql-request";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useAccount } from "wagmi";
import { ReplayPositionCard } from "../formation-grid-parts/ReplayPositionCard";
import { getPlayerName } from "../utils/playerName";
import {
  type MatchesResponse,
  type PlayedMatch,
  matchResultsHeaders,
  matchResultsUrl,
  recentMatchesQuery,
} from "./matchResultsQuery";

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

function shortenAddress(address: string) {
  if (!address || address.length < 10) {
    return address;
  }

  return `${address.slice(0, 6)}...${address.slice(-4)}`;
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
      const teamLabel = homePlayers.has(goal.playerId) ? "Home" : awayPlayers.has(goal.playerId) ? "Away" : "Unknown";

      return {
        id: `${match.id}-${index}`,
        teamLabel,
        playerId: goal.playerId,
        playerName: getPlayerName(BigInt(goal.playerId)),
      };
    });
}

type RevealPhase = "hidden" | "animating" | "complete";

function buildGoalCounts(timeline: ReturnType<typeof getGoalTimeline>): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const goal of timeline) {
    counts[goal.playerId] = (counts[goal.playerId] ?? 0) + 1;
  }
  return counts;
}

function getPlayerOfMatch(timeline: ReturnType<typeof getGoalTimeline>) {
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

function renderFormationRow(
  label: string,
  _icon: string,
  playerIds: string[],
  goalCounts: Record<string, number>,
  latestScorer: string | null,
  teamColour: string,
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
            goalCount={goalCounts[id] ?? 0}
            isLatestScorer={id === latestScorer}
            positionLabel={label}
            teamColour={teamColour}
          />
        ))}
      </div>
    </div>
  );
}

type GoalEvent = ReturnType<typeof getGoalTimeline>[number];

function shuffleArray<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function getVisibleScore(visibleGoals: GoalEvent[]) {
  return {
    away: visibleGoals.filter((goal) => goal.teamLabel === "Away").length,
    home: visibleGoals.filter((goal) => goal.teamLabel === "Home").length,
  };
}

function ReplayBroadcastHeader({
  awayScore,
  homeScore,
  latestGoal,
  totalGoals,
  visibleGoalCount,
}: {
  awayScore: number | string;
  homeScore: number | string;
  latestGoal: GoalEvent | null;
  totalGoals: number;
  visibleGoalCount: number;
}) {
  const progress = totalGoals > 0 ? Math.min(100, Math.round((visibleGoalCount / totalGoals) * 100)) : 100;

  return (
    <section className="matches-history-broadcast" aria-label="Replay broadcast">
      <div className="matches-history-live-bar">
        <span className="matches-history-live-dot" aria-hidden="true" />
        <span>Match Replay</span>
      </div>
      <div className="matches-history-broadcast-score">
        <span>Home</span>
        <strong>
          {homeScore} - {awayScore}
        </strong>
        <span>Away</span>
      </div>
      <div className="matches-history-replay-progress" aria-label={`Replay progress ${progress}%`}>
        <span style={{ width: `${progress}%` }} />
      </div>
      <div className="matches-history-latest-goal">
        <span>
          {visibleGoalCount > 0 ? `Goal ${visibleGoalCount} of ${Math.max(totalGoals, visibleGoalCount)}` : "Kick off"}
        </span>
        <strong>
          {latestGoal ? `${latestGoal.teamLabel}: ${latestGoal.playerName}` : "Waiting for the first chance"}
        </strong>
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
        <strong>Play again vs {shortenAddress(opponentAddress)}</strong>
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

export default function ShowMatches() {
  const [searchParams] = useSearchParams();
  const { address } = useAccount();
  const [revealPhases, setRevealPhases] = useState<Record<string, RevealPhase>>({});
  const [animSteps, setAnimSteps] = useState<Record<string, number>>({});
  const [shuffledTimelines, setShuffledTimelines] = useState<Record<string, GoalEvent[]>>({});
  const autoplayMatchId = searchParams.get("matchId");
  const shouldAutoplay = searchParams.get("autoplay") === "1";

  const { data, status, error } = useQuery<MatchesResponse>({
    queryKey: ["recent-matches"],
    async queryFn() {
      return await request(matchResultsUrl, recentMatchesQuery, {}, matchResultsHeaders);
    },
    refetchInterval: shouldAutoplay && autoplayMatchId ? 4000 : false,
  });

  const matches = data?.playedMatches ?? [];
  const orderedMatches = useMemo(() => {
    if (!autoplayMatchId) return matches;
    const prioritized = matches.find((match) => match.matchId === autoplayMatchId);
    if (!prioritized) return matches;
    return [prioritized, ...matches.filter((match) => match.id !== prioritized.id)];
  }, [autoplayMatchId, matches]);

  useEffect(() => {
    const animating = Object.entries(revealPhases).filter(([, phase]) => phase === "animating");
    if (animating.length === 0) return;

    const timers = animating.map(([matchId]) => {
      const match = matches.find((m) => m.id === matchId);
      const timeline = shuffledTimelines[matchId] ?? (match ? getGoalTimeline(match) : []);
      const step = animSteps[matchId] ?? 0;
      const delay = step === 0 ? 600 : 900;

      return setTimeout(() => {
        if (step >= timeline.length) {
          setRevealPhases((prev) => ({ ...prev, [matchId]: "complete" }));
        } else {
          setAnimSteps((prev) => ({ ...prev, [matchId]: step + 1 }));
        }
      }, delay);
    });

    return () => timers.forEach(clearTimeout);
  }, [revealPhases, animSteps, matches, shuffledTimelines]);

  const startReveal = useCallback(
    (matchId: string) => {
      const match = matches.find((m) => m.id === matchId);
      const shuffled = match ? shuffleArray(getGoalTimeline(match)) : [];
      setShuffledTimelines((prev) => ({ ...prev, [matchId]: shuffled }));
      setRevealPhases((prev) => ({ ...prev, [matchId]: "animating" }));
      setAnimSteps((prev) => ({ ...prev, [matchId]: 0 }));
    },
    [matches],
  );

  function skipToReveal(matchId: string) {
    setRevealPhases((prev) => ({ ...prev, [matchId]: "complete" }));
  }

  function hideMatch(matchId: string) {
    setRevealPhases((prev) => ({ ...prev, [matchId]: "hidden" }));
    setAnimSteps((prev) => ({ ...prev, [matchId]: 0 }));
  }

  useEffect(() => {
    if (!shouldAutoplay || !autoplayMatchId) return;
    const targetMatch = matches.find((match) => match.matchId === autoplayMatchId);
    if (!targetMatch) return;
    if ((revealPhases[targetMatch.id] ?? "hidden") !== "hidden") return;
    startReveal(targetMatch.id);
  }, [autoplayMatchId, matches, revealPhases, shouldAutoplay, startReveal]);

  const errorCode = typeof error === "object" && error !== null && "code" in error ? error.code : undefined;

  return (
    <main className="matches-history-panel">
      <div className="matches-history-header">
        <span className="section-kicker">Replays</span>
        <h2>{autoplayMatchId ? `Match #${autoplayMatchId} Replay` : "Match Replays"}</h2>
        <p>
          {autoplayMatchId
            ? "The selected match is pinned here and will reveal automatically when ready."
            : "Recent completed fixtures with replay reveals and goal events."}
        </p>
      </div>

      {status === "pending" ? <div className="matches-history-state">Loading recent matches...</div> : null}
      {status === "error" && errorCode ? (
        <div className="matches-history-state">Error ocurred querying the Subgraph</div>
      ) : status === "error" ? (
        <div className="matches-history-state">No games found.</div>
      ) : null}

      {status === "success" && matches.length === 0 ? (
        <div className="matches-history-state">No completed matches found yet.</div>
      ) : null}

      {status === "success" &&
      shouldAutoplay &&
      autoplayMatchId &&
      !matches.some((match) => match.matchId === autoplayMatchId) ? (
        <div className="matches-history-state">Waiting for the completed match replay to index...</div>
      ) : null}

      {status === "success" && orderedMatches.length > 0 ? (
        <ol className="matches-history-list" aria-label="Match replays">
          {orderedMatches.map((match) => {
            const phase = revealPhases[match.id] ?? "hidden";
            const step = animSteps[match.id] ?? 0;
            const timeline = getGoalTimeline(match);
            const playerOfMatch = getPlayerOfMatch(timeline);
            const animTimeline = shuffledTimelines[match.id] ?? timeline;
            const visibleGoals = animTimeline.slice(0, step);
            const latestScorer = visibleGoals.length > 0 ? visibleGoals[visibleGoals.length - 1].playerId : null;
            const latestGoal = visibleGoals.length > 0 ? visibleGoals[visibleGoals.length - 1] : null;
            const visibleScore = getVisibleScore(visibleGoals);
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

            return (
              <li className="matches-history-item matches-history-item-reveal" key={match.id}>
                <div className="matches-history-item-header">
                  <div>
                    <span className="matches-history-match-id">Match #{match.matchId}</span>
                    <p className="matches-history-timestamp">{formatMatchTime(match.blockTimestamp)}</p>
                  </div>
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
                      Skip →
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
                      homeScore={visibleScore.home}
                      latestGoal={latestGoal}
                      totalGoals={animTimeline.length}
                      visibleGoalCount={visibleGoals.length}
                    />

                    <div className="matches-history-replay-teams">
                      <section
                        className="matches-history-team-card matches-history-team-card--replay"
                        aria-label={`Home team for match ${match.matchId}`}
                      >
                        <h3>Home Team</h3>
                        <div className="formation-grid-wrapper">
                          {renderFormationRow(
                            "ATTACK",
                            "⚔️",
                            homeFormation.attack,
                            buildGoalCounts(visibleGoals),
                            latestScorer,
                            "#32ff7e",
                          )}
                          {renderFormationRow(
                            "MIDFIELD",
                            "⚡",
                            homeFormation.midfield,
                            buildGoalCounts(visibleGoals),
                            latestScorer,
                            "#32ff7e",
                          )}
                          {renderFormationRow(
                            "DEFENSE",
                            "🛡️",
                            homeFormation.defense,
                            buildGoalCounts(visibleGoals),
                            latestScorer,
                            "#32ff7e",
                          )}
                        </div>
                      </section>

                      <section
                        className="matches-history-team-card matches-history-team-card--replay"
                        aria-label={`Away team for match ${match.matchId}`}
                      >
                        <h3>Away Team</h3>
                        <div className="formation-grid-wrapper">
                          {renderFormationRow(
                            "ATTACK",
                            "⚔️",
                            awayFormation.attack,
                            buildGoalCounts(visibleGoals),
                            latestScorer,
                            "#1e90ff",
                          )}
                          {renderFormationRow(
                            "MIDFIELD",
                            "⚡",
                            awayFormation.midfield,
                            buildGoalCounts(visibleGoals),
                            latestScorer,
                            "#1e90ff",
                          )}
                          {renderFormationRow(
                            "DEFENSE",
                            "🛡️",
                            awayFormation.defense,
                            buildGoalCounts(visibleGoals),
                            latestScorer,
                            "#1e90ff",
                          )}
                        </div>
                      </section>
                    </div>

                    <section className="matches-history-goal-reveal-panel">
                      <h3>Goals</h3>
                      {visibleGoals.length === 0 ? (
                        <p className="matches-history-kickoff-hint">Kick off...</p>
                      ) : (
                        <ol className="matches-history-goal-list">
                          {visibleGoals.map((goal, i) => (
                            <li
                              key={goal.id}
                              className={`matches-history-goal-item${i === visibleGoals.length - 1 ? " matches-history-goal-item--new" : ""}`}
                            >
                              <span className="matches-history-goal-index">{i + 1}</span>
                              <div>
                                <strong>{goal.teamLabel}</strong>
                                <p>{goal.playerName}</p>
                              </div>
                            </li>
                          ))}
                        </ol>
                      )}
                    </section>
                  </div>
                )}

                {phase === "complete" && (
                  <div className="matches-history-reveal-body">
                    <ReplayBroadcastHeader
                      awayScore={match.awayScore}
                      homeScore={match.homeScore}
                      latestGoal={timeline.length > 0 ? timeline[timeline.length - 1] : null}
                      totalGoals={timeline.length}
                      visibleGoalCount={timeline.length}
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
                    </section>

                    <div className="matches-history-scoreboard">
                      <div className="matches-history-team-summary">
                        <span className="matches-history-side-label">Home Team</span>
                        <strong>{shortenAddress(match.homeAddress)}</strong>
                      </div>
                      <strong className="matches-history-score matches-history-score--revealed">
                        {match.homeScore} - {match.awayScore}
                      </strong>
                      <div className="matches-history-team-summary matches-history-team-summary-away">
                        <span className="matches-history-side-label">Away Team</span>
                        <strong>{shortenAddress(match.awayAddress)}</strong>
                      </div>
                    </div>

                    <div className="matches-history-replay-teams">
                      {(() => {
                        const fullCounts = buildGoalCounts(timeline);
                        return (
                          <>
                            <section
                              className="matches-history-team-card matches-history-team-card--replay"
                              aria-label={`Home team for match ${match.matchId}`}
                            >
                              <h3>Home Team</h3>
                              <div className="formation-grid-wrapper">
                                {renderFormationRow("ATTACK", "⚔️", homeFormation.attack, fullCounts, null, "#32ff7e")}
                                {renderFormationRow(
                                  "MIDFIELD",
                                  "⚡",
                                  homeFormation.midfield,
                                  fullCounts,
                                  null,
                                  "#32ff7e",
                                )}
                                {renderFormationRow("DEFENSE", "🛡️", homeFormation.defense, fullCounts, null, "#32ff7e")}
                              </div>
                            </section>
                            <section
                              className="matches-history-team-card matches-history-team-card--replay"
                              aria-label={`Away team for match ${match.matchId}`}
                            >
                              <h3>Away Team</h3>
                              <div className="formation-grid-wrapper">
                                {renderFormationRow("ATTACK", "⚔️", awayFormation.attack, fullCounts, null, "#1e90ff")}
                                {renderFormationRow(
                                  "MIDFIELD",
                                  "⚡",
                                  awayFormation.midfield,
                                  fullCounts,
                                  null,
                                  "#1e90ff",
                                )}
                                {renderFormationRow("DEFENSE", "🛡️", awayFormation.defense, fullCounts, null, "#1e90ff")}
                              </div>
                            </section>
                          </>
                        );
                      })()}
                    </div>

                    <section className="matches-history-goals-panel">
                      <h3>Goal Events</h3>
                      {timeline.length > 0 ? (
                        <ol className="matches-history-goal-list">
                          {timeline.map((goal, index) => (
                            <li className="matches-history-goal-item" key={goal.id}>
                              <span className="matches-history-goal-index">{index + 1}</span>
                              <div>
                                <strong>{goal.teamLabel}</strong>
                                <p>{goal.playerName}</p>
                              </div>
                            </li>
                          ))}
                        </ol>
                      ) : (
                        <div className="matches-history-state">No scorer events were indexed for this match.</div>
                      )}
                    </section>
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
