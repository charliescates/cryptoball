import { useState } from 'react';
import { useAccount, useConnect, useDisconnect } from 'wagmi';
import { NavLink } from 'react-router-dom';
import './header.css';

function Header() {
  const account = useAccount();
  const { connectors, connect, error } = useConnect();
  const { disconnect } = useDisconnect();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="header">
      <div className="header-top">
        <div className="logo">CryptoBalls</div>
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
            <li><NavLink to="/chemistry" className={({ isActive }) => (isActive ? 'active' : '')} onClick={() => setMenuOpen(false)}>Chemistry</NavLink></li>
          </ul>
        </nav>
        <nav className="connection">
          <div>
            Wallet {account.status} {account.status === 'connected' && (
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
          <div>{error?.message}</div>
        </nav>
      </div>
    </header>
  );
}

export default Header
