import { http, createConfig, fallback } from 'wagmi'
import { hardhat, mainnet, sepolia, polygonAmoy } from 'wagmi/chains'

export const config = createConfig({
  chains: [mainnet, sepolia, hardhat, polygonAmoy],
  transports: {
    [mainnet.id]: http(),
    [sepolia.id]: http(),
    [hardhat.id]: http(),
    // Use fallback with multiple RPC endpoints for Polygon Amoy
    [polygonAmoy.id]: fallback([
      http('https://rpc-amoy.polygon.technology'),
      http('https://polygon-amoy.drpc.org'),
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
