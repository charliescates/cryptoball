import * as React from "react";
import {
  BaseError,
  useAccount,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";
import { academyContract } from "../../contracts/academyContract";
import { activeChain } from "../../config/network";

export type BuyPlayerProps = {
  playerId: bigint;
  price: bigint;
  accentColor?: string;
};

export function BuyPlayer({
  playerId,
  price,
  accentColor = "#20ff7a",
}: BuyPlayerProps) {
  const { data: hash, error, isPending, writeContract, reset } = useWriteContract();
  const account = useAccount();

  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    reset();

    const buyerAddress = account.addresses?.[0];

    if (!buyerAddress) return;

    writeContract({
      address: academyContract.address,
      abi: academyContract.abi,
      functionName: "buyPlayer",
      args: [buyerAddress, playerId],
      chainId: activeChain.id,
      value: price,
    });
  }

  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({ hash });
  const gradientEnd = `${accentColor}cc`;
  const buttonGlow = `${accentColor}66`;

  const buttonText = isPending
    ? "Confirming..."
    : isConfirming
      ? "Processing..."
      : isConfirmed
        ? "Purchased"
        : "Buy Player";

  return (
    <form
      onSubmit={submit}
      style={{
        width: "100%",
        maxWidth: "none",
        boxSizing: "border-box",
        margin: 0,
        padding: 0,
        gap: 0,
        background: "transparent",
        border: "none",
      }}
    >
      <button
        className="buy-player-button"
        disabled={isPending || isConfirming || isConfirmed}
        type="submit"
        style={{
          width: "100%",
          boxSizing: "border-box",
          display: "block",
          margin: 0,
          padding: "10px 12px",
          borderRadius: "12px",
          border: "none",
          background: isConfirmed
            ? "rgba(255,255,255,0.18)"
            : `linear-gradient(135deg, ${accentColor}, ${gradientEnd})`,
          color: "#071018",
          fontSize: "0.86rem",
          fontWeight: 950,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
          cursor: isPending || isConfirming || isConfirmed ? "not-allowed" : "pointer",
          boxShadow: `0 0 18px ${buttonGlow}`,
        }}
      >
        {buttonText}
      </button>

      {(error || isConfirming || isConfirmed) && (
        <div
          style={{
            marginTop: "6px",
            textAlign: "center",
            fontSize: "0.68rem",
            opacity: 0.78,
            color: error ? "#ff6b6b" : "#ffffff",
          }}
        >
          {error
            ? (error as BaseError).shortMessage || error.message
            : isConfirming
              ? "Waiting for confirmation"
              : "Transaction confirmed"}
        </div>
      )}
    </form>
  );
}
