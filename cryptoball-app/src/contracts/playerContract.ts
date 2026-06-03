import { Contract } from "./types";
import { getContractAddress } from "../config/network";
import playerArtifact from "./abi/PlayerToken.json";

export const playerContract: Contract = {
  address: getContractAddress("player"),
  abi: playerArtifact.abi,
};
