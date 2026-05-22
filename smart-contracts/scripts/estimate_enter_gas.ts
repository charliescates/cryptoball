import { ethers } from "hardhat";

const TOURNEMENT_ADDRESS = process.env.TOURNEMENT_CONTRACT_ADDRESS || "0x3EE3D991B977f8Ee569e345D9ef615b762973901";
const PLAYER_ADDRESS = process.env.PLAYER_CONTRACT_ADDRESS || "0x818cAFC9e8AE9fa9b4503772AeF90b00adE9E027";

const TOURNEMENT_ABI = [
  "function getTournements() view returns ((uint256 tournementId,uint8 rounds,uint256 entryFee,uint8 minAttack,uint8 minDefence,uint8 maxAttack,uint8 maxDefence,uint8[] includeTypes,uint8[] excludeTypes,uint8 teamsEntered,uint256 maxTeams,bool isOpen,address champion)[] summaries)",
  "function enter(uint256 tournementId,uint256[3] attackingPlayers,uint256[3] midfieldPlayers,uint256[3] defensivePlayers) payable",
] as const;

const PLAYER_ABI = [
  "function getPlayersByOwner(address owner) view returns ((uint256 id,uint256 originalAttack,uint256 attack,uint256 originalDefense,uint256 defense,uint256 potential,uint256 gamesLeft,uint256 goalsScored,uint256 playerType)[])",
  "function ownerOf(uint256 tokenId) view returns (address)",
] as const;

function formatPol(wei: bigint): string {
  return `${ethers.formatEther(wei)} POL`;
}

async function main() {
  const [signer] = await ethers.getSigners();
  const signerAddress = await signer.getAddress();

  const tournement = new ethers.Contract(TOURNEMENT_ADDRESS, TOURNEMENT_ABI, signer);
  const player = new ethers.Contract(PLAYER_ADDRESS, PLAYER_ABI, signer);

  const tournaments = await tournement.getTournements();
  const openTournaments = tournaments.filter((t: any) => Boolean(t.isOpen));

  if (openTournaments.length === 0) {
    throw new Error("No open tournaments found for estimation.");
  }

  const players = await player.getPlayersByOwner(signerAddress);
  const rawPlayerIds: bigint[] = players.map((p: any) => BigInt(p.id)).filter((id: bigint) => id !== 0n);
  const playerIds: bigint[] = [];
  for (const id of rawPlayerIds) {
    const owner = (await player.ownerOf(id)).toLowerCase();
    if (owner === signerAddress.toLowerCase()) {
      playerIds.push(id);
    }
  }
  console.log(`Signer has ${rawPlayerIds.length} IDs in getPlayersByOwner and ${playerIds.length} currently owned by ownerOf`);

  if (playerIds.length < 5) {
    throw new Error(`Signer ${signerAddress} only has ${playerIds.length} players; need at least 5 for enter().`);
  }

  // Game._validateTeam currently requires exactly 5 non-zero player IDs.
  const attacking: [bigint, bigint, bigint] = [playerIds[0], playerIds[1], playerIds[2]];
  const midfield: [bigint, bigint, bigint] = [playerIds[3], playerIds[4], 0n];
  const defensive: [bigint, bigint, bigint] = [0n, 0n, 0n];

  let selectedTournament: any | null = null;
  let gasEstimate: bigint | null = null;
  let entryFee = 0n;
  let tournementId = 0n;
  const failures: Array<{ id: string; reason: string }> = [];

  for (const t of openTournaments) {
    const tId = BigInt(t.tournementId);
    const tEntryFee = BigInt(t.entryFee);
    try {
      const estimate = await tournement.enter.estimateGas(
        tId,
        attacking,
        midfield,
        defensive,
        { value: tEntryFee }
      );
      selectedTournament = t;
      gasEstimate = estimate;
      entryFee = tEntryFee;
      tournementId = tId;
      break;
    } catch {
      try {
        await tournement.enter.staticCall(
          tId,
          attacking,
          midfield,
          defensive,
          { value: tEntryFee }
        );
      } catch (err: any) {
        const reason = err?.shortMessage || err?.reason || err?.message || "Unknown revert";
        failures.push({ id: tId.toString(), reason });
      }
    }
  }

  if (!selectedTournament || gasEstimate === null) {
    if (failures.length > 0) {
      console.log("Failed tournaments and reasons:");
      for (const f of failures) {
        console.log(`- tournament ${f.id}: ${f.reason}`);
      }
    }
    throw new Error("No open tournament accepted this 5-player lineup for gas estimation.");
  }

  const feeData = await ethers.provider.getFeeData();
  const gasPrice = feeData.gasPrice ?? 0n;
  const maxFeePerGas = feeData.maxFeePerGas ?? gasPrice;

  const gasCostAtGasPrice = gasEstimate * gasPrice;
  const gasCostAtMaxFee = gasEstimate * maxFeePerGas;

  console.log("--- Tournament Enter Gas Estimate ---");
  console.log(`Network chainId: ${(await ethers.provider.getNetwork()).chainId}`);
  console.log(`Signer: ${signerAddress}`);
  console.log(`Tournament: ${TOURNEMENT_ADDRESS}`);
  console.log(`PlayerToken: ${PLAYER_ADDRESS}`);
  console.log(`Selected tournamentId: ${tournementId.toString()}`);
  console.log(`Entry fee (tx value): ${formatPol(entryFee)}`);
  console.log(`Estimated gas units: ${gasEstimate.toString()}`);
  console.log(`gasPrice: ${gasPrice.toString()} wei`);
  console.log(`maxFeePerGas: ${maxFeePerGas.toString()} wei`);
  console.log(`Estimated gas cost @ gasPrice: ${formatPol(gasCostAtGasPrice)}`);
  console.log(`Estimated gas cost @ maxFeePerGas: ${formatPol(gasCostAtMaxFee)}`);
  console.log(`Estimated total @ gasPrice (value + fee): ${formatPol(entryFee + gasCostAtGasPrice)}`);
  console.log(`Estimated total @ maxFeePerGas (value + fee): ${formatPol(entryFee + gasCostAtMaxFee)}`);
}

main().catch((error) => {
  console.error("Gas estimation failed:", error);
  process.exitCode = 1;
});
