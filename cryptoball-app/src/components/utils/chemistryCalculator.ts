import { Player } from '../player';
import { getPlayerTypeAdjustment } from './playerTypeAdjustments';
import { calculateChemistryBonuses, ChemistryBonus } from './chemistryBonuses';

export interface TeamStats {
    baseAttack: number;
    baseDefense: number;
    positionAdjustedAttack: number;
    positionAdjustedDefense: number;
    playerTypeBonusAttack: number;
    playerTypeBonusDefense: number;
    chemistryBonusAttack: number;
    chemistryBonusDefense: number;
    finalAttack: number;
    finalDefense: number;
    activeChemistryBonuses: ChemistryBonus[];
}

export const calculateTeamStats = (
    attackPlayers: (Player | null)[],
    midfieldPlayers: (Player | null)[],
    defensePlayers: (Player | null)[]
): TeamStats => {
    let baseAttack = 0;
    let baseDefense = 0;
    let positionAdjustedAttack = 0;
    let positionAdjustedDefense = 0;

    // Calculate base stats and position adjustments
    for (let i = 0; i < 3; i++) {
        // Attack position
        if (attackPlayers[i]) {
            const player = attackPlayers[i]!;
            const attack = Number(player.attack);
            const defense = Number(player.defense);
            const playerType = Number(player.playerType);

            baseAttack += attack;
            baseDefense += defense;

            const attackAdj = getPlayerTypeAdjustment(playerType, true, false, true);
            const defenseAdj = getPlayerTypeAdjustment(playerType, true, false, false);

            positionAdjustedAttack += (attack * (110 + attackAdj)) / 100;
            positionAdjustedDefense += (defense * (90 + defenseAdj)) / 100;
        }

        // Midfield position
        if (midfieldPlayers[i]) {
            const player = midfieldPlayers[i]!;
            const attack = Number(player.attack);
            const defense = Number(player.defense);
            const playerType = Number(player.playerType);

            baseAttack += attack;
            baseDefense += defense;

            const attackAdj = getPlayerTypeAdjustment(playerType, false, false, true);
            const defenseAdj = getPlayerTypeAdjustment(playerType, false, false, false);

            positionAdjustedAttack += (attack * (100 + attackAdj)) / 100;
            positionAdjustedDefense += (defense * (100 + defenseAdj)) / 100;
        }

        // Defense position
        if (defensePlayers[i]) {
            const player = defensePlayers[i]!;
            const attack = Number(player.attack);
            const defense = Number(player.defense);
            const playerType = Number(player.playerType);

            baseAttack += attack;
            baseDefense += defense;

            const attackAdj = getPlayerTypeAdjustment(playerType, false, true, true);
            const defenseAdj = getPlayerTypeAdjustment(playerType, false, true, false);

            positionAdjustedAttack += (attack * (90 + attackAdj)) / 100;
            positionAdjustedDefense += (defense * (110 + defenseAdj)) / 100;
        }
    }

    // Calculate chemistry bonuses
    const { attackBonus, defenseBonus, bonuses } = calculateChemistryBonuses(
        attackPlayers,
        midfieldPlayers,
        defensePlayers
    );

    // Apply chemistry bonuses as percentage
    const finalAttack = Math.round((positionAdjustedAttack * (100 + attackBonus)) / 100);
    const finalDefense = Math.round((positionAdjustedDefense * (100 + defenseBonus)) / 100);

    return {
        baseAttack,
        baseDefense,
        positionAdjustedAttack: Math.round(positionAdjustedAttack),
        positionAdjustedDefense: Math.round(positionAdjustedDefense),
        playerTypeBonusAttack: Math.round(positionAdjustedAttack - baseAttack),
        playerTypeBonusDefense: Math.round(positionAdjustedDefense - baseDefense),
        chemistryBonusAttack: attackBonus,
        chemistryBonusDefense: defenseBonus,
        finalAttack,
        finalDefense,
        activeChemistryBonuses: bonuses
    };
};

// Re-export for convenience
export type { ChemistryBonus } from './chemistryBonuses';
