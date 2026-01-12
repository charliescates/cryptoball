export enum PlayerType {
    ENFORCER = 0,
    TARGET_MAN = 1,
    PLAYMAKER = 2,
    ANCHOR = 3
}

export const getPlayerTypeName = (playerType: bigint | number): string => {
    const type = Number(playerType);
    switch (type) {
        case PlayerType.ENFORCER:
            return 'Enforcer';
        case PlayerType.TARGET_MAN:
            return 'Target Man';
        case PlayerType.PLAYMAKER:
            return 'Playmaker';
        case PlayerType.ANCHOR:
            return 'Anchor';
        default:
            return 'Unknown';
    }
};

export const getPlayerTypeIcon = (playerType: bigint | number): string => {
    const type = Number(playerType);
    switch (type) {
        case PlayerType.ENFORCER:
            return '💪';
        case PlayerType.TARGET_MAN:
            return '🎯';
        case PlayerType.PLAYMAKER:
            return '⚡';
        case PlayerType.ANCHOR:
            return '⚓';
        default:
            return '❓';
    }
};

export const getPlayerTypeColor = (playerType: bigint | number): string => {
    const type = Number(playerType);
    switch (type) {
        case PlayerType.ENFORCER:
            return '#ff6b6b'; // Red
        case PlayerType.TARGET_MAN:
            return '#51cf66'; // Green
        case PlayerType.PLAYMAKER:
            return '#4dabf7'; // Blue
        case PlayerType.ANCHOR:
            return '#ffd43b'; // Yellow
        default:
            return '#868e96'; // Gray
    }
};

export const getPlayerTypeDescription = (playerType: bigint | number): string => {
    const type = Number(playerType);
    switch (type) {
        case PlayerType.ENFORCER:
            return 'Defensive specialist with attack boost in forward positions';
        case PlayerType.TARGET_MAN:
            return 'Pure attacking specialist with maximum attack boost';
        case PlayerType.PLAYMAKER:
            return 'Midfield specialist excelling in playmaking roles';
        case PlayerType.ANCHOR:
            return 'Defensive anchor with strong defensive capabilities';
        default:
            return 'Unknown player type';
    }
};

export const getPlayerTypeBonuses = (playerType: bigint | number): { position: string; bonus: string }[] => {
    const type = Number(playerType);
    switch (type) {
        case PlayerType.ENFORCER:
            return [
                { position: 'Attack', bonus: '+5% Attack' },
                { position: 'Midfield', bonus: '+5% Defense' },
                { position: 'Defense', bonus: '+10% Defense' }
            ];
        case PlayerType.TARGET_MAN:
            return [
                { position: 'Attack', bonus: '+10% Attack' },
                { position: 'Midfield', bonus: 'No bonus' },
                { position: 'Defense', bonus: 'No bonus' }
            ];
        case PlayerType.PLAYMAKER:
            return [
                { position: 'Attack', bonus: '+5% Attack' },
                { position: 'Midfield', bonus: '+10% Attack' },
                { position: 'Defense', bonus: 'No bonus' }
            ];
        case PlayerType.ANCHOR:
            return [
                { position: 'Attack', bonus: 'No bonus' },
                { position: 'Midfield', bonus: '+5% Defense' },
                { position: 'Defense', bonus: '+10% Defense' }
            ];
        default:
            return [];
    }
};
