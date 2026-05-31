import { Navigate, NavLink, Route, Routes } from 'react-router-dom';
import JoinMatchPage from './game-pages/join-match-page';
import ShowMatches from './game-pages/show-matches';
import StartGamePage from './game-pages/start-game-page';

const Games = () => {
    return (
        <div className="games-container">
            <div className="tabs-container">
                <div className="games-shell-header">
                    <div className="games-panel-header">
                        <div>
                            <span className="section-kicker">Competition</span>
                            <h1 className="games-panel-title">Games Arena</h1>
                            <p className="games-panel-copy">Set up a new fixture, join an open match, and manage the club's competitive flow.</p>
                        </div>
                        <div className="games-panel-status">
                            <span>Matchflow</span>
                            <strong>Ready</strong>
                        </div>
                    </div>
                    <div className="tabs-header">
                        <NavLink
                            to="start"
                            className={({ isActive }) => `tab-button ${isActive ? 'active' : ''}`}
                        >
                            Start New Game
                        </NavLink>
                        <NavLink
                            to="join"
                            className={({ isActive }) => `tab-button ${isActive ? 'active' : ''}`}
                        >
                            Join Match
                        </NavLink>
                        <NavLink
                            to="recent"
                            className={({ isActive }) => `tab-button ${isActive ? 'active' : ''}`}
                        >
                            Replays
                        </NavLink>
                    </div>
                </div>

                <div className="tabs-content">
                    <Routes>
                        <Route index element={<Navigate to="start" replace />} />
                        <Route path="start" element={<StartGamePage />} />
                        <Route path="join" element={<JoinMatchPage />} />
                        <Route path="recent" element={<ShowMatches />} />
                    </Routes>
                </div>
            </div>
        </div>
    );
};

export default Games;
