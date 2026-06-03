This is a [Vite](https://vitejs.dev) project bootstrapped with [`create-wagmi`](https://github.com/wevm/wagmi/tree/main/packages/create-wagmi).

## Network Configuration

Network and contract addresses are centralized in [src/config/network.ts](src/config/network.ts).

Environment mode files:

- [.env.localhost](.env.localhost)
- [.env.prod](.env.prod)

The app supports:

- `polygon` (default)
- `localhost` (Hardhat node)

### Environment Variables

- `VITE_APP_NETWORK`: `polygon` or `localhost`
- `VITE_LOCAL_RPC_URL`: custom local RPC endpoint (default: `http://127.0.0.1:8545`)
- `VITE_SUBGRAPH_SOURCE`: `local` or `prod`
- `VITE_MATCH_RESULTS_SUBGRAPH_URL`: prod match-results endpoint
- `VITE_MARKET_SUBGRAPH_URL`: prod market endpoint
- `VITE_TOURNAMENTS_SUBGRAPH_URL`: prod tournaments endpoint
- `VITE_LOCAL_MATCH_RESULTS_SUBGRAPH_URL`: local graph-node match-results endpoint
- `VITE_LOCAL_MARKET_SUBGRAPH_URL`: local graph-node market endpoint
- `VITE_LOCAL_TOURNAMENTS_SUBGRAPH_URL`: local graph-node tournaments endpoint
- `VITE_PLAYER_CONTRACT_ADDRESS`
- `VITE_ACADEMY_CONTRACT_ADDRESS`
- `VITE_GAME_CONTRACT_ADDRESS`
- `VITE_MARKET_CONTRACT_ADDRESS`
- `VITE_TOURNEMENT_CONTRACT_ADDRESS` (or `VITE_TOURNAMENT_CONTRACT_ADDRESS`)

If address env vars are omitted, the app uses built-in defaults for the selected network.

Subgraph behavior is now independently configurable from chain selection:

- `VITE_SUBGRAPH_SOURCE=local` makes the app read local graph-node endpoints.
- `VITE_SUBGRAPH_SOURCE=prod` makes the app read production endpoints.

This allows localhost contract testing while still choosing either local or production subgraphs.

## Run Against Local Hardhat Node

1. Start a local chain in [smart-contracts](../smart-contracts):

```bash
npx hardhat node
```

2. Deploy contracts in [smart-contracts](../smart-contracts):

```bash
npx hardhat run scripts/deploy_localhost.ts --network localhost
```

3. Run local mode:

```bash
npm run dev:local
```

4. If your deployed addresses differ from defaults, edit [.env.localhost](.env.localhost) and set the address variables.

## Run Against Production Config

Use:

```bash
npm run dev:prod
```

Build commands:

```bash
npm run build:local
npm run build:prod
```
