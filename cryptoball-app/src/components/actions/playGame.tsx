import { type FormEvent, useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { parseEther } from "viem";
import { useAccount, useSwitchChain, useWaitForTransactionReceipt, useWriteContract } from "wagmi";

import { activeChain } from "../../config/network";
import { gameContract } from "../../contracts/gameContract";
import MatchPreviewPanel from "./start-game/MatchPreviewPanel";
import StartGameForm from "./start-game/StartGameForm";

const StartGame = () => {
  const { address, chainId } = useAccount();
  const { switchChainAsync } = useSwitchChain();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const rematchHomeAddress = searchParams.get("home");
  const rematchAwayAddress = searchParams.get("away");
  const rematchWager = searchParams.get("wager");
  const [homeAddress, setHomeAddress] = useState(() => rematchHomeAddress ?? "");
  const [awayAddress, setAwayAddress] = useState(() => rematchAwayAddress ?? "");
  const [wager, setWager] = useState(() => rematchWager ?? "");
  const [editable, setEditable] = useState(true);
  const shouldOpenJoinAfterCreate = searchParams.get("rematch") === "1";

  useEffect(() => {
    if (address && !homeAddress) {
      setHomeAddress(address);
    }
  }, [address, homeAddress]);

  const { data: hash, error, isPending, writeContract, reset } = useWriteContract();

  const startGame = async () => {
    reset();

    if (chainId !== activeChain.id) {
      await switchChainAsync({ chainId: activeChain.id });
    }

    writeContract({
      address: gameContract.address,
      abi: gameContract.abi,
      functionName: "createGame",
      args: [parseEther(wager), homeAddress, awayAddress],
      chainId: activeChain.id,
      gas: 1000000n,
    });
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setEditable(false);
    try {
      await startGame();
    } catch {
      // Re-enable the form if wallet network switching is rejected.
      setEditable(true);
    }
  };

  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  });

  useEffect(() => {
    if (isConfirmed && shouldOpenJoinAfterCreate) {
      navigate("/games/join");
    }
  }, [isConfirmed, navigate, shouldOpenJoinAfterCreate]);

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
