const { spawn } = require("node:child_process");

function getArg(argv, ...names) {
  for (const name of names) {
    const exact = argv.find((arg) => arg.startsWith(`--${name}=`));
    if (exact) {
      return exact.split("=").slice(1).join("=");
    }

    const index = argv.findIndex((arg) => arg === `--${name}`);
    if (index >= 0 && index + 1 < argv.length) {
      return argv[index + 1];
    }
  }

  return undefined;
}

const argv = process.argv.slice(2);

const env = {
  ...process.env,
  ACADEMY_ADDRESS:
    getArg(argv, "academy", "academy-address", "academyaddress") ?? process.env.ACADEMY_ADDRESS,
  SEED_NEW_PLAYERS:
    getArg(argv, "new-players", "newplayers") ?? process.env.SEED_NEW_PLAYERS,
  SEED_PLAYERS_PER_BUYER:
    getArg(argv, "players-per-buyer", "playersperbuyer") ?? process.env.SEED_PLAYERS_PER_BUYER,
  SEED_BUYER_ONE_INDEX:
    getArg(argv, "buyer-one-index", "buyeroneindex") ?? process.env.SEED_BUYER_ONE_INDEX,
  SEED_BUYER_TWO_INDEX:
    getArg(argv, "buyer-two-index", "buyertwoindex") ?? process.env.SEED_BUYER_TWO_INDEX,
  SEED_DEPOSIT_ETH:
    getArg(argv, "deposit-eth", "depositeth") ?? process.env.SEED_DEPOSIT_ETH
};

const child = spawn(
  "npx",
  ["hardhat", "run", "scripts/seed_local_players.ts", "--network", "localhost"],
  {
    stdio: "inherit",
    env
  }
);

child.on("exit", (code) => {
  process.exitCode = code ?? 1;
});
