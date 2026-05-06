import { useEffect, useRef, useState } from 'react'
import { parseEther, zeroAddress } from 'viem'
import { useAccount, useReadContract, useWaitForTransactionReceipt, useWriteContract } from 'wagmi'
import FootballPlayerAvatar from '../avatar/FootballPlayerAvatar'
import { marketContract } from '../../contracts/marketContract'
import { playerContract } from '../../contracts/playerContract'
import { getPlayerName } from '../utils/playerName'
import { getPlayerTypeColor, getPlayerTypeIcon, getPlayerTypeName } from '../utils/playerType'
import { isVisiblePlayerId } from '../utils/playerVisibility'
import type { Player } from '../player'
import { useMyListedTokenIds } from './useMyListedTokenIds'

type Props = {
  onCreated: () => void
}

// Duration options in seconds
const DURATION_OPTIONS = [
  { label: '1 hour', value: 3600 },
  { label: '6 hours', value: 21600 },
  { label: '24 hours', value: 86400 },
  { label: '3 days', value: 259200 },
  { label: '7 days', value: 604800 },
]

function getStatChips(player: Player) {
  return [
    { label: 'ATT', value: player.attack.toString() },
    { label: 'DEF', value: player.defense.toString() },
    { label: 'POT', value: player.potential.toString() },
    { label: 'GL', value: player.gamesLeft.toString() },
    { label: 'G', value: player.goalsScored.toString() },
  ]
}

