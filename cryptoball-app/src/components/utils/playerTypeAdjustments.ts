// Player type adjustment values for different positions and stats
// playerType: 0 = Enforcer, 1 = Target Man, 2 = Playmaker, 3 = Anchor

export const getPlayerTypeAdjustment = (
    playerType: number,
    isAttack: boolean,
    isDefense: boolean,
    isAttackingStat: boolean
): number => {
    if (playerType === 0) { // Enforcer
        if (isAttack) {
            return isAttackingStat ? 5 : 0;
        } else if (isDefense) {
            return isAttackingStat ? 0 : 10;
        } else {
            return isAttackingStat ? 0 : 5;
        }
    } else if (playerType === 1) { // Target Man
        if (isAttack) {
            return isAttackingStat ? 10 : 0;
        } else {
            return 0;
        }
    } else if (playerType === 2) { // Playmaker
        if (isAttack) {
            return isAttackingStat ? 5 : 0;
        } else if (isDefense) {
            return 0;
        } else {
            return isAttackingStat ? 10 : 0;
        }
    } else { // Anchor (3)
        if (isAttack) {
            return 0;
        } else if (isDefense) {
            return isAttackingStat ? 0 : 10;
        } else {
            return isAttackingStat ? 0 : 5;
        }
    }
};
