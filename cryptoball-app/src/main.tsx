import { Buffer } from 'buffer'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'
import ReactDOM from 'react-dom/client'
import { WagmiProvider } from 'wagmi'

import { config } from './wagmi.ts'

import './index.css'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Header from './header.tsx'
import GetPlayers from './get-players.tsx'
import Games from './games.tsx'
import Academy from './academy.tsx'

globalThis.Buffer = Buffer

const queryClient = new QueryClient()

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <Router>
          <Header />
          <div className="content">
            <Routes>
              {/* <Route path="/" element={<Home />} /> */}
              <Route path="/players" element={<GetPlayers />} />
              <Route path="/games" element={<Games />} />
              <Route path="/academy" element={<Academy />} />
            </Routes>
          </div>
        </Router>
      </QueryClientProvider>
    </WagmiProvider>
  </React.StrictMode>,
)

// ReactDOM.createRoot(document.getElementById('root')!).render(
//   <React.StrictMode>
//     <WagmiProvider config={config}>
//       <QueryClientProvider client={queryClient}>
//         <Header />
//         <MintPlayer />
//         <GetPlayers />
//       </QueryClientProvider>
//     </WagmiProvider>
//   </React.StrictMode>,
// )
