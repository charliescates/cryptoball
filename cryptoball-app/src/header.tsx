import { useAccount, useConnect, useDisconnect } from 'wagmi';
import { NavLink } from 'react-router-dom';
import './header.css';

function Header() {
  const account = useAccount();
  const { connectors, connect, error } = useConnect();
  const { disconnect } = useDisconnect();

  return (
    <header className="header">
      <div className="logo">CryptoBalls</div>
      <nav className="nav">
        <ul>
          <li><NavLink to="/players" className={({ isActive }) => (isActive ? 'active' : '')}>Squad</NavLink></li>
          <li><NavLink to="/games" className={({ isActive }) => (isActive ? 'active' : '')}>Games</NavLink></li>
          <li><NavLink to="/academy" className={({ isActive }) => (isActive ? 'active' : '')}>Academy</NavLink></li>
          <li><NavLink to="/chemistry" className={({ isActive }) => (isActive ? 'active' : '')}>Chemistry</NavLink></li>
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
    </header>
  );
}

export default Header
