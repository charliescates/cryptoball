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
    type SlotRole = 'attack' | 'midfield' | 'defense';
    type Slot = { index: number; playerType: number; role: SlotRole };
    type Requirement = { role: SlotRole; playerType: number; count: number };

    const slotsByRole: Record<SlotRole, Slot[]> = {
        attack: [],
        midfield: [],
        defense: []
    };
    const usedInBonus = new Set<number>();
    const bonuses: ChemistryBonus[] = [];
    let attackBonus = 0;
    let defenseBonus = 0;

    const mapRoleSlots = (players: (Player | null)[], role: SlotRole, roleOffset: number) => {
        for (let i = 0; i < players.length; i++) {
            const player = players[i];
            if (!player) continue;
            slotsByRole[role].push({
                index: roleOffset + i,
                playerType: Number(player.playerType),
                role
            });
        }
    };

    // Keep index compatibility for bonus breakdowns: 0-2 = defense, 3-5 = midfield, 6-8 = attack.
    mapRoleSlots(defensePlayers, 'defense', 0);
    mapRoleSlots(midfieldPlayers, 'midfield', 3);
    mapRoleSlots(attackPlayers, 'attack', 6);

    const findBonusPlayers = (requirements: Requirement[]): number[] | null => {
        const selected: number[] = [];
        const selectedInThisBonus = new Set<number>();

        for (const requirement of requirements) {
            for (let i = 0; i < requirement.count; i++) {
                const nextMatch = slotsByRole[requirement.role].find(
                    (slot) =>
                        slot.playerType === requirement.playerType &&
                        !usedInBonus.has(slot.index) &&
                        !selectedInThisBonus.has(slot.index)
                );

                if (!nextMatch) {
                    return null;
                }

                selected.push(nextMatch.index);
                selectedInThisBonus.add(nextMatch.index);
            }
        }

        return selected;
    };

    const applyBonus = (
        requirements: Requirement[],
        bonus: Omit<ChemistryBonus, 'playerIndices'>
    ) => {
        const playerIndices = findBonusPlayers(requirements);
        if (!playerIndices) return false;

        attackBonus += bonus.attackBonus;
        defenseBonus += bonus.defenseBonus;
        playerIndices.forEach((index) => usedInBonus.add(index));
        bonuses.push({
            ...bonus,
            playerIndices
        });
        return true;
    };

    // Check for 6-point bonuses first
    // Defense: any Anchor + any 2 Enforcers in defense = +6 defense
    applyBonus(
        [
            { role: 'defense', playerType: 3, count: 1 },
            { role: 'defense', playerType: 0, count: 2 }
        ],
        {
            type: 'defense',
            attackBonus: 0,
            defenseBonus: 6,
            description: 'Defensive Wall: Anchor + Enforcer + Enforcer'
        }
    );

    // Midfield Playmaker + 2 Attack Target Men = +6 attack
    applyBonus(
        [
            { role: 'midfield', playerType: 2, count: 1 },
            { role: 'attack', playerType: 1, count: 2 }
        ],
        {
            type: 'attack',
            attackBonus: 6,
            defenseBonus: 0,
            description: 'Strike Force: Playmaker + Target Man + Target Man'
        }
    );

    // Defense: Enforcer + Enforcer = +3 defense
    applyBonus(
        [{ role: 'defense', playerType: 0, count: 2 }],
        {
            type: 'defense',
            attackBonus: 0,
            defenseBonus: 3,
            description: 'Enforcer Duo'
        }
    );

    // Check for 3-point bonuses
    // Defense: Anchor + Enforcer = +3 defense
    applyBonus(
        [
            { role: 'defense', playerType: 3, count: 1 },
            { role: 'defense', playerType: 0, count: 1 }
        ],
        {
            type: 'defense',
            attackBonus: 0,
            defenseBonus: 3,
            description: 'Anchor + Enforcer'
        }
    );

    // Midfield: Playmaker + Attack: Target Man = +3 attack
    applyBonus(
        [
            { role: 'midfield', playerType: 2, count: 1 },
            { role: 'attack', playerType: 1, count: 1 }
        ],
        {
            type: 'attack',
            attackBonus: 3,
            defenseBonus: 0,
            description: 'Playmaker + Target Man'
        }
    );

    // Defense: Anchor + Midfield: Playmaker + Attack: Target Man = +3 defense, +3 attack
    applyBonus(
        [
            { role: 'defense', playerType: 3, count: 1 },
            { role: 'midfield', playerType: 2, count: 1 },
            { role: 'attack', playerType: 1, count: 1 }
        ],
        {
            type: 'both',
            attackBonus: 3,
            defenseBonus: 3,
            description: 'Balanced Trio: Anchor + Playmaker + Target Man'
        }
    );

    // Attack: Target Man + Enforcer = +3 attack
    applyBonus(
        [
            { role: 'attack', playerType: 1, count: 1 },
            { role: 'attack', playerType: 0, count: 1 }
        ],
        {
            type: 'attack',
            attackBonus: 3,
            defenseBonus: 0,
            description: 'Target Man + Enforcer'
        }
    );

    // Midfield: Playmaker + Anchor = +3 defense
    applyBonus(
        [
            { role: 'midfield', playerType: 2, count: 1 },
            { role: 'midfield', playerType: 3, count: 1 }
        ],
        {
            type: 'defense',
            attackBonus: 0,
            defenseBonus: 3,
            description: 'Midfield: Playmaker + Anchor'
        }
    );

    // Midfield: Playmaker + Anchor + Enforcer = +3 defense, +3 attack
    applyBonus(
        [
            { role: 'midfield', playerType: 2, count: 1 },
            { role: 'midfield', playerType: 3, count: 1 },
            { role: 'midfield', playerType: 0, count: 1 }
        ],
        {
            type: 'both',
            attackBonus: 3,
            defenseBonus: 3,
            description: 'Midfield Dominance: Playmaker + Anchor + Enforcer'
        }
    );

    // Attack: Target Man + Playmaker = +3 attack
    applyBonus(
        [
            { role: 'attack', playerType: 1, count: 1 },
            { role: 'attack', playerType: 2, count: 1 }
        ],
        {
            type: 'attack',
            attackBonus: 3,
            defenseBonus: 0,
            description: 'Target Man + Playmaker'
        }
    );

    return { attackBonus, defenseBonus, bonuses };
};
