/// <reference types="vite/client" />
/// <reference types="vitest/globals" />
/// <reference types="@testing-library/jest-dom" />

interface ImportMetaEnv {
	readonly VITE_APP_NETWORK?: "polygon" | "localhost";
	readonly VITE_LOCAL_RPC_URL?: string;
	readonly VITE_PLAYER_CONTRACT_ADDRESS?: string;
	readonly VITE_ACADEMY_CONTRACT_ADDRESS?: string;
	readonly VITE_GAME_CONTRACT_ADDRESS?: string;
	readonly VITE_MARKET_CONTRACT_ADDRESS?: string;
	readonly VITE_TOURNEMENT_CONTRACT_ADDRESS?: string;
	readonly VITE_TOURNAMENT_CONTRACT_ADDRESS?: string;
}

interface ImportMeta {
	readonly env: ImportMetaEnv;
}
