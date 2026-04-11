import { useState } from "react";
import { Player } from "../player";
import { BaseError, parseEther } from "viem";
import { gameContract } from "../contracts/gameContract";
import { useAccount, useWaitForTransactionReceipt, useWatchContractEvent, useWriteContract } from "wagmi";
import { getPlayerName } from "../playerName";

type PlayGameProps = {
    home: Player[];
    away: Player[];
};

const PlayGame = ({ home, away }: PlayGameProps) => {
    const {
        data: hash,
        error,
        isPending,
        writeContract,
        reset
    } = useWriteContract();
    const account = useAccount();

    const [homeScore, setHomeScore] = useState(0);
    const [awayScore, setAwayScore] = useState(0);
    const [goalScorers, setGoalScorers] = useState<string[]>([]);

    const playGame = async () => {
        // Reset any previous transaction state before submitting
        reset();

        const homeIds = home.map((player) => player ? player.id : 0);
        const awayIds = away.map((player) => player ? player.id : 0);
        
        writeContract({
            address: gameContract.address,
            abi: gameContract.abi,
            functionName: 'playMatch',
            args: [
                homeIds.slice(0, 3),
                homeIds.slice(3, 6),
                homeIds.slice(6),
                awayIds.slice(0, 3),
                awayIds.slice(3, 6),
                awayIds.slice(6),
            ],
            value: parseEther("30"),
            gas: 5000000n, // Set a reasonable gas limit
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
        address: gameContract.address,
        abi: gameContract.abi,
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
        address: gameContract.address,
        abi: gameContract.abi,
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
                    disabled={isPending || isConfirming}
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

const StartGame = () => {
    const [homeAddress, setHomeAddress] = useState("");
    const [awayAddress, setAwayAddress] = useState("");
    const [wager, setWager] = useState("");
    const [editable, setEditable] = useState(true);

    const {
        data: hash,
        error,
        isPending,
        writeContract,
        reset
    } = useWriteContract();
    const account = useAccount();

    const startGame = async () => {
        // Reset any previous transaction state before submitting
        reset();

        writeContract({
            address: gameContract.address,
            abi: gameContract.abi,
            functionName: 'createGame',
            args: [parseEther(wager), homeAddress, awayAddress],
            value: parseEther(wager),
            gas: 1000000n,
        });
    };

    function submit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setEditable(false);
        startGame();
    };

    const { isLoading: isConfirming, isSuccess: isConfirmed } =
        useWaitForTransactionReceipt({
            hash,
        });

    return (
        <div>
            <form onSubmit={submit}>
                <input
                    type="text"
                    placeholder="Home Address"
                    value={homeAddress}
                    onChange={(e) => setHomeAddress(e.target.value)}
                    disabled={!editable}
                />
                <input
                    type="text"
                    placeholder="Away Address"
                    value={awayAddress}
                    onChange={(e) => setAwayAddress(e.target.value)}
                    disabled={!editable}
                />
                <input
                    type="text"
                    placeholder="Wager"
                    value={wager}
                    onChange={(e) => setWager(e.target.value)}
                    disabled={!editable}
                />
                <button
                    className='start-game-button'
                    disabled={isPending || isConfirming || !editable}
                    type="submit"
                >
                    {isPending ? 'Starting Game...' : 'Start Game'}
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
};

export default StartGame;
