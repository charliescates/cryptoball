import { Player } from '../player';

export interface ChemistryBonus {
    type: 'attack' | 'defense' | 'both';
    attackBonus: number;
    defenseBonus: number;
    description: string;
    playerIndices: number[];
}

export const calculateChemistryBonuses = (
    attackPlayers: (Player | null)[],
    midfieldPlayers: (Player | null)[],
    defensePlayers: (Player | null)[]
): { attackBonus: number; defenseBonus: number; bonuses: ChemistryBonus[] } => {
    const playerTypes: number[] = new Array(9).fill(-1);
    const usedInBonus: boolean[] = new Array(9).fill(false);
    const bonuses: ChemistryBonus[] = [];
    let attackBonus = 0;
    let defenseBonus = 0;

    // Map player types: 0-2 = Defense, 3-5 = Midfield, 6-8 = Attack
    for (let i = 0; i < 3; i++) {
        if (defensePlayers[i]) {
            playerTypes[i] = Number(defensePlayers[i]!.playerType);
        }
        if (midfieldPlayers[i]) {
            playerTypes[i + 3] = Number(midfieldPlayers[i]!.playerType);
        }
        if (attackPlayers[i]) {
            playerTypes[i + 6] = Number(attackPlayers[i]!.playerType);
        }
    }

    // Check for 6-point bonuses first
    // Defense: Anchor + Enforcer + Enforcer = +6 defense
    if (!usedInBonus[0] && !usedInBonus[1] && !usedInBonus[2]) {
        if (playerTypes[0] === 3 && playerTypes[1] === 0 && playerTypes[2] === 0) {
            defenseBonus += 6;
            usedInBonus[0] = true;
            usedInBonus[1] = true;
            usedInBonus[2] = true;
            bonuses.push({
                type: 'defense',
                attackBonus: 0,
                defenseBonus: 6,
                description: 'Defensive Wall: Anchor + Enforcer + Enforcer',
                playerIndices: [0, 1, 2]
            });
        }
    }

    // Midfield Playmaker + 2 Attack Target Men = +6 attack
    if (!usedInBonus[3] && !usedInBonus[6] && !usedInBonus[7]) {
        if (playerTypes[3] === 2 && playerTypes[6] === 1 && playerTypes[7] === 1) {
            attackBonus += 6;
            usedInBonus[3] = true;
            usedInBonus[6] = true;
            usedInBonus[7] = true;
            bonuses.push({
                type: 'attack',
                attackBonus: 6,
                defenseBonus: 0,
                description: 'Strike Force: Playmaker + Target Man + Target Man',
                playerIndices: [3, 6, 7]
            });
        }
    }

    // Defense: Enforcer + Enforcer = +3 defense
    if (!usedInBonus[0] && !usedInBonus[1]) {
        if (playerTypes[0] === 0 && playerTypes[1] === 0) {
            defenseBonus += 3;
            usedInBonus[0] = true;
            usedInBonus[1] = true;
            bonuses.push({
                type: 'defense',
                attackBonus: 0,
                defenseBonus: 3,
                description: 'Enforcer Duo',
                playerIndices: [0, 1]
            });
        }
    }

    // Check for 3-point bonuses
    // Defense: Anchor + Enforcer = +3 defense
    if (!usedInBonus[0] && !usedInBonus[1]) {
        if (playerTypes[0] === 3 && playerTypes[1] === 0) {
            defenseBonus += 3;
            usedInBonus[0] = true;
            usedInBonus[1] = true;
            bonuses.push({
                type: 'defense',
                attackBonus: 0,
                defenseBonus: 3,
                description: 'Anchor + Enforcer',
                playerIndices: [0, 1]
            });
        }
    }

    // Midfield: Playmaker + Attack: Target Man = +3 attack
    if (!usedInBonus[3] && !usedInBonus[6]) {
        if (playerTypes[3] === 2 && playerTypes[6] === 1) {
            attackBonus += 3;
            usedInBonus[3] = true;
            usedInBonus[6] = true;
            bonuses.push({
                type: 'attack',
                attackBonus: 3,
                defenseBonus: 0,
                description: 'Playmaker + Target Man',
                playerIndices: [3, 6]
            });
        }
    }

    // Defense: Anchor + Midfield: Playmaker + Attack: Target Man = +3 defense, +3 attack
    if (!usedInBonus[0] && !usedInBonus[3] && !usedInBonus[6]) {
        if (playerTypes[0] === 3 && playerTypes[3] === 2 && playerTypes[6] === 1) {
            defenseBonus += 3;
            attackBonus += 3;
            usedInBonus[0] = true;
            usedInBonus[3] = true;
            usedInBonus[6] = true;
            bonuses.push({
                type: 'both',
                attackBonus: 3,
                defenseBonus: 3,
                description: 'Balanced Trio: Anchor + Playmaker + Target Man',
                playerIndices: [0, 3, 6]
            });
        }
    }

    // Attack: Target Man + Enforcer = +3 attack
    if (!usedInBonus[6] && !usedInBonus[7]) {
        if (playerTypes[6] === 1 && playerTypes[7] === 0) {
            attackBonus += 3;
            usedInBonus[6] = true;
            usedInBonus[7] = true;
            bonuses.push({
                type: 'attack',
                attackBonus: 3,
                defenseBonus: 0,
                description: 'Target Man + Enforcer',
                playerIndices: [6, 7]
            });
        }
    }

    // Midfield: Playmaker + Anchor = +3 defense
    if (!usedInBonus[3] && !usedInBonus[4]) {
        if (playerTypes[3] === 2 && playerTypes[4] === 3) {
            defenseBonus += 3;
            usedInBonus[3] = true;
            usedInBonus[4] = true;
            bonuses.push({
                type: 'defense',
                attackBonus: 0,
                defenseBonus: 3,
                description: 'Midfield: Playmaker + Anchor',
                playerIndices: [3, 4]
            });
        }
    }

    // Midfield: Playmaker + Anchor + Enforcer = +3 defense, +3 attack
    if (!usedInBonus[3] && !usedInBonus[4] && !usedInBonus[5]) {
        if (playerTypes[3] === 2 && playerTypes[4] === 3 && playerTypes[5] === 0) {
            defenseBonus += 3;
            attackBonus += 3;
            usedInBonus[3] = true;
            usedInBonus[4] = true;
            usedInBonus[5] = true;
            bonuses.push({
                type: 'both',
                attackBonus: 3,
                defenseBonus: 3,
                description: 'Midfield Dominance: Playmaker + Anchor + Enforcer',
                playerIndices: [3, 4, 5]
            });
        }
    }

    // Attack: Target Man + Playmaker = +3 attack
    if (!usedInBonus[6] && !usedInBonus[7]) {
        if (playerTypes[6] === 1 && playerTypes[7] === 2) {
            attackBonus += 3;
            usedInBonus[6] = true;
            usedInBonus[7] = true;
            bonuses.push({
                type: 'attack',
                attackBonus: 3,
                defenseBonus: 0,
                description: 'Target Man + Playmaker',
                playerIndices: [6, 7]
            });
        }
    }

    return { attackBonus, defenseBonus, bonuses };
};
