import * as React from 'react'
import { BaseError, useWaitForTransactionReceipt, useWriteContract } from 'wagmi';
import { academyContract } from '../contracts/academyContract';
import { useState, useEffect } from 'react';
import { parseEther } from 'viem';

import './deposit.css';

export function Extract() {
    const [amount, setAmount] = useState<number>(0);

    const {
        data: hash,
        error,
        isPending,
        writeContract,
        reset
    } = useWriteContract();

    function submit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();

        if (amount <= 0) {
            console.error('Amount must be greater than 0');
            return;
        }

        reset();

        writeContract({
            address: academyContract.address,
            abi: academyContract.abi,
            functionName: 'extract',
            args: [parseEther(amount.toString())],
        });
    };

    const { isLoading: isConfirming, isSuccess: isConfirmed } =
        useWaitForTransactionReceipt({
            hash,
        })

    useEffect(() => {
        if (isConfirmed) {
            const timer = setTimeout(() => {
                setAmount(0);
                reset();
            }, 3000);

            return () => clearTimeout(timer);
        }
    }, [isConfirmed, reset]);

    return (
        <form className='deposit-form' onSubmit={submit}>
            <input
                type="number"
                id="extract-amount"
                name="amount"
                required
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
            />
            <button
                className='deposit-button'
                disabled={isPending || isConfirming}
                type="submit"
                style={{ backgroundColor: '#ff4400' }}
            >
                {isPending ? 'Confirming...' : 'Extract'}
            </button>
            {hash && <div>Transaction Hash: {hash}</div>}
            {isConfirming && <div>Waiting for confirmation...</div>}
            {isConfirmed && <div>Extraction confirmed.</div>}
            {error && (
                <div>Error: {(error as BaseError).shortMessage || error.message}</div>
            )}
        </form>
    );
}
