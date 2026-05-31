import { ethers, network } from "hardhat";

type ParsedArgs = {
  admin?: string;
  minter?: string;
  game?: string;
  migrator?: string;
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

  return {
    admin: getArg("admin") ?? process.env.PLAYER_V2_ADMIN,
    minter: getArg("minter") ?? process.env.PLAYER_V2_MINTER,
    game: getArg("game") ?? process.env.PLAYER_V2_GAME,
    migrator: getArg("migrator") ?? process.env.PLAYER_V2_MIGRATOR
  };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const [deployer] = await ethers.getSigners();

  const admin = args.admin ?? deployer.address;
  const minter = args.minter ?? ethers.ZeroAddress;
  const game = args.game ?? ethers.ZeroAddress;

  console.log(`Network: ${network.name}`);
  console.log(`Deployer: ${deployer.address}`);
  console.log(`Admin: ${admin}`);
  console.log(`Minter: ${minter}`);
  console.log(`Game: ${game}`);

  const PlayerTokenV2 = await ethers.getContractFactory("PlayerTokenV2");
  const playerTokenV2 = await PlayerTokenV2.deploy(admin, minter, game);
  await playerTokenV2.waitForDeployment();

  const address = await playerTokenV2.getAddress();
  console.log(`PlayerTokenV2 deployed to: ${address}`);

  const migrator = args.migrator ?? deployer.address;
  if (migrator !== ethers.ZeroAddress && admin.toLowerCase() === deployer.address.toLowerCase()) {
    const migratorRole = await playerTokenV2.MIGRATOR_ROLE();
    const tx = await playerTokenV2.connect(deployer).grantRole(migratorRole, migrator);
    await tx.wait();
    console.log(`Granted MIGRATOR_ROLE to: ${migrator}`);
  } else if (migrator !== ethers.ZeroAddress) {
    console.log(
      `Deployer is not admin, so MIGRATOR_ROLE was not granted automatically. Admin ${admin} must grant MIGRATOR_ROLE to ${migrator}.`
    );
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});