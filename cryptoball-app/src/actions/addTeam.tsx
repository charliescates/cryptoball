import { Player } from "../player";
import { BaseError, parseEther } from "viem";
import { gameContract } from "../contracts/gameContract";
import { useAccount, useWaitForTransactionReceipt, useWriteContract } from "wagmi";

type AddTeamProps = {
    matchId: string;
    attackingPlayers: Player[];
    midfieldPlayers: Player[];
    defensivePlayers: Player[];
    wager: string;
};

export const AddTeam = ({ matchId, attackingPlayers, midfieldPlayers, defensivePlayers, wager }: AddTeamProps) => {
    const {
        data: hash,
        error,
        isPending,
        writeContract,
        reset
    } = useWriteContract();
    const account = useAccount();

    const addTeam = async () => {
        // Reset any previous transaction state before submitting
        reset();

        const attackingIds = createPlayerList(attackingPlayers);
        const midfieldIds = createPlayerList(midfieldPlayers);
        const defensiveIds = createPlayerList(defensivePlayers);

        writeContract({
            address: gameContract.address,
            abi: gameContract.abi,
            functionName: 'addTeam',
            args: [matchId, attackingIds, midfieldIds, defensiveIds],
            value: parseEther(wager),
            gas: 1000000n,
        });
    };

    function createPlayerList(players: Player[]): bigint[] {
        const playerIds = [];
        for (let i = 0; i < 3; i++) {
            if (players[i]) {
                playerIds.push(players[i].id);
            } else {
                playerIds.push(0n);
            }
        }
        return playerIds;
    }

    function submit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        addTeam();
    };

    const { isLoading: isConfirming, isSuccess: isConfirmed } =
        useWaitForTransactionReceipt({
            hash,
        });

    return (
        <div>
            <form onSubmit={submit}>
                <button
                    className='add-team-button'
                    disabled={isPending || isConfirming}
                    type="submit"
                >
                    {isPending ? 'Adding Team...' : 'Add Team'}
                </button>
                {hash && <div>Transaction Hash: {hash}</div>}
                {isConfirming && <div>Waiting for confirmation...</div>}
                {isConfirmed && <div>Transaction confirmed.</div>}
                {error && (
                    <div>Error: {(error as BaseError).shortMessage || error.message}</div>
                )}
            </form>
        </div>
    );
}

export default AddTeam;