import { ethers } from "hardhat";

async function main() {
  const playerToken = await ethers.deployContract("PlayerToken");
  await playerToken.waitForDeployment();
  console.log("PlayerToken deployed to:", await playerToken.getAddress());

  const academyContract = await ethers.deployContract("Academy", [await playerToken.getAddress()]);
  await academyContract.waitForDeployment();
  console.log("Academy deployed to:", await academyContract.getAddress());
  
  const gameContract = await ethers.deployContract("Game", [await playerToken.getAddress()]);
  await gameContract.waitForDeployment();
  console.log("Game deployed to:", await gameContract.getAddress());
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
