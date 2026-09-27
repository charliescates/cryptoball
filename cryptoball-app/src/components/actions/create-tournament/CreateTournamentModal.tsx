import { useEffect, useState } from "react";
import { parseEther } from "viem";
import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import type { BaseError } from "viem";
import { tournementContract } from "../../../contracts/tournementContract";
import { activeChain } from "../../../config/network";
import { nativeTokenSymbol } from "../../../config/network";
import {
  getPlayerTypeIcon,
  getPlayerTypeName,
  PlayerType,
} from "../../utils/playerType";
import "./CreateTournamentModal.css";

const MIN_ENTRY_FEE = 5;
const PLAYER_TYPE_OPTIONS: number[] = [
  PlayerType.ENFORCER,
  PlayerType.TARGET_MAN,
  PlayerType.PLAYMAKER,
  PlayerType.ANCHOR,
];

interface CreateTournamentModalProps {
  onSuccess?: () => void;
}

export default function CreateTournamentModal({
  onSuccess,
}: CreateTournamentModalProps) {
  const [name, setName] = useState("");
  const [rounds, setRounds] = useState("2");
  const [entryFee, setEntryFee] = useState("5");
  const [minAttack, setMinAttack] = useState("0");
  const [minDefence, setMinDefence] = useState("0");
  const [maxAttack, setMaxAttack] = useState("99");
  const [maxDefence, setMaxDefence] = useState("99");
  const [includeTypes, setIncludeTypes] = useState<number[]>([]);
  const [excludeTypes, setExcludeTypes] = useState<number[]>([]);

  const { data: hash, writeContract, isPending, error, reset } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  });
  const entryFeeAmount = Number(entryFee);
  const trimmedName = name.trim();
  const isNameValid = trimmedName.length > 0 && trimmedName.length <= 64;
  const isEntryFeeValid = entryFee.trim() !== "" && Number.isFinite(entryFeeAmount) && entryFeeAmount >= MIN_ENTRY_FEE;

  const resetForm = () => {
    reset();
    setName("");
    setRounds("2");
    setEntryFee("5");
    setMaxAttack("99");
    setMaxDefence("99");
    setMinAttack("0");
    setMinDefence("0");
    setIncludeTypes([]);
    setExcludeTypes([]);
  };

  const toggleIncludeType = (type: number) => {
    setIncludeTypes((previous) =>
      previous.includes(type) ? previous.filter((entry) => entry !== type) : [...previous, type],
    );
    setExcludeTypes((previous) => previous.filter((entry) => entry !== type));
  };

  const toggleExcludeType = (type: number) => {
    setExcludeTypes((previous) =>
      previous.includes(type) ? previous.filter((entry) => entry !== type) : [...previous, type],
    );
    setIncludeTypes((previous) => previous.filter((entry) => entry !== type));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isEntryFeeValid || !isNameValid) {
      return;
    }

    writeContract({
      address: tournementContract.address,
      abi: tournementContract.abi,
      functionName: "create",
      chainId: activeChain.id,
      args: [
        trimmedName,
        parseInt(rounds, 10),
        parseEther(entryFee),
        parseInt(minAttack, 10),
        parseInt(minDefence, 10),
        parseInt(maxAttack, 10),
        parseInt(maxDefence, 10),
        includeTypes,
        excludeTypes,
      ],
    });
  };

  useEffect(() => {
    if (isConfirmed) {
      onSuccess?.();
      resetForm();
    }
  }, [isConfirmed, onSuccess, reset]);

  const errorMessage = error ? (error as BaseError).shortMessage || error.message : null;
  const isLoading = isPending || isConfirming;
  const statusLabel = isConfirmed ? "Confirmed" : isConfirming ? "Confirming" : isPending ? "Submitting" : "Ready";

  return (
    <div className="tournament-modal-content tournament-modal-content--inline">
      <form onSubmit={handleSubmit} className="tournament-form">
        <div className="tournament-form-grid">

          <div className="form-field full-width">
            <label htmlFor="tournament-name">Tournament Name</label>
            <input
              id="tournament-name"
              type="text"
              maxLength={64}
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isLoading}
              placeholder="e.g. Summer Showdown"
            />
            <small className="form-field-hint">1-64 characters</small>
          </div>

            <div className="form-field">
              <label htmlFor="rounds">Tournament Rounds</label>
              <select
                id="rounds"
                value={rounds}
                onChange={(e) => setRounds(e.target.value)}
                disabled={isLoading}
              >
                <option value="1">1 Round (2 teams)</option>
                <option value="2">2 Rounds (4 teams)</option>
                <option value="3">3 Rounds (8 teams)</option>
                <option value="4">4 Rounds (16 teams)</option>
                <option value="5">5 Rounds (32 teams)</option>
                <option value="6">6 Rounds (64 teams)</option>
                <option value="7">7 Rounds (128 teams)</option>
              </select>
            </div>

            <div className="form-field">
              <label htmlFor="entry-fee">{`Entry Fee (${nativeTokenSymbol})`}</label>
              <input
                id="entry-fee"
                type="number"
                step="0.01"
                min={MIN_ENTRY_FEE}
                value={entryFee}
                onChange={(e) => setEntryFee(e.target.value)}
                disabled={isLoading}
                placeholder="5"
              />
              <small className="form-field-hint">Minimum entry fee: {MIN_ENTRY_FEE} {nativeTokenSymbol}</small>
            </div>

            <div className="form-field">
              <label htmlFor="min-attack">Minimum Attack</label>
              <input
                id="min-attack"
                type="number"
                step="1"
                min="0"
                max="99"
                value={minAttack}
                onChange={(e) => setMinAttack(e.target.value)}
                disabled={isLoading}
                placeholder="0"
              />
            </div>

            <div className="form-field">
              <label htmlFor="max-attack">Maximum Attack</label>
              <input
                id="max-attack"
                type="number"
                step="1"
                min="0"
                max="99"
                value={maxAttack}
                onChange={(e) => setMaxAttack(e.target.value)}
                disabled={isLoading}
                placeholder="0"
              />
            </div>

            <div className="form-field">
              <label htmlFor="min-defence">Minimum Defence</label>
              <input
                id="min-defence"
                type="number"
                step="1"
                min="0"
                max="99"
                value={minDefence}
                onChange={(e) => setMinDefence(e.target.value)}
                disabled={isLoading}
                placeholder="0"
              />
            </div>

            <div className="form-field">
              <label htmlFor="max-defence">Maximum Defence</label>
              <input
                id="max-defence"
                type="number"
                step="1"
                min="0"
                max="99"
                value={maxDefence}
                onChange={(e) => setMaxDefence(e.target.value)}
                disabled={isLoading}
                placeholder="0"
              />
            </div>

            <div className="form-field full-width">
              <label>Include Chemistry Types</label>
              <small className="form-field-hint">Leave empty for all types</small>
              <div className="tournament-type-grid" role="group" aria-label="Include chemistry types">
                {PLAYER_TYPE_OPTIONS.map((type) => {
                  const inputId = `include-type-${type}`;
                  const typeName = getPlayerTypeName(type);
                  const isSelected = includeTypes.includes(type);
                  return (
                    <label
                      key={inputId}
                      htmlFor={inputId}
                      className={`tournament-type-option tournament-type-option--include${isSelected ? " is-selected" : ""}`}
                    >
                      <input
                        id={inputId}
                        type="checkbox"
                        aria-label={typeName}
                        checked={isSelected}
                        onChange={() => toggleIncludeType(type)}
                        disabled={isLoading}
                      />
                      <span className="tournament-type-option-icon" aria-hidden="true">{getPlayerTypeIcon(type)}</span>
                      <span className="tournament-type-option-content">
                        <strong>{typeName}</strong>
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>

            <div className="form-field full-width">
              <label>Exclude Chemistry Types</label>
              <small className="form-field-hint">Leave empty to exclude none</small>
              <div className="tournament-type-grid" role="group" aria-label="Exclude chemistry types">
                {PLAYER_TYPE_OPTIONS.map((type) => {
                  const inputId = `exclude-type-${type}`;
                  const typeName = getPlayerTypeName(type);
                  const isSelected = excludeTypes.includes(type);
                  return (
                    <label
                      key={inputId}
                      htmlFor={inputId}
                      className={`tournament-type-option tournament-type-option--exclude${isSelected ? " is-selected" : ""}`}
                    >
                      <input
                        id={inputId}
                        type="checkbox"
                        aria-label={typeName}
                        checked={isSelected}
                        onChange={() => toggleExcludeType(type)}
                        disabled={isLoading}
                      />
                      <span className="tournament-type-option-icon" aria-hidden="true">{getPlayerTypeIcon(type)}</span>
                      <span className="tournament-type-option-content">
                        <strong>{typeName}</strong>
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>
        </div>

        <div className="tournament-form-footer">
          <div className="tournament-form-status">
            <span>Status</span>
            <strong>{statusLabel}</strong>
          </div>
          <button
            type="submit"
            className="tournament-create-button"
            disabled={isLoading || !isEntryFeeValid || !isNameValid}
          >
            {isLoading ? "Creating..." : "Create Tournament"}
          </button>
        </div>

        <div className="tournament-transaction-status" aria-live="polite">
          {hash && (
            <div className="transaction-status">
              <span>Transaction hash</span>
              <strong>{hash}</strong>
            </div>
          )}
          {isConfirming && (
            <div className="transaction-status pending">
              Waiting for wallet confirmation...
            </div>
          )}
          {isConfirmed && (
            <div className="transaction-status success">
              Tournament created successfully!
            </div>
          )}
          {!isEntryFeeValid && entryFee.trim() !== "" && (
            <div className="transaction-status error">
              Entry fee must be at least {MIN_ENTRY_FEE} {nativeTokenSymbol}.
            </div>
          )}
          {!isNameValid && name.length > 0 && (
            <div className="transaction-status error">
              Tournament name must be between 1 and 64 characters.
            </div>
          )}
          {errorMessage && (
            <div className="transaction-status error">
              Error: {errorMessage}
            </div>
          )}
        </div>
      </form>
    </div>
  );
}
