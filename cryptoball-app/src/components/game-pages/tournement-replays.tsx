import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ContractFunctionZeroDataError, formatEther, parseAbiItem } from "viem";
import { useAccount, usePublicClient, useReadContract, useWaitForTransactionReceipt, useWriteContract } from "wagmi";

import { tournementContract } from "../../contracts/tournementContract";
import { gameContract } from "../../contracts/gameContract";
import { playerContract } from "../../contracts/playerContract";
import { activeChain } from "../../config/network";
import generateName from "../utils/teamName";
import CreateTournamentButton from "../actions/create-tournament/CreateTournamentButton";
import TeamBuilder from "./join-match/TeamBuilder";
import { useFormationBuilder } from "./join-match/useFormationBuilder";
import { nativeTokenSymbol } from "../../config/network";
import type { Player } from "../player";

type TournamentMatch = {
  id: string;
  tournamentId: string;
  tournamentMatchId: string;
  round: number;
  homeAddress: string;
  awayAddress: string;
  winner?: string;
  homeScore?: number;
  awayScore?: number;
  blockNumber: bigint;
};

type TournamentActivityTone = "neutral" | "success" | "warning" | "info";

type TournamentActivity = {
  id: string;
  blockNumber?: bigint;
  blockTimestamp?: bigint;
  label: string;
  detail?: string;
  tone: TournamentActivityTone;
};

type TournamentView = {
  id: string;
  creator?: string;
  rounds: number;
  entryFee: bigint;
  minAttack: number;
  minDefence: number;
  maxAttack: number;
  maxDefence: number;
  maxTeams: number;
  matches: TournamentMatch[];
  champion?: string;
  championWinnings?: bigint;
  executorFees?: bigint;
  teamsEntered: number;
  entrants: string[];
  isReady: boolean;
  cancelled: boolean;
  currentRound: number;
  activity: TournamentActivity[];
};

type TournamentSection = "start" | "open" | "replay";

type TournementSummary = {
  tournamentId: bigint;
  rounds: bigint;
  entryFee: bigint;
  minAttack: bigint;
  minDefence: bigint;
  maxAttack: bigint;
  maxDefence: bigint;
  includeTypes: bigint[];
  excludeTypes: bigint[];
  creator: string;
  teamsEntered: bigint;
  maxTeams: bigint;
  isOpen: boolean;
  isReady: boolean;
  cancelled: boolean;
  currentRound: bigint;
  champion: string;
};

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

const tournamentMatchPlayedEvent = parseAbiItem(
  "event TournamentMatchPlayed(uint256 indexed tournamentId, uint256 tournamentMatchId, uint8 indexed round, address homeAddress, address awayAddress, address winner, uint8 homeScore, uint8 awayScore)",
);

function formatPol(wei: bigint) {
  const full = formatEther(wei);
  const [intPart, decimal = ""] = full.split(".");
  const shortDecimal = decimal.slice(0, 4).replace(/0+$/, "");
  return shortDecimal ? `${intPart}.${shortDecimal} ${nativeTokenSymbol}` : `${intPart} ${nativeTokenSymbol}`;
}

function makeMatchId(tournementId: string, round: number, index: number) {
  return `${tournementId}-${round}-${index}`;
}

function getTournamentStatus(tournament: TournamentView): { label: string; tone: TournamentActivityTone } {
  if (tournament.cancelled) {
    return { label: "Cancelled", tone: "warning" };
  }

  if (tournament.champion) {
    return { label: "Completed", tone: "success" };
  }

  if (tournament.currentRound > 0) {
    return { label: `Round ${tournament.currentRound}`, tone: "info" };
  }

  if (tournament.isReady) {
    return { label: "Ready", tone: "success" };
  }

  return { label: "Open", tone: "neutral" };
}

function padPlayersTo3(players: Player[]): [bigint, bigint, bigint] {
  return [players[0]?.id ?? 0n, players[1]?.id ?? 0n, players[2]?.id ?? 0n];
}

