import { ethers } from "hardhat";
import fs from "fs";
import path from "path";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with:", deployer.address);

  // PlayerToken
  const PlayerToken = await ethers.getContractFactory("PlayerTokenV2");
  // const PlayerToken = await ethers.getContractFactory("PlayerToken");
  const playerToken = await PlayerToken.deploy();
  await playerToken.waitForDeployment();
  console.log("PlayerTokenV2 deployed to:", await playerToken.getAddress());

  // Academy
  const Academy = await ethers.getContractFactory("Academy");
  const academy = await Academy.deploy(await playerToken.getAddress());
  // const academy = await Academy.deploy('0x05B665d3Ba0a83f5259C114fA3F2d2ECD8A00B29');
  await academy.waitForDeployment();
  console.log("Academy deployed to:", await academy.getAddress());
  await playerToken.setRole(await academy.getAddress(), await playerToken.MINTER_ROLE(), true);
  console.log("Academy authorized as PlayerToken minter");
  await academy.addDepositor(deployer.address);
  console.log("Deployer authorized as Academy depositer");

  // // Game
  const Game = await ethers.getContractFactory("Game");
  const game = await Game.deploy(await playerToken.getAddress(), await academy.getAddress());
  // const game = await Game.deploy('0x05B665d3Ba0a83f5259C114fA3F2d2ECD8A00B29', await academy.getAddress());
  await game.waitForDeployment();
  console.log("Game deployed to:", await game.getAddress());
  await playerToken.setRole(await game.getAddress(), await playerToken.GAME_ROLE(), true);
  console.log("Game authorized as PlayerToken game contract");
  await academy.addDepositor(await game.getAddress());
  console.log("Game authorized as Academy depositer");

  // Tournement
  const Tournement = await ethers.getContractFactory("Tournement");
  const tournement = await Tournement.deploy(await game.getAddress(), await academy.getAddress());
  // const tournement = await Tournement.deploy('0x666FC08efB36D6BA99AD13Ef9df2aA3B2B566b53');
  await tournement.waitForDeployment();
  console.log("Tournement deployed to:", await tournement.getAddress());
  await academy.addDepositor(await tournement.getAddress());
  console.log("Tournement authorized as Academy depositer");

  // const game = await ethers.getContractAt("Game", '0x666FC08efB36D6BA99AD13Ef9df2aA3B2B566b53');
  await (await game.setTournamentContract(await tournement.getAddress())).wait();
  console.log("Game authorized tournament contract");

  // Market
  const Market = await ethers.getContractFactory("Market");
  const market = await Market.deploy(await playerToken.getAddress(), await academy.getAddress());
  // const market = await Market.deploy('0x05B665d3Ba0a83f5259C114fA3F2d2ECD8A00B29', await academy.getAddress());
  // const market = await Market.deploy('0x05B665d3Ba0a83f5259C114fA3F2d2ECD8A00B29', '0x9d3616fCC1b1f4FD0C24327Fc658Ee4969856582');
  await market.waitForDeployment();
  console.log("Market deployed to:", await market.getAddress());
  await academy.addDepositor(await market.getAddress());
  console.log("Market authorized as Academy depositer");

  const addresses = {
    chainId: 31337,
    deployer: deployer.address,
    playerToken: await playerToken.getAddress(),
    academy: await academy.getAddress(),
    game: await game.getAddress(),
    tournement: await tournement.getAddress(),
    market: await market.getAddress(),
    updatedAt: new Date().toISOString(),
  };

  const outDir = path.resolve(__dirname, "..", "deployments");
  fs.mkdirSync(outDir, { recursive: true });

  const outFile = path.join(outDir, "localhost-addresses.json");
  fs.writeFileSync(outFile, `${JSON.stringify(addresses, null, 2)}\n`, "utf8");
  console.log("Wrote local deployment addresses:", outFile);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
