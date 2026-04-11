import React from 'react';
import './index.css';

export default function Chemistry() {
    return (
        <div className="chemistry-page" style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
            <h1>Chemistry System Guide</h1>
            
            <section style={{ marginBottom: '30px' }}>
                <h2>Overview</h2>
                <p>
                    The Chemistry System in CryptoBalls is a complex strategic layer that rewards smart team composition.
                    Your team's final attack and defense stats are calculated through multiple stages: base stats, position bonuses,
                    player type bonuses, and chemistry bonuses.
                </p>
            </section>

            <section style={{ marginBottom: '30px' }}>
                <h2>Player Types</h2>
                <p>There are four player types, each with unique strengths:</p>
                
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginTop: '15px' }}>
                    <div style={{ border: '2px solid #4a9eff', borderRadius: '8px', padding: '15px' }}>
                        <h3 style={{ color: '#4a9eff' }}>🛡️ Enforcer</h3>
                        <p><strong>Best Position:</strong> Defense or Attack</p>
                        <ul>
                            <li>Attack Position: +5% Attack</li>
                            <li>Defense Position: +10% Defense</li>
                            <li>Midfield: +5% Defense</li>
                        </ul>
                    </div>
                    
                    <div style={{ border: '2px solid #ff4a4a', borderRadius: '8px', padding: '15px' }}>
                        <h3 style={{ color: '#ff4a4a' }}>⚽ Target Man</h3>
                        <p><strong>Best Position:</strong> Attack</p>
                        <ul>
                            <li>Attack Position: +10% Attack</li>
                            <li>Other Positions: No bonus</li>
                        </ul>
                    </div>
                    
                    <div style={{ border: '2px solid #4aff4a', borderRadius: '8px', padding: '15px' }}>
                        <h3 style={{ color: '#4aff4a' }}>🎯 Playmaker</h3>
                        <p><strong>Best Position:</strong> Midfield</p>
                        <ul>
                            <li>Attack Position: +5% Attack</li>
                            <li>Midfield: +10% Attack</li>
                            <li>Defense Position: No bonus</li>
                        </ul>
                    </div>
                    
                    <div style={{ border: '2px solid #ff9d4a', borderRadius: '8px', padding: '15px' }}>
                        <h3 style={{ color: '#ff9d4a' }}>⚓ Anchor</h3>
                        <p><strong>Best Position:</strong> Defense</p>
                        <ul>
                            <li>Defense Position: +10% Defense</li>
                            <li>Midfield: +5% Defense</li>
                            <li>Attack Position: No bonus</li>
                        </ul>
                    </div>
                </div>
            </section>

            <section style={{ marginBottom: '30px' }}>
                <h2>Position Multipliers</h2>
                <p>Beyond player type bonuses, each position has base multipliers:</p>
                <ul>
                    <li><strong>Attack Position:</strong> 110% Attack, 90% Defense (base)</li>
                    <li><strong>Midfield Position:</strong> 100% Attack, 100% Defense (base)</li>
                    <li><strong>Defense Position:</strong> 90% Attack, 110% Defense (base)</li>
                </ul>
            </section>

            <section style={{ marginBottom: '30px' }}>
                <h2>Chemistry Bonuses</h2>
                <p>
                    Chemistry bonuses are triggered when specific player type combinations are placed in the right positions.
                    Players can only be used in ONE chemistry bonus, and higher-value bonuses are checked first.
                </p>
                
                <h3 style={{ marginTop: '20px', color: '#ff4a4a' }}>🔥 6-Point Bonuses (Checked First)</h3>
                <div style={{ marginLeft: '20px', marginTop: '10px' }}>
                    <div style={{ backgroundColor: '#2a2a3a', padding: '15px', borderRadius: '8px', marginBottom: '15px' }}>
                        <h4>⚔️ Strike Force (+6% Attack)</h4>
                        <p><strong>Combination:</strong> Playmaker (Midfield) + Target Man (Attack) + Target Man (Attack)</p>
                        <p style={{ fontSize: '0.9em', color: '#aaa' }}>Positions: Mid-Left + Attack-Left + Attack-Center</p>
                    </div>
                    
                    <div style={{ backgroundColor: '#2a2a3a', padding: '15px', borderRadius: '8px', marginBottom: '15px' }}>
                        <h4>🏰 Defensive Wall (+6% Defense)</h4>
                        <p><strong>Combination:</strong> Anchor (Defense) + Enforcer (Defense) + Enforcer (Defense)</p>
                        <p style={{ fontSize: '0.9em', color: '#aaa' }}>Positions: Defense-Left + Defense-Center + Defense-Right</p>
                    </div>
                </div>

                <h3 style={{ marginTop: '20px', color: '#4a9eff' }}>⚡ 3-Point Bonuses</h3>
                <div style={{ marginLeft: '20px', marginTop: '10px' }}>
                    <div style={{ backgroundColor: '#2a2a3a', padding: '15px', borderRadius: '8px', marginBottom: '15px' }}>
                        <h4>🤝 Balanced Trio (+3% Attack, +3% Defense)</h4>
                        <p><strong>Combination:</strong> Anchor (Defense) + Playmaker (Midfield) + Target Man (Attack)</p>
                        <p style={{ fontSize: '0.9em', color: '#aaa' }}>Positions: Defense-Left + Mid-Left + Attack-Left</p>
                    </div>
                    
                    <div style={{ backgroundColor: '#2a2a3a', padding: '15px', borderRadius: '8px', marginBottom: '15px' }}>
                        <h4>🎭 Midfield Dominance (+3% Attack, +3% Defense)</h4>
                        <p><strong>Combination:</strong> Playmaker (Midfield) + Anchor (Midfield) + Enforcer (Midfield)</p>
                        <p style={{ fontSize: '0.9em', color: '#aaa' }}>Positions: Mid-Left + Mid-Center + Mid-Right</p>
                    </div>
                    
                    <div style={{ backgroundColor: '#2a2a3a', padding: '15px', borderRadius: '8px', marginBottom: '15px' }}>
                        <h4>🎯 Playmaker + Target Man (+3% Attack)</h4>
                        <p><strong>Combination:</strong> Playmaker (Midfield) + Target Man (Attack)</p>
                        <p style={{ fontSize: '0.9em', color: '#aaa' }}>Positions: Mid-Left + Attack-Left</p>
                    </div>
                    
                    <div style={{ backgroundColor: '#2a2a3a', padding: '15px', borderRadius: '8px', marginBottom: '15px' }}>
                        <h4>💪 Target Man + Enforcer (+3% Attack)</h4>
                        <p><strong>Combination:</strong> Target Man (Attack) + Enforcer (Attack)</p>
                        <p style={{ fontSize: '0.9em', color: '#aaa' }}>Positions: Attack-Left + Attack-Center</p>
                    </div>
                    
                    <div style={{ backgroundColor: '#2a2a3a', padding: '15px', borderRadius: '8px', marginBottom: '15px' }}>
                        <h4>🎯 Target Man + Playmaker (+3% Attack)</h4>
                        <p><strong>Combination:</strong> Target Man (Attack) + Playmaker (Attack)</p>
                        <p style={{ fontSize: '0.9em', color: '#aaa' }}>Positions: Attack-Left + Attack-Center</p>
                    </div>
                    
                    <div style={{ backgroundColor: '#2a2a3a', padding: '15px', borderRadius: '8px', marginBottom: '15px' }}>
                        <h4>🛡️ Anchor + Enforcer (+3% Defense)</h4>
                        <p><strong>Combination:</strong> Anchor (Defense) + Enforcer (Defense)</p>
                        <p style={{ fontSize: '0.9em', color: '#aaa' }}>Positions: Defense-Left + Defense-Center</p>
                    </div>
                    
                    <div style={{ backgroundColor: '#2a2a3a', padding: '15px', borderRadius: '8px', marginBottom: '15px' }}>
                        <h4>🛡️ Enforcer Duo (+3% Defense)</h4>
                        <p><strong>Combination:</strong> Enforcer (Defense) + Enforcer (Defense)</p>
                        <p style={{ fontSize: '0.9em', color: '#aaa' }}>Positions: Defense-Left + Defense-Center</p>
                    </div>
                    
                    <div style={{ backgroundColor: '#2a2a3a', padding: '15px', borderRadius: '8px', marginBottom: '15px' }}>
                        <h4>🎯 Midfield: Playmaker + Anchor (+3% Defense)</h4>
                        <p><strong>Combination:</strong> Playmaker (Midfield) + Anchor (Midfield)</p>
                        <p style={{ fontSize: '0.9em', color: '#aaa' }}>Positions: Mid-Left + Mid-Center</p>
                    </div>
                </div>
            </section>

            <section style={{ marginBottom: '30px' }}>
                <h2>Formation Grid Reference</h2>
                <p>Player positions are indexed as follows:</p>
                <div style={{ backgroundColor: '#1a1a2a', padding: '20px', borderRadius: '8px', fontFamily: 'monospace' }}>
                    <div style={{ textAlign: 'center', marginBottom: '10px', color: '#ff4a4a' }}>
                        <strong>ATTACK</strong><br />
                        [6: Left] [7: Center] [8: Right]
                    </div>
                    <div style={{ textAlign: 'center', marginBottom: '10px', color: '#4aff4a' }}>
                        <strong>MIDFIELD</strong><br />
                        [3: Left] [4: Center] [5: Right]
                    </div>
                    <div style={{ textAlign: 'center', color: '#4a9eff' }}>
                        <strong>DEFENSE</strong><br />
                        [0: Left] [1: Center] [2: Right]
                    </div>
                </div>
            </section>

            <section style={{ marginBottom: '30px' }}>
                <h2>Calculation Order</h2>
                <p>Team stats are calculated in the following order:</p>
                <ol>
                    <li><strong>Base Stats:</strong> Sum of all player attack/defense values</li>
                    <li><strong>Position Multipliers:</strong> Apply base position multipliers (110%/90%/100%)</li>
                    <li><strong>Player Type Bonuses:</strong> Add player type-specific bonuses based on position</li>
                    <li><strong>Chemistry Bonuses:</strong> Apply percentage bonuses from chemistry combinations</li>
                    <li><strong>Final Stats:</strong> Round to nearest integer</li>
                </ol>
                
                <div style={{ backgroundColor: '#1a1a2a', padding: '15px', borderRadius: '8px', marginTop: '15px' }}>
                    <strong>Example Formula:</strong><br />
                    <code>Final Attack = ((Position-Adjusted Attack) × (100 + Chemistry Bonus %)) / 100</code>
                </div>
            </section>

            <section style={{ marginBottom: '30px' }}>
                <h2>Strategy Tips</h2>
                <ul>
                    <li>🎯 <strong>Maximize Synergies:</strong> Try to trigger multiple chemistry bonuses by strategic placement</li>
                    <li>⚖️ <strong>Balance vs Specialization:</strong> Decide whether to focus on attack, defense, or both</li>
                    <li>🔄 <strong>Player Type Matters:</strong> Place players in positions that match their type for maximum efficiency</li>
                    <li>💎 <strong>High-Value Combos:</strong> Aim for 6-point bonuses when possible, they're checked first</li>
                    <li>🧩 <strong>No Overlap:</strong> Remember that each player can only contribute to ONE chemistry bonus</li>
                </ul>
            </section>
        </div>
    );
}
