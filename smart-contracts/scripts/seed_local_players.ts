import { ethers, network } from "hardhat";

type ParsedArgs = {
  academyAddress?: string;
  newPlayers: number;
  playersPerBuyer: number;
  buyerOneIndex: number;
  buyerTwoIndex: number;
  depositEth: string;
};

function parseArgs(argv: string[]): ParsedArgs {
  const getArg = (...names: string[]): string | undefined => {
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
  };

  const parsePositiveInt = (value: string | undefined, fallback: number, field: string): number => {
    if (!value) {
      return fallback;
    }

    const parsed = Number(value);
    if (!Number.isInteger(parsed) || parsed <= 0) {
      throw new Error(`${field} must be a positive integer`);
    }

    return parsed;
  };

  return {
    academyAddress: getArg("academy", "academy-address", "academyaddress") ?? process.env.ACADEMY_ADDRESS,
    newPlayers: parsePositiveInt(
      getArg("new-players", "newplayers") ?? process.env.SEED_NEW_PLAYERS,
      100,
      "newPlayers"
    ),
    playersPerBuyer: parsePositiveInt(
      getArg("players-per-buyer", "playersperbuyer") ?? process.env.SEED_PLAYERS_PER_BUYER,
      8,
      "playersPerBuyer"
    ),
    buyerOneIndex: parsePositiveInt(
      getArg("buyer-one-index", "buyeroneindex") ?? process.env.SEED_BUYER_ONE_INDEX,
      1,
      "buyerOneIndex"
    ),
    buyerTwoIndex: parsePositiveInt(
      getArg("buyer-two-index", "buyertwoindex") ?? process.env.SEED_BUYER_TWO_INDEX,
      2,
      "buyerTwoIndex"
    ),
    depositEth: getArg("deposit-eth", "depositeth") ?? process.env.SEED_DEPOSIT_ETH ?? "0.005"
  };
}

async function main() {
  if (network.name !== "localhost" && network.name !== "hardhat") {
    throw new Error(`This script is local-only. Refusing to run on network: ${network.name}`);
  }

  const args = parseArgs(process.argv.slice(2));

  if (!args.academyAddress) {
    throw new Error("Missing academy address. Provide --academy <address> or ACADEMY_ADDRESS env var.");
  }

  const signers = await ethers.getSigners();
  if (args.buyerOneIndex >= signers.length || args.buyerTwoIndex >= signers.length) {
    throw new Error("Buyer signer index is out of range for available local signers");
  }

  const depositor = signers[0];
  const buyerOne = signers[args.buyerOneIndex];
  const buyerTwo = signers[args.buyerTwoIndex];

  const academy: any = await ethers.getContractAt("Academy", args.academyAddress);
  const depositAmount = ethers.parseEther(args.depositEth);

  console.log(`Network: ${network.name}`);
  console.log(`Academy: ${args.academyAddress}`);
  console.log(`Depositor: ${depositor.address}`);
  console.log(`Buyer 1 (index ${args.buyerOneIndex}): ${buyerOne.address}`);
  console.log(`Buyer 2 (index ${args.buyerTwoIndex}): ${buyerTwo.address}`);
  console.log(`Target new players: ${args.newPlayers}`);
  console.log(`Players per buyer: ${args.playersPerBuyer}`);
  console.log(`Deposit amount per mint tx: ${args.depositEth} ETH`);

  for (let i = 1; i <= args.newPlayers; i++) {
    const tx = await academy.connect(depositor).deposit({ value: depositAmount });
    await tx.wait();

    if (i % 10 === 0 || i === args.newPlayers) {
      console.log(`Mint progress: ${i}/${args.newPlayers} deposits complete`);
    }
  }

  const academyPlayers: Array<{ id: bigint; value: bigint }> = await academy.getAcademyPlayers();
  const totalNeeded = args.playersPerBuyer * 2;
  if (academyPlayers.length < totalNeeded) {
    throw new Error(
      `Not enough academy players to buy. Need ${totalNeeded}, found ${academyPlayers.length}`
    );
  }

  const sortedByValue = [...academyPlayers].sort((a, b) => {
    if (a.value < b.value) {
      return -1;
    }
    if (a.value > b.value) {
      return 1;
    }
    return 0;
  });

  const boughtByBuyerOne: bigint[] = [];
  const boughtByBuyerTwo: bigint[] = [];

  let cursor = 0;
  let spentBuyerOne = 0n;
  let spentBuyerTwo = 0n;

  const buyFor = async (
    buyer: { address: string },
    purchases: bigint[],
    currentSpent: bigint,
    label: string
  ): Promise<bigint> => {
    let spent = currentSpent;
    for (let i = 0; i < args.playersPerBuyer; i++) {
      const playerId = sortedByValue[cursor].id;
      cursor += 1;

      const price: bigint = await academy.getPlayerValue(playerId);
      const tx = await academy.connect(buyer).buyPlayer(buyer.address, playerId, { value: price });
      await tx.wait();

      purchases.push(playerId);
      spent += price;
      console.log(`${label} bought player ${playerId.toString()} for ${ethers.formatEther(price)} ETH`);
    }

    return spent;
  };

  spentBuyerOne = await buyFor(buyerOne, boughtByBuyerOne, spentBuyerOne, "Buyer 1");
  spentBuyerTwo = await buyFor(buyerTwo, boughtByBuyerTwo, spentBuyerTwo, "Buyer 2");

  console.log("\nSeeding complete.");
  console.log(`Buyer 1 IDs: ${boughtByBuyerOne.map((id) => id.toString()).join(", ")}`);
  console.log(`Buyer 2 IDs: ${boughtByBuyerTwo.map((id) => id.toString()).join(", ")}`);
  console.log(`Buyer 1 total spent: ${ethers.formatEther(spentBuyerOne)} ETH`);
  console.log(`Buyer 2 total spent: ${ethers.formatEther(spentBuyerTwo)} ETH`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});