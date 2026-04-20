import React, { useEffect, useState } from 'react';
import { useAccount, useReadContract } from 'wagmi';
import { playerContract } from './contracts/playerContract';
import { getPlayerName } from './playerName';
import { getPlayerTypeIcon, getPlayerTypeName, getPlayerTypeColor } from './playerType';
import { Player } from './player';

const formatSignedDelta = (delta: bigint): string => {
    if (delta >= 0n) {
        return `+${delta.toString()}`;
    }
    return delta.toString();
};

const getDeltaClassName = (delta: bigint): string => {
    if (delta > 0n) return 'stat-delta-positive';
    if (delta < 0n) return 'stat-delta-negative';
    return 'stat-delta-neutral';
};

const GetPlayers: React.FC = () => {
    const account = useAccount();
    const [players, setPlayers] = useState<Player[]>([]);

    const { data: allPlayers, error } = useReadContract({
        abi: playerContract.abi,
        address: playerContract.address,
        functionName: 'getPlayersByOwner',
        args: [ account.address! ]
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
            {/* <MintPlayer /> */}
            <div className="player-container">
                {players.map((player) => {
                    const attackDelta = player.attack - player.originalAttack;
                    const defenseDelta = player.defense - player.originalDefense;

                    return (
                        <div className="player-card" key={player.id.toString()}>
                            <div className="player-info">
                            <p className="player-name">Name: <span>{getPlayerName(player.id)}</span></p>
                            <p className="player-type">
                                Type: 
                                <span style={{ 
                                    backgroundColor: getPlayerTypeColor(player.playerType),
                                    padding: '2px 8px',
                                    borderRadius: '4px',
                                    marginLeft: '5px',
                                    fontWeight: 'bold',
                                    color: '#000'
                                }}>
                                    {getPlayerTypeIcon(player.playerType)} {getPlayerTypeName(player.playerType)}
                                </span>
                            </p>
                            <p className="player-attack">
                                Attack:{' '}
                                <span className="stat-value-with-delta">
                                    <span>{player.attack.toString()}</span>
                                    {attackDelta !== 0n && (
                                        <span className={`stat-delta ${getDeltaClassName(attackDelta)}`}>
                                            {formatSignedDelta(attackDelta)}
                                        </span>
                                    )}
                                </span>
                            </p>
                            <p className="player-defense">
                                Defense:{' '}
                                <span className="stat-value-with-delta">
                                    <span>{player.defense.toString()}</span>
                                    {defenseDelta !== 0n && (
                                        <span className={`stat-delta ${getDeltaClassName(defenseDelta)}`}>
                                            {formatSignedDelta(defenseDelta)}
                                        </span>
                                    )}
                                </span>
                            </p>
                            <p className="player-potential">Potential: <span>{player.potential.toString()}</span></p>
                            <p className="player-games-left">Games Left: <span>{player.gamesLeft.toString()}</span></p>
                            <p className="player-goals-scored">Goals Scored: <span>{player.goalsScored.toString()}</span></p>
                        </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default GetPlayers;
