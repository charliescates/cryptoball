import { zeroAddress } from "viem";
import { useAccount, useReadContract } from "wagmi";

import { playerContract } from "./contracts/playerContract";
import type { Player } from "./player";
import SquadPlayerCard from "./players/SquadPlayerCard";

const GetPlayers = () => {
  const account = useAccount();

  const { data: allPlayers, error } = useReadContract({
    abi: playerContract.abi,
    address: playerContract.address,
    functionName: "getPlayersByOwner",
    args: [account.address ?? zeroAddress],
    query: {
      enabled: account.isConnected && !!account.address,
    },
  });

  const players = (allPlayers as Player[] | undefined) ?? [];

  if (error) {
    console.error("Failed to fetch players:", error);
    return <div>Error loading players.</div>;
  }

  return (
    <div className="player-container">
      {players.map((player) => (
        <SquadPlayerCard key={player.id.toString()} player={player} />
      ))}
    </div>
  );
};

export default GetPlayers;
