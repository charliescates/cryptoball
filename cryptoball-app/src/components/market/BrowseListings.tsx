import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { gql, request } from 'graphql-request'
import { parseEther } from 'viem'
import { useReadContracts } from 'wagmi'
import { playerContract } from '../../contracts/playerContract'
import { isVisiblePlayerId } from '../utils/playerVisibility'
import ListingCard from './ListingCard'
import { MARKET_SUBGRAPH_URL, getGraphHeaders, mapListing, type SubgraphListing } from './marketSubgraph'
import type { RawPlayer } from './ListingPlayerInfo'

const ACTIVE_LISTINGS_QUERY = gql`
  query ActiveListings {
    listings(where: { active: true }, orderBy: blockTimestamp, orderDirection: desc) {
      id
      listingId
      seller
      tokenId
      buyNowPrice
      minBid
      highestBid
      highestBidder
      active
    }
  }
`

export default function BrowseListings() {
  const [filters, setFilters] = useState({
    attack: '',
    defense: '',
    potential: '',
    gamesLeft: '',
    maxBid: '',
    maxBuyNow: '',
  })
  const headers = getGraphHeaders()

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['market-listings'],
    queryFn: () =>
      request<{ listings: SubgraphListing[] }>(
        MARKET_SUBGRAPH_URL,
        ACTIVE_LISTINGS_QUERY,
        {},
        headers,
      ),
    refetchInterval: 30_000,
  })

  const listings = (data?.listings ?? []).map(mapListing).filter((listing) => isVisiblePlayerId(listing.tokenId))
  const playerContracts = listings.map((listing) => ({
    address: playerContract.address,
    abi: playerContract.abi,
    functionName: 'players' as const,
    args: [listing.tokenId] as const,
  }))

  const { data: playerResults, isLoading: isLoadingPlayerData } = useReadContracts({
    contracts: playerContracts,
    query: {
      enabled: listings.length > 0,
    },
  })

  const parsedThresholds = useMemo(
    () => ({
      attack: Number.parseInt(filters.attack, 10) || 0,
      defense: Number.parseInt(filters.defense, 10) || 0,
      potential: Number.parseInt(filters.potential, 10) || 0,
      gamesLeft: Number.parseInt(filters.gamesLeft, 10) || 0,
      maxBid: filters.maxBid.trim() ? parseEther(filters.maxBid.trim()) : null,
      maxBuyNow: filters.maxBuyNow.trim() ? parseEther(filters.maxBuyNow.trim()) : null,
    }),
    [filters],
  )

  const hasActiveFilters = useMemo(
    () => Object.values(filters).some((value) => value.trim() !== ''),
    [filters],
  )

  const listingPlayerData = useMemo(() => {
    const map = new Map<string, RawPlayer>()

    playerResults?.forEach((result, index) => {
      if (result.status !== 'success') return

      const playerData = result.result as RawPlayer | undefined
      const listing = listings[index]
      if (!playerData || !listing) return
      map.set(listing.id, playerData)
    })

    return map
  }, [listings, playerResults])

  const filteredListings = useMemo(() => {
    if (!hasActiveFilters) return listings

    return listings.filter((listing) => {
      const playerData = listingPlayerData.get(listing.id)
      if (!playerData) return false

      const attack = Number(playerData[1])
      const defense = Number(playerData[3])
      const potential = Number(playerData[4])
      const gamesLeft = Number(playerData[5])

      return (
        attack >= parsedThresholds.attack &&
        defense >= parsedThresholds.defense &&
        potential >= parsedThresholds.potential &&
        gamesLeft >= parsedThresholds.gamesLeft &&
        (parsedThresholds.maxBid === null || listing.highestBid <= parsedThresholds.maxBid) &&
        (parsedThresholds.maxBuyNow === null || listing.buyNowPrice <= parsedThresholds.maxBuyNow)
      )
    })
  }, [hasActiveFilters, listings, listingPlayerData, parsedThresholds])

  function updateFilter(
    field: 'attack' | 'defense' | 'potential' | 'gamesLeft' | 'maxBid' | 'maxBuyNow',
    value: string,
  ) {
    if (value === '') {
      setFilters((previous) => ({ ...previous, [field]: '' }))
      return
    }

    if (field === 'maxBid' || field === 'maxBuyNow') {
      if (!/^\d*(\.\d*)?$/.test(value)) return
      const normalized = value.startsWith('.') ? `0${value}` : value

      try {
        parseEther(normalized)
      } catch {
        return
      }

      setFilters((previous) => ({ ...previous, [field]: normalized }))
      return
    }

    const parsed = Number.parseInt(value, 10)
    if (!Number.isFinite(parsed) || parsed < 0) return

    setFilters((previous) => ({ ...previous, [field]: parsed.toString() }))
  }

  function clearFilters() {
    setFilters({
      attack: '',
      defense: '',
      potential: '',
      gamesLeft: '',
      maxBid: '',
      maxBuyNow: '',
    })
  }

  if (isLoading) return <p className="market-empty">Loading listings…</p>
  if (error) return <p className="market-empty">Failed to load listings.</p>
  if (listings.length === 0) return <p className="market-empty">No active listings right now.</p>

  return (
    <>
      <section className="market-filters" aria-label="Browse listing filters">
        <div className="market-filters-header">
          <h3>Filter by stats</h3>
          <button
            className="market-btn market-btn--secondary"
            type="button"
            onClick={clearFilters}
            disabled={!hasActiveFilters}
          >
            Reset
          </button>
        </div>
        <div className="market-filters-grid">
          <label className="market-field">
            <span>Min Attack</span>
            <input
              className="market-input"
              type="number"
              min={0}
              step={1}
              value={filters.attack}
              onChange={(event) => updateFilter('attack', event.target.value)}
              placeholder="0"
            />
          </label>
          <label className="market-field">
            <span>Min Defense</span>
            <input
              className="market-input"
              type="number"
              min={0}
              step={1}
              value={filters.defense}
              onChange={(event) => updateFilter('defense', event.target.value)}
              placeholder="0"
            />
          </label>
          <label className="market-field">
            <span>Min Potential</span>
            <input
              className="market-input"
              type="number"
              min={0}
              step={1}
              value={filters.potential}
              onChange={(event) => updateFilter('potential', event.target.value)}
              placeholder="0"
            />
          </label>
          <label className="market-field">
            <span>Min Games Left</span>
            <input
              className="market-input"
              type="number"
              min={0}
              step={1}
              value={filters.gamesLeft}
              onChange={(event) => updateFilter('gamesLeft', event.target.value)}
              placeholder="0"
            />
          </label>
          <label className="market-field">
            <span>Max Bid (POL)</span>
            <input
              className="market-input"
              type="text"
              inputMode="decimal"
              value={filters.maxBid}
              onChange={(event) => updateFilter('maxBid', event.target.value)}
              placeholder="Any"
            />
          </label>
          <label className="market-field">
            <span>Max Buy Now (POL)</span>
            <input
              className="market-input"
              type="text"
              inputMode="decimal"
              value={filters.maxBuyNow}
              onChange={(event) => updateFilter('maxBuyNow', event.target.value)}
              placeholder="Any"
            />
          </label>
        </div>
      </section>

      {filteredListings.length === 0 ? (
        <p className="market-empty">
          {hasActiveFilters && isLoadingPlayerData
            ? 'Loading player stats for filters…'
            : 'No listings match the current filters.'}
        </p>
      ) : (
        <ul className="market-listings-grid" aria-label="Active listings">
          {filteredListings.map((listing) => (
            <ListingCard
              key={listing.id}
              listing={listing}
              onAction={refetch}
              playerData={listingPlayerData.get(listing.id)}
            />
          ))}
        </ul>
      )}
    </>
  )
}
