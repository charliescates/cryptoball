import { useState } from "react";
import { useAccount } from "wagmi";
import CreateTournamentModal from "./CreateTournamentModal";
import "./CreateTournamentButton.css";

interface CreateTournamentButtonProps {
  onSuccess?: () => void;
  variant?: "primary" | "secondary";
  size?: "small" | "medium" | "large";
}

export default function CreateTournamentButton({
  onSuccess,
  variant = "primary",
  size = "medium",
}: CreateTournamentButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { isConnected } = useAccount();

  return (
    <>
      <button
        className={`create-tournament-button create-tournament-button--${variant} create-tournament-button--${size}`}
        onClick={() => setIsModalOpen(true)}
        disabled={!isConnected}
        type="button"
        title={!isConnected ? "Connect wallet to create tournament" : "Create a new tournament"}
      >
        <span className="create-tournament-icon">⚽</span>
        <span className="create-tournament-label">Create Tournament</span>
      </button>
      <CreateTournamentModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={onSuccess}
      />
    </>
  );
}
