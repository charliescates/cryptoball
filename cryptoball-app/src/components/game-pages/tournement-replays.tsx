import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ContractFunctionZeroDataError, formatEther } from "viem";
import { useAccount, usePublicClient, useReadContract, useWaitForTransactionReceipt, useWriteContract } from "wagmi";

import { tournementContract } from "../../contracts/tournementContract";
import { playerContract } from "../../contracts/playerContract";
import { activeChain } from "../../config/network";
import generateName from "../utils/teamName";
import CreateTournamentModal from "../actions/create-tournament/CreateTournamentModal";
import TeamBuilder from "./join-match/TeamBuilder";
import { getFormationPositionMeta, useFormationBuilder } from "./join-match/useFormationBuilder";
import { nativeTokenSymbol } from "../../config/network";
import type { Player } from "../player";
import { getPlayerTypeName } from "../utils/playerType";
import type { Formation } from "./join-match/formations";
import ShowMatches from "./show-matches";
import { fetchTournamentMatchResultsFromSubgraph } from "./tournementSubgraph";

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
  name: string;
  creator?: string;
  rounds: number;
  entryFee: bigint;
  minAttack: number;
  minDefence: number;
  maxAttack: number;
  maxDefence: number;
  includeTypes: number[];
  excludeTypes: number[];
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

type TournamentSection = "create" | "open" | "live" | "completed";

