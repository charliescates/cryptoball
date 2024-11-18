import React, { useEffect, useState } from 'react';
import { useReadContract } from 'wagmi';
import { playerContract } from './contracts/playerContract';
import { MintPlayer } from './mint-player';
import { getPlayerName } from './playerName';
import { Player } from './player';

const GetPlayers: React.FC = () => {
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
        <div>
            <MintPlayer />
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
    );
};

export default GetPlayers;
