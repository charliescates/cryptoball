import { type BaseError, parseEther } from "viem";
import { useWaitForTransactionReceipt, useWriteContract } from "wagmi";
import { gameContract } from "../../contracts/gameContract";
import type { Player } from "../player";

type AddTeamProps = {
  matchId: string;
  attackingPlayers: Player[];
  midfieldPlayers: Player[];
  defensivePlayers: Player[];
  wager: string;
  disabled?: boolean;
  disabledLabel?: string;
  readyLabel?: string;
};

export const AddTeam = ({
  matchId,
  attackingPlayers,
  midfieldPlayers,
  defensivePlayers,
  wager,
  disabled = false,
  disabledLabel = "Team Not Ready",
  readyLabel = "Add Team",
}: AddTeamProps) => {
  const { data: hash, error, isPending, writeContract, reset } = useWriteContract();

  const addTeam = async () => {
    // Reset any previous transaction state before submitting
    reset();

    const attackingIds = createPlayerList(attackingPlayers);
    const midfieldIds = createPlayerList(midfieldPlayers);
    const defensiveIds = createPlayerList(defensivePlayers);

    writeContract({
      address: gameContract.address,
      abi: gameContract.abi,
      functionName: "addTeam",
      args: [matchId, attackingIds, midfieldIds, defensiveIds],
      value: parseEther(wager),
    });
  };

  function createPlayerList(players: Player[]): bigint[] {
    const playerIds = [];
    for (let i = 0; i < 3; i++) {
      if (players[i]) {
        playerIds.push(players[i].id);
      } else {
        playerIds.push(0n);
      }
    }
    return playerIds;
  }

  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    addTeam();
  }

  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  });

  return (
    <div>
      <form onSubmit={submit}>
        <button className="add-team-button" disabled={disabled || isPending || isConfirming} type="submit">
          {disabled ? disabledLabel : isPending ? "Adding Team..." : readyLabel}
        </button>
        {hash && <div>Transaction Hash: {hash}</div>}
        {isConfirming && <div>Waiting for confirmation...</div>}
        {isConfirmed && <div>Transaction confirmed.</div>}
        {error && <div>Error: {(error as BaseError).shortMessage || error.message}</div>}
      </form>
    </div>
  );
};

export default AddTeam;
