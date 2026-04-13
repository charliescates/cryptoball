import { useEffect, useState } from "react";
import { useAccount, useReadContract } from "wagmi";
import { Deposit } from "./actions/deposit";
import { Extract } from "./actions/extract";
import { getPlayerName } from "./playerName";
import { getPlayerTypeIcon, getPlayerTypeName, getPlayerTypeColor } from "./playerType";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { academyContract } from "./contracts/academyContract";
import { BuyPlayer } from "./actions/buyPlayer";

type AcademyPlayer = {
    id: bigint;
    attack: bigint;
    defense: bigint;
    potential: bigint;
    value: bigint;
    playerType: bigint;
}

const EXTRACT_ADDRESS = '0x05B665d3Ba0a83f5259C114fA3F2d2ECD8A00B29';

const Academy = () => {
    const [players, setPlayers] = useState<AcademyPlayer[]>([]);
    const { address, isConnected } = useAccount();

    const isOwnerWallet = isConnected &&
        address?.toLowerCase() === EXTRACT_ADDRESS.toLowerCase();

    const { data: allPlayers, error } = useReadContract({
        abi: academyContract.abi,
        address: academyContract.address,
        functionName: 'getAcademyPlayers',
        query: {
            refetchInterval: 10000, // Refetch every 10 seconds
        }
    });

    useEffect(() => {
        if (allPlayers) {
            console.log(allPlayers);
            setPlayers(allPlayers as AcademyPlayer[]);
        }
    }, [allPlayers]);

    useEffect(() => {
        if (error) {
            console.error('Failed to fetch players:', error);
        }
    }, [error]);

    return (
        <DndProvider backend={HTML5Backend}>
            <div className="app">
                {isOwnerWallet && <Deposit />}
                {isOwnerWallet && <Extract />}
                <div className="player-container">
                    {error ?
                        <div>Error loading players.</div> :
                        players.map((player) => (
                            <div className="player-card" key={player.id.toString()}>
                                <div className="player-info">
                                    <p className="player-name">Name: <span>{getPlayerName(player.id)}</span></p>
                                    <p className="player-name">Type: <span
                                        style={{
                                            backgroundColor: getPlayerTypeColor(player.playerType),
                                            padding: '2px 6px',
                                            borderRadius: '4px',
                                            fontSize: '0.85em',
                                            fontWeight: 'bold',
                                            color: '#000'
                                        }}
                                    >
                                        {getPlayerTypeIcon(player.playerType)} {getPlayerTypeName(player.playerType)}
                                    </span></p>
                                    <p className="player-attack">Attack: <span>{player.attack.toString()}</span></p>
                                    <p className="player-defense">Defense: <span>{player.defense.toString()}</span></p>
                                    <p className="player-potential">Potential: <span>{player.potential.toString()}</span></p>
                                    <p className="player-value">Value: <span>{(Number(player.value) / 1e18).toFixed(4)} POL</span></p>
                                    <BuyPlayer playerId={player.id} price={player.value} />
                                </div>
                            </div>
                        ))}
                </div>
            </div>
        </DndProvider>
    );
}

export default Academy;