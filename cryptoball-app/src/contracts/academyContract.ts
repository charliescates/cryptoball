import { Contract } from "./types";
import { getContractAddress } from "../config/network";
import academyArtifact from "../../../smart-contracts/artifacts/contracts/Academy.sol/Academy.json";

export const academyContract: Contract = {
  address: getContractAddress("academy"),
  abi: academyArtifact.abi,
};
