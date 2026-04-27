import { useEffect, useState } from "react";
import { type BaseError, parseEther } from "viem";
import { useAccount, useWaitForTransactionReceipt, useWriteContract } from "wagmi";
import { gameContract } from "../../contracts/gameContract";

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

  const startGame = async () => {
    // Reset any previous transaction state before submitting
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

  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setEditable(false);
    startGame();
  }

  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  });

  const statusLabel = isConfirmed ? "Confirmed" : isConfirming ? "Confirming" : isPending ? "Submitting" : "Ready";
  const hasReadyFixture = Boolean(homeAddress && awayAddress && wager);
  const shortHome = homeAddress ? `${homeAddress.slice(0, 6)}...${homeAddress.slice(-4)}` : "Assign home wallet";
  const shortAway = awayAddress ? `${awayAddress.slice(0, 6)}...${awayAddress.slice(-4)}` : "Assign away wallet";

  return (
    <div className="start-game-console">
      <form className="start-game-form" onSubmit={submit}>
        <div className="start-game-panel-header">
          <div>
            <span className="section-kicker">Create match</span>
            <h3>Fixture Setup</h3>
          </div>
          <div className={`start-game-state-pill ${statusLabel.toLowerCase()}`}>{statusLabel}</div>
        </div>

        <div className="start-game-form-section">
          <div className="start-game-section-heading">
            <strong>Wallet pairing</strong>
            <span>Choose the two managers entering the match.</span>
          </div>
          <div className="form-field">
            <label htmlFor="home-address">Home wallet</label>
            <input
              id="home-address"
              type="text"
              placeholder="0x..."
              value={homeAddress}
              onChange={(e) => setHomeAddress(e.target.value)}
              disabled={!editable}
            />
          </div>
          <div className="form-field">
            <label htmlFor="away-address">Away wallet</label>
            <input
              id="away-address"
              type="text"
              placeholder="0x..."
              value={awayAddress}
              onChange={(e) => setAwayAddress(e.target.value)}
              disabled={!editable}
            />
          </div>
        </div>

        <div className="start-game-form-section">
          <div className="start-game-section-heading">
            <strong>Match stake</strong>
            <span>Both sides commit the same value to open the contest.</span>
          </div>
          <div className="form-field">
            <label htmlFor="match-wager">Wager</label>
            <div className="wager-input-wrap">
              <input
                id="match-wager"
                type="text"
                inputMode="decimal"
                placeholder="0.05"
                value={wager}
                onChange={(e) => setWager(e.target.value)}
                disabled={!editable}
              />
              <span>ETH</span>
            </div>
          </div>
        </div>

        <div className="start-game-form-footer">
          <div className="start-game-readiness">
            <span className="section-kicker">Launch state</span>
            <strong>{hasReadyFixture ? "Fixture complete" : "Awaiting details"}</strong>
          </div>
          <button className="start-game-button" disabled={isPending || isConfirming || !editable} type="submit">
            {isPending ? "Starting Match..." : "Launch Match"}
          </button>
        </div>

        <div className="transaction-status-list" aria-live="polite">
          {hash && (
            <div className="transaction-status">
              <span>Transaction hash</span>
              <strong>{hash}</strong>
            </div>
          )}
          {isConfirming && <div className="transaction-status pending">Waiting for wallet confirmation...</div>}
          {isConfirmed && <div className="transaction-status success">Match creation confirmed.</div>}
          {error && (
            <div className="transaction-status error">Error: {(error as BaseError).shortMessage || error.message}</div>
          )}
        </div>
      </form>
      <aside className="match-summary-panel">
        <div className="start-game-panel-header">
          <div>
            <span className="section-kicker">Match preview</span>
            <h3>Fixture Board</h3>
          </div>
        </div>
        <div className="matchup-row">
          <div>
            <span>Home</span>
            <strong>{shortHome}</strong>
          </div>
          <span className="versus-pill">VS</span>
          <div>
            <span>Away</span>
            <strong>{shortAway}</strong>
          </div>
        </div>
        <div className="summary-grid">
          <div>
            <span>Wager</span>
            <strong>{wager || "0"} ETH</strong>
          </div>
          <div>
            <span>Status</span>
            <strong>{statusLabel}</strong>
          </div>
          <div>
            <span>Entry type</span>
            <strong>Direct challenge</strong>
          </div>
          <div>
            <span>Chain action</span>
            <strong>{hasReadyFixture ? "Ready to submit" : "Waiting on inputs"}</strong>
          </div>
        </div>
        <div className="start-game-guidance">
          <div className="start-game-guidance-row">
            <span>1</span>
            <p>Set the home and away wallets for the fixture.</p>
          </div>
          <div className="start-game-guidance-row">
            <span>2</span>
            <p>Choose the shared stake that opens the match.</p>
          </div>
          <div className="start-game-guidance-row">
            <span>3</span>
            <p>Launch the match and confirm the wallet transaction.</p>
          </div>
        </div>
      </aside>
    </div>
  );
};

export default StartGame;
