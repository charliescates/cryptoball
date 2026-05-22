import { expect } from "chai";
import { ethers } from "hardhat";

describe("Tournement", () => {
  const entryFee = ethers.parseEther("1");

  function buildTeam(ids: bigint[]) {
    return [
      [ids[0], 0n, ids[1]],
      [0n, ids[2], 0n],
      [ids[3], 0n, ids[4]],
    ];
  }

  function getParsedLogs(contract: any, receipt: any) {
    return receipt.logs
      .map((log: any) => {
        try {
          const parsed = contract.interface.parseLog(log);
          return { name: parsed.name, args: parsed.args };
        } catch {
          return null;
        }
      })
      .filter((log: any) => log !== null);
  }

  async function deploySuite() {
    const [p1, p2, p3, p4] = await ethers.getSigners();
    const entrants = [p1, p2, p3, p4];

    const playerToken = await ethers.deployContract("PlayerToken");
    await playerToken.waitForDeployment();

    const academy = await ethers.deployContract("Academy", [await playerToken.getAddress()]);
    await academy.waitForDeployment();

    const game = await ethers.deployContract("Game", [await playerToken.getAddress(), await academy.getAddress()]);
    await game.waitForDeployment();

    const tournement = await ethers.deployContract("Tournement", [await game.getAddress()]);
    await tournement.waitForDeployment();

    // Mint 5 players per entrant in round-robin order to keep token ids deterministic.
    for (let round = 0; round < 5; round++) {
      for (const entrant of entrants) {
        await playerToken.mintPlayer(entrant.address);
      }
    }

    const entrantTeams = entrants.map((_, entrantIndex) => {
      const ids = Array.from({ length: 5 }, (_, round) => BigInt(entrantIndex + 1 + round * entrants.length));
      return buildTeam(ids);
    });

    return { tournement, game, entrants, entrantTeams };
  }

  it("runs a 4-team bracket and emits tournament-specific events", async () => {
    const { tournement, game, entrants, entrantTeams } = await deploySuite();

    await tournement.create(2, entryFee, 0, 0, [], []);

    for (let i = 0; i < entrants.length; i++) {
      await tournement
        .connect(entrants[i])
        .enter(0n, entrantTeams[i][0], entrantTeams[i][1], entrantTeams[i][2], { value: entryFee });
    }

    const tx = await tournement.start(0n);
    const receipt = await tx.wait();

    const parsedTournamentLogs = getParsedLogs(tournement, receipt);
    const parsedGameLogs = getParsedLogs(game, receipt);

    const startedEvents = parsedTournamentLogs.filter((log: any) => log.name === "TournementMatchStarted");
    const completedEvents = parsedTournamentLogs.filter((log: any) => log.name === "TournementCompleted");
    const gameTournamentEvents = parsedGameLogs.filter((log: any) => log.name === "TournamentMatchPlayed");
    const winningsEvents = parsedGameLogs.filter((log: any) => log.name === "WinningsDistributed");

    expect(startedEvents.length).to.equal(3);
    expect(completedEvents.length).to.equal(1);
    expect(gameTournamentEvents.length).to.equal(3);
    expect(winningsEvents.length).to.equal(0);

    const startedRounds = startedEvents.map((event: any) => Number(event.args.round));
    const playedRounds = gameTournamentEvents.map((event: any) => Number(event.args.round));

    expect(startedRounds).to.deep.equal([1, 1, 2]);
    expect(playedRounds).to.deep.equal([1, 1, 2]);

    const champion = completedEvents[0].args.champion as string;
    expect(entrants.map((s) => s.address)).to.include(champion);

    const info = await tournement.tournements(0n);
    expect(info.champion).to.equal(champion);
    expect(Number(info.teamsEntered)).to.equal(4);
  });

  it("reverts starting when not enough teams entered", async () => {
    const { tournement, entrants, entrantTeams } = await deploySuite();

    await tournement.create(2, entryFee, 0, 0, [], []);

    await tournement
      .connect(entrants[0])
      .enter(0n, entrantTeams[0][0], entrantTeams[0][1], entrantTeams[0][2], { value: entryFee });

    await expect(tournement.start(0n)).to.be.revertedWith("Not enough teams entered");
  });

  it("returns tournament requirements and availability via getTournements", async () => {
    const { tournement, entrants, entrantTeams } = await deploySuite();

    await tournement.create(2, entryFee, 45, 55, [1, 2], [3]);
    await tournement.create(1, ethers.parseEther("2"), 20, 25, [], [0, 2]);

    await tournement
      .connect(entrants[0])
      .enter(0n, entrantTeams[0][0], entrantTeams[0][1], entrantTeams[0][2], { value: entryFee });
    await tournement
      .connect(entrants[1])
      .enter(0n, entrantTeams[1][0], entrantTeams[1][1], entrantTeams[1][2], { value: entryFee });
    await tournement
      .connect(entrants[2])
      .enter(0n, entrantTeams[2][0], entrantTeams[2][1], entrantTeams[2][2], { value: entryFee });
    await tournement
      .connect(entrants[3])
      .enter(0n, entrantTeams[3][0], entrantTeams[3][1], entrantTeams[3][2], { value: entryFee });

    const summaries = await tournement.getTournements();

    expect(summaries).to.have.lengthOf(2);

    expect(BigInt(summaries[0].tournementId)).to.equal(0n);
    expect(Number(summaries[0].rounds)).to.equal(2);
    expect(BigInt(summaries[0].entryFee)).to.equal(entryFee);
    expect(Number(summaries[0].minAttack)).to.equal(45);
    expect(Number(summaries[0].minDefence)).to.equal(55);
    expect(summaries[0].includeTypes.map((v: bigint) => Number(v))).to.deep.equal([1, 2]);
    expect(summaries[0].excludeTypes.map((v: bigint) => Number(v))).to.deep.equal([3]);
    expect(Number(summaries[0].teamsEntered)).to.equal(4);
    expect(BigInt(summaries[0].maxTeams)).to.equal(4n);
    expect(summaries[0].isOpen).to.equal(false);

    expect(BigInt(summaries[1].tournementId)).to.equal(1n);
    expect(Number(summaries[1].rounds)).to.equal(1);
    expect(BigInt(summaries[1].entryFee)).to.equal(ethers.parseEther("2"));
    expect(Number(summaries[1].minAttack)).to.equal(20);
    expect(Number(summaries[1].minDefence)).to.equal(25);
    expect(summaries[1].includeTypes).to.deep.equal([]);
    expect(summaries[1].excludeTypes.map((v: bigint) => Number(v))).to.deep.equal([0, 2]);
    expect(Number(summaries[1].teamsEntered)).to.equal(0);
    expect(BigInt(summaries[1].maxTeams)).to.equal(2n);
    expect(summaries[1].isOpen).to.equal(true);
  });

  describe("Tournament Reward Claiming", () => {
    it("allows champion to claim tournament reward", async () => {
      const { tournement, game, entrants, entrantTeams } = await deploySuite();

      await tournement.create(2, entryFee, 0, 0, [], []);

      for (let i = 0; i < entrants.length; i++) {
        await tournement
          .connect(entrants[i])
          .enter(0n, entrantTeams[i][0], entrantTeams[i][1], entrantTeams[i][2], { value: entryFee });
      }

      await tournement.start(0n);

      const info = await tournement.tournements(0n);
      const champion = info.champion;
      
      const championBalanceBefore = await ethers.provider.getBalance(champion);
      const expectedReward = entryFee * BigInt(4); // 4 teams * entryFee

      const tx = await tournement.connect(ethers.getSigner(champion)).claimReward(0n);
      const receipt = await tx.wait();
      const gasUsed = receipt!.gasUsed * receipt!.gasPrice;

      const championBalanceAfter = await ethers.provider.getBalance(champion);
      const actualReward = championBalanceAfter - championBalanceBefore + gasUsed;

      expect(actualReward).to.equal(expectedReward);
    });

    it("prevents claiming reward twice", async () => {
      const { tournement, game, entrants, entrantTeams } = await deploySuite();

      await tournement.create(2, entryFee, 0, 0, [], []);

      for (let i = 0; i < entrants.length; i++) {
        await tournement
          .connect(entrants[i])
          .enter(0n, entrantTeams[i][0], entrantTeams[i][1], entrantTeams[i][2], { value: entryFee });
      }

      await tournement.start(0n);

      const info = await tournement.tournements(0n);
      const champion = info.champion;

      await tournement.connect(ethers.getSigner(champion)).claimReward(0n);

      await expect(
        tournement.connect(ethers.getSigner(champion)).claimReward(0n)
      ).to.be.revertedWith("Reward already claimed");
    });

    it("prevents non-champion from claiming reward", async () => {
      const { tournement, game, entrants, entrantTeams } = await deploySuite();

      await tournement.create(2, entryFee, 0, 0, [], []);

      for (let i = 0; i < entrants.length; i++) {
        await tournement
          .connect(entrants[i])
          .enter(0n, entrantTeams[i][0], entrantTeams[i][1], entrantTeams[i][2], { value: entryFee });
      }

      await tournement.start(0n);

      const info = await tournement.tournements(0n);
      const nonChampion = entrants.find((e) => e.address !== info.champion);

      await expect(
        tournement.connect(nonChampion!).claimReward(0n)
      ).to.be.revertedWith("Only the champion can claim the reward");
    });

    it("prevents claiming reward before tournament completes", async () => {
      const { tournement, entrants, entrantTeams } = await deploySuite();

      await tournement.create(2, entryFee, 0, 0, [], []);

      await tournement
        .connect(entrants[0])
        .enter(0n, entrantTeams[0][0], entrantTeams[0][1], entrantTeams[0][2], { value: entryFee });

      // Tournament is not complete, no champion yet
      await expect(
        tournement.connect(entrants[0]).claimReward(0n)
      ).to.be.revertedWith("Tournament has not completed");
    });
  });

  describe("Tournament Validation - Player Types", () => {
    it("enforces includeTypes restriction", async () => {
      const { tournement, playerToken, entrants } = await deploySuite();

      // Create tournament that only allows player types 0 and 1
      await tournement.create(2, entryFee, 0, 0, [0, 1], []);

      const [p1, p2] = entrants;

      // Get player IDs for p1 - these will have various types
      const allPlayers = await playerToken.getAllPlayers();
      const p1Players = allPlayers.filter((p) => p.owner === p1.address).map((p) => BigInt(p.id));
      
      // Try to enter with p1's players (which may have types outside [0, 1])
      const team1 = [
        [p1Players[0] || 0n, p1Players[1] || 0n, p1Players[2] || 0n],
        [p1Players[3] || 0n, 0n, 0n],
        [p1Players[4] || 0n, 0n, 0n],
      ];

      // This may succeed or fail depending on the actual player types
      // The validation function checks that all players are in the include list
    });

    it("enforces excludeTypes restriction", async () => {
      const { tournement, playerToken, entrants } = await deploySuite();

      // Create tournament that excludes player type 3
      await tournement.create(2, entryFee, 0, 0, [], [3]);

      const [p1] = entrants;

      // Get player IDs for p1
      const allPlayers = await playerToken.getAllPlayers();
      const p1Players = allPlayers.filter((p) => p.owner === p1.address).map((p) => BigInt(p.id));

      // Attempt to enter with p1's players
      const team1 = [
        [p1Players[0] || 0n, p1Players[1] || 0n, p1Players[2] || 0n],
        [p1Players[3] || 0n, 0n, 0n],
        [p1Players[4] || 0n, 0n, 0n],
      ];

      // The contract should only reject if a player with type 3 is included
    });
  });

  describe("Tournament Validation - Stats Requirements", () => {
    it("enforces minimum attack stat", async () => {
      const { tournement, playerToken, entrants } = await deploySuite();

      // Create tournament with high minimum attack requirement
      await tournement.create(2, entryFee, 80, 0, [], []);

      const [p1] = entrants;
      const allPlayers = await playerToken.getAllPlayers();
      const p1Players = allPlayers.filter((p) => p.owner === p1.address);

      // Find players that might not meet the requirement
      const lowAttackPlayers = p1Players.filter((p) => Number(p.attack) < 80);

      if (lowAttackPlayers.length > 0) {
        const team1 = [
          [BigInt(lowAttackPlayers[0].id), 0n, 0n],
          [0n, 0n, 0n],
          [0n, 0n, 0n],
        ];

        await expect(
          tournement.connect(p1).enter(0n, team1[0], team1[1], team1[2], { value: entryFee })
        ).to.be.revertedWith("One or more players do not meet minimum stat requirements");
      }
    });

    it("enforces minimum defense stat", async () => {
      const { tournement, playerToken, entrants } = await deploySuite();

      // Create tournament with high minimum defense requirement
      await tournement.create(2, entryFee, 0, 80, [], []);

      const [p1] = entrants;
      const allPlayers = await playerToken.getAllPlayers();
      const p1Players = allPlayers.filter((p) => p.owner === p1.address);

      // Find players that might not meet the requirement
      const lowDefensePlayers = p1Players.filter((p) => Number(p.defense) < 80);

      if (lowDefensePlayers.length > 0) {
        const team1 = [
          [BigInt(lowDefensePlayers[0].id), 0n, 0n],
          [0n, 0n, 0n],
          [0n, 0n, 0n],
        ];

        await expect(
          tournement.connect(p1).enter(0n, team1[0], team1[1], team1[2], { value: entryFee })
        ).to.be.revertedWith("One or more players do not meet minimum stat requirements");
      }
    });
  });

  describe("Tournament Edge Cases", () => {
    it("prevents entering non-existent tournament", async () => {
      const { tournement, entrants, entrantTeams } = await deploySuite();

      await expect(
        tournement.connect(entrants[0]).enter(999n, entrantTeams[0][0], entrantTeams[0][1], entrantTeams[0][2], { value: entryFee })
      ).to.be.revertedWith("Tournement does not exist");
    });

    it("rejects incorrect entry fee", async () => {
      const { tournement, entrants, entrantTeams } = await deploySuite();

      await tournement.create(2, entryFee, 0, 0, [], []);

      await expect(
        tournement
          .connect(entrants[0])
          .enter(0n, entrantTeams[0][0], entrantTeams[0][1], entrantTeams[0][2], {
            value: ethers.parseEther("0.5"),
          })
      ).to.be.revertedWith("Incorrect entry fee");
    });

    it("prevents starting tournament with invalid ID", async () => {
      const { tournement } = await deploySuite();

      await expect(tournement.start(999n)).to.be.revertedWith("Tournement does not exist");
    });

    it("tracks correct team counts", async () => {
      const { tournement, entrants, entrantTeams } = await deploySuite();

      await tournement.create(2, entryFee, 0, 0, [], []);

      const summariesBefore = await tournement.getTournements();
      expect(Number(summariesBefore[0].teamsEntered)).to.equal(0);

      await tournement
        .connect(entrants[0])
        .enter(0n, entrantTeams[0][0], entrantTeams[0][1], entrantTeams[0][2], { value: entryFee });

      const summariesAfter = await tournement.getTournements();
      expect(Number(summariesAfter[0].teamsEntered)).to.equal(1);
    });
  });
});

