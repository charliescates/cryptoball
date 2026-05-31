import { ethers, network } from "hardhat";

type ParsedArgs = {
  oldToken: string;
  admin?: string;
  startId: number;
  endId?: number;
  skipMigrate: boolean;
  skipLock: boolean;
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
  MINTER_ROLE(): Promise<string>;
  GAME_ROLE(): Promise<string>;
  MIGRATOR_ROLE(): Promise<string>;
  setRole(account: string, role: string, enabled: boolean): Promise<{ wait(): Promise<unknown> }>;
  mintPlayerFromMigration(
    owner: string,
    player: {
      id: bigint;
      originalAttack: bigint;
      attack: bigint;
      originalDefense: bigint;
      defense: bigint;
      potential: bigint;
      gamesLeft: bigint;
      goalsScored: bigint;
      playerType: bigint;
    }
  ): Promise<{ wait(): Promise<unknown> }>;
  ownerOf(tokenId: bigint): Promise<string>;
  getPlayerAttributes(
    playerId: bigint
  ): Promise<[bigint, bigint, bigint, bigint, bigint, bigint, bigint, bigint]>;
  lockMigration(): Promise<{ wait(): Promise<unknown> }>;
  getAddress(): Promise<string>;
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
  if (!oldToken) {
    throw new Error("Missing old token address. Use --old <address> or OLD_PLAYER_TOKEN_ADDRESS.");
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

  return {
    oldToken,
    admin: getArg("admin") ?? process.env.PLAYER_V2_ADMIN,
    startId,
    endId,
    skipMigrate: (getArg("skipMigrate") ?? "false").toLowerCase() === "true",
    skipLock: (getArg("skipLock") ?? "false").toLowerCase() === "true"
  };
}

function toMigrationStruct(player: SnapshotPlayer) {
  return {
    id: player.id,
    originalAttack: player.originalAttack,
    attack: player.attack,
    originalDefense: player.originalDefense,
    defense: player.defense,
    potential: player.potential,
    gamesLeft: player.gamesLeft,
    goalsScored: player.goalsScored,
    playerType: player.playerType
  };
}

async function migratePlayers(oldToken: OldToken, newToken: NewToken, startId: number, endId?: number) {
  const allPlayers = await oldToken.getAllPlayers();
  const selected = allPlayers.filter((player) => {
    const id = Number(player.id);
    if (id < startId) {
      return false;
    }
    if (endId !== undefined && id > endId) {
      return false;
    }
    return true;
  });

  console.log(`Players selected for migration: ${selected.length}`);

  let migrated = 0;
  for (const player of selected) {
    const owner = await oldToken.ownerOf(player.id);
    const tx = await newToken.mintPlayerFromMigration(owner, toMigrationStruct(player));
    await tx.wait();
    migrated += 1;

    if (migrated % 25 === 0 || migrated === selected.length) {
      console.log(`Migration progress: ${migrated}/${selected.length}`);
    }
  }

  return selected;
}

async function verifyPlayers(oldToken: OldToken, newToken: NewToken, selected: SnapshotPlayer[]) {
  let checked = 0;
  for (const player of selected) {
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

    const oldOwner = (await oldToken.ownerOf(player.id)).toLowerCase();
    const newOwner = (await newToken.ownerOf(player.id)).toLowerCase();

    if (oldOwner !== newOwner) {
      throw new Error(`Owner mismatch for player ${player.id.toString()}: old=${oldOwner} new=${newOwner}`);
    }

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
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const [deployer] = await ethers.getSigners();

  const admin = args.admin ?? deployer.address;

  console.log(`Network: ${network.name}`);
  console.log(`Deployer: ${deployer.address}`);
  console.log(`Admin: ${admin}`);
  console.log(`Old token: ${args.oldToken}`);

  const PlayerTokenV2 = await ethers.getContractFactory("PlayerTokenV2");
  const playerTokenV2 = (await PlayerTokenV2.deploy(admin, ethers.ZeroAddress, ethers.ZeroAddress)) as unknown as NewToken;
  await (playerTokenV2 as unknown as { waitForDeployment(): Promise<unknown> }).waitForDeployment();
  const playerTokenV2Address = await playerTokenV2.getAddress();
  console.log(`PlayerTokenV2: ${playerTokenV2Address}`);

  const Academy = await ethers.getContractFactory("Academy");
  const academy = await Academy.deploy(playerTokenV2Address);
  await academy.waitForDeployment();
  const academyAddress = await academy.getAddress();
  console.log(`Academy: ${academyAddress}`);

  const Game = await ethers.getContractFactory("Game");
  const game = await Game.deploy(playerTokenV2Address, academyAddress);
  await game.waitForDeployment();
  const gameAddress = await game.getAddress();
  console.log(`Game: ${gameAddress}`);

  const Market = await ethers.getContractFactory("Market");
  const market = await Market.deploy(playerTokenV2Address, academyAddress);
  await market.waitForDeployment();
  const marketAddress = await market.getAddress();
  console.log(`Market: ${marketAddress}`);

  const minterRole = await playerTokenV2.MINTER_ROLE();
  const gameRole = await playerTokenV2.GAME_ROLE();
  const migratorRole = await playerTokenV2.MIGRATOR_ROLE();

  if (admin.toLowerCase() !== deployer.address.toLowerCase()) {
    throw new Error(
      `Deployer is not admin. Admin ${admin} must grant MINTER_ROLE(${academyAddress}), GAME_ROLE(${gameAddress}), and MIGRATOR_ROLE(${deployer.address}) before migration can continue.`
    );
  }

  await (await playerTokenV2.setRole(academyAddress, minterRole, true)).wait();
  await (await playerTokenV2.setRole(gameAddress, gameRole, true)).wait();
  await (await playerTokenV2.setRole(deployer.address, migratorRole, true)).wait();
  console.log("Roles granted: MINTER_ROLE->Academy, GAME_ROLE->Game, MIGRATOR_ROLE->Deployer");

  const oldToken = (await ethers.getContractAt("PlayerToken", args.oldToken)) as unknown as OldToken;

  let selected: SnapshotPlayer[] = [];
  if (!args.skipMigrate) {
    selected = await migratePlayers(oldToken, playerTokenV2, args.startId, args.endId);
    await verifyPlayers(oldToken, playerTokenV2, selected);
    console.log("Migration verification passed.");
  } else {
    console.log("Skipping migration as requested.");
  }

  if (!args.skipLock) {
    await (await playerTokenV2.lockMigration()).wait();
    console.log("Migration locked.");
  } else {
    console.log("Skipping migration lock as requested.");
  }

  console.log("Summary:");
  console.log(`  PlayerTokenV2=${playerTokenV2Address}`);
  console.log(`  Academy=${academyAddress}`);
  console.log(`  Game=${gameAddress}`);
  console.log(`  Market=${marketAddress}`);
  console.log(`  MigratedPlayers=${selected.length}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});