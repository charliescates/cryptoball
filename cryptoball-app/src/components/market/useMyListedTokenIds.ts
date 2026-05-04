import { useQuery } from '@tanstack/react-query'
import { gql, request } from 'graphql-request'
import { useAccount } from 'wagmi'
import { MARKET_SUBGRAPH_URL, getGraphHeaders } from './marketSubgraph'

const MY_ACTIVE_TOKEN_IDS_QUERY = gql`
  query MyActiveTokenIds($seller: Bytes!) {
    listings(where: { active: true, seller: $seller }) {
      tokenId
    }
  }
`

/**
 * Returns a Set of tokenIds (as bigint) that the connected wallet currently has listed.
 */
export function useMyListedTokenIds(): Set<bigint> {
  const { address } = useAccount()
  const headers = getGraphHeaders()

  const { data } = useQuery({
    queryKey: ['market-my-listed-token-ids', address?.toLowerCase()],
    enabled: !!address,
    queryFn: () =>
      request<{ listings: { tokenId: string }[] }>(
        MARKET_SUBGRAPH_URL,
        MY_ACTIVE_TOKEN_IDS_QUERY,
        { seller: address?.toLowerCase() },
        headers,
      ),
    refetchInterval: 30_000,
  })

  return new Set((data?.listings ?? []).map((l) => BigInt(l.tokenId)))
}