type TournementSummary = {
  tournamentId: bigint;
  name: string;
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

const MAX_TOURNEMENT_SCAN = 128;

function formatPol(wei: bigint) {
  const full = formatEther(wei);
  const [intPart, decimal = ""] = full.split(".");
  const shortDecimal = decimal.slice(0, 4).replace(/0+$/, "");
  return shortDecimal ? `${intPart}.${shortDecimal} ${nativeTokenSymbol}` : `${intPart} ${nativeTokenSymbol}`;
}

function makeMatchId(tournementId: string, round: number, index: number) {
  return `${tournementId}-${round}-${index}`;
}

function getReplayResultKey(match: Pick<TournamentMatch, "tournamentId" | "tournamentMatchId">) {
  return `${match.tournamentId}-${match.tournamentMatchId}`;
}

function isOpenTournament(tournament: TournamentView) {
  return !tournament.cancelled && !tournament.champion && tournament.currentRound === 0 && tournament.teamsEntered < tournament.maxTeams;
}

function isLiveTournament(tournament: TournamentView) {
  if (tournament.cancelled || tournament.champion) {
    return false;
  }

  if (tournament.currentRound > 0) {
    return true;
  }

  return tournament.teamsEntered === tournament.maxTeams && tournament.maxTeams > 0;
}

function isCompletedTournament(tournament: TournamentView) {
  return !!tournament.champion;
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

function getKnockoutRoundLabel(round: number, totalRounds?: number, maxObservedRound?: number) {
  let roundsForLabel = totalRounds;

  if (!roundsForLabel && maxObservedRound && maxObservedRound >= round) {
    roundsForLabel = maxObservedRound;
  }

  if (!roundsForLabel || roundsForLabel < round) {
    return `Round ${round}`;
  }

  const teamsInRound = 2 ** (roundsForLabel - round + 1);
  if (teamsInRound === 2) return "Final";
  if (teamsInRound === 4) return "Semifinals";
  if (teamsInRound === 8) return "Quarterfinals";
  if (teamsInRound === 16) return "Round of 16";
  return `Round ${round}`;
}

function padPlayersTo3(players: Player[]): [bigint, bigint, bigint] {
  return [players[0]?.id ?? 0n, players[1]?.id ?? 0n, players[2]?.id ?? 0n];
}

function addGasBuffer(estimatedGas: bigint): bigint {
  // Keep a small headroom to prevent underestimation-related rejections in wallet UIs.
  return (estimatedGas * 12n) / 10n;
}

function getQuickRoleScore(player: Player, role: "attack" | "midfield" | "defense"): number {
  if (role === "attack") return Number(player.attack) * 1.2 + Number(player.potential) * 0.25;
  if (role === "defense") return Number(player.defense) * 1.2 + Number(player.potential) * 0.25;
  return (Number(player.attack) + Number(player.defense) + Number(player.potential)) / 3;
}

function formatPlayerTypeList(types: number[]): string {
  if (types.length === 0) {
    return "None";
  }

  return [...new Set(types)].map((type) => getPlayerTypeName(type)).join(", ");
}

function getTournamentPlayerRestrictionReason(player: Player, tournament: TournamentView): string | null {
  const attack = Number(player.attack);
  const defense = Number(player.defense);
  const playerType = Number(player.playerType);

  if (tournament.minAttack > 0 && attack < tournament.minAttack) {
    return `attack below minimum (${attack} < ${tournament.minAttack})`;
  }

  if (tournament.minDefence > 0 && defense < tournament.minDefence) {
    return `defense below minimum (${defense} < ${tournament.minDefence})`;
  }

  if (tournament.maxAttack > 0 && attack > tournament.maxAttack) {
    return `attack above maximum (${attack} > ${tournament.maxAttack})`;
  }

  if (tournament.maxDefence > 0 && defense > tournament.maxDefence) {
    return `defense above maximum (${defense} > ${tournament.maxDefence})`;
  }

  if (tournament.excludeTypes.length > 0 && tournament.excludeTypes.includes(playerType)) {
    return `${getPlayerTypeName(playerType)} is excluded`;
  }

  if (tournament.includeTypes.length > 0 && !tournament.includeTypes.includes(playerType)) {
    return `${getPlayerTypeName(playerType)} is not in allowed include types`;
  }

  return null;
}

function isPlayerEligibleForTournament(player: Player, tournament: TournamentView): boolean {
  return getTournamentPlayerRestrictionReason(player, tournament) === null;
}

function buildQuickEntryFormation(players: Player[], formation: Formation) {
  const availablePlayers = players.filter((player) => player.gamesLeft > 0n);
  const nextFormation: (Player | null)[] = Array(5).fill(null);
  const usedPlayerIds = new Set<bigint>();

  for (let index = 0; index < 5; index += 1) {
    const { role } = getFormationPositionMeta(index, formation);
    const bestPlayer = availablePlayers
      .filter((player) => !usedPlayerIds.has(player.id))
      .sort((first, second) => getQuickRoleScore(second, role) - getQuickRoleScore(first, role))[0];

    if (bestPlayer) {
      nextFormation[index] = bestPlayer;
      usedPlayerIds.add(bestPlayer.id);
    }
  }

  const attackingPlayers = nextFormation.slice(0, formation.attack).filter((player): player is Player => player !== null);
  const midfieldPlayers = nextFormation
    .slice(formation.attack, formation.attack + formation.midfield)
    .filter((player): player is Player => player !== null);
  const defensivePlayers = nextFormation
    .slice(formation.attack + formation.midfield, 5)
    .filter((player): player is Player => player !== null);

  return {
    formation: nextFormation,
    isComplete: nextFormation.every((player) => player !== null),
    attackingPlayers,
    midfieldPlayers,
    defensivePlayers,
  };
}

export default function TournementReplays({ section }: { section?: TournamentSection }) {
  const { address } = useAccount();
  const publicClient = usePublicClient();
  const formationBuilder = useFormationBuilder();
  const [selectedTournamentId, setSelectedTournamentId] = useState<string | null>(null);
  const [selectedMatchId, setSelectedMatchId] = useState<string | null>(null);
  const [selectedCompletedRound, setSelectedCompletedRound] = useState<number | null>(null);
  const [selectedCompletedMatchId, setSelectedCompletedMatchId] = useState<string | null>(null);
  const [entryValidationError, setEntryValidationError] = useState<string | null>(null);
  const [showAdvancedEntry, setShowAdvancedEntry] = useState(false);
  const [revealedLiveReplayKeys, setRevealedLiveReplayKeys] = useState<Set<string>>(new Set());
  const [revealedCompletedReplayKeys, setRevealedCompletedReplayKeys] = useState<Set<string>>(new Set());
  const [playedOutCompletedReplayKeys, setPlayedOutCompletedReplayKeys] = useState<Set<string>>(new Set());

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
  const {
    data: claimRewardHash,
    writeContract: writeClaimRewardContract,
    isPending: isClaimRewardPending,
    error: claimRewardError,
  } = useWriteContract();
  const { isLoading: isClaimRewardConfirming, isSuccess: isClaimRewardConfirmed } = useWaitForTransactionReceipt({
    hash: claimRewardHash,
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
          name: summary.name || `Tournament #${id}`,
          creator: summary.creator,
          rounds,
          entryFee: summary.entryFee,
          minAttack: Number(summary.minAttack),
          minDefence: Number(summary.minDefence),
          maxAttack: Number(summary.maxAttack),
          maxDefence: Number(summary.maxDefence),
          includeTypes: summary.includeTypes.map((value) => Number(value)),
          excludeTypes: summary.excludeTypes.map((value) => Number(value)),
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

      const storageScanContracts = Array.from({ length: MAX_TOURNEMENT_SCAN }, (_, index) => ({
        address: tournementContract.address,
        abi: tournementContract.abi,
        functionName: "tournements" as const,
        args: [BigInt(index + 1)],
      }));

      const storageScanResults = await publicClient.multicall({
        contracts: storageScanContracts,
        allowFailure: true,
      });

      for (let index = 0; index < storageScanResults.length; index += 1) {
        const result = storageScanResults[index];
        if (result.status !== "success") {
          continue;
        }

        const id = String(index + 1);
        const [
          name,
          rounds,
          entryFee,
          creator,
          minAttack,
          minDefence,
          maxAttack,
          maxDefence,
          teamsEntered,
          currentRound,
          cancelled,
          champion,
        ] = result.result as unknown as [
          string,
          bigint,
          bigint,
          string,
          bigint,
          bigint,
          bigint,
          bigint,
          bigint,
          bigint,
          boolean,
          string,
        ];

        const looksInitialized =
          creator.toLowerCase() !== ZERO_ADDRESS || entryFee > 0n || rounds > 0n || champion.toLowerCase() !== ZERO_ADDRESS;

        if (!looksInitialized) {
          continue;
        }

        const existing = tournamentMap.get(id);
        const maxTeams = rounds > 0n ? 2 ** Number(rounds) : 0;
        const championAddress = champion.toLowerCase() !== ZERO_ADDRESS ? champion : undefined;

        if (existing) {
          existing.name = name || existing.name;
          existing.creator = creator;
          existing.rounds = Number(rounds);
          existing.entryFee = entryFee;
          existing.minAttack = Number(minAttack);
          existing.minDefence = Number(minDefence);
          existing.maxAttack = Number(maxAttack);
          existing.maxDefence = Number(maxDefence);
          existing.teamsEntered = Number(teamsEntered);
          existing.currentRound = Number(currentRound);
          existing.cancelled = cancelled;
          existing.maxTeams = maxTeams || existing.maxTeams;
          existing.champion = championAddress ?? existing.champion;
          continue;
        }

        const activity: TournamentActivity[] = [];
        if (championAddress) {
          activity.push({
            id: `completed-${id}`,
            label: "Tournament completed",
            detail: `Champion ${generateName(championAddress)}`,
            tone: "success",
          });
        } else if (cancelled) {
          activity.push({
            id: `cancelled-${id}`,
            label: "Tournament cancelled",
            tone: "warning",
          });
        } else {
          activity.push({
            id: `open-${id}`,
            label: "Tournament discovered from contract storage",
            detail: `${Number(teamsEntered)}/${maxTeams} teams entered`,
            tone: "neutral",
          });
        }

        tournamentMap.set(id, {
          id,
          name: name || `Tournament #${id}`,
          creator,
          rounds: Number(rounds),
          entryFee,
          minAttack: Number(minAttack),
          minDefence: Number(minDefence),
          maxAttack: Number(maxAttack),
          maxDefence: Number(maxDefence),
          includeTypes: [],
          excludeTypes: [],
          maxTeams,
          matches: [],
          champion: championAddress,
          teamsEntered: Number(teamsEntered),
          entrants: [],
          isReady: Number(teamsEntered) === maxTeams && maxTeams > 0,
          cancelled,
          currentRound: Number(currentRound),
          activity,
        });
      }

      const knownTournamentIds = [...tournamentMap.keys()].map((id) => BigInt(id));
      if (knownTournamentIds.length > 0) {
        const feeResults = await publicClient.multicall({
          contracts: knownTournamentIds.map((tournamentId) => ({
            address: tournementContract.address,
            abi: tournementContract.abi,
            functionName: "tournementExecutorFees" as const,
            args: [tournamentId],
          })),
          allowFailure: true,
        });

        feeResults.forEach((result, index) => {
          if (result.status !== "success") {
            return;
          }

          const id = knownTournamentIds[index].toString();
          const tournament = tournamentMap.get(id);
          if (!tournament) {
            return;
          }

          const fee = result.result as bigint;
          if (fee > 0n) {
            tournament.executorFees = fee;
          }
        });
      }

      if (tournamentMap.size === 0) {
        return [];
      }
      const matchesByTournament = new Map<string, TournamentMatch[]>();

      try {
        const replayData = await fetchTournamentMatchResultsFromSubgraph();
        for (const match of replayData.tournamentMatchPlayeds ?? []) {
          const tournamentId = String(match.tournamentId);
          const tournament = tournamentMap.get(tournamentId);
          if (!tournament) {
            continue;
          }

          const matches = matchesByTournament.get(tournamentId) ?? [];
          matches.push({
            id: match.id,
            tournamentId,
            tournamentMatchId: String(match.tournamentMatchId),
            round: Number(match.round),
            homeAddress: match.homeAddress,
            awayAddress: match.awayAddress,
            winner: match.winner,
            homeScore: Number(match.homeScore),
            awayScore: Number(match.awayScore),
            blockNumber: BigInt(match.blockNumber ?? 0),
          });
          matchesByTournament.set(tournamentId, matches);

          tournament.activity.push({
            id: `match-played-${match.id}`,
            blockNumber: BigInt(match.blockNumber ?? 0),
            label: `Round ${String(match.round)} result`,
            detail: "Replay available. Watch game to reveal score and winner.",
            tone: "info",
          });
        }
      } catch (subgraphError) {
        console.error("Error fetching tournament replay data from subgraph:", subgraphError);
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

  const filteredTournaments = useMemo(() => {
    if (section === "create") {
      return [];
    }

    if (section === "open") {
      return tournaments.filter(isOpenTournament);
    }

    if (section === "live") {
      return tournaments.filter(isLiveTournament);
    }

    if (section === "completed") {
      return tournaments.filter(isCompletedTournament);
    }

    return tournaments;
  }, [section, tournaments]);

  const selectedTournament = useMemo(
    () => filteredTournaments.find((t) => t.id === selectedTournamentId) ?? filteredTournaments[0],
    [filteredTournaments, selectedTournamentId],
  );

  const selectedMatch = useMemo(
    () => selectedTournament?.matches.find((m) => m.id === selectedMatchId),
    [selectedTournament, selectedMatchId],
  );

  const selectedTournamentIdBigInt = selectedTournament ? BigInt(selectedTournament.id) : undefined;

  const { data: claimedRewardData, refetch: refetchClaimedReward } = useReadContract({
    abi: tournementContract.abi,
    address: tournementContract.address,
    functionName: "hasClaimedReward",
    args: selectedTournamentIdBigInt !== undefined && !!address ? [selectedTournamentIdBigInt, address] : undefined,
    query: {
      enabled: !!selectedTournamentIdBigInt && !!address && !!selectedTournament?.champion,
    },
  });

  const { data: academyFeeData } = useReadContract({
    abi: tournementContract.abi,
    address: tournementContract.address,
    functionName: "tournementAcademyFees",
    args: selectedTournamentIdBigInt !== undefined ? [selectedTournamentIdBigInt] : undefined,
    query: {
      enabled: !!selectedTournamentIdBigInt,
    },
  });

  const hasClaimedReward = Boolean(claimedRewardData);
  const academyFee = (academyFeeData as bigint | undefined) ?? 0n;

  const eligibleOwnedPlayers = useMemo(() => {
    if (!selectedTournament) {
      return uniqueOwnedPlayers;
    }

    return uniqueOwnedPlayers.filter((player) => isPlayerEligibleForTournament(player, selectedTournament));
  }, [selectedTournament, uniqueOwnedPlayers]);

  const customTeamRestrictionError = useMemo(() => {
    if (!selectedTournament) {
      return null;
    }

    const selectedPlayers = formationBuilder.formation.filter((player): player is Player => player !== null);
    for (const player of selectedPlayers) {
      const reason = getTournamentPlayerRestrictionReason(player, selectedTournament);
      if (reason) {
        return `Selected team has ineligible players (${reason}).`;
      }
    }

    return null;
  }, [formationBuilder.formation, selectedTournament]);

  useEffect(() => {
    if (!selectedTournament || !showAdvancedEntry) {
      return;
    }

    let hasChanges = false;
    const normalizedFormation = formationBuilder.formation.map((player) => {
      if (!player) {
        return null;
      }

      if (isPlayerEligibleForTournament(player, selectedTournament)) {
        return player;
      }

      hasChanges = true;
      return null;
    });

    if (!hasChanges) {
      return;
    }

    formationBuilder.applyFormation(normalizedFormation, formationBuilder.selectedFormation);
    setEntryValidationError("Removed players that do not meet this tournament's stat/type rules.");
  }, [formationBuilder, selectedTournament, showAdvancedEntry]);

  function handleWatchLiveMatch(match: TournamentMatch) {
    setSelectedMatchId(match.id);
    const replayKey = getReplayResultKey(match);
    setRevealedLiveReplayKeys((previous) => {
      if (previous.has(replayKey)) {
        return previous;
      }

      const next = new Set(previous);
      next.add(replayKey);
      return next;
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

  function handleClaimReward(tournementId: string) {
    writeClaimRewardContract({
      address: tournementContract.address,
      abi: tournementContract.abi,
      functionName: "claimReward",
      chainId: activeChain.id,
      args: [BigInt(tournementId)],
    });
  }

  async function estimateEnterGas(
    tournamentId: bigint,
    attackingPlayers: [bigint, bigint, bigint],
    midfieldPlayers: [bigint, bigint, bigint],
    defensivePlayers: [bigint, bigint, bigint],
    entryFee: bigint,
  ) {
    if (!publicClient || !address) {
      return null;
    }

    try {
      const estimatedGas = await publicClient.estimateContractGas({
        account: address,
        address: tournementContract.address,
        abi: tournementContract.abi,
        functionName: "enter",
        args: [tournamentId, attackingPlayers, midfieldPlayers, defensivePlayers],
        value: entryFee,
      });

      return addGasBuffer(estimatedGas);
    } catch (gasError) {
      console.error("Failed to estimate tournament entry gas", gasError);
      return null;
    }
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

    if (customTeamRestrictionError) {
      setEntryValidationError(customTeamRestrictionError);
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
    const tournamentId = BigInt(tournament.id);

    const gas = await estimateEnterGas(
      tournamentId,
      attackingPlayers,
      midfieldPlayers,
      defensivePlayers,
      tournament.entryFee,
    );

    const enterRequest = {
      address: tournementContract.address,
      abi: tournementContract.abi,
      functionName: "enter",
      chainId: activeChain.id,
      args: [tournamentId, attackingPlayers, midfieldPlayers, defensivePlayers],
      value: tournament.entryFee,
      ...(gas ? { gas } : {}),
    };

    if (!gas) {
      console.warn("Proceeding without explicit gas limit for tournament entry; wallet will estimate.");
    }

    writeEnterContract(enterRequest);
  }

  async function handleQuickEnterTournament(tournament: TournamentView) {
    setEntryValidationError(null);

    if (!address) {
      setEntryValidationError("Connect wallet before entering a tournament.");
      return;
    }

    if (!publicClient) {
      setEntryValidationError("Wallet client unavailable. Please refresh and try again.");
      return;
    }

    if (eligibleOwnedPlayers.length < 5) {
      setEntryValidationError("Need at least 5 eligible players to quick-enter this tournament.");
      return;
    }

    const quickFormation = buildQuickEntryFormation(eligibleOwnedPlayers, formationBuilder.selectedFormation);

    if (!quickFormation.isComplete) {
      setEntryValidationError("Not enough eligible players with games left for quick entry.");
      return;
    }

    const selectedIds = quickFormation.formation
      .filter((player): player is Player => player !== null)
      .map((player) => player.id);

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
        setEntryValidationError("One or more quick-picked players are no longer owned by this wallet. Refresh and try again.");
        return;
      }
    } catch {
      setEntryValidationError("Could not verify quick-picked player ownership. Please try again.");
      return;
    }

    const tournamentId = BigInt(tournament.id);
    const attackingPlayers = padPlayersTo3(quickFormation.attackingPlayers);
    const midfieldPlayers = padPlayersTo3(quickFormation.midfieldPlayers);
    const defensivePlayers = padPlayersTo3(quickFormation.defensivePlayers);
    const gas = await estimateEnterGas(tournamentId, attackingPlayers, midfieldPlayers, defensivePlayers, tournament.entryFee);

    const enterRequest = {
      address: tournementContract.address,
      abi: tournementContract.abi,
      functionName: "enter",
      chainId: activeChain.id,
      args: [
        tournamentId,
        attackingPlayers,
        midfieldPlayers,
        defensivePlayers,
      ],
      value: tournament.entryFee,
      ...(gas ? { gas } : {}),
    };

    if (!gas) {
      console.warn("Proceeding without explicit gas limit for quick tournament entry; wallet will estimate.");
    }

    writeEnterContract(enterRequest);
  }

  const requiredTeams = selectedTournament?.maxTeams ?? 0;
  const canStartOrAdvance =
    !!selectedTournament &&
    !!address &&
    !!selectedTournament.creator &&
    selectedTournament.creator.toLowerCase() === address.toLowerCase() &&
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
  const isSelectedChampion =
    !!selectedTournament && !!selectedTournament.champion && !!address &&
    selectedTournament.champion.toLowerCase() === address.toLowerCase();
  const estimatedChampionReward = selectedTournament
    ? (selectedTournament.entryFee * BigInt(selectedTournament.teamsEntered))
      - (selectedTournament.executorFees ?? 0n)
      - academyFee
    : 0n;
  const canClaimChampionReward =
    !!selectedTournament?.champion && isSelectedChampion && !hasClaimedReward;
  const roundResults = useMemo(() => {
    if (!selectedTournament) {
      return [] as Array<{ round: number; matches: TournamentMatch[] }>;
    }

    const groups = new Map<number, TournamentMatch[]>();
    for (const match of selectedTournament.matches) {
      const bucket = groups.get(match.round) ?? [];
      bucket.push(match);
      groups.set(match.round, bucket);
    }

    return [...groups.entries()]
      .sort((a, b) => a[0] - b[0])
      .map(([round, matches]) => ({
        round,
        matches: matches.sort((a, b) => Number(a.blockNumber - b.blockNumber)),
      }));
  }, [selectedTournament]);

  const isCreateSection = section === "create";
  const isOpenSection = section === "open";
  const isLiveSection = section === "live";
  const isCompletedSection = section === "completed";
  const completedRoundsTotal = selectedTournament?.rounds && selectedTournament.rounds > 0 ? selectedTournament.rounds : undefined;
  const maxObservedRound = roundResults.length > 0 ? roundResults[roundResults.length - 1].round : undefined;

  const visibleCompletedRoundResults = useMemo(() => {
    if (!isCompletedSection || roundResults.length === 0) {
      return roundResults;
    }

    return roundResults.filter((_, index) => {
      if (index === 0) {
        return true;
      }

      const previousRound = roundResults[index - 1];
      const firstPreviousRoundMatch = previousRound.matches[0];
      if (!firstPreviousRoundMatch) {
        return false;
      }

      return playedOutCompletedReplayKeys.has(getReplayResultKey(firstPreviousRoundMatch));
    });
  }, [isCompletedSection, playedOutCompletedReplayKeys, roundResults]);

  const selectedCompletedRoundResult = useMemo(() => {
    if (!isCompletedSection || visibleCompletedRoundResults.length === 0) {
      return undefined;
    }

    return visibleCompletedRoundResults.find((round) => round.round === selectedCompletedRound) ?? visibleCompletedRoundResults[0];
  }, [isCompletedSection, selectedCompletedRound, visibleCompletedRoundResults]);

  useEffect(() => {
    if (!isCompletedSection) {
      return;
    }

    if (visibleCompletedRoundResults.length === 0) {
      if (selectedCompletedRound !== null) {
        setSelectedCompletedRound(null);
      }
      return;
    }

    const hasSelectedRound =
      selectedCompletedRound !== null && visibleCompletedRoundResults.some((round) => round.round === selectedCompletedRound);

    if (!hasSelectedRound) {
      setSelectedCompletedRound(visibleCompletedRoundResults[0].round);
    }
  }, [isCompletedSection, selectedCompletedRound, visibleCompletedRoundResults]);

  useEffect(() => {
    if (!isClaimRewardConfirmed) {
      return;
    }

    void refetch();
    void refetchClaimedReward();
  }, [isClaimRewardConfirmed, refetch, refetchClaimedReward]);

  const selectedCompletedRoundIndex = selectedCompletedRoundResult
    ? visibleCompletedRoundResults.findIndex((round) => round.round === selectedCompletedRoundResult.round)
    : -1;

  const selectedCompletedMatch = useMemo(() => {
    if (!selectedCompletedMatchId) {
      return undefined;
    }

    for (const round of roundResults) {
      const match = round.matches.find((entry) => entry.id === selectedCompletedMatchId);
      if (match) {
        return match;
      }
    }

    return undefined;
  }, [roundResults, selectedCompletedMatchId]);

  function handleWatchCompletedMatch(match: TournamentMatch) {
    setSelectedCompletedRound(match.round);
    setSelectedCompletedMatchId(match.id);
    const replayKey = getReplayResultKey(match);
    setRevealedCompletedReplayKeys((previous) => {
      if (previous.has(replayKey)) {
        return previous;
      }

      const next = new Set(previous);
      next.add(replayKey);
      return next;
    });
  }

  const canGoToPreviousRound = selectedCompletedRoundIndex > 0;
  const canGoToNextRound =
    selectedCompletedRoundIndex >= 0 && selectedCompletedRoundIndex < visibleCompletedRoundResults.length - 1;

  function handlePlayRound(round: number) {
    setSelectedCompletedRound(round);
    setSelectedCompletedMatchId(null);
  }

  function handlePreviousRound() {
    if (visibleCompletedRoundResults.length === 0) {
      return;
    }

    setSelectedCompletedRound((currentRound) => {
      const activeRound = currentRound ?? visibleCompletedRoundResults[0].round;
      const activeIndex = visibleCompletedRoundResults.findIndex((round) => round.round === activeRound);
      if (activeIndex <= 0) {
        return activeRound;
      }

      return visibleCompletedRoundResults[activeIndex - 1].round;
    });
    setSelectedCompletedMatchId(null);
  }

  function handleNextRound() {
    if (visibleCompletedRoundResults.length === 0) {
      return;
    }

    setSelectedCompletedRound((currentRound) => {
      const activeRound = currentRound ?? visibleCompletedRoundResults[0].round;
      const activeIndex = visibleCompletedRoundResults.findIndex((round) => round.round === activeRound);
      if (activeIndex < 0 || activeIndex >= visibleCompletedRoundResults.length - 1) {
        return activeRound;
      }

      return visibleCompletedRoundResults[activeIndex + 1].round;
    });
    setSelectedCompletedMatchId(null);
  }

  const finalRoundResult = roundResults.length > 0 ? roundResults[roundResults.length - 1] : undefined;
  const finalRoundMatch = finalRoundResult?.matches[0];
  const isSelectedChampionRevealed =
    !!finalRoundMatch && revealedCompletedReplayKeys.has(getReplayResultKey(finalRoundMatch));

  function isTournamentChampionRevealed(tournament: TournamentView) {
    if (!tournament.champion || tournament.matches.length === 0) {
      return false;
    }

    const maxRound = Math.max(...tournament.matches.map((match) => match.round));
    const finalMatch = tournament.matches.find((match) => match.round === maxRound);
    if (!finalMatch) {
      return false;
    }

    return revealedCompletedReplayKeys.has(getReplayResultKey(finalMatch));
  }

  const sectionMeta = isCreateSection
    ? {
        kicker: "Tournament Setup",
        title: "Create New Tournament",
        copy: "Define rounds, entry fee, and player filters to launch a bracket on-chain.",
      }
    : isOpenSection
      ? {
          kicker: "Tournament Entry",
          title: "Open Tournaments",
          copy: "Enter tournaments that are still open and lock in your lineup before the bracket is full.",
        }
      : isLiveSection
        ? {
            kicker: "Tournament Progress",
            title: "Live Brackets",
            copy: "Run the next round for full brackets and monitor every knockout result as the tournament advances.",
          }
        : {
            kicker: "Tournament Archive",
            title: "Completed Tournaments",
            copy: "Review champions and every round result in a Champions League style recap.",
          };

  return (
    <main className="tournament-panel">
      {!isCreateSection && (
        <header className="tournament-header">
          <div>
            <span className="section-kicker">{sectionMeta.kicker}</span>
            <h2>{sectionMeta.title}</h2>
            <p>{sectionMeta.copy}</p>
          </div>
        </header>
      )}

      {isCreateSection && contractConfigured && (
        <div className="tab-panel">
          <div className="start-game-section tournament-create-section">
            <div className="start-game-hero">
              <div className="start-game-hero-copy">
                <span className="section-kicker">Tournament launch</span>
                <h2>Create new tournament</h2>
                <p className="tab-description">
                  Set bracket size, stake, and eligibility rules, then deploy the tournament on-chain in one step.
                </p>
              </div>
              <div className="start-game-format-pills" aria-label="Tournament setup mode and bracket style">
                <div>
                  <span>Format</span>
                  <strong>Knockout</strong>
                </div>
                <div>
                  <span>Mode</span>
                  <strong>Wager</strong>
                </div>
              </div>
            </div>

            <ol className="start-game-setup-rail" aria-label="Tournament setup steps">
              <li>
                <span>1</span>
                <strong>Rules</strong>
              </li>
              <li>
                <span>2</span>
                <strong>Stake</strong>
              </li>
              <li>
                <span>3</span>
                <strong>Launch</strong>
              </li>
            </ol>

            <CreateTournamentModal onSuccess={() => refetch()} />
          </div>
        </div>
      )}

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
        <div className="matches-history-state">No tournaments found.</div>
      )}

      {status === "success" && contractConfigured && tournaments.length > 0 && filteredTournaments.length === 0 && (
        <div className="matches-history-state">
          {isOpenSection
            ? "No open tournaments are available to join right now."
            : isLiveSection
              ? "No live or full tournaments are ready for round execution."
              : isCompletedSection
                ? "No completed tournaments with champions yet."
                : "Create mode only launches new tournaments. Existing open brackets are shown in Join Open."}
        </div>
      )}

      {selectedTournament && (
        <div className="tournament-layout">
          <aside className="tournament-list" aria-label="Tournament list">
            <h3>
              {isCreateSection
                ? "Setup Queue"
                : isOpenSection
                  ? "Open Brackets"
                  : isLiveSection
                    ? "Live Brackets"
                    : "Finished Brackets"}
            </h3>
            <ol>
              {filteredTournaments.map((tournament) => {
                const isActive = selectedTournament.id === tournament.id;
                const status = getTournamentStatus(tournament);
                return (
                  <li key={tournament.id}>
                    <button
                      className={`tournament-list-item${isActive ? " active" : ""}`}
                      onClick={() => {
                        setSelectedTournamentId(tournament.id);
                        setSelectedMatchId(null);
                        setSelectedCompletedRound(null);
                        setSelectedCompletedMatchId(null);
                      }}
                      type="button"
                    >
                      <strong>{tournament.name}</strong>
                      <span>ID #{tournament.id}</span>
                      <span className={`tournament-status-badge tournament-status-badge--${status.tone}`}>{status.label}</span>
                      {isCompletedSection ? (
                        <>
                          <span>{tournament.matches.length} matches played</span>
                          <span>
                            Champion: {tournament.champion && isTournamentChampionRevealed(tournament) ? generateName(tournament.champion) : "Hidden until final replay"}
                          </span>
                        </>
                      ) : (
                        <>
                          <span>{tournament.teamsEntered} teams entered</span>
                          <span>{tournament.matches.length} games</span>
                          <span>Entry: {formatPol(tournament.entryFee)}</span>
                        </>
                      )}
                    </button>
                  </li>
                );
              })}
            </ol>
          </aside>

          <section className="tournament-detail">
            <div className="tournament-meta-cards">
              {isCompletedSection ? (
                <>
                  <article>
                    <span>Name</span>
                    <strong>{selectedTournament.name}</strong>
                  </article>
                  <article>
                    <span>Champion</span>
                    <strong>
                      {selectedTournament.champion && isSelectedChampionRevealed
                        ? generateName(selectedTournament.champion)
                        : "Hidden until final replay"}
                    </strong>
                  </article>
                  <article>
                    <span>Champion Prize</span>
                    <strong>{selectedTournament.championWinnings !== undefined ? formatPol(selectedTournament.championWinnings) : "-"}</strong>
                  </article>
                  <article>
                    <span>Rounds Played</span>
                    <strong>{roundResults.length || "-"}</strong>
                  </article>
                  <article>
                    <span>Matches Played</span>
                    <strong>{selectedTournament.matches.length}</strong>
                  </article>
                </>
              ) : (
                <>
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
                    <span>Name</span>
                    <strong>{selectedTournament.name}</strong>
                  </article>
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
                </>
              )}
            </div>

            {isLiveSection && (
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
                                  ? revealedLiveReplayKeys.has(getReplayResultKey(match))
                                    ? `${match.homeScore}-${match.awayScore} • Winner: ${generateName(match.winner || ZERO_ADDRESS)}`
                                    : "Result hidden. Watch replay to reveal score and winner."
                                  : "Awaiting result event"}
                              </p>
                            </div>
                            {isComplete ? (
                              <button
                                className="matches-history-reveal-button"
                                onClick={() => handleWatchLiveMatch(match)}
                                type="button"
                              >
                                {revealedLiveReplayKeys.has(getReplayResultKey(match)) ? "Replay Opened" : "Watch Replay"}
                              </button>
                            ) : (
                              <span className="matches-history-reveal-button" aria-disabled="true">
                                Pending
                              </span>
                            )}
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
                    <ShowMatches
                      embeddedMatchId={selectedMatch.tournamentMatchId}
                      embeddedTournamentId={selectedMatch.tournamentId}
                      hideHeader
                    />
                  </section>
                ) : null}
              </>
            )}

            {isCreateSection && (
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
                {isCreateSection && (
                  <>
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
                  </>
                )}
              </section>
            )}

            {isLiveSection && (
              <section className="tournament-teams" aria-label="Tournament round controls">
                <button
                  className="play-match-button"
                  type="button"
                  onClick={() => void handleStartTournament(selectedTournament.id)}
                  disabled={!canStartOrAdvance || isStartPending || isStartConfirming}
                  title={
                    selectedTournament.teamsEntered === 0
                      ? "No teams have entered"
                      : !selectedTournament.creator || !address
                        ? "Connect wallet to progress tournament"
                        : selectedTournament.creator.toLowerCase() !== address.toLowerCase()
                          ? "Only tournament creator can run rounds"
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
                      ? "Run Next Round"
                      : "Start Tournament"}
                </button>
                  {!!address && !!selectedTournament.creator && selectedTournament.creator.toLowerCase() !== address.toLowerCase() && (
                    <p className="market-step-label">Only {generateName(selectedTournament.creator)} can progress this tournament.</p>
                  )}
                {isStartConfirmed && <p className="market-step-label">Tournament round execution confirmed.</p>}
                {startError && <p className="market-step-label">Tournament start failed: {startError.message}</p>}
              </section>
            )}

            {isOpenSection && (
              <section className="tournament-claim" aria-label="Tournament entry">
                <h3>Tournament Entry</h3>
                <p>
                  Quick enter will auto-pick your best available 5-player lineup and submit immediately.
                  <br />
                  You currently have {uniqueOwnedPlayers.length} unique players, with {eligibleOwnedPlayers.length} eligible for this tournament.
                </p>

                {(selectedTournament.includeTypes.length > 0 || selectedTournament.excludeTypes.length > 0) && (
                  <p className="market-step-label">
                    Type rules: include {formatPlayerTypeList(selectedTournament.includeTypes)}; exclude {formatPlayerTypeList(selectedTournament.excludeTypes)}.
                  </p>
                )}

                <button
                  className="play-match-button"
                  type="button"
                  onClick={() => void handleQuickEnterTournament(selectedTournament)}
                  disabled={
                    !address ||
                    selectedTournament.cancelled ||
                    !!selectedTournament.champion ||
                    eligibleOwnedPlayers.length < 5 ||
                    isEnterPending ||
                    isEnterConfirming
                  }
                  title={
                    !address
                      ? "Connect wallet to enter"
                      : selectedTournament.cancelled
                        ? "Tournament cancelled"
                        : eligibleOwnedPlayers.length < 5
                          ? "Need at least 5 eligible players to enter"
                          : undefined
                  }
                >
                  {isEnterPending || isEnterConfirming ? "Entering..." : `Quick Enter - Entry Fee ${formatPol(selectedTournament.entryFee)}`}
                </button>

                <button
                  className="matches-history-reveal-button"
                  type="button"
                  onClick={() => setShowAdvancedEntry((previous) => !previous)}
                >
                  {showAdvancedEntry ? "Hide Advanced Team Builder" : "Use Advanced Team Builder"}
                </button>

                {showAdvancedEntry && (
                  <>
                    <TeamBuilder
                      activePositionIndex={formationBuilder.activePositionIndex}
                      activePositionMeta={formationBuilder.activePositionMeta}
                      formation={formationBuilder.formation}
                      isFormationEmpty={formationBuilder.isFormationEmpty}
                      ownedPlayers={eligibleOwnedPlayers}
                      selectedCount={formationBuilder.selectedCount}
                      selectedFormation={formationBuilder.selectedFormation}
                      selectedPlayerIds={formationBuilder.selectedPlayerIds}
                      teamAddress={address}
                      onAutoPick={() => formationBuilder.autoPickFormation(eligibleOwnedPlayers)}
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
                        eligibleOwnedPlayers.length < 5 ||
                        !!customTeamRestrictionError ||
                        !formationBuilder.isFormationComplete ||
                        isEnterPending ||
                        isEnterConfirming
                      }
                      title={
                        !address
                          ? "Connect wallet to enter"
                          : selectedTournament.cancelled
                            ? "Tournament cancelled"
                          : eligibleOwnedPlayers.length < 5
                            ? "Need at least 5 eligible players to enter"
                            : customTeamRestrictionError
                              ? customTeamRestrictionError
                            : !formationBuilder.isFormationComplete
                              ? "Complete your formation to enter"
                              : undefined
                      }
                    >
                      {isEnterPending || isEnterConfirming ? "Entering..." : `Enter with Custom Team - Entry Fee ${formatPol(selectedTournament.entryFee)}`}
                    </button>
                  </>
                )}

                <button
                  className="matches-filter-toggle"
                  type="button"
                  onClick={() => formationBuilder.autoPickFormation(eligibleOwnedPlayers)}
                  disabled={eligibleOwnedPlayers.length < 5}
                >
                  Refresh Suggested Team
                </button>

                {isEnterConfirmed && <p className="market-step-label">Tournament entry confirmed.</p>}
                {customTeamRestrictionError && <p className="market-step-label">{customTeamRestrictionError}</p>}
                {entryValidationError && <p className="market-step-label">{entryValidationError}</p>}
                {enterError && <p className="market-step-label">Tournament entry failed: {enterError.message}</p>}
              </section>
            )}

            {isCompletedSection && (
              <>
                <section className="tournament-claim" aria-label="Champion reward claim">
                  <h3>Champion Reward</h3>
                  <p>
                    Champion rewards are paid from the tournament pot and can be claimed once per completed tournament.
                  </p>

                  <div className="market-withdraw-amount">
                    <span>Estimated claimable reward</span>
                    <strong>{estimatedChampionReward > 0n ? formatPol(estimatedChampionReward) : "-"}</strong>
                  </div>

                  <button
                    className="play-match-button"
                    type="button"
                    onClick={() => void handleClaimReward(selectedTournament.id)}
                    disabled={!canClaimChampionReward || isClaimRewardPending || isClaimRewardConfirming}
                    title={
                      !address
                        ? "Connect wallet to claim"
                        : !selectedTournament.champion
                          ? "Tournament is not completed"
                          : !isSelectedChampion
                            ? "Only the champion can claim this reward"
                            : hasClaimedReward
                              ? "Reward already claimed"
                              : undefined
                    }
                  >
                    {isClaimRewardPending || isClaimRewardConfirming ? "Claiming Reward..." : "Withdraw Champion Reward"}
                  </button>

                  {hasClaimedReward && <p className="market-step-label">Champion reward already claimed.</p>}
                  {isClaimRewardConfirmed && <p className="market-step-label">Champion reward claimed.</p>}
                  {claimRewardError && <p className="market-step-label">Reward claim failed: {claimRewardError.message}</p>}
                </section>

                <section className="tournament-activity" aria-label="Tournament round results">
                  <h3>Champions League Recap</h3>
                  {roundResults.length === 0 ? (
                    <p className="matches-history-state">No round results were indexed for this tournament.</p>
                  ) : (
                    <ol className="tournament-activity-list">
                      {visibleCompletedRoundResults.map((roundResult, index) => (
                        <li key={`round-${roundResult.round}`} className="tournament-activity-item tournament-activity-item--info">
                          <div>
                            <strong>{getKnockoutRoundLabel(roundResult.round, completedRoundsTotal, maxObservedRound)}</strong>
                            <p>{roundResult.matches.length} matches</p>
                            <ol className="tournament-teams-list">
                              {roundResult.matches.map((match) => (
                                <li key={match.id}>
                                  {revealedCompletedReplayKeys.has(getReplayResultKey(match))
                                    ? `${generateName(match.homeAddress)} ${match.homeScore ?? 0} - ${match.awayScore ?? 0} ${generateName(match.awayAddress)} • Winner: ${generateName(match.winner || ZERO_ADDRESS)}`
                                    : `${generateName(match.homeAddress)} vs ${generateName(match.awayAddress)} • Result hidden until replay`}
                                </li>
                              ))}
                            </ol>
                          </div>
                          <button
                            className="matches-history-reveal-button"
                            type="button"
                            onClick={() => handlePlayRound(roundResult.round)}
                          >
                            Play Round
                          </button>
                          {index === visibleCompletedRoundResults.length - 1 && index < roundResults.length - 1 ? (
                            <span>Next round unlocks after this round's first replay finishes.</span>
                          ) : null}
                        </li>
                      ))}
                    </ol>
                  )}
                </section>

                {selectedCompletedRoundResult && (
                  <section className="tournament-bracket" aria-label="Tournament playback controls">
                    <h3>
                      Playback: {getKnockoutRoundLabel(selectedCompletedRoundResult.round, completedRoundsTotal, maxObservedRound)}
                    </h3>
                    <div className="tournament-playback-controls">
                      <button
                        className="matches-history-reveal-button"
                        type="button"
                        onClick={handlePreviousRound}
                        disabled={!canGoToPreviousRound}
                      >
                        Previous Round
                      </button>
                      <button
                        className="matches-history-reveal-button"
                        type="button"
                        onClick={handleNextRound}
                        disabled={!canGoToNextRound}
                      >
                        Next Round
                      </button>
                    </div>

                    <ol className="tournament-match-list">
                      {selectedCompletedRoundResult.matches.map((match) => {
                        const isSelected = selectedCompletedMatch?.id === match.id;
                        return (
                          <li key={match.id} className={`tournament-match-item${isSelected ? " active" : ""}`}>
                            <div>
                              <div className="tournament-match-head">
                                <span>{getKnockoutRoundLabel(match.round, completedRoundsTotal, maxObservedRound)}</span>
                                <strong>
                                  {generateName(match.homeAddress)} vs {generateName(match.awayAddress)}
                                </strong>
                              </div>
                              <p>
                                {revealedCompletedReplayKeys.has(getReplayResultKey(match))
                                  ? `${match.homeScore ?? 0}-${match.awayScore ?? 0} • Winner: ${generateName(match.winner || ZERO_ADDRESS)}`
                                  : "Result hidden. Watch replay to reveal score and winner."}
                              </p>
                            </div>
                            <button
                              className="matches-history-reveal-button"
                              onClick={() => handleWatchCompletedMatch(match)}
                              type="button"
                            >
                              {revealedCompletedReplayKeys.has(getReplayResultKey(match)) ? "Replay Opened" : "Watch Match"}
                            </button>
                          </li>
                        );
                      })}
                    </ol>
                  </section>
                )}

                {selectedCompletedMatch ? (
                  <section className="tournament-replay" aria-label="Selected completed tournament replay">
                    <h3>
                      Replay: {generateName(selectedCompletedMatch.homeAddress)} vs {generateName(selectedCompletedMatch.awayAddress)}
                    </h3>
                    <p>
                      {getKnockoutRoundLabel(selectedCompletedMatch.round, completedRoundsTotal, maxObservedRound)} • Final score: {selectedCompletedMatch.homeScore ?? 0} - {selectedCompletedMatch.awayScore ?? 0}
                    </p>
                    <ShowMatches
                      embeddedMatchId={selectedCompletedMatch.tournamentMatchId}
                      embeddedTournamentId={selectedCompletedMatch.tournamentId}
                      hideHeader
                      onReplayComplete={() => {
                        const replayKey = getReplayResultKey(selectedCompletedMatch);
                        setPlayedOutCompletedReplayKeys((previous) => {
                          if (previous.has(replayKey)) {
                            return previous;
                          }

                          const next = new Set(previous);
                          next.add(replayKey);
                          return next;
                        });
                      }}
                    />
                  </section>
                ) : null}
              </>
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
