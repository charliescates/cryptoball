import { Contract } from "./types";
import { getContractAddress } from "../config/network";
import marketArtifact from "../../../smart-contracts/artifacts/contracts/Market.sol/Market.json";

export const marketContract: Contract = {
  address: getContractAddress("market"),
  abi: marketArtifact.abi,
};
