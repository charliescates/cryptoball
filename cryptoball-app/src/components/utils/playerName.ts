import { default as playerNames } from '../../resources/fifa_24_players.json'

export function getPlayerName(bigIntId: bigint): string {
    const id = (Number(bigIntId) - 1) % playerNames.length;
    if (id < 0) {
        return '';
    }
    return `${playerNames[id]['First Name']}  ${playerNames[id]['Last Name']}`;
}
