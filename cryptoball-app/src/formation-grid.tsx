import { useEffect, useState } from 'react';
import { Player } from './player';
import Position from './position';
import { calculateTeamStats, TeamStats } from './chemistryCalculator';

interface Formation {
    name: string;
    attack: number;
    midfield: number;
    defense: number;
}

interface FormationGridProps {
    teamColour: string;
    teamName: string;
    formation: (Player | null)[];
    selectedFormation: Formation;
    onPositionClick: (index: number) => void;
}

const FormationGrid = ({ teamColour, teamName, formation, selectedFormation, onPositionClick }: FormationGridProps) => {
    const [teamStats, setTeamStats] = useState<TeamStats | null>(null);
    const [showBonusBreakdown, setShowBonusBreakdown] = useState(false);

    useEffect(() => {
        // Split formation into position groups
        const attackPlayers: (Player | null)[] = [];
        const midfieldPlayers: (Player | null)[] = [];
        const defensePlayers: (Player | null)[] = [];

        let currentIndex = 0;
        
        // Attack positions
        for (let i = 0; i < selectedFormation.attack; i++) {
            attackPlayers.push(formation[currentIndex] || null);
            currentIndex++;
        }
        
        // Midfield positions
        for (let i = 0; i < selectedFormation.midfield; i++) {
            midfieldPlayers.push(formation[currentIndex] || null);
            currentIndex++;
        }
        
        // Defense positions
        for (let i = 0; i < selectedFormation.defense; i++) {
            defensePlayers.push(formation[currentIndex] || null);
            currentIndex++;
        }

        const stats = calculateTeamStats(attackPlayers, midfieldPlayers, defensePlayers);
        setTeamStats(stats);
    }, [formation, selectedFormation]);

    const renderPositionRow = (label: string, icon: string, startIndex: number, count: number) => {
        if (count === 0) return null;
        
        return (
            <div className="formation-row">
                <div className="position-label">{icon} {label}</div>
                <div className="formation-positions" style={{ 
                    gridTemplateColumns: `repeat(${count}, 1fr)` 
                }}>
                    {Array.from({ length: count }).map((_, i) => {
                        const index = startIndex + i;
                        return (
                            <Position
                                key={index}
                                positionName={label}
                                teamColour={teamColour}
                                index={index}
                                player={formation[index]}
                                onPositionClick={onPositionClick}
                            />
                        );
                    })}
                </div>
            </div>
        );
    };
    
    return (
        <div className="formation-grid-wrapper">
            <h2 style={{ color: teamColour }}>{teamName}</h2>
            <div className="formation-name-display">{selectedFormation.name}</div>
            
            {renderPositionRow('ATTACK', '⚔️', 0, selectedFormation.attack)}
            {renderPositionRow('MIDFIELD', '⚡', selectedFormation.attack, selectedFormation.midfield)}
            {renderPositionRow('DEFENSE', '🛡️', selectedFormation.attack + selectedFormation.midfield, selectedFormation.defense)}

            <div className="team-stats">
                <div className="stat-box">
                    <span className="stat-label">Attack</span>
                    <span className="stat-value">{teamStats?.finalAttack || 0}</span>
                </div>
                <div className="stat-box">
                    <span className="stat-label">Defense</span>
                    <span className="stat-value">{teamStats?.finalDefense || 0}</span>
                </div>
            </div>

            {teamStats && (teamStats.activeChemistryBonuses.length > 0 || teamStats.playerTypeBonusAttack > 0 || teamStats.playerTypeBonusDefense > 0) && (
                <div style={{ marginTop: '15px' }}>
                    <button 
                        onClick={() => setShowBonusBreakdown(!showBonusBreakdown)}
                        style={{
                            padding: '8px 16px',
                            backgroundColor: '#4dabf7',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontWeight: 'bold',
                            width: '100%'
                        }}
                    >
                        {showBonusBreakdown ? '▼ Hide Bonus Breakdown' : '▶ Show Bonus Breakdown'}
                    </button>
                    
                    {showBonusBreakdown && (
                        <div style={{ 
                            marginTop: '10px', 
                            padding: '15px', 
                            backgroundColor: '#1a1a1a',
                            borderRadius: '8px',
                            border: '1px solid #333'
                        }}>
                            <h3 style={{ margin: '0 0 10px 0', fontSize: '1em', color: '#fff' }}>📊 Stats Breakdown</h3>
                            
                            <div style={{ marginBottom: '15px' }}>
                                <h4 style={{ fontSize: '0.9em', color: '#51cf66', margin: '5px 0' }}>⚔️ Attack</h4>
                                <div style={{ fontSize: '0.85em', paddingLeft: '10px' }}>
                                    <div>Base: {teamStats.baseAttack}</div>
                                    <div>Position + Player Type: {teamStats.positionAdjustedAttack} 
                                        <span style={{ color: '#51cf66' }}> (+{teamStats.playerTypeBonusAttack})</span>
                                    </div>
                                    {teamStats.chemistryBonusAttack > 0 && (
                                        <div>Chemistry Bonus: +{teamStats.chemistryBonusAttack}%</div>
                                    )}
                                    <div style={{ fontWeight: 'bold', marginTop: '5px', color: '#51cf66' }}>
                                        Final: {teamStats.finalAttack}
                                    </div>
                                </div>
                            </div>

                            <div style={{ marginBottom: '15px' }}>
                                <h4 style={{ fontSize: '0.9em', color: '#4dabf7', margin: '5px 0' }}>🛡️ Defense</h4>
                                <div style={{ fontSize: '0.85em', paddingLeft: '10px' }}>
                                    <div>Base: {teamStats.baseDefense}</div>
                                    <div>Position + Player Type: {teamStats.positionAdjustedDefense}
                                        <span style={{ color: '#4dabf7' }}> (+{teamStats.playerTypeBonusDefense})</span>
                                    </div>
                                    {teamStats.chemistryBonusDefense > 0 && (
                                        <div>Chemistry Bonus: +{teamStats.chemistryBonusDefense}%</div>
                                    )}
                                    <div style={{ fontWeight: 'bold', marginTop: '5px', color: '#4dabf7' }}>
                                        Final: {teamStats.finalDefense}
                                    </div>
                                </div>
                            </div>

                            {teamStats.activeChemistryBonuses.length > 0 && (
                                <div>
                                    <h4 style={{ fontSize: '0.9em', color: '#ffd43b', margin: '10px 0 5px 0' }}>⭐ Active Chemistry Bonuses</h4>
                                    {teamStats.activeChemistryBonuses.map((bonus, index) => (
                                        <div 
                                            key={index}
                                            style={{ 
                                                padding: '8px',
                                                marginBottom: '5px',
                                                backgroundColor: '#2a2a2a',
                                                borderRadius: '4px',
                                                borderLeft: `3px solid ${bonus.type === 'attack' ? '#51cf66' : bonus.type === 'defense' ? '#4dabf7' : '#ffd43b'}`
                                            }}
                                        >
                                            <div style={{ fontSize: '0.85em', fontWeight: 'bold' }}>
                                                {bonus.description}
                                            </div>
                                            <div style={{ fontSize: '0.75em', color: '#aaa', marginTop: '3px' }}>
                                                {bonus.attackBonus > 0 && <span style={{ color: '#51cf66' }}>+{bonus.attackBonus}% Attack </span>}
                                                {bonus.defenseBonus > 0 && <span style={{ color: '#4dabf7' }}>+{bonus.defenseBonus}% Defense</span>}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default FormationGrid;