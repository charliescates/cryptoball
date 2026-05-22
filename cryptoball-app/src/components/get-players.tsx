import { useMemo, useState } from "react";
import { zeroAddress } from "viem";
import { useAccount, useReadContract } from "wagmi";

import { playerContract } from "../contracts/playerContract";
import { useMyListedTokenIds } from "./market/useMyListedTokenIds";
import type { Player } from "./player";
import PlayerDetailDrawer from "./players/PlayerDetailDrawer";
import SquadPlayerCard from "./players/SquadPlayerCard";
import SquadInsights from "./squad/SquadInsights";
import SquadPageHeader from "./squad/SquadPageHeader";
import SquadPlanner from "./squad/SquadPlanner";
import SquadToolbar from "./squad/SquadToolbar";
import generateName from "./utils/teamName";
import { isVisiblePlayerId } from "./utils/playerVisibility";
import {
  type SquadFilter,
  type SquadSort,
  getRoleFitLabel,
  getSquadInsights,
  getSquadMetrics,
  getVisibleSquadPlayers,
} from "./squad/squadViewModel";

const GetPlayers = () => {
  const account = useAccount();
  const [filter, setFilter] = useState<SquadFilter>("all");
  const [sort, setSort] = useState<SquadSort>("overall");
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);

  const { data: allPlayers, error } = useReadContract({
    abi: playerContract.abi,
    address: playerContract.address,
    functionName: "getPlayersByOwner",
    args: [account.address ?? zeroAddress],
    query: {
      enabled: account.isConnected && !!account.address,
      refetchInterval: 12_000,
    },
  });

  const listedTokenIds = useMyListedTokenIds();
  const players = ((allPlayers as Player[] | undefined) ?? []).filter(
    (p) => !listedTokenIds.has(p.id) && isVisiblePlayerId(p.id),
  );
  const squadMetrics = useMemo(() => getSquadMetrics(players), [players]);
  const squadInsights = useMemo(() => getSquadInsights(players), [players]);
  const visiblePlayers = useMemo(() => getVisibleSquadPlayers(players, filter, sort), [filter, players, sort]);
  const teamName = account.address ? generateName(account.address) : undefined;

  if (error) {
    console.error("Failed to fetch players:", error);
    return <div>Error loading players.</div>;
  }

  return (
    <main className="squad-page">
      <SquadPageHeader metrics={squadMetrics} teamName={teamName} />

      {players.length > 0 ? (
        <>
          <SquadToolbar
            filter={filter}
            onFilterChange={setFilter}
            onSortChange={setSort}
            resultCount={visiblePlayers.length}
            sort={sort}
            totalCount={players.length}
          />
          <SquadInsights insights={squadInsights} />
          <SquadPlanner players={players} />

          <div className="player-container squad-player-grid">
            {visiblePlayers.map((player) => (
              <SquadPlayerCard
                key={player.id.toString()}
                player={player}
                roleFitLabel={getRoleFitLabel(player)}
                teamAddress={account.address}
                onOpenDetails={setSelectedPlayer}
              />
            ))}
          </div>
        </>
      ) : (
        <section className="squad-empty-state">
          <p className="squad-page-kicker">No players</p>
          <h2>Build your first squad</h2>
          <p>Visit the Academy to scout and recruit players before setting up your team.</p>
        </section>
      )}

      <PlayerDetailDrawer
        kind="squad"
        player={selectedPlayer}
        teamAddress={account.address}
        onClose={() => setSelectedPlayer(null)}
      />
    </main>
  );
};

export default GetPlayers;
