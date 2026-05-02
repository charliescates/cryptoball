import type { Player } from "../player";
import { getPlayerName } from "../utils/playerName";

interface SquadPlannerProps {
  players: Player[];
}

const getTopPlayers = (players: Player[], selector: (player: Player) => bigint) =>
  [...players].sort((first, second) => Number(selector(second) - selector(first))).slice(0, 3);

const PlannerColumn = ({
  label,
  players,
  selector,
}: {
  label: string;
  players: Player[];
  selector: (player: Player) => bigint;
}) => (
  <div className="squad-planner-column">
    <span>{label}</span>
    {players.length > 0 ? (
      <ol>
        {players.map((player) => (
          <li key={player.id.toString()}>
            <strong>{getPlayerName(player.id)}</strong>
            <small>{selector(player).toString()}</small>
          </li>
        ))}
      </ol>
    ) : (
      <p>No options yet</p>
    )}
  </div>
);

const SquadPlanner = ({ players }: SquadPlannerProps) => {
  const attackers = getTopPlayers(players, (player) => player.attack);
  const defenders = getTopPlayers(players, (player) => player.defense);
  const prospects = getTopPlayers(players, (player) => player.potential);

  return (
    <section className="squad-planner" aria-label="Squad planner">
      <div className="squad-planner-header">
        <div>
          <p className="squad-page-kicker">Squad planner</p>
          <h2>Role Depth</h2>
        </div>
        <p>Top options by role, so weak areas are visible before match setup.</p>
      </div>
      <div className="squad-planner-grid">
        <PlannerColumn label="Attack" players={attackers} selector={(player) => player.attack} />
        <PlannerColumn label="Defense" players={defenders} selector={(player) => player.defense} />
        <PlannerColumn label="Future core" players={prospects} selector={(player) => player.potential} />
      </div>
    </section>
  );
};

export default SquadPlanner;
