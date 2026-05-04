import { formatEther, zeroAddress } from 'viem'
import { useAccount, useReadContract, useWaitForTransactionReceipt, useWriteContract } from 'wagmi'
import { marketContract } from '../../contracts/marketContract'

export default function WithdrawPanel() {
  const { address } = useAccount()

  const { data: pending, refetch } = useReadContract({
    address: marketContract.address,
    abi: marketContract.abi,
    functionName: 'pendingWithdrawals',
    args: [address ?? zeroAddress],
    query: { enabled: !!address },
  })

  const pendingAmount = (pending as bigint | undefined) ?? 0n

  const { data: hash, isPending, writeContract, reset } = useWriteContract()
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({ hash })

  if (isConfirmed) {
    refetch()
  }

  function handleWithdraw() {
    reset()
    writeContract({
      address: marketContract.address,
      abi: marketContract.abi,
      functionName: 'withdraw',
      gas: 80_000n,
    })
  }

  if (!address) {
    return <p className="market-empty">Connect your wallet to view pending withdrawals.</p>
  }

  return (
    <div className="market-withdraw-panel">
      <h3>Pending Withdrawals</h3>
      <p className="market-withdraw-copy">
        When you are outbid or sell a player, funds accumulate here until you claim them.
      </p>

      <div className="market-withdraw-amount">
        <span>Available to withdraw</span>
        <strong>{formatEther(pendingAmount)} POL</strong>
      </div>

      <button
        className="market-btn market-btn--primary"
        type="button"
        onClick={handleWithdraw}
        disabled={pendingAmount === 0n || isPending || isConfirming}
      >
        {isPending || isConfirming ? 'Withdrawing...' : 'Withdraw'}
      </button>
    </div>
  )
}