function buildReplayGoals(match: TournamentMatch) {
  const home = match.homeScore ?? 0;
  const away = match.awayScore ?? 0;
  const goals: { minute: number; side: "home" | "away" }[] = [];

  const totalGoals = home + away;
  if (totalGoals === 0) return goals;

  let homeLeft = home;
  let awayLeft = away;
  for (let i = 0; i < totalGoals; i++) {
    const minute = Math.min(90, 8 + i * Math.ceil(80 / totalGoals));
    const pickHome = homeLeft > 0 && (awayLeft === 0 || i % 2 === 0);
    if (pickHome) {
      goals.push({ minute, side: "home" });
      homeLeft -= 1;
    } else {
      goals.push({ minute, side: "away" });
      awayLeft -= 1;
    }
  }
  return goals;
}

export default function TournementReplays({ section }: { section?: TournamentSection }) {
  const { address } = useAccount();
  const publicClient = usePublicClient();
  const formationBuilder = useFormationBuilder();
  const [selectedTournamentId, setSelectedTournamentId] = useState<string | null>(null);
  const [selectedMatchId, setSelectedMatchId] = useState<string | null>(null);
  const [entryValidationError, setEntryValidationError] = useState<string | null>(null);

  const { data: claimHash, writeContract: writeClaimContract, isPending: isClaimPending, error: claimError } = useWriteContract();
  const { isLoading: isClaimConfirming, isSuccess: isClaimConfirmed } = useWaitForTransactionReceipt({
    hash: claimHash,
  });
  const { data: enterHash, writeContract: writeEnterContract, isPending: isEnterPending, error: enterError } = useWriteContract();
  const { isLoading: isEnterConfirming, isSuccess: isEnterConfirmed } = useWaitForTransactionReceipt({
    hash: enterHash,
  });
  const { data: startHash, writeContract: writeStartContract, isPending: isStartPending, error: startError } = useWriteContract();
  const { isLoading: isStartConfirming, isSuccess: isStartConfirmed } = useWaitForTransactionReceipt({
    hash: startHash,
  });
  const { data: cancelHash, writeContract: writeCancelContract, isPending: isCancelPending, error: cancelError } = useWriteContract();
  const { isLoading: isCancelConfirming, isSuccess: isCancelConfirmed } = useWaitForTransactionReceipt({
    hash: cancelHash,
  });
  const { data: refundHash, writeContract: writeRefundContract, isPending: isRefundPending, error: refundError } = useWriteContract();
  const { isLoading: isRefundConfirming, isSuccess: isRefundConfirmed } = useWaitForTransactionReceipt({
    hash: refundHash,
  });

  const { data: myPlayers } = useReadContract({
    abi: playerContract.abi,
    address: playerContract.address,
    functionName: "getPlayersByOwner",
    args: [address ?? ZERO_ADDRESS],
    query: {
      enabled: !!address,
    },
  });

  const ownedPlayers = (myPlayers as Player[] | undefined) ?? [];

  const uniqueOwnedPlayers = useMemo(() => {
    const seen = new Set<string>();
    const players: Player[] = [];
    for (const player of ownedPlayers) {
      if (player.id === 0n) continue;
      const key = player.id.toString();
      if (seen.has(key)) continue;
      seen.add(key);
      players.push(player);
    }
    return players;
  }, [ownedPlayers]);

  const contractConfigured = tournementContract.address.toLowerCase() !== ZERO_ADDRESS;

  const { data: tournaments = [], status, error, refetch } = useQuery<TournamentView[]>({
    queryKey: ["tournament-feed", tournementContract.address, gameContract.address],
    enabled: contractConfigured && !!publicClient,
    async queryFn() {
      if (!contractConfigured || !publicClient) return [];

      let summaries: TournementSummary[];
      try {
        summaries = (await publicClient.readContract({
          address: tournementContract.address,
          abi: tournementContract.abi,
          functionName: "getTournements",
        })) as TournementSummary[];
      } catch (queryError) {
        if (queryError instanceof ContractFunctionZeroDataError) {
          return [];
        }

        throw queryError;
      }

      if (summaries.length === 0) {
        return [];
      }

      const tournamentMap = new Map<string, TournamentView>();

      for (const summary of summaries) {
        const id = summary.tournamentId.toString();
        const rounds = Number(summary.rounds);
        const teamsEntered = Number(summary.teamsEntered);
        const maxTeams = Number(summary.maxTeams);
        const currentRound = Number(summary.currentRound);
        const champion = summary.champion !== ZERO_ADDRESS ? summary.champion : undefined;
        const activity: TournamentActivity[] = [];

        if (summary.isReady) {
          activity.push({
            id: `ready-${id}`,
            label: "Tournament ready",
            detail: `${teamsEntered}/${maxTeams} teams entered`,
            tone: "success",
          });
        } else if (currentRound > 0) {
          activity.push({
            id: `round-${id}`,
            label: `Round ${currentRound} active`,
            detail: `${teamsEntered}/${maxTeams} teams entered`,
            tone: "info",
          });
        } else {
          activity.push({
            id: `open-${id}`,
            label: "Open for entry",
            detail: `${teamsEntered}/${maxTeams} teams entered`,
            tone: "neutral",
          });
        }

        tournamentMap.set(id, {
          id,
          creator: summary.creator,
          rounds,
          entryFee: summary.entryFee,
          minAttack: Number(summary.minAttack),
          minDefence: Number(summary.minDefence),
          maxAttack: Number(summary.maxAttack),
          maxDefence: Number(summary.maxDefence),
          maxTeams,
          matches: [],
          champion,
          teamsEntered,
          entrants: [],
          isReady: summary.isReady,
          cancelled: summary.cancelled,
          currentRound,
          activity,
        });
      }

      let tournamentMatchLogs: Awaited<ReturnType<typeof publicClient.getLogs>> = [];
      try {
        const tournamentsToFetch = summaries.map((summary) => summary.tournamentId);
        const logsByTournament = await Promise.all(
          tournamentsToFetch.map(async (tournamentId) => {
            const logs = await publicClient.getLogs({
              address: gameContract.address,
              event: tournamentMatchPlayedEvent,
              args: { tournamentId },
              fromBlock: 0n,
              toBlock: "latest",
            });
            return logs;
          }),
        );
        tournamentMatchLogs = logsByTournament.flat();
      } catch (logError) {
        console.error("Error fetching tournament match logs from contract:", logError);
      }

      const matchesByTournament = new Map<string, TournamentMatch[]>();
      for (const log of tournamentMatchLogs) {
        if (!("args" in log) || log.args == null) {
          continue;
        }

        const args = log.args as {
          tournamentId?: bigint;
          tournamentMatchId?: bigint;
          round?: number;
          homeAddress?: string;
          awayAddress?: string;
          winner?: string;
          homeScore?: number;
          awayScore?: number;
        };

        if (args.tournamentId == null || args.tournamentMatchId == null) {
          continue;
        }

        const tournamentId = args.tournamentId.toString();
        const round = Number(args.round ?? 0);
        const homeScore = Number(args.homeScore ?? 0);
        const awayScore = Number(args.awayScore ?? 0);
        const homeAddress = args.homeAddress ?? ZERO_ADDRESS;
        const awayAddress = args.awayAddress ?? ZERO_ADDRESS;
        const winner = args.winner ?? ZERO_ADDRESS;

        const tournament = tournamentMap.get(tournamentId);
        if (!tournament) {
          continue;
        }

        const matches = matchesByTournament.get(tournamentId) ?? [];
        matches.push({
          id: `${String(log.transactionHash ?? "0x")}-${String(log.logIndex ?? 0)}`,
          tournamentId,
          tournamentMatchId: args.tournamentMatchId.toString(),
          round,
          homeAddress,
          awayAddress,
          winner,
          homeScore,
          awayScore,
          blockNumber: log.blockNumber ?? 0n,
        });
        matchesByTournament.set(tournamentId, matches);

        tournament.activity.push({
          id: `match-played-${log.transactionHash ?? "0x"}-${String(log.logIndex ?? 0)}`,
          blockNumber: log.blockNumber ?? 0n,
          label: `Round ${round} result`,
          detail: `${homeScore}-${awayScore}, winner ${generateName(winner)}`,
          tone: "success",
        });
      }

      for (const [id, matches] of matchesByTournament.entries()) {
        const current = tournamentMap.get(id);
        if (!current) {
          continue;
        }

        current.matches = matches
          .sort((a, b) => {
            if (a.round !== b.round) return a.round - b.round;
            return Number(a.blockNumber - b.blockNumber);
          })
          .map((match, index) => ({
            ...match,
            id: makeMatchId(id, match.round, index),
          }));
      }

      for (const tournament of tournamentMap.values()) {
        tournament.activity.sort((a, b) => Number((b.blockNumber ?? 0n) - (a.blockNumber ?? 0n)));
      }

      return [...tournamentMap.values()].sort((a, b) => Number(BigInt(b.id) - BigInt(a.id)));
    },
    refetchInterval: 8000,
  });

  const selectedTournament = useMemo(
    () => tournaments.find((t) => t.id === selectedTournamentId) ?? tournaments[0],
    [selectedTournamentId, tournaments],
  );

  const selectedMatch = useMemo(
    () => selectedTournament?.matches.find((m) => m.id === selectedMatchId) ?? selectedTournament?.matches[0],
    [selectedTournament, selectedMatchId],
  );

  const replayGoals = useMemo(() => (selectedMatch ? buildReplayGoals(selectedMatch) : []), [selectedMatch]);

  function handleClaimReward(tournementId: string) {
    writeClaimContract({
      address: tournementContract.address,
      abi: tournementContract.abi,
      functionName: "claimReward",
      chainId: activeChain.id,
      args: [BigInt(tournementId)],
    });
  }

  function handleStartTournament(tournementId: string) {
    writeStartContract({
      address: tournementContract.address,
      abi: tournementContract.abi,
      functionName: "start",
      chainId: activeChain.id,
      args: [BigInt(tournementId)],
    });
  }

  function handleCancelTournament(tournementId: string) {
    writeCancelContract({
      address: tournementContract.address,
      abi: tournementContract.abi,
      functionName: "cancel",
      chainId: activeChain.id,
      args: [BigInt(tournementId)],
    });
  }

  function handleClaimCancelledEntry(tournementId: string) {
    writeRefundContract({
      address: tournementContract.address,
      abi: tournementContract.abi,
      functionName: "claimCancelledEntry",
      chainId: activeChain.id,
      args: [BigInt(tournementId)],
    });
  }

  async function handleEnterTournament(tournament: TournamentView) {
    setEntryValidationError(null);

    if (!address) {
      setEntryValidationError("Connect wallet before entering a tournament.");
      return;
    }

    if (!publicClient) {
      setEntryValidationError("Wallet client unavailable. Please refresh and try again.");
      return;
    }

    const selectedIds = formationBuilder.formation
      .filter((player): player is Player => player !== null)
      .map((player) => player.id);

    if (selectedIds.length < 5) {
      setEntryValidationError("Complete your 5-player formation before entering.");
      return;
    }

    try {
      const selectedOwners = await Promise.all(
        selectedIds.map(async (id) => {
          const owner = await publicClient.readContract({
            address: playerContract.address,
            abi: playerContract.abi,
            functionName: "ownerOf",
            args: [id],
          });
          return (owner as string).toLowerCase();
        }),
      );

      const normalizedAddress = address.toLowerCase();
      if (selectedOwners.some((owner) => owner !== normalizedAddress)) {
        setEntryValidationError("One or more selected players are no longer owned by this wallet. Refresh and try again.");
        return;
      }
    } catch {
      setEntryValidationError("Could not verify player ownership before entering. Please try again.");
      return;
    }

    const attackingPlayers = padPlayersTo3(formationBuilder.attackingPlayers);
    const midfieldPlayers = padPlayersTo3(formationBuilder.midfieldPlayers);
    const defensivePlayers = padPlayersTo3(formationBuilder.defensivePlayers);

    writeEnterContract({
      address: tournementContract.address,
      abi: tournementContract.abi,
      functionName: "enter",
      chainId: activeChain.id,
      args: [BigInt(tournament.id), attackingPlayers, midfieldPlayers, defensivePlayers],
      value: tournament.entryFee,
    });
  }

  const requiredTeams = selectedTournament?.maxTeams ?? 0;
  const canStartOrAdvance =
    !!selectedTournament &&
    selectedTournament.teamsEntered === requiredTeams &&
    requiredTeams > 0 &&
    !selectedTournament.cancelled &&
    !selectedTournament.champion;
  const canCancel =
    !!selectedTournament &&
    !!address &&
    !!selectedTournament.creator &&
    selectedTournament.creator.toLowerCase() === address.toLowerCase() &&
    !selectedTournament.cancelled &&
    !selectedTournament.champion &&
    selectedTournament.currentRound === 0;
  const canClaimRefund = !!selectedTournament && !!address && selectedTournament.cancelled;
  const showStartSection = section === undefined || section === "start";
  const showOpenSection = section === undefined || section === "open";
  const showReplaySection = section === undefined || section === "replay";

  return (
    <main className="tournament-panel">
      <header className="tournament-header">
        <div>
          <span className="section-kicker">Tournament Replay Hub</span>
          <h2>Tournament Games, Bracket Progress, and Champion Payout</h2>
          <p>
            Track every game from emitted events, inspect each matchup, replay key moments, and claim rewards from the
            winner wallet.
          </p>
        </div>
        <CreateTournamentButton
          variant="primary"
          size="medium"
          onSuccess={() => refetch()}
        />
      </header>

      {!contractConfigured && (
        <div className="matches-history-state">
          Set VITE_TOURNEMENT_CONTRACT_ADDRESS to enable tournament replay and winner withdrawals.
        </div>
      )}

      {status === "pending" && contractConfigured && <div className="matches-history-state">Loading tournaments...</div>}
      {status === "error" && contractConfigured && (
        <div className="matches-history-state">Failed to load live tournaments: {(error as Error)?.message}</div>
      )}

      {status === "success" && contractConfigured && tournaments.length === 0 && (
        <div className="matches-history-state">No Tournements</div>
      )}

      {selectedTournament && (
        <div className="tournament-layout">
          <aside className="tournament-list" aria-label="Tournament list">
            <h3>All Tournaments</h3>
            <ol>
              {tournaments.map((tournament) => {
                const isActive = selectedTournament.id === tournament.id;
                const status = getTournamentStatus(tournament);
                return (
                  <li key={tournament.id}>
                    <button
                      className={`tournament-list-item${isActive ? " active" : ""}`}
                      onClick={() => {
                        setSelectedTournamentId(tournament.id);
                        setSelectedMatchId(null);
                      }}
                      type="button"
                    >
                      <strong>Tournament #{tournament.id}</strong>
                      <span className={`tournament-status-badge tournament-status-badge--${status.tone}`}>{status.label}</span>
                      <span>{tournament.teamsEntered} teams entered</span>
                      <span>{tournament.matches.length} games</span>
                      <span>Entry: {formatPol(tournament.entryFee)}</span>
                    </button>
                  </li>
                );
              })}
            </ol>
          </aside>

          <section className="tournament-detail">
            <div className="tournament-meta-cards">
              {(() => {
                const status = getTournamentStatus(selectedTournament);
                return (
                  <article>
                    <span>Status</span>
                    <strong>{status.label}</strong>
                  </article>
                );
              })()}
              <article>
                <span>Rounds</span>
                <strong>{selectedTournament.rounds || "-"}</strong>
              </article>
              <article>
                <span>Teams Entered</span>
                <strong>{selectedTournament.teamsEntered}/{requiredTeams || "?"}</strong>
              </article>
              <article>
                <span>Champion</span>
                <strong>
                  {selectedTournament.champion ? generateName(selectedTournament.champion) : "In progress"}
                </strong>
              </article>
              {selectedTournament.creator && (
                <article>
                  <span>Creator</span>
                  <strong>{generateName(selectedTournament.creator)}</strong>
                </article>
              )}
              {selectedTournament.championWinnings !== undefined && (
                <article>
                  <span>Champion Winnings</span>
                  <strong>{formatPol(selectedTournament.championWinnings)}</strong>
                </article>
              )}
              {selectedTournament.executorFees !== undefined && (
                <article>
                  <span>Executor Fees</span>
                  <strong>{formatPol(selectedTournament.executorFees)}</strong>
                </article>
              )}
              {selectedTournament.minAttack > 0 && (
                <article>
                  <span>Min Attack</span>
                  <strong>{selectedTournament.minAttack}</strong>
                </article>
              )}
              {selectedTournament.maxAttack > 0 && (
                <article>
                  <span>Max Attack</span>
                  <strong>{selectedTournament.maxAttack}</strong>
                </article>
              )}
              {selectedTournament.minDefence > 0 && (
                <article>
                  <span>Min Defence</span>
                  <strong>{selectedTournament.minDefence}</strong>
                </article>
              )}
              {selectedTournament.maxDefence > 0 && (
                <article>
                  <span>Max Defence</span>
                  <strong>{selectedTournament.maxDefence}</strong>
                </article>
              )}
            </div>

            {showReplaySection && (
              <>
                <section className="tournament-activity" aria-label="Tournament activity timeline">
                  <h3>Activity Timeline</h3>
                  {selectedTournament.activity.length === 0 ? (
                    <p className="matches-history-state">No tournament activity indexed yet.</p>
                  ) : (
                    <ol className="tournament-activity-list">
                      {selectedTournament.activity.map((item) => (
                        <li key={item.id} className={`tournament-activity-item tournament-activity-item--${item.tone}`}>
                          <div>
                            <strong>{item.label}</strong>
                            {item.detail ? <p>{item.detail}</p> : null}
                          </div>
                          {item.blockNumber !== undefined ? <span>Block {item.blockNumber.toString()}</span> : null}
                        </li>
                      ))}
                    </ol>
                  )}
                </section>

                <div className="tournament-bracket" aria-label="Tournament bracket from events">
                  <h3>Game Progression</h3>
                  {selectedTournament.matches.length === 0 ? (
                    <div className="matches-history-state">No match events indexed for this tournament yet.</div>
                  ) : (
                    <ol className="tournament-match-list">
                      {selectedTournament.matches.map((match) => {
                        const isSelected = selectedMatch?.id === match.id;
                        const isComplete = typeof match.homeScore === "number" && typeof match.awayScore === "number";

                        return (
                          <li key={match.id} className={`tournament-match-item${isSelected ? " active" : ""}`}>
                            <div>
                              <div className="tournament-match-head">
                                <span>Round {match.round}</span>
                                <strong>
                                  {generateName(match.homeAddress)} vs {generateName(match.awayAddress)}
                                </strong>
                              </div>
                              <p>
                                {isComplete
                                  ? `${match.homeScore}-${match.awayScore} • Winner: ${generateName(match.winner || ZERO_ADDRESS)}`
                                  : "Awaiting result event"}
                              </p>
                            </div>
                            <button
                              className="matches-history-reveal-button"
                              onClick={() => setSelectedMatchId(match.id)}
                              type="button"
                              disabled={!isComplete}
                            >
                              {isComplete ? "Watch Game" : "Pending"}
                            </button>
                          </li>
                        );
                      })}
                    </ol>
                  )}
                </div>

                {selectedMatch && typeof selectedMatch.homeScore === "number" && typeof selectedMatch.awayScore === "number" ? (
                  <section className="tournament-replay" aria-label="Selected tournament replay">
                    <h3>
                      Replay: {generateName(selectedMatch.homeAddress)} vs {generateName(selectedMatch.awayAddress)}
                    </h3>
                    <p>
                      Final score: {selectedMatch.homeScore} - {selectedMatch.awayScore} | Winner: {generateName(selectedMatch.winner || ZERO_ADDRESS)}
                    </p>
                    <ol className="tournament-goal-timeline">
                      {replayGoals.length === 0 ? (
                        <li>No goals scored in this game.</li>
                      ) : (
                        replayGoals.map((goal, index) => (
                          <li key={`${goal.minute}-${goal.side}-${index}`}>
                            {goal.minute}' - {goal.side === "home" ? generateName(selectedMatch.homeAddress) : generateName(selectedMatch.awayAddress)}
                          </li>
                        ))
                      )}
                    </ol>
                  </section>
                ) : null}
              </>
            )}

            {showStartSection && (
              <section className="tournament-teams" aria-label="Teams entered in tournament">
                <h3>Teams Entered ({selectedTournament.teamsEntered}/{requiredTeams || "?"})</h3>
                {selectedTournament.entrants.length === 0 ? (
                  <p className="matches-history-state">No teams have entered yet.</p>
                ) : (
                  <ol className="tournament-teams-list">
                    {selectedTournament.entrants.map((player) => (
                      <li key={player}>{generateName(player)}</li>
                    ))}
                  </ol>
                )}
                <button
                  className="play-match-button"
                  type="button"
                  onClick={() => void handleStartTournament(selectedTournament.id)}
                  disabled={!canStartOrAdvance || isStartPending || isStartConfirming}
                  title={
                    selectedTournament.teamsEntered === 0
                      ? "No teams have entered"
                      : selectedTournament.teamsEntered !== requiredTeams
                        ? `Need ${requiredTeams} teams to start`
                        : selectedTournament.cancelled
                          ? "Tournament is cancelled"
                          : selectedTournament.champion
                            ? "Tournament already completed"
                        : undefined
                  }
                >
                  {isStartPending || isStartConfirming
                    ? "Submitting..."
                    : selectedTournament.currentRound > 0
                      ? "Advance Tournament Round"
                      : "Start Tournament"}
                </button>
                {isStartConfirmed && <p className="market-step-label">Tournament round execution confirmed.</p>}
                {startError && <p className="market-step-label">Tournament start failed: {startError.message}</p>}

                <button
                  className="play-match-button"
                  type="button"
                  onClick={() => void handleCancelTournament(selectedTournament.id)}
                  disabled={!canCancel || isCancelPending || isCancelConfirming}
                >
                  {isCancelPending || isCancelConfirming ? "Cancelling..." : "Cancel Tournament"}
                </button>
                {isCancelConfirmed && <p className="market-step-label">Tournament cancelled.</p>}
                {cancelError && <p className="market-step-label">Cancellation failed: {cancelError.message}</p>}

                <button
                  className="play-match-button"
                  type="button"
                  onClick={() => void handleClaimCancelledEntry(selectedTournament.id)}
                  disabled={!canClaimRefund || isRefundPending || isRefundConfirming}
                  title={!selectedTournament.cancelled ? "Tournament is not cancelled" : undefined}
                >
                  {isRefundPending || isRefundConfirming ? "Claiming Refund..." : "Claim Cancelled Entry"}
                </button>
                {isRefundConfirmed && <p className="market-step-label">Refund claimed.</p>}
                {refundError && <p className="market-step-label">Refund failed: {refundError.message}</p>}
              </section>
            )}

            {showOpenSection && (
              <section className="tournament-claim" aria-label="Tournament entry">
                <h3>Tournament Entry</h3>
                <p>
                  Build your tournament lineup using the same formation builder as join match.
                  <br />
                  You currently have {uniqueOwnedPlayers.length} unique players.
                </p>
                <TeamBuilder
                  activePositionIndex={formationBuilder.activePositionIndex}
                  activePositionMeta={formationBuilder.activePositionMeta}
                  formation={formationBuilder.formation}
                  isFormationEmpty={formationBuilder.isFormationEmpty}
                  ownedPlayers={uniqueOwnedPlayers}
                  selectedCount={formationBuilder.selectedCount}
                  selectedFormation={formationBuilder.selectedFormation}
                  selectedPlayerIds={formationBuilder.selectedPlayerIds}
                  teamAddress={address}
                  onAutoPick={() => formationBuilder.autoPickFormation(uniqueOwnedPlayers)}
                  onClearFormation={formationBuilder.clearFormation}
                  onFormationChange={formationBuilder.handleFormationChange}
                  onPlayerClick={formationBuilder.handlePlayerClick}
                  onPositionClick={formationBuilder.handlePositionClick}
                />
                <button
                  className="play-match-button"
                  type="button"
                  onClick={() => void handleEnterTournament(selectedTournament)}
                  disabled={
                    !address ||
                    selectedTournament.cancelled ||
                    !!selectedTournament.champion ||
                    uniqueOwnedPlayers.length < 5 ||
                    !formationBuilder.isFormationComplete ||
                    isEnterPending ||
                    isEnterConfirming
                  }
                  title={
                    !address
                      ? "Connect wallet to enter"
                      : selectedTournament.cancelled
                        ? "Tournament cancelled"
                      : uniqueOwnedPlayers.length < 5
                        ? "Need at least 5 unique players to enter"
                        : !formationBuilder.isFormationComplete
                          ? "Complete your formation to enter"
                          : undefined
                  }
                >
                  {isEnterPending || isEnterConfirming ? "Entering..." : `Enter Tournament (${formatPol(selectedTournament.entryFee)})`}
                </button>
                {isEnterConfirmed && <p className="market-step-label">Tournament entry confirmed.</p>}
                {entryValidationError && <p className="market-step-label">{entryValidationError}</p>}
                {enterError && <p className="market-step-label">Tournament entry failed: {enterError.message}</p>}
              </section>
            )}

            {showReplaySection && (
              <section className="tournament-claim" aria-label="Champion reward claim">
                <h3>Champion Withdrawal</h3>
                <p>
                  Connected wallet: {address ? generateName(address) : "Not connected"}
                  <br />
                  Eligible champion: {selectedTournament.champion ? generateName(selectedTournament.champion) : "Not decided yet"}
                </p>
                <button
                  className="play-match-button"
                  type="button"
                  onClick={() => handleClaimReward(selectedTournament.id)}
                  disabled={
                    !address ||
                    selectedTournament.cancelled ||
                    !selectedTournament.champion ||
                    selectedTournament.champion.toLowerCase() !== address.toLowerCase() ||
                    isClaimPending ||
                    isClaimConfirming
                  }
                >
                  {isClaimPending || isClaimConfirming ? "Withdrawing..." : "Withdraw Winner Funds"}
                </button>
                {isClaimConfirmed && <p className="market-step-label">Reward withdrawal confirmed.</p>}
                {claimError && <p className="market-step-label">Withdrawal failed: {claimError.message}</p>}
              </section>
            )}
          </section>
        </div>
      )}

      <button className="matches-filter-toggle" onClick={() => void refetch()} type="button">
        Refresh Event Feed
      </button>
    </main>
  );
}
