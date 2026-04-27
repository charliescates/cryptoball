import { useQuery } from '@tanstack/react-query'
import { gql, request } from 'graphql-request'
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';

const query = gql`{
  matchPlayeds(first: 5) {
    id
    matchId
    homeScore
    awayScore
  }
  newMatches(first: 5) {
    id
    matchId
    blockNumber
    blockTimestamp
  }
}`
const url = 'https://api.studio.thegraph.com/query/1747934/match-results/version/latest'
const headers = { Authorization: 'Bearer {api-key}' }

export default function ShowMatches() {
  const { data, status } = useQuery({
    queryKey: ['data'],
    async queryFn() {
      return await request(url, query, {}, headers)
    }
  })
  return (
    <DndProvider backend={HTML5Backend}>
      <main>
        {status === 'pending' ? <div>Loading...</div> : null}
        {status === 'error' ? <div>Error ocurred querying the Subgraph</div> : null}
        <div>{JSON.stringify(data ?? {})}</div>
      </main>
    </DndProvider>
  )
}
