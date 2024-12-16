import { useEffect, useState } from 'react';
import { useReadContract } from 'wagmi';
import { playerContract } from './contracts/playerContract';
import FormationGrid from './formation-grid';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import PlayerCard, { Player } from './player';
import PlayGame from './actions/playGame';

const Games = () => {
    const [players, setPlayers] = useState<Player[]>([]);
    const { data: allPlayers } = useReadContract({
        abi: playerContract.abi,
        address: playerContract.address,
        functionName: 'getAllPlayers',
    });
    const [homeFormation, setHomeFormation] = useState(Array(9).fill(null));
    const [awayFormation, setAwayFormation] = useState(Array(9).fill(null));

    useEffect(() => {
        if (allPlayers) {
            setPlayers(allPlayers as Player[]);
        }
    }, [allPlayers]);

    const handleHomePlayerDrop = (positionIndex: number, player: Player) => {
        setHomeFormation((prevFormation) => {
            const newFormation = [...prevFormation];
            console.log(player, newFormation, positionIndex);
            newFormation[positionIndex] = player;
            return newFormation;
        });
        setPlayers((prevPlayers) => {
            return prevPlayers.filter((p) => p.id !== player.id);
        });
    };

    const handleAwayPlayerDrop = (positionIndex: number, player: Player) => {
        setAwayFormation((prevFormation) => {
            const newFormation = [...prevFormation];
            console.log(player, newFormation, positionIndex);
            newFormation[positionIndex] = player;
            return newFormation;
        });
        setPlayers((prevPlayers) => {
            return prevPlayers.filter((p) => p.id !== player.id);
        });
    };

    return (
        <DndProvider backend={HTML5Backend}>
            <div className="app">
                <PlayGame home={homeFormation} away={awayFormation}/>
                <div className="formation-grid-container">
                    <FormationGrid teamColour="#1e90ff" teamName="Home" formation={homeFormation} onPlayerDrop={handleHomePlayerDrop} />
                    <FormationGrid teamColour="#ff4757" teamName="Away" formation={awayFormation} onPlayerDrop={handleAwayPlayerDrop} />
                </div>
                <h2>Players</h2>
                <div className="player-list">
                    {players.map((player) => (
                        <PlayerCard key={player.id} player={player} />
                    ))}
                </div>
            </div>
        </DndProvider>
    );
};

export default Games;