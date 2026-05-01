import { type FormEvent, useEffect, useState } from "react";
import { parseEther } from "viem";
import { useAccount, useWaitForTransactionReceipt, useWriteContract } from "wagmi";

import { gameContract } from "../../contracts/gameContract";
import MatchPreviewPanel from "./start-game/MatchPreviewPanel";
import StartGameForm from "./start-game/StartGameForm";

const StartGame = () => {
  const { address } = useAccount();
  const [homeAddress, setHomeAddress] = useState("");
  const [awayAddress, setAwayAddress] = useState("");
  const [wager, setWager] = useState("");
  const [editable, setEditable] = useState(true);

  useEffect(() => {
    if (address && !homeAddress) {
      setHomeAddress(address);
    }
  }, [address, homeAddress]);

  const { data: hash, error, isPending, writeContract, reset } = useWriteContract();

  const startGame = () => {
    reset();

    writeContract({
      address: gameContract.address,
      abi: gameContract.abi,
      functionName: "createGame",
      args: [parseEther(wager), homeAddress, awayAddress],
      value: parseEther(wager),
      gas: 1000000n,
    });
  };

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setEditable(false);
    startGame();
  };

  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  });

  const statusLabel = isConfirmed ? "Confirmed" : isConfirming ? "Confirming" : isPending ? "Submitting" : "Ready";
  const hasReadyFixture = Boolean(homeAddress && awayAddress && wager);

  return (
    <div className="start-game-console">
      <StartGameForm
        awayAddress={awayAddress}
        editable={editable}
        error={error}
        hash={hash}
        hasReadyFixture={hasReadyFixture}
        homeAddress={homeAddress}
        isConfirming={isConfirming}
        isConfirmed={isConfirmed}
        isPending={isPending}
        onAwayAddressChange={setAwayAddress}
        onHomeAddressChange={setHomeAddress}
        onSubmit={submit}
        onWagerChange={setWager}
        statusLabel={statusLabel}
        wager={wager}
      />
      <MatchPreviewPanel
        hasReadyFixture={hasReadyFixture}
        homeAddress={homeAddress}
        statusLabel={statusLabel}
        wager={wager}
        awayAddress={awayAddress}
      />
    </div>
  );
};

export default StartGame;
