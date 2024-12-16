import * as React from 'react'
import { BaseError, useAccount, useWaitForTransactionReceipt, useWriteContract } from 'wagmi';
import { academyContract } from '../contracts/academyContract';
import { useState } from 'react';
import { parseEther } from 'viem';

import './deposit.css';

export function Deposit() {
    const [amount, setAmount] = useState<number>(0);

    const {
        data: hash,
        error,
        isPending,
        writeContract
    } = useWriteContract();
    const account = useAccount();

    function submit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();

        console.log('Account:', account!.addresses![0]);

        writeContract({
            address: academyContract.address,
            abi: academyContract.abi,
            args: [],
            functionName: 'deposit',
            chainId: account.chainId as any,
            gas: 3000000n,
            value: parseEther(amount.toString())
        });
    };

    const { isLoading: isConfirming, isSuccess: isConfirmed } =
        useWaitForTransactionReceipt({
            hash,
        })

    return (
        <form className='deposit-form' onSubmit={submit}>
            <input
                type="number"
                id="amount"
                name="amount"
                required
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
            />
            <button
                className='deposit-button'
                disabled={isPending}
                type="submit"
            >
                {isPending ? 'Confirming...' : 'Deposit'}
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