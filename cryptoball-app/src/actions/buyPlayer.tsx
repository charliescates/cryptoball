import * as React from 'react'
import { BaseError, useAccount, useWaitForTransactionReceipt, useWriteContract } from 'wagmi';
import { Transaction } from './transactions';
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
        writeContract
    } = useWriteContract();
    const account = useAccount();

    const transaction: Transaction = {
        address: academyContract.address,
        abi: academyContract.abi,
        functionName: 'buyPlayer',
        args: [account && account.addresses ? account.addresses[0] : '0x0', props.playerId],
        chainId: account.chainId as any,
        value: props.price,
        gas: 3000000n,
    };

    function submit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();

        console.log('Account:', account!.addresses![0]);

        writeContract(transaction as any);
    };

    const { isLoading: isConfirming, isSuccess: isConfirmed } =
        useWaitForTransactionReceipt({
            hash,
        })

    return (
        <form onSubmit={submit}>
            <button
                className='buy-player-button'
                disabled={isPending}
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