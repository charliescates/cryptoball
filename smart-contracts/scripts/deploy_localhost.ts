import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with:", deployer.address);

  // // PlayerToken
  // const PlayerToken = await ethers.getContractFactory("PlayerToken");
  // const playerToken = await PlayerToken.deploy();
  // await playerToken.waitForDeployment();
  // console.log("PlayerToken deployed to:", await playerToken.getAddress());

  // // Academy
  // const Academy = await ethers.getContractFactory("Academy");
  // const academy = await Academy.deploy(await playerToken.getAddress());
  // await academy.waitForDeployment();
  // console.log("Academy deployed to:", await academy.getAddress());

  // // Game
  // const Game = await ethers.getContractFactory("Game");
  // const game = await Game.deploy(await playerToken.getAddress(), await academy.getAddress());
  // await game.waitForDeployment();
  // console.log("Game deployed to:", await game.getAddress());

  // Market
  const Market = await ethers.getContractFactory("Market");
  // const market = await Market.deploy(await playerToken.getAddress(), await academy.getAddress());
  const market = await Market.deploy('0x818cAFC9e8AE9fa9b4503772AeF90b00adE9E027', '0xA83B4FD07A83020B3f89716097AaCD8A1346aC93');
  await market.waitForDeployment();
  console.log("Market deployed to:", await market.getAddress());
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
