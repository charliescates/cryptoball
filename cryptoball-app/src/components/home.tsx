import { zeroAddress } from "viem";
import { useAccount, useReadContract } from "wagmi";

import { playerContract } from "../contracts/playerContract";
import { useMyListedTokenIds } from "./market/useMyListedTokenIds";
import HomeDisconnected from "./home/HomeDisconnected";
import SquadDashboard from "./home/SquadDashboard";
import WelcomeSection from "./home/WelcomeSection";
import type { Player } from "./player";
import generateName from "./utils/teamName";
import "./home.css";

const Home = () => {
  const account = useAccount();

  const { data: allPlayers } = useReadContract({
    abi: playerContract.abi,
    address: playerContract.address,
    functionName: "getPlayersByOwner",
    args: [account.address ?? zeroAddress],
    query: {
      enabled: account.isConnected && !!account.address,
      refetchInterval: 12_000,
    },
  });

  const listedTokenIds = useMyListedTokenIds();
  const players = ((allPlayers as Player[] | undefined) ?? []).filter(
    (p) => !listedTokenIds.has(p.id),
  );
  const playerCount = players.length;
  const teamName = account.address ? generateName(account.address) : null;

  return (
    <div className="home-container">
      {!account.isConnected ? (
        <HomeDisconnected />
      ) : playerCount === 0 ? (
        <WelcomeSection teamName={teamName ?? undefined} />
      ) : (
        <SquadDashboard players={players} teamName={teamName ?? undefined} />
      )}
    </div>
  );
};

export default Home;
