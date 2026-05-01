import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { useAccount, useReadContract } from "wagmi";

import { Deposit } from "../actions/deposit";
import { Extract } from "../actions/extract";
import { academyContract } from "../contracts/academyContract";
import type { AcademyPlayer } from "../utils/playerUtils";
import { PlayerCard } from "./PlayerCard";

const EXTRACT_ADDRESS = "0x05B665d3Ba0a83f5259C114fA3F2d2ECD8A00B29";

export const Academy = () => {
  const { address, isConnected } = useAccount();

  const isOwnerWallet = isConnected && address?.toLowerCase() === EXTRACT_ADDRESS.toLowerCase();

  const { data: allPlayers, error } = useReadContract({
    abi: academyContract.abi,
    address: academyContract.address,
    functionName: "getAcademyPlayers",
    query: {
      refetchInterval: 10000,
    },
  });

  const players = (allPlayers as AcademyPlayer[] | undefined) ?? [];

  if (error) {
    console.error("Failed to fetch players:", error);
  }

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="app">
        {isOwnerWallet && <Deposit />}
        {isOwnerWallet && <Extract />}

        <section className="academy-section-header" aria-labelledby="academy-title">
          <div>
            <p className="academy-section-kicker">Recruitment</p>
            <h1 id="academy-title">Academy</h1>
            <p className="academy-section-copy">Scout fresh talent and sign the next CryptoBalls starter.</p>
          </div>
          <div className="academy-section-count">
            <strong>{players.length}</strong>
            <span>available</span>
          </div>
        </section>

        <div className="academy-player-grid">
          {error ? (
            <div>Error loading players.</div>
          ) : (
            players.map((player) => <PlayerCard key={player.id.toString()} player={player} />)
          )}
        </div>
      </div>
    </DndProvider>
  );
};

export default Academy;
