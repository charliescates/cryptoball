import { useState } from 'react';
import { useAccount, useConnect, useDisconnect } from 'wagmi';
import { NavLink } from 'react-router-dom';
import generateName from './utils/teamName';
import './header.css';

function Header() {
  const account = useAccount();
  const { connectors, connect, error } = useConnect();
  const { disconnect } = useDisconnect();
  const [menuOpen, setMenuOpen] = useState(false);

  const teamName = account.address ? generateName(account.address) : null;

  return (
    <header className="header">
      <div className="header-top">
        <div className="header-brand">
          <div className="header-brand-main">
            <div className="logo">CryptoBalls</div>
            <span className="header-brand-badge">Live Club</span>
          </div>
        </div>
        <button
          className="hamburger"
          type="button"
          aria-label="Toggle menu"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          <span className={`hamburger-line ${menuOpen ? 'open' : ''}`} />
          <span className={`hamburger-line ${menuOpen ? 'open' : ''}`} />
          <span className={`hamburger-line ${menuOpen ? 'open' : ''}`} />
        </button>
      </div>
      <div className={`header-collapse ${menuOpen ? 'header-collapse--open' : ''}`}>
        <nav className="nav">
          <ul>
            <li><NavLink to="/players" className={({ isActive }) => (isActive ? 'active' : '')} onClick={() => setMenuOpen(false)}>Squad</NavLink></li>
            <li><NavLink to="/games" className={({ isActive }) => (isActive ? 'active' : '')} onClick={() => setMenuOpen(false)}>Games</NavLink></li>
            <li><NavLink to="/academy" className={({ isActive }) => (isActive ? 'active' : '')} onClick={() => setMenuOpen(false)}>Academy</NavLink></li>
            <li><NavLink to="/market" className={({ isActive }) => (isActive ? 'active' : '')} onClick={() => setMenuOpen(false)}>Market</NavLink></li>
            <li><NavLink to="/chemistry" className={({ isActive }) => (isActive ? 'active' : '')} onClick={() => setMenuOpen(false)}>Chemistry</NavLink></li>
          </ul>
        </nav>
        <nav className="connection">
          <div className="wallet-panel">
            <div className="wallet-panel-copy">
              <strong>{teamName ?? 'No wallet connected'}</strong>
              <span className={`wallet-status-inline wallet-status-${account.status}`}>
                <span className="wallet-status-dot" />
                {account.status === 'connected' ? 'Linked' : account.status === 'connecting' ? 'Connecting' : 'Offline'}
              </span>
            </div>
            <div className="wallet-actions">
              {account.status === 'connected' && (
                <button className="disconnect-button" type="button" onClick={() => disconnect()}>
                  Disconnect
                </button>
              )}
              {account.status !== 'connected' && connectors.map((connector) => (
                <button
                  className="connect-button"
                  key={connector.uid}
                  onClick={() => connect({ connector })}
                  type="button"
                >
                  {connector.name}
                </button>
              ))}
            </div>
          </div>
          {error?.message ? <div className="wallet-error">{error.message}</div> : null}
        </nav>
      </div>
    </header>
  );
}

export default Header
