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
  // // const academy = await Academy.deploy(await playerToken.getAddress());
  // const academy = await Academy.deploy('0x05B665d3Ba0a83f5259C114fA3F2d2ECD8A00B29');
  // await academy.waitForDeployment();
  // console.log("Academy deployed to:", await academy.getAddress());

  // // // Game
  // const Game = await ethers.getContractFactory("Game");
  // // const game = await Game.deploy(await playerToken.getAddress(), await academy.getAddress());
  // const game = await Game.deploy('0x05B665d3Ba0a83f5259C114fA3F2d2ECD8A00B29', await academy.getAddress());
  // await game.waitForDeployment();
  // console.log("Game deployed to:", await game.getAddress());

  // Tournement
  const Tournement = await ethers.getContractFactory("Tournement");
  // const tournement = await Tournement.deploy(await game.getAddress());
  const tournement = await Tournement.deploy('0x666FC08efB36D6BA99AD13Ef9df2aA3B2B566b53');
  await tournement.waitForDeployment();
  console.log("Tournement deployed to:", await tournement.getAddress());

  // // Market
  // const Market = await ethers.getContractFactory("Market");
  // // const market = await Market.deploy(await playerToken.getAddress(), await academy.getAddress());
  // const market = await Market.deploy('0x05B665d3Ba0a83f5259C114fA3F2d2ECD8A00B29', await academy.getAddress());
  // // const market = await Market.deploy('0x05B665d3Ba0a83f5259C114fA3F2d2ECD8A00B29', '0x9d3616fCC1b1f4FD0C24327Fc658Ee4969856582');
  // await market.waitForDeployment();
  // console.log("Market deployed to:", await market.getAddress());
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
