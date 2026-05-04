import { useReadContract } from 'wagmi'
import { playerContract } from '../../contracts/playerContract'
import FootballPlayerAvatar from '../avatar/FootballPlayerAvatar'
import { getPlayerTypeColor, getPlayerTypeIcon, getPlayerTypeName } from '../utils/playerType'

type Props = {
  tokenId: bigint
  playerData?: RawPlayer
}

export type RawPlayer = [bigint, bigint, bigint, bigint, bigint, bigint, bigint, bigint]

export default function ListingPlayerInfo({ tokenId, playerData: providedPlayerData }: Props) {
  const { data: rawPlayer } = useReadContract({
    address: playerContract.address,
    abi: playerContract.abi,
    functionName: 'players',
    args: [tokenId],
    query: { enabled: providedPlayerData === undefined },
  })

  const playerData = providedPlayerData ?? (rawPlayer as RawPlayer | undefined)
  const playerType = playerData?.[7] ?? 0n
  const playerTypeColor = getPlayerTypeColor(playerType)

  return (
    <div className="market-listing-player-info">
      <div className="market-listing-avatar" style={{ borderColor: `${playerTypeColor}66` }}>
        <FootballPlayerAvatar
          seed={`${tokenId.toString()}-${playerType.toString()}`}
          size={56}
          showBadge={false}
          traits={{ primaryKitColor: playerTypeColor, secondaryKitColor: '#ffffff' }}
        />
      </div>
      <div className="market-listing-player-meta">
        <span className="market-player-type-pill" style={{ color: playerTypeColor }}>
          {getPlayerTypeIcon(playerType)} {getPlayerTypeName(playerType)}
        </span>
        {playerData && (
          <div className="market-player-stat-chips">
            <span className="market-player-stat-chip">ATT {playerData[1].toString()}</span>
            <span className="market-player-stat-chip">DEF {playerData[3].toString()}</span>
            <span className="market-player-stat-chip">POT {playerData[4].toString()}</span>
            <span className="market-player-stat-chip">GL {playerData[5].toString()}</span>
            <span className="market-player-stat-chip">G {playerData[6].toString()}</span>
          </div>
        )}
      </div>
    </div>
  )
}
