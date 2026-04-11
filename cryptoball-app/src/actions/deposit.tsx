import * as React from 'react'
import { BaseError, useAccount, useWaitForTransactionReceipt, useWriteContract } from 'wagmi';
import { academyContract } from '../contracts/academyContract';
import { useState, useEffect } from 'react';
import { parseEther } from 'viem';

import './deposit.css';

export function Deposit() {
    const [amount, setAmount] = useState<number>(0);

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

        // Validate amount before submitting
        if (amount <= 0) {
            console.error('Amount must be greater than 0');
            return;
        }

        // Reset any previous transaction state before submitting
        reset();

        console.log('Account:', account!.addresses![0]);
        console.log('Amount to deposit:', parseEther(amount.toString()));
        console.log('Academy Contract Address:', academyContract.address);
        console.log('Chain ID:', account.chainId);

        writeContract({
            address: academyContract.address,
            abi: academyContract.abi,
            functionName: 'deposit',
            args: [],
            value: parseEther(amount.toString()),
        });
    };

    const { isLoading: isConfirming, isSuccess: isConfirmed } =
        useWaitForTransactionReceipt({
            hash,
        })

    // Reset form after successful transaction
    useEffect(() => {
        if (isConfirmed) {
            const timer = setTimeout(() => {
                setAmount(0);
                reset();
            }, 3000); // Clear after 3 seconds to let user see success message
            
            return () => clearTimeout(timer);
        }
    }, [isConfirmed, reset]);

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
                disabled={isPending || isConfirming}
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