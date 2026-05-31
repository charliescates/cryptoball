import { Contract } from "./types";
import { getContractAddress } from "../config/network";
import playerArtifact from "../../../smart-contracts/artifacts/contracts/PlayerToken.sol/PlayerToken.json";

export const playerContract: Contract = {
  address: getContractAddress("player"),
  abi: playerArtifact.abi,
};
