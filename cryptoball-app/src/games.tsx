import { useEffect, useState } from 'react';
import { useAccount, useReadContract, useWatchContractEvent } from 'wagmi';
import { playerContract } from './contracts/playerContract';
import FormationGrid from './formation-grid';
import { Player } from './player';
import StartGame from './actions/playGame';
import AddTeam from './actions/addTeam';
import { gameContract } from './contracts/gameContract';
import { Log, formatEther } from 'viem';
import { getPlayerName } from './playerName';
import { getPlayerTypeIcon, getPlayerTypeName, getPlayerTypeColor } from './playerType';

interface MatchDetails {
    homeAddress: string;
    awayAddress: string;
    wagerRequired: bigint;
    pot: bigint;
}

interface Formation {
    name: string;
    attack: number;
    midfield: number;
    defense: number;
}

// All possible 5-a-side formations with at least 1 in each position
const FORMATIONS: Formation[] = [
    { name: '3-1-1', attack: 3, midfield: 1, defense: 1 },
    { name: '1-3-1', attack: 1, midfield: 3, defense: 1 },
    { name: '1-1-3', attack: 1, midfield: 1, defense: 3 },
    { name: '2-2-1', attack: 2, midfield: 2, defense: 1 },
    { name: '2-1-2', attack: 2, midfield: 1, defense: 2 },
    { name: '1-2-2', attack: 1, midfield: 2, defense: 2 },
];

type TabType = 'start' | 'join';

