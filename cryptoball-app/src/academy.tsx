import { useEffect, useState } from "react";
import { useReadContract } from "wagmi";
import { Deposit } from "./actions/deposit";
import { getPlayerName } from "./playerName";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { academyContract } from "./contracts/academyContract";
import { BuyPlayer } from "./actions/buyPlayer";

type AcademyPlayer =  {
    id: bigint;
    attack: bigint;
    defense: bigint;
    potential: bigint;
    value: bigint;
}

const Academy = () => {
    const [players, setPlayers] = useState<AcademyPlayer[]>([]);

    const { data: allPlayers, error } = useReadContract({
        abi: academyContract.abi,
        address: academyContract.address,
        functionName: 'getAcademyPlayers'
    });

    useEffect(() => {
        if (allPlayers) {
            setPlayers(allPlayers as AcademyPlayer[]);
        }
    }, [allPlayers]);

    if (error) {
        console.error('Failed to fetch players:', error);
        return <div>Error loading players.</div>;
    }

    return (
        <DndProvider backend={HTML5Backend}>
            <div className="app">
                <Deposit />
                <div className="player-container">
                    {players.map((player) => (
                        <div className="player-card" key={player.id.toString()}>
                            <div className="player-info">
                                <p className="player-name">Name: <span>{getPlayerName(player.id)}</span></p>
                                <p className="player-attack">Attack: <span>{player.attack.toString()}</span></p>
                                <p className="player-defense">Defense: <span>{player.defense.toString()}</span></p>
                                <p className="player-potential">Potential: <span>{player.potential.toString()}</span></p>
                                <p className="player-value">Value: <span>{(Number(player.value) / 1e18).toFixed(4)} ETH</span></p>
                                <BuyPlayer playerId={player.id} price={player.value} />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </DndProvider>
    );
}

export default Academy;