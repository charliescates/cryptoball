import type { FormEvent, ReactNode } from "react";

import type { BaseError } from "viem";

interface StartGameFormProps {
  awayAddress: string;
  editable: boolean;
  error: unknown;
  hash?: string;
  hasReadyFixture: boolean;
  homeAddress: string;
  isConfirming: boolean;
  isConfirmed: boolean;
  isPending: boolean;
  onAwayAddressChange: (value: string) => void;
  onHomeAddressChange: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onWagerChange: (value: string) => void;
  statusLabel: string;
  wager: string;
}

const StartGameForm = ({
  awayAddress,
  editable,
  error,
  hash,
  hasReadyFixture,
  homeAddress,
  isConfirming,
  isConfirmed,
  isPending,
  onAwayAddressChange,
  onHomeAddressChange,
  onSubmit,
  onWagerChange,
  statusLabel,
  wager,
}: StartGameFormProps) => {
  const errorMessage = getErrorMessage(error);

  return (
    <form className="start-game-form" onSubmit={onSubmit}>
      <PanelHeader label="Launch pad" title="Fixture details" state={statusLabel} />

      <StartGameSection description="Choose the two managers entering the match." title="Wallet pairing">
        <div className="start-game-field-grid">
          <div className="form-field">
            <label htmlFor="home-address">Home wallet</label>
            <input
              id="home-address"
              type="text"
              placeholder="0x..."
              value={homeAddress}
              onChange={(event) => onHomeAddressChange(event.target.value)}
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
              onChange={(event) => onAwayAddressChange(event.target.value)}
              disabled={!editable}
            />
          </div>
        </div>
      </StartGameSection>

      <StartGameSection description="Both managers commit the same value to open the contest." title="Match stake">
        <div className="form-field">
          <label htmlFor="match-wager">Shared wager</label>
          <div className="wager-input-wrap">
            <input
              id="match-wager"
              type="text"
              inputMode="decimal"
              placeholder="0.05"
              value={wager}
              onChange={(event) => onWagerChange(event.target.value)}
              disabled={!editable}
            />
            <span>ETH</span>
          </div>
        </div>
      </StartGameSection>

      <div className="start-game-form-footer">
        <div className="start-game-readiness">
          <span className="section-kicker">Launch state</span>
          <strong>{hasReadyFixture ? "Fixture complete" : "Awaiting details"}</strong>
        </div>
        <button className="start-game-button" disabled={isPending || isConfirming || !editable} type="submit">
          {isPending ? "Starting match..." : "Start Game"}
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
        {errorMessage && <div className="transaction-status error">Error: {errorMessage}</div>}
      </div>
    </form>
  );
};

const PanelHeader = ({ label, title, state }: { label: string; title: string; state: string }) => (
  <div className="start-game-panel-header">
    <div>
      <span className="section-kicker">{label}</span>
      <h3>{title}</h3>
    </div>
    <div className={`start-game-state-pill ${state.toLowerCase()}`}>{state}</div>
  </div>
);

const StartGameSection = ({
  children,
  description,
  title,
}: {
  children: ReactNode;
  description: string;
  title: string;
}) => (
  <div className="start-game-form-section">
    <div className="start-game-section-heading">
      <strong>{title}</strong>
      <span>{description}</span>
    </div>
    {children}
  </div>
);

const getErrorMessage = (error: unknown): string | null => {
  if (!error) {
    return null;
  }

  if (typeof error === "string") {
    return error;
  }

  if (typeof error === "object" && error !== null) {
    const baseError = error as BaseError & Error;
    return baseError.shortMessage || baseError.message || null;
  }

  return null;
};

export default StartGameForm;
