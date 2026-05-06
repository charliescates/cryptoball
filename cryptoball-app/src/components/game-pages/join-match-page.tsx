import { useQuery } from "@tanstack/react-query";
import { request } from "graphql-request";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { type Log, decodeEventLog } from "viem";
import { zeroAddress } from "viem";
import { useAccount, useReadContract, useReadContracts, useWatchContractEvent } from "wagmi";

import { gameContract } from "../../contracts/gameContract";
import { playerContract } from "../../contracts/playerContract";
import type { Player } from "../player";
import GameResult from "./join-match/GameResult";
import MatchSelector from "./join-match/MatchSelector";
import SubmitTeamSection from "./join-match/SubmitTeamSection";
import TeamBuilder from "./join-match/TeamBuilder";
import type { GameResultScore, MatchDetails } from "./join-match/types";
import { useFormationBuilder } from "./join-match/useFormationBuilder";
import {
  type MatchesResponse,
  matchResultsHeaders,
  matchResultsUrl,
  playedMatchByMatchIdQuery,
} from "./matchResultsQuery";
import { getRecentMatchSquad, restoreRecentMatchSquad, saveRecentMatchSquad } from "./recentMatchSquad";

const hasSubmittedTeam = (team?: MatchDetails["homeTeam"]) =>
  !!team &&
  [...team.attackingPlayers, ...team.midfieldPlayers, ...team.defensivePlayers].some((playerId) => playerId > 0n);

type PlayedMatchEventArgs = {
  awayScore: bigint | number;
  homeScore: bigint | number;
  matchId: bigint;
};

const MatchRequiredPanel = ({ hasMatches }: { hasMatches: boolean }) => (
  <section className="join-flow-locked" aria-label="Squad setup locked">
    <p className="join-flow-kicker">Squad setup locked</p>
    <h2>Select a Match First</h2>
    <p>
      {hasMatches
        ? "Choose an open match above to unlock formation, player selection, and final team review."
        : "There are no open matches right now. Start a new match or wait for one to appear before building your team."}
    </p>
    <div className="join-flow-locked-steps" aria-label="Locked join flow">
      <span className="active">1 Match</span>
      <span>2 Shape</span>
      <span>3 Players</span>
      <span>4 Lock team</span>
    </div>
  </section>
);

const LockedTeamPanel = ({ isConfirmed, isPending }: { isConfirmed: boolean; isPending: boolean }) => (
  <section className="join-flow-locked" aria-label="Submitted squad locked">
    <p className="join-flow-kicker">Team submitted</p>
    <h2>Your Team Is Locked</h2>
    <p>
      {isConfirmed
        ? "Your team is confirmed on-chain. The match will play automatically once both sides are ready."
        : isPending
          ? "Your wallet transaction is in progress. This team can no longer be edited for this match."
          : "Your team is locked for this match. Waiting for the match to complete."}
    </p>
    <div className="join-flow-locked-steps" aria-label="Submitted team flow">
      <span className="complete">1 Team</span>
      <span className={isConfirmed ? "complete" : "active"}>2 Confirm</span>
      <span>3 Play</span>
      <span>4 Replay</span>
    </div>
  </section>
);

