import { ethers, network } from "hardhat";

type ParsedArgs = {
  oldtoken: string;
  newtoken: string;
  startid: number;
  endid?: number;
  dryrun: boolean;
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

  const oldToken = getArg("oldtoken") ?? process.env.OLD_PLAYER_TOKEN_ADDRESS;
  const newToken = getArg("newtoken") ?? process.env.NEW_PLAYER_TOKEN_ADDRESS;

  if (!oldToken) {
    throw new Error("Missing old token address. Use --old <address> or OLD_PLAYER_TOKEN_ADDRESS.");
  }
  if (!newToken) {
    throw new Error("Missing new token address. Use --new <address> or NEW_PLAYER_TOKEN_ADDRESS.");
  }

  const startRaw = getArg("startid") ?? process.env.MIGRATION_START_ID ?? "1";
  const endRaw = getArg("endid") ?? process.env.MIGRATION_END_ID;

  const startId = Number(startRaw);
  if (!Number.isInteger(startId) || startId <= 0) {
    throw new Error("startid must be a positive integer");
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

  const dryRunArg = getArg("dryrun") ?? process.env.MIGRATION_DRY_RUN ?? "false";
  const dryRun = dryRunArg.toLowerCase() === "true";

  return {
    oldtoken: oldToken,
    newtoken: newToken,
    startid: startId,
    endid: endId,
    dryrun: dryRun
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

function formatError(error: unknown): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  if (typeof error === "string" && error.length > 0) {
    return error;
  }

  return "Unknown error";
}

async function main() {
  const args = parseArgs(process.argv.slice(2));

  console.log(`Network: ${network.name}`);
  console.log(`Old token: ${args.oldtoken}`);
  console.log(`New token: ${args.newtoken}`);
  console.log(`Range start: ${args.startid}`);
  console.log(`Range end: ${args.endid ?? "max"}`);
  console.log(`Dry run: ${args.dryrun}`);

  const oldToken = (await ethers.getContractAt("PlayerToken", args.oldtoken)) as unknown as OldToken;
  const newToken = (await ethers.getContractAt("PlayerTokenV2", args.newtoken)) as unknown as NewToken;

  const allPlayers = await oldToken.getAllPlayers();
  const selected = allPlayers.filter((player) => {
    const id = Number(player.id);
    if (id < args.startid) {
      return false;
    }
    if (args.endid !== undefined && id > args.endid) {
      return false;
    }
    return true;
  });

  console.log(`Players found in range: ${selected.length}`);

  let migrated = 0;
  let failed = 0;
  for (const player of selected) {
    try {
      const owner = await oldToken.ownerOf(player.id);

      if (args.dryrun) {
        console.log(
          `[dry-run] id=${player.id.toString()} owner=${owner} atk=${player.attack.toString()} def=${player.defense.toString()} pot=${player.potential.toString()}`
        );
        migrated += 1;
        continue;
      }

      const tx = await newToken.mintPlayerFromMigration(owner, toMigrationStruct(player));
      await tx.wait();
      migrated += 1;

      if ((migrated + failed) % 25 === 0 || migrated + failed === selected.length) {
        console.log(`Migration progress: ${migrated + failed}/${selected.length}`);
      }
    } catch (error) {
      failed += 1;
      const msg = formatError(error);
      console.log(`[skip] id=${player.id.toString()} reason=${msg.replace(/\s+/g, " ").trim()}`);
    }
  }

  console.log(`Migration complete. Succeeded: ${migrated}, skipped: ${failed}, total: ${selected.length}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});