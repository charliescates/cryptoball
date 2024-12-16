import * as React from 'react'
import { BaseError, useAccount, useWaitForTransactionReceipt, useWriteContract } from 'wagmi';
import { playerContract } from '../contracts/playerContract';
import { Transaction } from './transactions';

export function MintPlayer() {
    const {
        data: hash,
        error,
        isPending,
        writeContract
    } = useWriteContract();
    const account = useAccount();

    const transaction: Transaction = {
        address: playerContract.address,
        abi: playerContract.abi,
        functionName: 'mintPlayer',
        args: [account && account.addresses ? account.addresses[0] : '0x0'],
        chainId: account.chainId as any,
        gas: 3000000n, // TODO Make the thing more efficient in the future!!
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
                className='mint-player-button'
                disabled={isPending}
                type="submit"
            >
                {isPending ? 'Confirming...' : 'Mint Player'}
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