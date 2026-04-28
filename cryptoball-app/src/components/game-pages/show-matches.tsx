import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { gql, request } from 'graphql-request'
import { getPlayerName } from '../utils/playerName'
import { ReplayPositionCard } from '../formation-grid-parts/ReplayPositionCard'

type PlayerScored = {
  playerId: string
  goalOrder: number
}

type PlayedMatch = {
  id: string
  matchId: string
  homeScore: number
  awayScore: number
  blockTimestamp: string
  homeAddress: string
  awayAddress: string
  homeAttackingPlayers: string[]
  homeMidfieldPlayers: string[]
  homeDefensivePlayers: string[]
  awayAttackingPlayers: string[]
  awayMidfieldPlayers: string[]
  awayDefensivePlayers: string[]
  playerScoreds: PlayerScored[]
}

type MatchesResponse = {
  playedMatches: PlayedMatch[]
}

const query = gql`
  {
    playedMatches(first: 5, orderBy: blockTimestamp, orderDirection: desc) {
      id
      matchId
      homeScore
      awayScore
      blockTimestamp
      homeAddress
      awayAddress
      homeAttackingPlayers
      homeMidfieldPlayers
      homeDefensivePlayers
      awayAttackingPlayers
      awayMidfieldPlayers
      awayDefensivePlayers
      playerScoreds {
        playerId
        goalOrder
      }
    }
  }
`

const url = 'https://api.studio.thegraph.com/query/1747934/match-results/version/latest'
const graphApiKey = import.meta.env.VITE_GRAPH_API_KEY
const headers = graphApiKey ? { Authorization: `Bearer ${graphApiKey}` } : undefined

function formatMatchTime(blockTimestamp: string) {
  const value = Number(blockTimestamp)

  if (Number.isNaN(value) || value <= 0) {
    return 'Timestamp unavailable'
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value * 1000))
}

