import { Contract } from "./types";
import { getContractAddress } from "../config/network";
import academyArtifact from "./abi/Academy.json";

export const academyContract: Contract = {
  address: getContractAddress("academy"),
  abi: academyArtifact.abi,
};
