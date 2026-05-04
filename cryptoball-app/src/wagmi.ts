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
      http('https://polygon-bor-rpc.publicnode.com'),
      http('https://rpc.ankr.com/polygon'),
      http('https://polygon.llamarpc.com'),
      http('https://polygon.drpc.org'),
    ], {
      rank: false,
    })
  },
})

declare module 'wagmi' {
  interface Register {
    config: typeof config
  }
}
