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
              to="create"
              className={({ isActive }) => `tab-button ${isActive ? 'active' : ''}`}
            >
              Create Tournament
            </NavLink>
            <NavLink
              to="open"
              className={({ isActive }) => `tab-button ${isActive ? 'active' : ''}`}
            >
              Join Open
            </NavLink>
            <NavLink
              to="live"
              className={({ isActive }) => `tab-button ${isActive ? 'active' : ''}`}
            >
              Live Brackets
            </NavLink>
            <NavLink
              to="completed"
              className={({ isActive }) => `tab-button ${isActive ? 'active' : ''}`}
            >
              Completed
            </NavLink>
          </div>
        </div>

        <div className="tabs-content">
          <Routes>
            <Route index element={<Navigate to="create" replace />} />
            <Route path="create" element={<TournementReplays section="create" />} />
            <Route path="open" element={<TournementReplays section="open" />} />
            <Route path="live" element={<TournementReplays section="live" />} />
            <Route path="completed" element={<TournementReplays section="completed" />} />
          </Routes>
        </div>
      </div>
    </div>
  );
};

export default Tournaments;
