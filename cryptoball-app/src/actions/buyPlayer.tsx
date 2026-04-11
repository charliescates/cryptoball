import * as React from 'react'
import { BaseError, useAccount, useWaitForTransactionReceipt, useWriteContract } from 'wagmi';
import { academyContract } from '../contracts/academyContract';

export type BuyPlayerProps = {
    playerId: bigint;
    price: bigint;
}

export function BuyPlayer(props: BuyPlayerProps) {
    const {
        data: hash,
        error,
        isPending,
        writeContract,
        reset
    } = useWriteContract();
    const account = useAccount();

    function submit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();

        // Reset any previous transaction state before submitting
        reset();

        console.log('Account:', account!.addresses![0]);

        writeContract({
            address: academyContract.address,
            abi: academyContract.abi,
            functionName: 'buyPlayer',
            args: [account && account.addresses ? account.addresses[0] : '0x0', props.playerId],
            value: props.price,
        });
    };

    const { isLoading: isConfirming, isSuccess: isConfirmed } =
        useWaitForTransactionReceipt({
            hash,
        })

    return (
        <form onSubmit={submit}>
            <button
                className='buy-player-button'
                disabled={isPending || isConfirming}
                type="submit"
            >
                {isPending ? 'Confirming...' : 'Buy Player'}
            </button>
            {hash && <div>Transaction Hash: {hash}</div>}
            {isConfirming && <div>Waiting for confirmation...</div>}
            {isConfirmed && <div>Transaction confirmed.</div>}
            {error && (
                <div>Error: {(error as BaseError).shortMessage || error.message}</div>
            )}
        </form>
    );
}