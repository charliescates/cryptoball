import { Contract } from "./types";
import { getContractAddress } from "../config/network";
import tournementArtifact from "../../../smart-contracts/artifacts/contracts/Tournement.sol/Tournement.json";

export const tournementContract: Contract = {
  address: getContractAddress("tournement"),
  abi: tournementArtifact.abi,
};
