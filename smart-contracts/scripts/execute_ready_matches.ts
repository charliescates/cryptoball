import { ethers } from "hardhat";

async function main() {
  const gameAddress = process.env.GAME_ADDRESS;
  const startGameAddress = process.env.START_GAME_ADDRESS;
  const maxToExecute = Number(process.env.MAX_MATCHES_PER_RUN ?? "10");

  if (!gameAddress || !startGameAddress) {
    throw new Error("Missing GAME_ADDRESS or START_GAME_ADDRESS env var");
  }

  const [relayer] = await ethers.getSigners();
  console.log("Relayer:", relayer.address);

  const game = await ethers.getContractAt("Game", gameAddress);
  const startGame = await ethers.getContractAt("StartGame", startGameAddress);

  const readyMatchIds = await game.getReadyMatchList();
  if (readyMatchIds.length === 0) {
    console.log("No ready matches to execute");
    return;
  }

  const batch = readyMatchIds.slice(0, Math.max(0, maxToExecute));
  console.log(`Executing ${batch.length} ready matches`);

  for (const matchId of batch) {
    const tx = await startGame.executeMatch(matchId);
    const receipt = await tx.wait();
    console.log(`Executed match ${matchId.toString()} in tx ${receipt?.hash}`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
