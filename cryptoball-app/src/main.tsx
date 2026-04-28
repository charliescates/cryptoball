import { Buffer } from 'buffer'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'
import ReactDOM from 'react-dom/client'
import { WagmiProvider } from 'wagmi'

import { config } from './wagmi.ts'

import './index.css'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Header from './components/header.tsx'
import Home from './components/home.tsx'
import GetPlayers from './components/get-players.tsx'
import Test from './components/test.tsx'
import Games from './components/games.tsx'
import Academy from './components/academy/Academy.tsx'
import Chemistry from './components/chemistry.tsx'

const globalWithBuffer = globalThis as typeof globalThis & {
  Buffer: typeof Buffer
}

globalWithBuffer.Buffer = Buffer

const queryClient = new QueryClient()

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <Router>
          <Header />
          <div className="content">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/players" element={<GetPlayers />} />
              <Route path="/games/*" element={<Games />} />
              <Route path="/academy" element={<Academy />} />
              <Route path="/chemistry" element={<Chemistry />} />
              <Route path="/test" element={<Test />} />
            </Routes>
          </div>
        </Router>
      </QueryClientProvider>
    </WagmiProvider>
  </React.StrictMode>,
)
