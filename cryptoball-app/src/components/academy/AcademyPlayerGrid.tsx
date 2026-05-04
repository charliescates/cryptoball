import type { AcademyPlayer } from "../utils/playerUtils";
import { PlayerCard } from "./PlayerCard";

interface AcademyPlayerGridProps {
  error?: Error | null;
  onOpenDetails?: (player: AcademyPlayer) => void;
  onToggleShortlist?: (playerId: bigint) => void;
  players: AcademyPlayer[];
  shortlistedIds?: Set<string>;
}

const AcademyPlayerGrid = ({
  error,
  onOpenDetails,
  onToggleShortlist,
  players,
  shortlistedIds = new Set(),
}: AcademyPlayerGridProps) => (
  <div className="academy-player-grid">
    {error ? (
      <div>Error loading players.</div>
    ) : (
      players.map((player) => (
        <PlayerCard
          key={player.id.toString()}
          player={player}
          isShortlisted={shortlistedIds.has(player.id.toString())}
          onOpenDetails={onOpenDetails}
          onToggleShortlist={onToggleShortlist}
        />
      ))
    )}
  </div>
);

export default AcademyPlayerGrid;
