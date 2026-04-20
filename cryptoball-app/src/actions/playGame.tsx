import { useEffect, useState } from "react";
import { BaseError, parseEther } from "viem";
import { gameContract } from "../contracts/gameContract";
import { useAccount, useWaitForTransactionReceipt, useWriteContract } from "wagmi";

const StartGame = () => {
    const { address } = useAccount();
    const [homeAddress, setHomeAddress] = useState("");
    const [awayAddress, setAwayAddress] = useState("");
    const [wager, setWager] = useState("");
    const [editable, setEditable] = useState(true);

    useEffect(() => {
        if (address && !homeAddress) {
            setHomeAddress(address);
        }
    }, [address, homeAddress]);

    const {
        data: hash,
        error,
        isPending,
        writeContract,
        reset
    } = useWriteContract();

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
