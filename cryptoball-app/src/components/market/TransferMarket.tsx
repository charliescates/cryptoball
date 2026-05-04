import { Navigate, NavLink, Route, Routes } from 'react-router-dom'
import BrowseListings from './BrowseListings'
import CreateListing from './CreateListing'
import ActiveBidsTab from './ActiveBidsTab'
import SellingTab from './SellingTab'

export default function TransferMarket() {
  return (
    <div className="games-container">
      <div className="tabs-container">
        <div className="games-shell-header">
          <div className="games-panel-header">
            <div>
              <span className="section-kicker">Transfer Market</span>
              <h1 className="games-panel-title">Player Market</h1>
              <p className="games-panel-copy">
                Buy, bid, and sell players. Listings run as timed auctions with an optional buy now price.
              </p>
            </div>
            <div className="games-panel-status">
              <span>Fees</span>
              <strong>1% bid · 2% buy now</strong>
            </div>
          </div>
          <div className="tabs-header">
            <NavLink
              to="browse"
              className={({ isActive }) => `tab-button ${isActive ? 'active' : ''}`}
            >
              Browse
            </NavLink>
            <NavLink
              to="list"
              className={({ isActive }) => `tab-button ${isActive ? 'active' : ''}`}
            >
              List Player
            </NavLink>
            <NavLink
              to="selling"
              className={({ isActive }) => `tab-button ${isActive ? 'active' : ''}`}
            >
              Selling
            </NavLink>
            <NavLink
              to="active-bids"
              className={({ isActive }) => `tab-button ${isActive ? 'active' : ''}`}
            >
              Active Bids
            </NavLink>
          </div>
        </div>

        <div className="tabs-content">
          <Routes>
            <Route index element={<Navigate to="browse" replace />} />
            <Route path="browse" element={
              <div className="tab-panel">
                <BrowseListings />
              </div>
            } />
            <Route path="list" element={
              <div className="tab-panel">
                <CreateListing onCreated={() => {}} />
              </div>
            } />
            <Route path="selling" element={
              <div className="tab-panel">
                <SellingTab />
              </div>
            } />
            <Route path="active-bids" element={
              <div className="tab-panel">
                <ActiveBidsTab />
              </div>
            } />
          </Routes>
        </div>
      </div>
    </div>
  )
}
