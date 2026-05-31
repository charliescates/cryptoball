import { Navigate, NavLink, Route, Routes } from 'react-router-dom';
import TournementReplays from './game-pages/tournement-replays';

const Tournaments = () => {
  return (
    <div className="games-container">
      <div className="tabs-container">
        <div className="games-shell-header">
          <div className="games-panel-header">
            <div>
              <span className="section-kicker">Competition</span>
              <h1 className="games-panel-title">Tournament Arena</h1>
              <p className="games-panel-copy">Launch new tournaments, enter open brackets, and replay completed knockout matches.</p>
            </div>
            <div className="games-panel-status">
              <span>Bracketflow</span>
              <strong>Live</strong>
            </div>
          </div>
          <div className="tabs-header">
            <NavLink
              to="start"
              className={({ isActive }) => `tab-button ${isActive ? 'active' : ''}`}
            >
              Start Tournament
            </NavLink>
            <NavLink
              to="open"
              className={({ isActive }) => `tab-button ${isActive ? 'active' : ''}`}
            >
              Open Tournaments
            </NavLink>
            <NavLink
              to="replays"
              className={({ isActive }) => `tab-button ${isActive ? 'active' : ''}`}
            >
              Replays
            </NavLink>
          </div>
        </div>

        <div className="tabs-content">
          <Routes>
            <Route index element={<Navigate to="start" replace />} />
            <Route path="start" element={<TournementReplays section="start" />} />
            <Route path="open" element={<TournementReplays section="open" />} />
            <Route path="replays" element={<TournementReplays section="replay" />} />
          </Routes>
        </div>
      </div>
    </div>
  );
};

export default Tournaments;
