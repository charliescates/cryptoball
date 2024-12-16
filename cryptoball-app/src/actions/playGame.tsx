import { useState } from "react";
import { Player } from "../player";
import { BaseError, parseEther } from "viem";
import { gameContract } from "../contracts/gameContract";
import { useAccount, useWaitForTransactionReceipt, useWatchContractEvent, useWriteContract } from "wagmi";
import { getPlayerName } from "../playerName";
import { Transaction } from "./transactions";

type PlayGameProps = {
    home: Player[];
    away: Player[];
};

const PlayGame = ({ home, away }: PlayGameProps) => {
    const {
        data: hash,
        error,
        isPending,
        writeContract
    } = useWriteContract();
    const account = useAccount();

    const transaction: Transaction = {
        address: gameContract.address,
        abi: gameContract.abi,
        functionName: 'playMatch',
        chainId: account.chainId as any,
        gas: 30000000n, // TODO Make the thing more efficient in the future!!
    };

    const [homeScore, setHomeScore] = useState(0);
    const [awayScore, setAwayScore] = useState(0);
    const [goalScorers, setGoalScorers] = useState<string[]>([]);

    const playGame = async () => {
        const homeIds = home.map((player) => player ? player.id : 0);
        const awayIds = away.map((player) => player ? player.id : 0);
        writeContract({
            ...transaction as any,
            account: account!.addresses![0],
            args: [
                homeIds.slice(0, 3),
                homeIds.slice(3, 6),
                homeIds.slice(6),
                awayIds.slice(0, 3),
                awayIds.slice(3, 6),
                awayIds.slice(6),
            ],
            value: parseEther("30")
        });
    };

    function submit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();

        console.log('Account:', account!.addresses![0]);

        playGame();
    };

    const { isLoading: isConfirming, isSuccess: isConfirmed } =
        useWaitForTransactionReceipt({
            hash,
        });

    useWatchContractEvent({
        ...transaction as any,
        eventName: 'MatchPlayed',
        onLogs: (logs: any[]) => {
            console.log('GamePlayed event detected:', logs);
            const latestEvent = logs[logs.length - 1].args;

            if (latestEvent.homeScore !== homeScore || latestEvent.awayScore !== awayScore) {
                setHomeScore(Number(latestEvent.homeScore));
                setAwayScore(Number(latestEvent.awayScore));
            }
        },
    });

    useWatchContractEvent({
        ...transaction as any,
        eventName: 'PlayerScored',
        onLogs: (logs: any[]) => {
            console.log('PlayerScored event detected:', logs);

            setGoalScorers(logs.map((log) => getPlayerName(log.args.playerId)));
        },
    });
    return (
        <div>
            <h1>{homeScore} - {awayScore}</h1>
            <h1>Goal Scorers</h1>
            <p key="goalScorers" style={{ textAlign: "center" }}>{goalScorers.join(', ')}</p>
            <form onSubmit={submit}>
                <button
                    className='mint-player-button'
                    disabled={isPending}
                    type="submit"
                >
                    {isPending ? 'Playing...' : 'Play Game'}
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

export default PlayGame;
