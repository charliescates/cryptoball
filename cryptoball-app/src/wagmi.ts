import { createConfig } from 'wagmi'

import { activeChain, getActiveTransport } from './config/network'

export const config = createConfig({
  chains: [activeChain] as const,
  transports: {
    [activeChain.id]: getActiveTransport(),
  },
})

declare module 'wagmi' {
  interface Register {
    config: typeof config
  }
}
