import { useQuery } from "@tanstack/react-query";
import { request } from "graphql-request";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
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
  icon: string,
  playerIds: string[],
  goalCounts: Record<string, number>,
  latestScorer: string | null,
  teamColour: string,
) {
  if (playerIds.length === 0) return null;
  return (
    <div className="formation-row">
      <div className="position-label">
        {icon} {label}
      </div>
      <div className="formation-positions" style={{ gridTemplateColumns: `repeat(${playerIds.length}, 1fr)` }}>
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

export default function ShowMatches() {
  const [searchParams] = useSearchParams();
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
                    <div className="matches-history-live-bar">
                      <span className="matches-history-live-dot" aria-hidden="true" />
                      <span>Match Replay</span>
                    </div>

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
