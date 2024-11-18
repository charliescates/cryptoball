import { useEffect, useState } from 'react';
import { Player } from './player';
import Position from './position';

interface FormationGridProps {
    teamColour: string;
    teamName: string;
    formation: Player[];
    onPlayerDrop: any;
}

const FormationGrid = ({ teamColour, teamName, formation, onPlayerDrop }: FormationGridProps) => {
    const [attack, setAttack] = useState<number>(0);
    const [defense, setDefense] = useState<number>(0);

    useEffect(() => {
        let attackSum = 0;
        let defenseSum = 0;
        formation.forEach((player, index) => {
            if (player) {
                if (index < 3) {
                    attackSum += Number(player.attack) * 1.1;
                    defenseSum += Number(player.defense) * 0.9;
                } else if (index < 6) {
                    attackSum += Number(player.attack);
                    defenseSum += Number(player.defense);
                } else {
                    attackSum += Number(player.attack) * 0.9;
                    defenseSum += Number(player.defense) * 1.1;
                }
            }
        });
        setAttack(Math.round(attackSum / 5));
        setDefense(Math.round(defenseSum / 5));
    });

    return (
        <div>
            <h1 color={teamColour}>{teamName}</h1>
            <div className="formation-grid">
                <Position
                    positionName='Attack'
                    teamColour={teamColour}
                    key={0}
                    index={0}
                    player={formation[0]}
                    onPlayerDrop={onPlayerDrop}
                />
                <Position
                    positionName='Attack'
                    teamColour={teamColour}
                    key={1}
                    index={1}
                    player={formation[1]}
                    onPlayerDrop={onPlayerDrop}
                />
                <Position
                    positionName='Attack'
                    teamColour={teamColour}
                    key={2}
                    index={2}
                    player={formation[2]}
                    onPlayerDrop={onPlayerDrop}
                />
            </div>
            <div className="formation-grid">
                <Position
                    positionName='Midfield'
                    teamColour={teamColour}
                    key={3}
                    index={3}
                    player={formation[3]}
                    onPlayerDrop={onPlayerDrop}
                />
                <Position
                    positionName='Midfield'
                    teamColour={teamColour}
                    key={4}
                    index={4}
                    player={formation[4]}
                    onPlayerDrop={onPlayerDrop}
                />
                <Position
                    positionName='Midfield'
                    teamColour={teamColour}
                    key={5}
                    index={5}
                    player={formation[5]}
                    onPlayerDrop={onPlayerDrop}
                />
            </div>
            <div className="formation-grid">
                <Position
                    positionName='Defense'
                    teamColour={teamColour}
                    key={6}
                    index={6}
                    player={formation[6]}
                    onPlayerDrop={onPlayerDrop}
                />
                <Position
                    positionName='Defense'
                    teamColour={teamColour}
                    key={7}
                    index={7}
                    player={formation[7]}
                    onPlayerDrop={onPlayerDrop}
                />
                <Position
                    positionName='Defense'
                    teamColour={teamColour}
                    key={8}
                    index={8}
                    player={formation[8]}
                    onPlayerDrop={onPlayerDrop}
                />
            </div>
            <div>Attack: {attack} Defense: {defense}</div>
        </div>
    );
};

export default FormationGrid;