const Games = () => {
    const account = useAccount();
    const [activeTab, setActiveTab] = useState<TabType>('start');
    const [formation, setFormation] = useState<(Player | null)[]>(Array(5).fill(null));
    const [selectedFormation, setSelectedFormation] = useState<Formation>(FORMATIONS[0]);
    const [selectedMatchId, setSelectedMatchId] = useState<number | null>(null);
    const [gameResult, setGameResult] = useState<{ homeScore: number; awayScore: number } | null>(null);
    const [ownedPlayers, setOwnedPlayers] = useState<Player[]>([]);

    const { data: myPlayers } = useReadContract({
        abi: playerContract.abi,
        address: playerContract.address,
        functionName: 'getPlayersByOwner',
        args: [account.address!],
    });

    const { data: matches } = useReadContract({
        abi: gameContract.abi,
        address: gameContract.address,
        functionName: 'getMatchList',
    });

    const { data: matchDetails } = useReadContract({
        abi: gameContract.abi,
        address: gameContract.address,
        functionName: 'getMatch',
        args: selectedMatchId !== null ? [selectedMatchId] : undefined,
    });

    useWatchContractEvent({
        address: gameContract.address,
        abi: gameContract.abi,
        eventName: 'MatchPlayed',
        onLogs: (logs: Log[]) => {
            logs.forEach((log) => {
                const decodedLog = gameContract.abi.decodeEventLog('MatchPlayed', log.data, log.topics);
                const { matchId, homeScore, awayScore } = decodedLog;
                console.log(`Match ${matchId} played: Home ${homeScore} - Away ${awayScore}`);
                setGameResult({ homeScore: Number(homeScore), awayScore: Number(awayScore) });
            });
        },
    });

    useEffect(() => {
        if (myPlayers) {
            setOwnedPlayers(myPlayers as Player[]);
        }
    }, [myPlayers]);

    // Reset formation when formation type changes
    useEffect(() => {
        setFormation(Array(5).fill(null));
    }, [selectedFormation]);

    const handlePlayerClick = (player: Player) => {
        // Check if player is already in formation
        const isAlreadySelected = formation.some(p => p?.id === player.id);
        if (isAlreadySelected) {
            // Remove player from formation
            setFormation(prev => prev.map(p => p?.id === player.id ? null : p));
            return;
        }

        // Add player to first available position
        const firstEmptyIndex = formation.findIndex(p => p === null);
        if (firstEmptyIndex !== -1) {
            setFormation(prev => {
                const newFormation = [...prev];
                newFormation[firstEmptyIndex] = player;
                return newFormation;
            });
        }
    };

    const handlePositionClick = (index: number) => {
        // Remove player from this position
        setFormation(prev => {
            const newFormation = [...prev];
            newFormation[index] = null;
            return newFormation;
        });
    };

    const clearFormation = () => {
        setFormation(Array(5).fill(null));
    };

    const handleFormationChange = (formationName: string) => {
        const newFormation = FORMATIONS.find(f => f.name === formationName);
        if (newFormation) {
            setSelectedFormation(newFormation);
        }
    };

    const isFormationComplete = formation.every(p => p !== null);
    const selectedPlayerIds = new Set(formation.filter(p => p !== null).map(p => p!.id));

    const matchList = (matches as number[])?.filter(id => id > 0) || [];
    const typedMatchDetails = matchDetails as MatchDetails | undefined;

    // Split formation into positions based on selected formation
    const attackingPlayers = formation.slice(0, selectedFormation.attack).filter(p => p !== null) as Player[];
    const midfieldPlayers = formation.slice(
        selectedFormation.attack,
        selectedFormation.attack + selectedFormation.midfield
    ).filter(p => p !== null) as Player[];
    const defensivePlayers = formation.slice(
        selectedFormation.attack + selectedFormation.midfield,
        5
    ).filter(p => p !== null) as Player[];

    return (
        <div className="games-container">
            {/* Tab Navigation */}
            <div className="tabs-container">
                <div className="tabs-header">
                    <button
                        className={`tab-button ${activeTab === 'start' ? 'active' : ''}`}
                        onClick={() => setActiveTab('start')}
                    >
                        Start New Game
                    </button>
                    <button
                        className={`tab-button ${activeTab === 'join' ? 'active' : ''}`}
                        onClick={() => setActiveTab('join')}
                    >
                        Join Match
                    </button>
                </div>

                <div className="tabs-content">
                    {/* Start New Game Tab */}
                    {activeTab === 'start' && (
                        <div className="tab-panel">
                            <div className="start-game-section">
                                <h2>Create a New Match</h2>
                                <p className="tab-description">
                                    Set up a new match by specifying the home and away addresses and the wager amount.
                                </p>
                                <StartGame />
                            </div>
                        </div>
                    )}

                    {/* Join Match Tab */}
                    {activeTab === 'join' && (
                        <div className="tab-panel">
                            {/* Match Selection Section */}
                            <div className="match-selection-section">
                                <h2>Select Match</h2>
                                {matchList.length === 0 ? (
                                    <p className="no-matches">No matches available</p>
                                ) : (
                                    <select 
                                        className="match-select"
                                        onChange={(e) => {
                                            const value = e.target.value;
                                            console.log('Selected value:', value, 'Type:', typeof value);
                                            const matchId = value === '' ? null : Number(value);
                                            console.log('Setting matchId to:', matchId);
                                            setSelectedMatchId(matchId);
                                        }}
                                        value={selectedMatchId || ''}
                                    >
                                        <option value="">-- Select a Match --</option>
                                        {matchList.map((id: number) => (
                                            <option key={`${id}`} value={`${id}`}>
                                                Match #{`${id}`}
                                            </option>
                                        ))}
                                    </select>
                                )}

                                {typedMatchDetails && selectedMatchId !== null && (
                                    <div className="match-details">
                                        <h3>Match Details</h3>
                                        <div className="match-info">
                                            <p><strong>Match ID:</strong> {selectedMatchId}</p>
                                            <p><strong>Home:</strong> {typedMatchDetails.homeAddress ? `${typedMatchDetails.homeAddress.slice(0, 6)}...${typedMatchDetails.homeAddress.slice(-4)}` : 'Available'}</p>
                                            <p><strong>Away:</strong> {typedMatchDetails.awayAddress ? `${typedMatchDetails.awayAddress.slice(0, 6)}...${typedMatchDetails.awayAddress.slice(-4)}` : 'Available'}</p>
                                            <p><strong>Wager Required:</strong> {typedMatchDetails.wagerRequired ? formatEther(typedMatchDetails.wagerRequired) : '0'} ETH</p>
                                            <p><strong>Prize Pot:</strong> {typedMatchDetails.pot ? formatEther(typedMatchDetails.pot) : '0'} ETH</p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Team Building Section */}
                            <div className="team-building-section">
                                <div className="team-header">
                                    <h2>Build Your Team (5-a-side)</h2>
                                    <div className="formation-controls">
                                        <label htmlFor="formation-select">Formation:</label>
                                        <select 
                                            id="formation-select"
                                            className="formation-select"
                                            value={selectedFormation.name}
                                            onChange={(e) => handleFormationChange(e.target.value)}
                                        >
                                            {FORMATIONS.map((f) => (
                                                <option key={f.name} value={f.name}>
                                                    {f.name} (ATT: {f.attack}, MID: {f.midfield}, DEF: {f.defense})
                                                </option>
                                            ))}
                                        </select>
                                        <button 
                                            className="clear-formation-button" 
                                            onClick={clearFormation}
                                            disabled={formation.every(p => p === null)}
                                        >
                                            Clear Formation
                                        </button>
                                    </div>
                                </div>

                                <div className="team-builder">
                                    {/* Player Roster */}
                                    <div className="player-roster">
                                        <h3>Your Players</h3>
                                        <p className="formation-info">
                                            Selected: {formation.filter(p => p !== null).length} / 5
                                        </p>
                                        {ownedPlayers.length === 0 ? (
                                            <p className="no-players">No players available. Visit the Academy to get players!</p>
                                        ) : (
                                            <div className="player-list">
                                                {ownedPlayers.map((player) => {
                                                    const isSelected = selectedPlayerIds.has(player.id);
                                                    return (
                                                        <div
                                                            key={player.id.toString()}
                                                            className={`player-card-small ${isSelected ? 'selected' : ''}`}
                                                            onClick={() => handlePlayerClick(player)}
                                                            style={{ position: 'relative' }}
                                                        >
                                                            <span
                                                                style={{ 
                                                                    position: 'absolute',
                                                                    top: '4px',
                                                                    right: '4px',
                                                                    backgroundColor: getPlayerTypeColor(player.playerType),
                                                                    padding: '2px 6px',
                                                                    borderRadius: '4px',
                                                                    fontSize: '0.85em',
                                                                    fontWeight: 'bold',
                                                                    color: '#000',
                                                                    display: 'inline-block',
                                                                    lineHeight: '1'
                                                                }}
                                                                title={getPlayerTypeName(player.playerType)}
                                                            >
                                                                {getPlayerTypeIcon(player.playerType)}
                                                            </span>
                                                            <div className="player-card-header">
                                                                <strong>{getPlayerName(player.id)}</strong>
                                                                {isSelected && <span className="selected-badge">✓</span>}
                                                            </div>
                                                            <div className="player-stats">
                                                                <span>ATT: {player.attack.toString()}</span>
                                                                <span>DEF: {player.defense.toString()}</span>
                                                                <span>POT: {player.potential.toString()}</span>
                                                            </div>
                                                            <div className="player-games">
                                                                Games Left: {player.gamesLeft.toString()}
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>

                                    {/* Formation Grid */}
                                    <div className="formation-section">
                                        <FormationGrid
                                            teamColour="#32ff7e"
                                            teamName="Your Team"
                                            formation={formation}
                                            selectedFormation={selectedFormation}
                                            onPositionClick={handlePositionClick}
                                        />
                                        
                                        {!isFormationComplete && (
                                            <p className="formation-hint">
                                                Click players on the left to add them to your {selectedFormation.name} formation. You need 5 players total.
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Submit Team Section */}
                            <div className="submit-section">
                                {!isFormationComplete && (
                                    <p className="warning">Please select all 5 players before submitting your team.</p>
                                )}
                                {selectedMatchId === null && (
                                    <p className="warning">Please select a match before submitting your team.</p>
                                )}
                                <AddTeam
                                    matchId={selectedMatchId?.toString() || ''}
                                    attackingPlayers={attackingPlayers}
                                    midfieldPlayers={midfieldPlayers}
                                    defensivePlayers={defensivePlayers}
                                    wager={typedMatchDetails?.wagerRequired ? formatEther(typedMatchDetails.wagerRequired) : '0'}
                                />
                            </div>

                            {/* Game Result Section */}
                            {gameResult && (
                                <div className="game-result">
                                    <h2>Game Result</h2>
                                    <div className="score">
                                        <span className="home-score">{gameResult.homeScore}</span>
                                        <span className="separator">-</span>
                                        <span className="away-score">{gameResult.awayScore}</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Games;