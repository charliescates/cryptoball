import { useAccount } from "wagmi";
import { useNavigate } from "react-router-dom";
import "./CreateTournamentButton.css";

interface CreateTournamentButtonProps {
  onSuccess?: () => void;
  variant?: "primary" | "secondary";
  size?: "small" | "medium" | "large";
}

export default function CreateTournamentButton({
  onSuccess: _onSuccess,
  variant = "primary",
  size = "medium",
}: CreateTournamentButtonProps) {
  const { isConnected } = useAccount();
  const navigate = useNavigate();

  return (
    <button
      className={`create-tournament-button create-tournament-button--${variant} create-tournament-button--${size}`}
      onClick={() => navigate("/tournaments/create")}
      disabled={!isConnected}
      type="button"
      title={!isConnected ? "Connect wallet to create tournament" : "Go to create tournament tab"}
    >
      <span className="create-tournament-icon">⚽</span>
      <span className="create-tournament-label">Create Tournament</span>
    </button>
  );
}
