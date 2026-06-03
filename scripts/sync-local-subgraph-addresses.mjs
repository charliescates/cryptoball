import fs from "fs";
import path from "path";

const rootDir = process.cwd();
const addressesFile = path.join(rootDir, "smart-contracts", "deployments", "localhost-addresses.json");

function fail(message) {
  console.error(message);
  process.exit(1);
}

function assertAddress(value, name) {
  if (typeof value !== "string" || !/^0x[a-fA-F0-9]{40}$/.test(value)) {
    fail(`Invalid ${name} address: ${value ?? "<missing>"}`);
  }
}

if (!fs.existsSync(addressesFile)) {
  fail(`Missing deployment artifact: ${addressesFile}\nRun: cd smart-contracts && npx hardhat run scripts/deploy_localhost.ts --network localhost`);
}

const deployed = JSON.parse(fs.readFileSync(addressesFile, "utf8"));
assertAddress(deployed.game, "game");
assertAddress(deployed.market, "market");
assertAddress(deployed.tournement, "tournement");

const targets = [
  {
    file: path.join(rootDir, "match-results", "subgraph.local.yaml"),
    address: deployed.game,
  },
  {
    file: path.join(rootDir, "cryptoball-market", "subgraph.local.yaml"),
    address: deployed.market,
  },
  {
    file: path.join(rootDir, "tournements", "subgraph.local.yaml"),
    address: deployed.tournement,
  },
];

for (const target of targets) {
  if (!fs.existsSync(target.file)) {
    fail(`Missing manifest: ${target.file}`);
  }

  const original = fs.readFileSync(target.file, "utf8");
  const updated = original
    .replace(/(\n\s*network:\s*).*/i, "$1mainnet")
    .replace(/(\n\s*address:\s*")[^"]+("\s*\n)/i, `$1${target.address}$2`)
    .replace(/(\n\s*startBlock:\s*)\d+/i, "$10");

  if (updated === original) {
    console.warn(`No changes made in ${target.file}`);
  } else {
    fs.writeFileSync(target.file, updated, "utf8");
    console.log(`Updated ${target.file}`);
  }
}

console.log("Local subgraph manifests synced from smart-contracts/deployments/localhost-addresses.json");
