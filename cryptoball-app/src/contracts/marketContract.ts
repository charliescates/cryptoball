import { Contract } from "./types";
import { getContractAddress } from "../config/network";
import marketArtifact from "./abi/Market.json";

export const marketContract: Contract = {
  address: getContractAddress("market"),
  abi: marketArtifact.abi,
};
