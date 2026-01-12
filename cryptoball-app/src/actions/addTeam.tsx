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
        writeContract
    } = useWriteContract();
    const account = useAccount();

    const transaction = {
        address: gameContract.address,
        abi: gameContract.abi,
        functionName: 'addTeam',
        chainId: account.chainId as any,
        gas: 30000000n,
    };

    const addTeam = async () => {
        const attackingIds = createPlayerList(attackingPlayers);
        const midfieldIds = createPlayerList(midfieldPlayers);
        const defensiveIds = createPlayerList(defensivePlayers);

        writeContract({
            ...transaction as any,
            account: account!.addresses![0],
            args: [matchId, attackingIds, midfieldIds, defensiveIds],
            value: parseEther(wager)
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
                    disabled={isPending}
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