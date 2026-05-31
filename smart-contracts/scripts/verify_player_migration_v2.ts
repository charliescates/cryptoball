import { ethers, network } from "hardhat";

type ParsedArgs = {
  oldToken: string;
  newToken: string;
  startId: number;
  endId?: number;
};

type SnapshotPlayer = {
  id: bigint;
  originalAttack: bigint;
  attack: bigint;
  originalDefense: bigint;
  defense: bigint;
  potential: bigint;
  gamesLeft: bigint;
  goalsScored: bigint;
  playerType: bigint;
};

type OldToken = {
  getAllPlayers(): Promise<SnapshotPlayer[]>;
  ownerOf(tokenId: bigint): Promise<string>;
};

type NewToken = {
  ownerOf(tokenId: bigint): Promise<string>;
  getPlayerAttributes(
    playerId: bigint
  ): Promise<[bigint, bigint, bigint, bigint, bigint, bigint, bigint, bigint]>;
};

function parseArgs(argv: string[]): ParsedArgs {
  const getArg = (name: string): string | undefined => {
    const exact = argv.find((arg) => arg.startsWith(`--${name}=`));
    if (exact) {
      return exact.split("=").slice(1).join("=");
    }

    const index = argv.findIndex((arg) => arg === `--${name}`);
    if (index >= 0 && index + 1 < argv.length) {
      return argv[index + 1];
    }

    return undefined;
  };

  const oldToken = getArg("old") ?? process.env.OLD_PLAYER_TOKEN_ADDRESS;
  const newToken = getArg("new") ?? process.env.NEW_PLAYER_TOKEN_ADDRESS;

  if (!oldToken || !newToken) {
    throw new Error("Missing token addresses. Provide --old/--new or OLD_PLAYER_TOKEN_ADDRESS/NEW_PLAYER_TOKEN_ADDRESS env vars.");
  }

  const startRaw = getArg("startId") ?? process.env.MIGRATION_START_ID ?? "1";
  const endRaw = getArg("endId") ?? process.env.MIGRATION_END_ID;

  const startId = Number(startRaw);
  if (!Number.isInteger(startId) || startId <= 0) {
    throw new Error("startId must be a positive integer");
  }

  let endId: number | undefined;
  if (endRaw !== undefined) {
    const parsedEnd = Number(endRaw);
    if (!Number.isInteger(parsedEnd) || parsedEnd <= 0) {
      throw new Error("endId must be a positive integer when provided");
    }
    endId = parsedEnd;
  }

  if (endId !== undefined && endId < startId) {
    throw new Error("endId cannot be smaller than startId");
  }

  return { oldToken, newToken, startId, endId };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));

  console.log(`Network: ${network.name}`);
  console.log(`Old token: ${args.oldToken}`);
  console.log(`New token: ${args.newToken}`);

  const oldToken = (await ethers.getContractAt("PlayerToken", args.oldToken)) as unknown as OldToken;
  const newToken = (await ethers.getContractAt("PlayerTokenV2", args.newToken)) as unknown as NewToken;

  const allPlayers = await oldToken.getAllPlayers();
  const selected = allPlayers.filter((player) => {
    const id = Number(player.id);
    if (id < args.startId) {
      return false;
    }
    if (args.endId !== undefined && id > args.endId) {
      return false;
    }
    return true;
  });

  console.log(`Players to verify: ${selected.length}`);

  let checked = 0;
  for (const player of selected) {
    const oldOwner = (await oldToken.ownerOf(player.id)).toLowerCase();
    const newOwner = (await newToken.ownerOf(player.id)).toLowerCase();
    if (oldOwner !== newOwner) {
      throw new Error(`Owner mismatch for player ${player.id.toString()}`);
    }

    const [
      newOriginalAttack,
      newAttack,
      newOriginalDefense,
      newDefense,
      newPotential,
      newGamesLeft,
      newGoalsScored,
      newPlayerType
    ] = await newToken.getPlayerAttributes(player.id);

    if (
      newOriginalAttack !== player.originalAttack ||
      newAttack !== player.attack ||
      newOriginalDefense !== player.originalDefense ||
      newDefense !== player.defense ||
      newPotential !== player.potential ||
      newGamesLeft !== player.gamesLeft ||
      newGoalsScored !== player.goalsScored ||
      newPlayerType !== player.playerType
    ) {
      throw new Error(`Attribute mismatch for player ${player.id.toString()}`);
    }

    checked += 1;
    if (checked % 50 === 0 || checked === selected.length) {
      console.log(`Verification progress: ${checked}/${selected.length}`);
    }
  }

  console.log("Verification complete. All checked players match.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});