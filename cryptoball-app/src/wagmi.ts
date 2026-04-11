import { http, createConfig, fallback } from 'wagmi'
import { hardhat, mainnet, sepolia, polygon } from 'wagmi/chains'

export const config = createConfig({
  chains: [mainnet, sepolia, hardhat, polygon],
  transports: {
    [mainnet.id]: http(),
    [sepolia.id]: http(),
    [hardhat.id]: http(),
    // Use fallback with multiple RPC endpoints for Polygon PoS
    [polygon.id]: fallback([
      http('https://polygon.drpc.org'),
      http('https://polygon-rpc.com'),
      http(), // Default public RPC as last resort
    ], {
      rank: false, // Don't rank, just use in order
    })
  },
})

declare module 'wagmi' {
  interface Register {
    config: typeof config
  }
}
