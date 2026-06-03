import { Contract } from "./types";
import { getContractAddress } from "../config/network";
import tournementArtifact from "./abi/Tournement.json";

export const tournementContract: Contract = {
  address: getContractAddress("tournement"),
  abi: tournementArtifact.abi,
};
