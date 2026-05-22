import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { formatEther } from "viem";
import { useAccount, usePublicClient, useReadContract, useWaitForTransactionReceipt, useWriteContract } from "wagmi";

import { tournementContract } from "../../contracts/tournementContract";
import { playerContract } from "../../contracts/playerContract";
import generateName from "../utils/teamName";
import CreateTournamentButton from "../actions/create-tournament/CreateTournamentButton";
import TeamBuilder from "./join-match/TeamBuilder";
import { useFormationBuilder } from "./join-match/useFormationBuilder";
import { fetchTournamentsFromSubgraph } from "./tournementSubgraph";
import type { Player } from "../player";

type TournamentMatch = {
  id: string;
  tournementId: string;
  round: number;
  homeAddress: string;
  awayAddress: string;
  winner?: string;
  homeScore?: number;
  awayScore?: number;
  blockNumber: bigint;
};

type TournamentView = {
  id: string;
  rounds: number;
  entryFee: bigint;
  minAttack: number;
  minDefence: number;
  maxAttack: number;
  maxDefence: number;
  matches: TournamentMatch[];
  champion?: string;
};

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

function formatPol(wei: bigint) {
  const full = formatEther(wei);
  const [intPart, decimal = ""] = full.split(".");
  const shortDecimal = decimal.slice(0, 4).replace(/0+$/, "");
  return shortDecimal ? `${intPart}.${shortDecimal} POL` : `${intPart} POL`;
}

function makeMatchId(tournementId: string, round: number, index: number) {
  return `${tournementId}-${round}-${index}`;
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

export default function TournementReplays() {
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
    queryKey: ["tournament-feed", tournementContract.address],
    enabled: contractConfigured,
    async queryFn() {
      if (!contractConfigured) return [];

      const { tournementCreateds, tournementMatchStarteds, tournementCompleteds } = await fetchTournamentsFromSubgraph();

      const tournamentMap = new Map<string, TournamentView>();

      for (const log of tournementCreateds) {
        const id = log.tournementId;
        tournamentMap.set(id, {
          id,
          rounds: log.rounds,
          entryFee: BigInt(log.entryFee),
          minAttack: log.minAttack ?? 0,
          minDefence: log.minDefence ?? 0,
          maxAttack: log.maxAttack ?? 0,
          maxDefence: log.maxDefence ?? 0,
          matches: [],
        });
      }

      const startedByTournament = new Map<string, TournamentMatch[]>();

      for (const log of tournementMatchStarteds) {
        const id = log.tournementId;
        if (!tournamentMap.has(id)) {
          tournamentMap.set(id, {
            id,
            rounds: 0,
            entryFee: 0n,
            minAttack: 0,
            minDefence: 0,
            maxAttack: 0,
            maxDefence: 0,
            matches: [],
          });
        }

        const matches = startedByTournament.get(id) ?? [];
        matches.push({
          id: `${log.transactionHash}-${log.id}`,
          tournementId: id,
          round: log.round,
          homeAddress: log.homeAddress,
          awayAddress: log.awayAddress,
          blockNumber: BigInt(log.blockNumber),
        });
        startedByTournament.set(id, matches);
      }

      // No match played data from subgraph yet, so matches show as "Awaiting result"
      for (const [id, startedMatches] of startedByTournament.entries()) {
        const orderedStarted = [...startedMatches].sort((a, b) => Number(a.blockNumber - b.blockNumber));
        const joined: TournamentMatch[] = orderedStarted.map((start, i) => ({
          ...start,
          id: makeMatchId(id, start.round, i),
        }));

        const current = tournamentMap.get(id);
        if (current) {
          current.matches = joined.sort((a, b) => {
            if (a.round !== b.round) return a.round - b.round;
            return Number(a.blockNumber - b.blockNumber);
          });
        }
      }

      for (const log of tournementCompleteds) {
        const id = log.tournementId;
        const current = tournamentMap.get(id);
        if (!current) continue;
        current.champion = log.champion;
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
      args: [BigInt(tournament.id), attackingPlayers, midfieldPlayers, defensivePlayers],
      value: tournament.entryFee,
    });
  }

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
        <div className="matches-history-state">Failed to load tournament events: {(error as Error)?.message}</div>
      )}

      {status === "success" && contractConfigured && tournaments.length === 0 && (
        <div className="matches-history-state">No tournament events found yet.</div>
      )}

      {selectedTournament && (
        <div className="tournament-layout">
          <aside className="tournament-list" aria-label="Tournament list">
            <h3>All Tournaments</h3>
            <ol>
              {tournaments.map((tournament) => {
                const isActive = selectedTournament.id === tournament.id;
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
              <article>
                <span>Rounds</span>
                <strong>{selectedTournament.rounds || "-"}</strong>
              </article>
              <article>
                <span>Teams Entered</span>
                <strong>{selectedTournament.rounds ? 2 ** selectedTournament.rounds : selectedTournament.matches.length * 2}</strong>
              </article>
              <article>
                <span>Champion</span>
                <strong>
                  {selectedTournament.champion ? generateName(selectedTournament.champion) : "In progress"}
                </strong>
              </article>
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

            <section className="tournament-claim" aria-label="Champion reward claim">
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
                  !!selectedTournament.champion ||
                  uniqueOwnedPlayers.length < 5 ||
                  !formationBuilder.isFormationComplete ||
                  isEnterPending ||
                  isEnterConfirming
                }
                title={
                  !address
                    ? "Connect wallet to enter"
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
          </section>
        </div>
      )}

      <button className="matches-filter-toggle" onClick={() => void refetch()} type="button">
        Refresh Event Feed
      </button>
    </main>
  );
}
