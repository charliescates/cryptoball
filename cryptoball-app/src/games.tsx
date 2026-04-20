import { Navigate, NavLink, Route, Routes } from 'react-router-dom';
import JoinMatchPage from './game-pages/join-match-page';
import StartGamePage from './game-pages/start-game-page';

const Games = () => {
    return (
        <div className="games-container">
            <div className="tabs-container">
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
                </div>

                <div className="tabs-content">
                    <Routes>
                        <Route index element={<Navigate to="start" replace />} />
                        <Route path="start" element={<StartGamePage />} />
                        <Route path="join" element={<JoinMatchPage />} />
                    </Routes>
                </div>
            </div>
        </div>
    );
};

export default Games;