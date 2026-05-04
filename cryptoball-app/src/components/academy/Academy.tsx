import { useMemo, useState } from "react";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";

import { Deposit } from "../actions/deposit";
import { Extract } from "../actions/extract";
import PlayerDetailDrawer from "../players/PlayerDetailDrawer";
import type { AcademyPlayer } from "../utils/playerUtils";
import AcademyHeader from "./AcademyHeader";
import AcademyPlayerGrid from "./AcademyPlayerGrid";
import AcademyRecruitmentToolbar, { type AcademyRecruitmentFocus } from "./AcademyRecruitmentToolbar";
import { useAcademyPlayers } from "./hooks/useAcademyPlayers";

export const Academy = () => {
  const { error, isOwnerWallet, players } = useAcademyPlayers();
  const [focus, setFocus] = useState<AcademyRecruitmentFocus>("all");
  const [selectedPlayer, setSelectedPlayer] = useState<AcademyPlayer | null>(null);
  const [shortlistedIds, setShortlistedIds] = useState<Set<string>>(() => new Set());

  const filteredPlayers = useMemo(() => {
    return players.filter((player) => {
      if (focus === "attack") return player.attack >= player.defense;
      if (focus === "defense") return player.defense >= player.attack;
      if (focus === "potential") return player.potential >= 80n;
      if (focus === "shortlist") return shortlistedIds.has(player.id.toString());
      return true;
    });
  }, [focus, players, shortlistedIds]);

  const toggleShortlist = (playerId: bigint) => {
    setShortlistedIds((currentIds) => {
      const nextIds = new Set(currentIds);
      const key = playerId.toString();
      if (nextIds.has(key)) {
        nextIds.delete(key);
      } else {
        nextIds.add(key);
      }
      return nextIds;
    });
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="app">
        {isOwnerWallet && <Deposit />}
        {isOwnerWallet && <Extract />}

        <AcademyHeader playerCount={players.length} />
        <AcademyRecruitmentToolbar
          focus={focus}
          resultCount={filteredPlayers.length}
          shortlistCount={shortlistedIds.size}
          totalCount={players.length}
          onFocusChange={setFocus}
        />
        <AcademyPlayerGrid
          error={error}
          players={filteredPlayers}
          shortlistedIds={shortlistedIds}
          onOpenDetails={setSelectedPlayer}
          onToggleShortlist={toggleShortlist}
        />
        <PlayerDetailDrawer kind="academy" player={selectedPlayer} onClose={() => setSelectedPlayer(null)} />
      </div>
    </DndProvider>
  );
};

export default Academy;
