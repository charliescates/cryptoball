import { useEffect, useState } from "react";
import { Player } from "./player";
import { playerContract } from "./contracts/playerContract";
import { useReadContract } from "wagmi";
import { Deposit } from "./actions/deposit";
import { getPlayerName } from "./playerName";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";

const Academy = () => {
    const [players, setPlayers] = useState<Player[]>([]);

    const { data: allPlayers, error } = useReadContract({
        abi: playerContract.abi,
        address: playerContract.address,
        functionName: 'getAllPlayers',
    });

    useEffect(() => {
        if (allPlayers) {
            setPlayers(allPlayers as Player[]);
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
                                <p className="player-games-left">Games Left: <span>{player.gamesLeft.toString()}</span></p>
                                <p className="player-goals-scored">Goals Scored: <span>{player.goalsScored.toString()}</span></p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </DndProvider>
    );
}

export default Academy;