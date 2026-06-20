import { useEffect } from "react";
import { type BaseError, parseEther } from "viem";
import { useWaitForTransactionReceipt, useWriteContract } from "wagmi";
import { activeChain } from "../../config/network";
import { gameContract } from "../../contracts/gameContract";
import type { Player } from "../player";

const ADD_TEAM_GAS_LIMIT = 15_000_000n;

type AddTeamProps = {
  matchId: string;
  attackingPlayers: Player[];
  midfieldPlayers: Player[];
  defensivePlayers: Player[];
  wager: string;
  disabled?: boolean;
  disabledLabel?: string;
  onTransactionConfirmed?: () => void;
  onTransactionFailed?: () => void;
  onTransactionStarted?: () => void;
  onTransactionSubmitted?: (hash: `0x${string}`) => void;
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
  onTransactionConfirmed,
  onTransactionFailed,
  onTransactionStarted,
  onTransactionSubmitted,
  readyLabel = "Add Team",
}: AddTeamProps) => {
  const { data: hash, error, isPending, writeContract, reset } = useWriteContract();

  const addTeam = async () => {
    // Reset any previous transaction state before submitting
    reset();
    onTransactionStarted?.();

    const attackingIds = createPlayerList(attackingPlayers);
    const midfieldIds = createPlayerList(midfieldPlayers);
    const defensiveIds = createPlayerList(defensivePlayers);

    writeContract({
      address: gameContract.address,
      abi: gameContract.abi,
      functionName: "addTeam",
      args: [matchId, attackingIds, midfieldIds, defensiveIds],
      chainId: activeChain.id,
      value: parseEther(wager),
      gas: ADD_TEAM_GAS_LIMIT,
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

  useEffect(() => {
    if (hash) {
      onTransactionSubmitted?.(hash);
    }
  }, [hash, onTransactionSubmitted]);

  useEffect(() => {
    if (isConfirmed) {
      onTransactionConfirmed?.();
    }
  }, [isConfirmed, onTransactionConfirmed]);

  useEffect(() => {
    if (error) {
      onTransactionFailed?.();
    }
  }, [error, onTransactionFailed]);

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
