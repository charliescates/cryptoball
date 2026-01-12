import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with:", deployer.address);

  // PlayerToken
  const PlayerToken = await ethers.getContractFactory("PlayerToken");
  const playerToken = await PlayerToken.deploy();
  await playerToken.waitForDeployment();
  console.log("PlayerToken deployed to:", await playerToken.getAddress());

  // Academy
  const Academy = await ethers.getContractFactory("Academy");
  const academy = await Academy.deploy(await playerToken.getAddress());
  await academy.waitForDeployment();
  console.log("Academy deployed to:", await academy.getAddress());

  // Game
  const Game = await ethers.getContractFactory("Game");
  const game = await Game.deploy(await playerToken.getAddress(), await academy.getAddress());
  await game.waitForDeployment();
  console.log("Game deployed to:", await game.getAddress());
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
