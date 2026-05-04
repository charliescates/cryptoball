import { useEffect } from "react";
import { useAccount, useReadContract } from "wagmi";

import { academyContract } from "../../contracts/academyContract";
import type { AcademyPlayer } from "../../utils/playerUtils";
import { ACADEMY_OWNER_TOOLS_ADDRESS } from "../constants";

export const useAcademyPlayers = () => {
  const { address, isConnected } = useAccount();
  const isOwnerWallet = isConnected && address?.toLowerCase() === ACADEMY_OWNER_TOOLS_ADDRESS.toLowerCase();

  const { data, error } = useReadContract({
    abi: academyContract.abi,
    address: academyContract.address,
    functionName: "getAcademyPlayers",
    query: {
      refetchInterval: 10000,
    },
  });

  useEffect(() => {
    if (error) {
      console.error("Failed to fetch players:", error);
    }
  }, [error]);

  return {
    error,
    isOwnerWallet,
    players: (data as AcademyPlayer[] | undefined) ?? [],
  };
};