function shortenAddress(address: string) {
  if (!address || address.length < 10) {
    return address
  }

  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

function normalizePlayerIds(playerIds: string[]) {
  return playerIds.filter((playerId) => playerId !== '0')
}

function buildFormation(attack: string[], midfield: string[], defense: string[]) {
  return {
    attack: normalizePlayerIds(attack),
    midfield: normalizePlayerIds(midfield),
    defense: normalizePlayerIds(defense),
  }
}

function getGoalTimeline(match: PlayedMatch) {
  const homePlayers = new Set([
    ...normalizePlayerIds(match.homeAttackingPlayers),
    ...normalizePlayerIds(match.homeMidfieldPlayers),
    ...normalizePlayerIds(match.homeDefensivePlayers),
  ])
  const awayPlayers = new Set([
    ...normalizePlayerIds(match.awayAttackingPlayers),
    ...normalizePlayerIds(match.awayMidfieldPlayers),
    ...normalizePlayerIds(match.awayDefensivePlayers),
  ])

  return [...match.playerScoreds]
    .sort((left, right) => left.goalOrder - right.goalOrder)
    .map((goal, index) => {
      const teamLabel = homePlayers.has(goal.playerId)
        ? 'Home'
        : awayPlayers.has(goal.playerId)
          ? 'Away'
          : 'Unknown'

      return {
        id: `${match.id}-${index}`,
        teamLabel,
        playerId: goal.playerId,
        playerName: getPlayerName(BigInt(goal.playerId)),
      }
    })
}

type RevealPhase = 'hidden' | 'animating' | 'complete'

function buildGoalCounts(timeline: ReturnType<typeof getGoalTimeline>): Record<string, number> {
  const counts: Record<string, number> = {}
  for (const goal of timeline) {
    counts[goal.playerId] = (counts[goal.playerId] ?? 0) + 1
  }
  return counts
}

function renderFormationRow(
  label: string,
  icon: string,
  playerIds: string[],
  goalCounts: Record<string, number>,
  latestScorer: string | null,
  teamColour: string,
) {
  if (playerIds.length === 0) return null
  return (
    <div className="formation-row">
      <div className="position-label">
        {icon} {label}
      </div>
      <div
        className="formation-positions"
        style={{ gridTemplateColumns: `repeat(${playerIds.length}, 1fr)` }}
      >
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
  )
}

type GoalEvent = ReturnType<typeof getGoalTimeline>[number]

function shuffleArray<T>(arr: T[]): T[] {
  const copy = [...arr]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

export default function ShowMatches() {
  const [revealPhases, setRevealPhases] = useState<Record<string, RevealPhase>>({})
  const [animSteps, setAnimSteps] = useState<Record<string, number>>({})
  const [shuffledTimelines, setShuffledTimelines] = useState<Record<string, GoalEvent[]>>({})

  const { data, status, error } = useQuery<MatchesResponse>({
    queryKey: ['recent-matches'],
    async queryFn() {
      return await request(url, query, {}, headers)
    },
  })

  const matches = data?.playedMatches ?? []

  useEffect(() => {
    const animating = Object.entries(revealPhases).filter(([, phase]) => phase === 'animating')
    if (animating.length === 0) return

    const timers = animating.map(([matchId]) => {
      const match = matches.find((m) => m.id === matchId)
      const timeline = shuffledTimelines[matchId] ?? (match ? getGoalTimeline(match) : [])
      const step = animSteps[matchId] ?? 0
      const delay = step === 0 ? 600 : 900

      return setTimeout(() => {
        if (step >= timeline.length) {
          setRevealPhases((prev) => ({ ...prev, [matchId]: 'complete' }))
        } else {
          setAnimSteps((prev) => ({ ...prev, [matchId]: step + 1 }))
        }
      }, delay)
    })

    return () => timers.forEach(clearTimeout)
  }, [revealPhases, animSteps, matches])

  function startReveal(matchId: string) {
    const match = matches.find((m) => m.id === matchId)
    const shuffled = match ? shuffleArray(getGoalTimeline(match)) : []
    setShuffledTimelines((prev) => ({ ...prev, [matchId]: shuffled }))
    setRevealPhases((prev) => ({ ...prev, [matchId]: 'animating' }))
    setAnimSteps((prev) => ({ ...prev, [matchId]: 0 }))
  }

  function skipToReveal(matchId: string) {
    setRevealPhases((prev) => ({ ...prev, [matchId]: 'complete' }))
  }

  function hideMatch(matchId: string) {
    setRevealPhases((prev) => ({ ...prev, [matchId]: 'hidden' }))
    setAnimSteps((prev) => ({ ...prev, [matchId]: 0 }))
  }

  return (
    <main className="matches-history-panel">
      <div className="matches-history-header">
        <span className="section-kicker">Results Feed</span>
        <h2>Last 5 Matches</h2>
        <p>Recent completed fixtures pulled from the match results subgraph.</p>
      </div>

      {status === 'pending' ? <div className="matches-history-state">Loading recent matches...</div> : null}
      {status === 'error' && (error as any)?.code ? (
        <div className="matches-history-state">Error ocurred querying the Subgraph</div>
      ) : status === 'error' ? (
        <div className="matches-history-state">No games found.</div>
      ) : null}

      {status === 'success' && matches.length === 0 ? (
        <div className="matches-history-state">No completed matches found yet.</div>
      ) : null}

      {status === 'success' && matches.length > 0 ? (
        <ol className="matches-history-list" aria-label="Last 5 matches">
          {matches.map((match) => {
            const phase = revealPhases[match.id] ?? 'hidden'
            const step = animSteps[match.id] ?? 0
            const timeline = getGoalTimeline(match)
            const animTimeline = shuffledTimelines[match.id] ?? timeline
            const visibleGoals = animTimeline.slice(0, step)
            const latestScorer = visibleGoals.length > 0 ? visibleGoals[visibleGoals.length - 1].playerId : null
            const homeFormation = buildFormation(
              match.homeAttackingPlayers,
              match.homeMidfieldPlayers,
              match.homeDefensivePlayers,
            )
            const awayFormation = buildFormation(
              match.awayAttackingPlayers,
              match.awayMidfieldPlayers,
              match.awayDefensivePlayers,
            )

            return (
              <li className="matches-history-item matches-history-item-reveal" key={match.id}>
                <div className="matches-history-item-header">
                  <div>
                    <span className="matches-history-match-id">Match #{match.matchId}</span>
                    <p className="matches-history-timestamp">{formatMatchTime(match.blockTimestamp)}</p>
                  </div>
                  {phase === 'hidden' && (
                    <button
                      className="matches-history-reveal-button"
                      onClick={() => startReveal(match.id)}
                      type="button"
                    >
                      Reveal Result
                    </button>
                  )}
                  {phase === 'animating' && (
                    <button
                      className="matches-history-reveal-button matches-history-reveal-button--skip"
                      onClick={() => skipToReveal(match.id)}
                      type="button"
                    >
                      Skip →
                    </button>
                  )}
                  {phase === 'complete' && (
                    <button
                      className="matches-history-reveal-button"
                      onClick={() => hideMatch(match.id)}
                      type="button"
                    >
                      Hide Result
                    </button>
                  )}
                </div>

                {phase === 'hidden' && (
                  <div className="matches-history-concealed">Result hidden until reveal.</div>
                )}

                {phase === 'animating' && (
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
                          {renderFormationRow('ATTACK', '⚔️', homeFormation.attack, buildGoalCounts(visibleGoals), latestScorer, '#32ff7e')}
                          {renderFormationRow('MIDFIELD', '⚡', homeFormation.midfield, buildGoalCounts(visibleGoals), latestScorer, '#32ff7e')}
                          {renderFormationRow('DEFENSE', '🛡️', homeFormation.defense, buildGoalCounts(visibleGoals), latestScorer, '#32ff7e')}
                        </div>
                      </section>

                      <section
                        className="matches-history-team-card matches-history-team-card--replay"
                        aria-label={`Away team for match ${match.matchId}`}
                      >
                        <h3>Away Team</h3>
                        <div className="formation-grid-wrapper">
                          {renderFormationRow('ATTACK', '⚔️', awayFormation.attack, buildGoalCounts(visibleGoals), latestScorer, '#1e90ff')}
                          {renderFormationRow('MIDFIELD', '⚡', awayFormation.midfield, buildGoalCounts(visibleGoals), latestScorer, '#1e90ff')}
                          {renderFormationRow('DEFENSE', '🛡️', awayFormation.defense, buildGoalCounts(visibleGoals), latestScorer, '#1e90ff')}
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
                              className={`matches-history-goal-item${i === visibleGoals.length - 1 ? ' matches-history-goal-item--new' : ''}`}
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

                {phase === 'complete' && (
                  <div className="matches-history-reveal-body">
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
                        const fullCounts = buildGoalCounts(timeline)
                        return (
                          <>
                            <section
                              className="matches-history-team-card matches-history-team-card--replay"
                              aria-label={`Home team for match ${match.matchId}`}
                            >
                              <h3>Home Team</h3>
                              <div className="formation-grid-wrapper">
                                {renderFormationRow('ATTACK', '⚔️', homeFormation.attack, fullCounts, null, '#32ff7e')}
                                {renderFormationRow('MIDFIELD', '⚡', homeFormation.midfield, fullCounts, null, '#32ff7e')}
                                {renderFormationRow('DEFENSE', '🛡️', homeFormation.defense, fullCounts, null, '#32ff7e')}
                              </div>
                            </section>
                            <section
                              className="matches-history-team-card matches-history-team-card--replay"
                              aria-label={`Away team for match ${match.matchId}`}
                            >
                              <h3>Away Team</h3>
                              <div className="formation-grid-wrapper">
                                {renderFormationRow('ATTACK', '⚔️', awayFormation.attack, fullCounts, null, '#1e90ff')}
                                {renderFormationRow('MIDFIELD', '⚡', awayFormation.midfield, fullCounts, null, '#1e90ff')}
                                {renderFormationRow('DEFENSE', '🛡️', awayFormation.defense, fullCounts, null, '#1e90ff')}
                              </div>
                            </section>
                          </>
                        )
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
            )
          })}
        </ol>
      ) : null}
    </main>
  )
}
