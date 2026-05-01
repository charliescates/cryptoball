import { useQuery } from "@tanstack/react-query";
import { request } from "graphql-request";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { Log } from "viem";
import { zeroAddress } from "viem";
import { useAccount, useReadContract, useWatchContractEvent } from "wagmi";

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

const hasSubmittedTeam = (team?: MatchDetails["homeTeam"]) =>
  !!team &&
  [...team.attackingPlayers, ...team.midfieldPlayers, ...team.defensivePlayers].some((playerId) => playerId > 0n);

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

const JoinMatchPage = () => {
  const account = useAccount();
  const navigate = useNavigate();
  const [selectedMatchId, setSelectedMatchId] = useState<number | null>(null);
  const [gameResult, setGameResult] = useState<GameResultScore | null>(null);

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

  const { data: matchDetails } = useReadContract({
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
        const decodedLog = gameContract.abi.decodeEventLog("MatchPlayed", log.data, log.topics);
        const { homeScore, awayScore } = decodedLog;
        setGameResult({ homeScore: Number(homeScore), awayScore: Number(awayScore) });
      }
    },
  });

  const ownedPlayers = (myPlayers as Player[] | undefined) ?? [];
  const matchList = ((matches as bigint[] | undefined) ?? []).map(Number).filter((id) => id > 0);
  const typedMatchDetails = matchDetails as MatchDetails | undefined;

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
    enabled: bothTeamsSubmitted && !!selectedMatchIdText,
    refetchInterval: bothTeamsSubmitted && selectedMatchIdText ? 4000 : false,
  });

  const isReplayReady = !!replayData?.playedMatches?.length;
  const isReplayPending = bothTeamsSubmitted && !isReplayReady && replayStatus !== "error";

  const handleWatchReplay = () => {
    if (selectedMatchId === null) return;
    navigate(`/games/recent?matchId=${selectedMatchId}&autoplay=1`);
  };

  return (
    <div className="tab-panel">
      <MatchSelector
        matchDetails={typedMatchDetails}
        matchList={matchList}
        selectedMatchId={selectedMatchId}
        onMatchChange={setSelectedMatchId}
      />

      {selectedMatchId === null ? (
        <MatchRequiredPanel hasMatches={matchList.length > 0} />
      ) : (
        <>
          <TeamBuilder
            activePositionIndex={formationBuilder.activePositionIndex}
            activePositionMeta={formationBuilder.activePositionMeta}
            formation={formationBuilder.formation}
            isFormationEmpty={formationBuilder.isFormationEmpty}
            ownedPlayers={ownedPlayers}
            selectedCount={formationBuilder.selectedCount}
            selectedFormation={formationBuilder.selectedFormation}
            selectedPlayerIds={formationBuilder.selectedPlayerIds}
            onClearFormation={formationBuilder.clearFormation}
            onFormationChange={formationBuilder.handleFormationChange}
            onPlayerClick={formationBuilder.handlePlayerClick}
            onPositionClick={formationBuilder.handlePositionClick}
          />

          <SubmitTeamSection
            attackingPlayers={formationBuilder.attackingPlayers}
            defensivePlayers={formationBuilder.defensivePlayers}
            hasOwnTeamSubmitted={hasOwnTeamSubmitted}
            isFormationComplete={formationBuilder.isFormationComplete}
            matchDetails={typedMatchDetails}
            midfieldPlayers={formationBuilder.midfieldPlayers}
            selectedMatchId={selectedMatchId}
            hasBothTeamsSubmitted={bothTeamsSubmitted}
            isReplayPending={isReplayPending}
            isReplayReady={isReplayReady}
            onWatchReplay={handleWatchReplay}
          />
        </>
      )}

      {gameResult && <GameResult result={gameResult} />}
    </div>
  );
};

export default JoinMatchPage;
