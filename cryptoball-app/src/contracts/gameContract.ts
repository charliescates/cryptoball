import { Contract } from "./types";
import { getContractAddress } from "../config/network";
import gameArtifact from "../../../smart-contracts/artifacts/contracts/Game.sol/Game.json";

export const gameContract: Contract = {
  address: getContractAddress("game"),
  abi: gameArtifact.abi,
};