export default function CreateListing({ onCreated }: Props) {
  const { address } = useAccount()

  const [selectedTokenId, setSelectedTokenId] = useState<bigint | null>(null)
  const [buyNowPrice, setBuyNowPrice] = useState('')
  const [minBid, setMinBid] = useState('')
  const [duration, setDuration] = useState(3600)
  const [step, setStep] = useState<'form' | 'approving' | 'listing' | 'done'>('form')
  const [priceError, setPriceError] = useState<string | null>(null)
  const hasTriggeredListingRef = useRef(false)
  const hasHandledCreatedRef = useRef(false)

  const { data: allPlayers } = useReadContract({
    abi: playerContract.abi,
    address: playerContract.address,
    functionName: 'getPlayersByOwner',
    args: [address ?? zeroAddress],
    query: { enabled: !!address },
  })

  const listedTokenIds = useMyListedTokenIds()
  const players = ((allPlayers as Player[] | undefined) ?? []).filter(
    (p) => !listedTokenIds.has(p.id) && isVisiblePlayerId(p.id),
  )
  const selectedPlayer =
    selectedTokenId === null ? null : players.find((player) => player.id === selectedTokenId) ?? null

  // Approve write
  const {
    data: approveHash,
    isPending: isApprovePending,
    writeContract: writeApprove,
    reset: resetApprove,
    error: approveError,
  } = useWriteContract()

  const { isLoading: isApproveConfirming, isSuccess: isApproveConfirmed } =
    useWaitForTransactionReceipt({ hash: approveHash })

  // CreateListing write
  const {
    data: listHash,
    isPending: isListPending,
    writeContract: writeList,
    reset: resetList,
    error: listError,
  } = useWriteContract()

  const { isLoading: isListConfirming, isSuccess: isListConfirmed } =
    useWaitForTransactionReceipt({ hash: listHash })

  useEffect(() => {
    if (!isApproveConfirmed || step !== 'approving' || hasTriggeredListingRef.current) return
    if (!selectedTokenId || !buyNowPrice || !minBid) return

    hasTriggeredListingRef.current = true
    setStep('listing')
    console.log('[CreateListing] approve confirmed, calling createListing', {
      selectedTokenId: selectedTokenId.toString(),
      buyNowPrice,
      minBid,
      duration,
    })
    writeList({
      address: marketContract.address,
      abi: marketContract.abi,
      functionName: 'createListing',
      args: [
        selectedTokenId,
        parseEther(buyNowPrice),
        parseEther(minBid),
        BigInt(duration),
      ],
      gas: 1_000_000n,
    })
  }, [
    isApproveConfirmed,
    step,
    selectedTokenId,
    buyNowPrice,
    minBid,
    duration,
    writeList,
  ])

  // Reset to form on approve error
  useEffect(() => {
    if (!approveError) return
    console.error('[CreateListing] approve error:', approveError)
    setStep('form')
  }, [approveError])

  // Reset to form on listing error
  useEffect(() => {
    if (!listError) return
    console.error('[CreateListing] createListing error:', listError)
    setStep('form')
  }, [listError])

  useEffect(() => {
    if (!isListConfirmed || hasHandledCreatedRef.current) return
    hasHandledCreatedRef.current = true
    console.log('[CreateListing] listing confirmed!')
    setStep('done')
    onCreated()
  }, [isListConfirmed, onCreated])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedTokenId || !buyNowPrice || !minBid) return
    if (parseFloat(minBid) >= parseFloat(buyNowPrice)) {
      setPriceError('Minimum bid must be less than the buy now price.')
      return
    }
    setPriceError(null)
    resetApprove()
    resetList()
    hasTriggeredListingRef.current = false
    hasHandledCreatedRef.current = false
    setStep('approving')
    writeApprove({
      address: playerContract.address,
      abi: playerContract.abi,
      functionName: 'approve',
      args: [marketContract.address, selectedTokenId],
    })
  }

  const isBusy = isApprovePending || isApproveConfirming || isListPending || isListConfirming

  function stepLabel() {
    if (isApprovePending || isApproveConfirming) return 'Step 1/2 — Approving transfer...'
    if (isListPending || isListConfirming) return 'Step 2/2 — Creating listing...'
    return null
  }

  if (step === 'done') {
    return (
      <div className="market-create-form">
        <h3>Player Listed!</h3>
        <p className="market-step-label">Your player has been successfully listed on the market.</p>
        <button
          type="button"
          className="market-btn market-btn--primary"
          onClick={() => {
            setSelectedTokenId(null)
            setBuyNowPrice('')
            setMinBid('')
            setDuration(3600)
            setPriceError(null)
            resetApprove()
            resetList()
            hasTriggeredListingRef.current = false
            hasHandledCreatedRef.current = false
            setStep('form')
          }}
        >
          List Another Player
        </button>
      </div>
    )
  }

  return (
    <form className="market-create-form" onSubmit={handleSubmit}>
      <h3>List a Player</h3>

      <div className="market-field">
        <label>Player</label>
        {players.length === 0 ? (
          <p className="market-empty">No owned players available to list.</p>
        ) : (
          <div className="market-player-picker" role="listbox" aria-label="Select player to list">
            {players.map((player) => {
              const playerTypeColor = getPlayerTypeColor(player.playerType)
              const isSelected = selectedTokenId === player.id

              return (
                <button
                  key={player.id.toString()}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  className={`market-player-option ${isSelected ? 'selected' : ''}`}
                  onClick={() => setSelectedTokenId(player.id)}
                >
                  <div className="market-player-option-avatar" style={{ borderColor: `${playerTypeColor}66` }}>
                    <FootballPlayerAvatar
                      seed={`${player.id.toString()}-${player.playerType.toString()}`}
                      size={58}
                      showBadge={false}
                      traits={{
                        primaryKitColor: playerTypeColor,
                        secondaryKitColor: '#ffffff',
                      }}
                    />
                  </div>
                  <div className="market-player-option-copy">
                    <strong>{getPlayerName(player.id)}</strong>
                    <span>#{player.id.toString()}</span>
                  </div>
                  <div className="market-player-option-metrics">
                    <span className="market-player-type-pill" style={{ color: playerTypeColor }}>
                      {getPlayerTypeIcon(player.playerType)} {getPlayerTypeName(player.playerType)}
                    </span>
                    <div className="market-player-stat-chips" aria-label="Player stats">
                      {getStatChips(player).map((stat) => (
                        <span className="market-player-stat-chip" key={`${player.id.toString()}-${stat.label}`}>
                          {stat.label} {stat.value}
                        </span>
                      ))}
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        )}

        {selectedPlayer ? (
          <div className="market-selected-player-card" aria-live="polite">
            <div className="market-selected-player-card-top">
              <div
                className="market-selected-player-avatar"
                style={{ borderColor: `${getPlayerTypeColor(selectedPlayer.playerType)}66` }}
              >
                <FootballPlayerAvatar
                  seed={`${selectedPlayer.id.toString()}-${selectedPlayer.playerType.toString()}`}
                  size={72}
                  showBadge={false}
                  traits={{
                    primaryKitColor: getPlayerTypeColor(selectedPlayer.playerType),
                    secondaryKitColor: '#ffffff',
                  }}
                />
              </div>
              <div className="market-selected-player-copy">
                <p className="market-selected-player-kicker">Listing card preview</p>
                <strong>{getPlayerName(selectedPlayer.id)}</strong>
                <span>Player #{selectedPlayer.id.toString()}</span>
              </div>
            </div>
            <div className="market-selected-player-stats" aria-label="Selected player stats">
              {getStatChips(selectedPlayer).map((stat) => (
                <span className="market-selected-player-stat" key={`selected-${stat.label}`}>
                  <b>{stat.label}</b> {stat.value}
                </span>
              ))}
            </div>
          </div>
        ) : null}
      </div>

      <div className="market-field-row">
        <div className="market-field">
          <label htmlFor="market-min-bid">Minimum Bid (POL)</label>
          <input
            id="market-min-bid"
            className="market-input"
            type="number"
            step="0.001"
            min="0.001"
            placeholder="e.g. 0.1"
            value={minBid}
            onChange={(e) => { setMinBid(e.target.value); setPriceError(null) }}
            required
          />
        </div>

        <div className="market-field">
          <label htmlFor="market-buy-now">Buy Now Price (POL)</label>
          <input
            id="market-buy-now"
            className="market-input"
            type="number"
            step="0.001"
            min="0.001"
            placeholder="e.g. 0.5"
            value={buyNowPrice}
            onChange={(e) => { setBuyNowPrice(e.target.value); setPriceError(null) }}
            required
          />
        </div>
      </div>

      <div className="market-field">
        <label htmlFor="market-duration">Duration</label>
        <select
          id="market-duration"
          className="market-select"
          value={duration}
          onChange={(e) => setDuration(Number(e.target.value))}
        >
          {DURATION_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      <p className="market-fee-note">
        A 2% academy fee applies on buy now sales. 1% on auction settlements.
      </p>

      {priceError && <p className="market-error">{priceError}</p>}
      {stepLabel() && <p className="market-step-label">{stepLabel()}</p>}
      {approveError && <p className="market-error">Approval failed: {(approveError as any).shortMessage ?? approveError.message}</p>}
      {listError && <p className="market-error">Listing failed: {(listError as any).shortMessage ?? listError.message}</p>}

      <button className="market-btn market-btn--primary" type="submit" disabled={isBusy || !address}>
        {isBusy ? 'Processing...' : 'List Player'}
      </button>
    </form>
  )
}
