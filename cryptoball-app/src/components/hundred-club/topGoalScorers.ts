import { requestMarketSubgraph } from "../market/marketSubgraph";

export const goalScoreerQuery = `
  query TopGoalScorers {
    players(first: 10, orderBy: goals, orderDirection: desc) {
      id
      name
      goals
    }
  }
`;

export async function getTopGoalScorers<TResponse>(
  query: string = goalScoreerQuery,
  variables?: Record<string, unknown>,
): Promise<TResponse> {
  return requestMarketSubgraph<TResponse>(query, variables);
}