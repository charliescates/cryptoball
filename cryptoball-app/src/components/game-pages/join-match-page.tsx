import { useState } from "react";
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

const JoinMatchPage = () => {
  const account = useAccount();
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
  const matchList = ((matches as number[] | undefined) ?? []).filter((id) => id > 0);
  const typedMatchDetails = matchDetails as MatchDetails | undefined;

  return (
    <div className="tab-panel">
      <MatchSelector
        matchDetails={typedMatchDetails}
        matchList={matchList}
        selectedMatchId={selectedMatchId}
        onMatchChange={setSelectedMatchId}
      />

      <TeamBuilder
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
        isFormationComplete={formationBuilder.isFormationComplete}
        matchDetails={typedMatchDetails}
        midfieldPlayers={formationBuilder.midfieldPlayers}
        selectedMatchId={selectedMatchId}
      />

      {gameResult && <GameResult result={gameResult} />}
    </div>
  );
};

export default JoinMatchPage;