const JoinMatchPage = () => {
  const account = useAccount();
  const navigate = useNavigate();
  const [selectedMatchId, setSelectedMatchId] = useState<number | null>(null);
  const [gameResult, setGameResult] = useState<GameResultScore | null>(null);
  const [isTeamSubmissionPending, setIsTeamSubmissionPending] = useState(false);
  const [isTeamTransactionConfirmed, setIsTeamTransactionConfirmed] = useState(false);
  const [playedMatchId, setPlayedMatchId] = useState<number | null>(null);
  const [recentSquadMessage, setRecentSquadMessage] = useState<string | null>(null);

  const formationBuilder = useFormationBuilder();

  const { data: myPlayers } = useReadContract({
    abi: playerContract.abi,
    address: playerContract.address,
    functionName: "getPlayersByOwner",
    args: [account.address ?? zeroAddress],
    query: {
      enabled: account.isConnected && !!account.address,
    },
  });

  const { data: matches } = useReadContract({
    abi: gameContract.abi,
    address: gameContract.address,
    functionName: "getMatchList",
  });

  const { data: matchDetails, refetch: refetchMatchDetails } = useReadContract({
    abi: gameContract.abi,
    address: gameContract.address,
    functionName: "getMatch",
    args: selectedMatchId !== null ? [selectedMatchId] : undefined,
    query: {
      enabled: selectedMatchId !== null,
      refetchInterval: selectedMatchId !== null ? 4000 : false,
    },
  });

  useWatchContractEvent({
    address: gameContract.address,
    abi: gameContract.abi,
    eventName: "MatchPlayed",
    onLogs: (logs: Log[]) => {
      for (const log of logs) {
        const { args } = decodeEventLog({
          abi: gameContract.abi,
          data: log.data,
          eventName: "MatchPlayed",
          topics: log.topics,
        });
        const { awayScore, homeScore, matchId } = args as PlayedMatchEventArgs;
        const nextPlayedMatchId = Number(matchId);

        if (selectedMatchId === null || nextPlayedMatchId !== selectedMatchId) {
          continue;
        }

        setPlayedMatchId(nextPlayedMatchId);
        setGameResult({ homeScore: Number(homeScore), awayScore: Number(awayScore) });
      }
    },
  });

  const ownedPlayers = (myPlayers as Player[] | undefined) ?? [];
  const matchList = ((matches as bigint[] | undefined) ?? []).map(Number).filter((id) => id > 0);
  const typedMatchDetails = matchDetails as MatchDetails | undefined;

  const matchContracts = useMemo(
    () =>
      matchList.map((id) => ({
        abi: gameContract.abi,
        address: gameContract.address,
        functionName: "getMatch" as const,
        args: [id] as const,
      })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [matchList.join(",")],
  );

  const { data: allMatchDetailsRaw } = useReadContracts({
    contracts: matchContracts,
    query: { enabled: matchList.length > 0 },
  });

  const userMatchesWithDetails = useMemo(() => {
    if (!allMatchDetailsRaw || !account.address) return [];
    const userAddr = account.address.toLowerCase();
    return matchList
      .map((id, i) => {
        const result = allMatchDetailsRaw[i];
        if (result?.status !== "success") return null;
        const details = result.result as MatchDetails;
        const isInvolved =
          details.homeAddress.toLowerCase() === userAddr || details.awayAddress.toLowerCase() === userAddr;
        if (!isInvolved) return null;
        return { id, details };
      })
      .filter((item): item is { id: number; details: MatchDetails } => item !== null);
  }, [allMatchDetailsRaw, matchList, account.address]);

  const bothTeamsSubmitted = useMemo(() => {
    if (!typedMatchDetails) return false;
    return hasSubmittedTeam(typedMatchDetails.homeTeam) && hasSubmittedTeam(typedMatchDetails.awayTeam);
  }, [typedMatchDetails]);

  const hasOwnTeamSubmitted = useMemo(() => {
    if (!typedMatchDetails || !account.address) return false;
    const currentAddress = account.address.toLowerCase();
    if (typedMatchDetails.homeAddress.toLowerCase() === currentAddress) {
      return hasSubmittedTeam(typedMatchDetails.homeTeam);
    }
    if (typedMatchDetails.awayAddress.toLowerCase() === currentAddress) {
      return hasSubmittedTeam(typedMatchDetails.awayTeam);
    }
    return false;
  }, [account.address, typedMatchDetails]);

  const hasLockedTeam = hasOwnTeamSubmitted || isTeamSubmissionPending || isTeamTransactionConfirmed;
  const recentSquad = getRecentMatchSquad();
  const canUseRecentSquad = !!recentSquad && !hasLockedTeam && ownedPlayers.length > 0;
  const shouldPollReplay = hasLockedTeam || bothTeamsSubmitted || playedMatchId !== null;
  const selectedMatchIdText = selectedMatchId?.toString();
  const { data: replayData, status: replayStatus } = useQuery<MatchesResponse>({
    queryKey: ["played-match", selectedMatchIdText],
    async queryFn() {
      return await request(
        matchResultsUrl,
        playedMatchByMatchIdQuery,
        { matchId: selectedMatchIdText },
        matchResultsHeaders,
      );
    },
    enabled: shouldPollReplay && !!selectedMatchIdText,
    refetchInterval: shouldPollReplay && selectedMatchIdText ? 4000 : false,
  });

  const isReplayReady = shouldPollReplay && !!replayData?.playedMatches?.length;
  const isReplayPending = shouldPollReplay && !isReplayReady && replayStatus !== "error";

  const handleWatchReplay = useCallback(() => {
    if (selectedMatchId === null) return;
    navigate(`/games/recent?matchId=${selectedMatchId}&autoplay=1`);
  }, [navigate, selectedMatchId]);

  const handleTeamTransactionConfirmed = useCallback(() => {
    setIsTeamSubmissionPending(false);
    setIsTeamTransactionConfirmed(true);
    void refetchMatchDetails();
  }, [refetchMatchDetails]);

  const handleTeamTransactionFailed = useCallback(() => {
    setIsTeamSubmissionPending(false);
  }, []);

  const handleMatchChange = useCallback((matchId: number | null) => {
    setSelectedMatchId(matchId);
    setGameResult(null);
    setIsTeamSubmissionPending(false);
    setIsTeamTransactionConfirmed(false);
    setPlayedMatchId(null);
    setRecentSquadMessage(null);
  }, []);

  const getOpponentAddress = useCallback(() => {
    if (!typedMatchDetails || !account.address) return undefined;
    const currentAddress = account.address.toLowerCase();

    if (typedMatchDetails.homeAddress.toLowerCase() === currentAddress) {
      return typedMatchDetails.awayAddress;
    }

    if (typedMatchDetails.awayAddress.toLowerCase() === currentAddress) {
      return typedMatchDetails.homeAddress;
    }

    return undefined;
  }, [account.address, typedMatchDetails]);

  const saveSubmittedSquad = useCallback(() => {
    if (selectedMatchId === null) return;

    saveRecentMatchSquad({
      attackingPlayerIds: formationBuilder.attackingPlayers.map((player) => player.id.toString()),
      defensivePlayerIds: formationBuilder.defensivePlayers.map((player) => player.id.toString()),
      formationName: formationBuilder.selectedFormation.name,
      matchId: selectedMatchId,
      midfieldPlayerIds: formationBuilder.midfieldPlayers.map((player) => player.id.toString()),
      opponentAddress: getOpponentAddress(),
    });
  }, [
    formationBuilder.attackingPlayers,
    formationBuilder.defensivePlayers,
    formationBuilder.midfieldPlayers,
    formationBuilder.selectedFormation.name,
    getOpponentAddress,
    selectedMatchId,
  ]);

  const handleUseRecentSquad = useCallback(() => {
    const restoredSquad = restoreRecentMatchSquad(ownedPlayers, getRecentMatchSquad());

    if (!restoredSquad) {
      setRecentSquadMessage("No recent squad is available yet.");
      return;
    }

    formationBuilder.applyFormation(restoredSquad.formation, restoredSquad.selectedFormation);
    setRecentSquadMessage(
      restoredSquad.restoredCount === restoredSquad.totalCount
        ? `Restored ${restoredSquad.restoredCount} players from your most recent match.`
        : `Restored ${restoredSquad.restoredCount} of ${restoredSquad.totalCount} players. Pick replacements for the rest.`,
    );
  }, [formationBuilder, ownedPlayers]);

  useEffect(() => {
    if (playedMatchId !== null || isReplayReady) {
      handleWatchReplay();
    }
  }, [handleWatchReplay, isReplayReady, playedMatchId]);

  return (
    <div className="tab-panel">
      <MatchSelector
        currentAddress={account.address}
        matchDetails={typedMatchDetails}
        matchesWithDetails={userMatchesWithDetails}
        selectedMatchId={selectedMatchId}
        disabled={hasLockedTeam}
        onMatchChange={handleMatchChange}
      />

      {selectedMatchId === null ? (
        <MatchRequiredPanel hasMatches={userMatchesWithDetails.length > 0} />
      ) : (
        <>
          {hasLockedTeam ? (
            <LockedTeamPanel
              isConfirmed={hasOwnTeamSubmitted || isTeamTransactionConfirmed}
              isPending={isTeamSubmissionPending}
            />
          ) : (
            <TeamBuilder
              activePositionIndex={formationBuilder.activePositionIndex}
              activePositionMeta={formationBuilder.activePositionMeta}
              formation={formationBuilder.formation}
              isFormationEmpty={formationBuilder.isFormationEmpty}
              ownedPlayers={ownedPlayers}
              selectedCount={formationBuilder.selectedCount}
              selectedFormation={formationBuilder.selectedFormation}
              selectedPlayerIds={formationBuilder.selectedPlayerIds}
              onAutoPick={() => formationBuilder.autoPickFormation(ownedPlayers)}
              onClearFormation={formationBuilder.clearFormation}
              onFormationChange={formationBuilder.handleFormationChange}
              onPlayerClick={formationBuilder.handlePlayerClick}
              onPositionClick={formationBuilder.handlePositionClick}
              onUseRecentSquad={canUseRecentSquad ? handleUseRecentSquad : undefined}
              recentSquadLabel={recentSquad ? `Use squad from match #${recentSquad.matchId}` : undefined}
              recentSquadMessage={recentSquadMessage}
            />
          )}

          <SubmitTeamSection
            attackingPlayers={formationBuilder.attackingPlayers}
            defensivePlayers={formationBuilder.defensivePlayers}
            hasOwnTeamSubmitted={hasLockedTeam}
            isFormationComplete={formationBuilder.isFormationComplete}
            matchDetails={typedMatchDetails}
            midfieldPlayers={formationBuilder.midfieldPlayers}
            selectedMatchId={selectedMatchId}
            hasBothTeamsSubmitted={bothTeamsSubmitted}
            isReplayPending={isReplayPending}
            isReplayReady={isReplayReady}
            onTransactionConfirmed={handleTeamTransactionConfirmed}
            onTransactionFailed={handleTeamTransactionFailed}
            onTransactionStarted={() => {
              saveSubmittedSquad();
              setIsTeamSubmissionPending(true);
            }}
            onWatchReplay={handleWatchReplay}
          />
        </>
      )}

      {gameResult && <GameResult result={gameResult} />}
    </div>
  );
};

export default JoinMatchPage;
