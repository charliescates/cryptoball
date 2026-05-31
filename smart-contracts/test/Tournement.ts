import { expect } from "chai";
import { ethers } from "hardhat";

describe("Tournement", () => {
  const entryFee = ethers.parseEther("3");

  function buildTeam(ids: bigint[]) {
    return [
      [ids[0], 0n, ids[1]],
      [0n, ids[2], 0n],
      [ids[3], 0n, ids[4]],
    ] as const;
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

  async function getPlayerRowsForOwner(playerToken: any, owner: string) {
    return playerToken.getPlayersByOwner(owner);
  }

  async function ensureDistinctTypes(playerToken: any, owner: string, targetDistinct = 2) {
    let players = await getPlayerRowsForOwner(playerToken, owner);

    for (let i = 0; i < 20; i++) {
      const distinct = new Set(players.map((p: any) => Number(p.playerType)));
      if (distinct.size >= targetDistinct) {
        return players;
      }
      await playerToken.mintPlayer(owner);
      players = await getPlayerRowsForOwner(playerToken, owner);
    }

    return players;
  }

  async function deploySuite() {
    const [p1, p2, p3, p4] = await ethers.getSigners();
    const entrants = [p1, p2, p3, p4];

    const playerToken: any = await ethers.deployContract("PlayerToken");
    await playerToken.waitForDeployment();

    const academy: any = await ethers.deployContract("Academy", [await playerToken.getAddress()]);
    await academy.waitForDeployment();

    const game: any = await ethers.deployContract("Game", [await playerToken.getAddress(), await academy.getAddress()]);
    await game.waitForDeployment();

    const tournement: any = await ethers.deployContract("Tournement", [await game.getAddress()]);
    await tournement.waitForDeployment();

    await game.setTournamentContract(await tournement.getAddress());

    // Mint 5 players per entrant in round-robin order so each entrant has a valid base team.
    for (let round = 0; round < 5; round++) {
      for (const entrant of entrants) {
        await playerToken.mintPlayer(entrant.address);
      }
    }

    const entrantTeams: Array<readonly [readonly [bigint, bigint, bigint], readonly [bigint, bigint, bigint], readonly [bigint, bigint, bigint]]> = [];
    for (const entrant of entrants) {
      const players = await getPlayerRowsForOwner(playerToken, entrant.address);
      const ids = players.slice(0, 5).map((p: any) => BigInt(p.id));
      entrantTeams.push(buildTeam(ids));
    }

    return { tournement, game, playerToken, entrants, entrantTeams };
  }

  it("runs a 4-team bracket and emits tournament-specific events", async () => {
    const { tournement, game, entrants, entrantTeams } = await deploySuite();

    await tournement.create(2, entryFee, 0, 0, 0, 0, [], []);

    for (let i = 0; i < entrants.length; i++) {
      await tournement
        .connect(entrants[i])
        .enter(0n, entrantTeams[i][0], entrantTeams[i][1], entrantTeams[i][2], { value: entryFee });
    }

    const txRound1 = await tournement.start(0n);
    const receiptRound1 = await txRound1.wait();
    const txRound2 = await tournement.start(0n);
    const receiptRound2 = await txRound2.wait();

    const parsedTournamentLogs = [...getParsedLogs(tournement, receiptRound1), ...getParsedLogs(tournement, receiptRound2)];
    const parsedGameLogs = [...getParsedLogs(game, receiptRound1), ...getParsedLogs(game, receiptRound2)];

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

    const prizePot = entryFee * 4n;
    const executorFee = await tournement.tournementExecutorFees(0n);
    const expectedChampionWinnings = prizePot - executorFee;

    expect(BigInt(completedEvents[0].args.championWinnings)).to.equal(expectedChampionWinnings);

    const winningTeam = completedEvents[0].args.winningTeam;
    const championIndex = entrants.findIndex((s) => s.address === champion);
    expect(championIndex).to.not.equal(-1);
    const expectedTeam = entrantTeams[championIndex];

    expect((winningTeam.attackingPlayers as bigint[]).map((v: bigint) => BigInt(v))).to.deep.equal(expectedTeam[0]);
    expect((winningTeam.midfieldPlayers as bigint[]).map((v: bigint) => BigInt(v))).to.deep.equal(expectedTeam[1]);
    expect((winningTeam.defensivePlayers as bigint[]).map((v: bigint) => BigInt(v))).to.deep.equal(expectedTeam[2]);

    const expectedPlayerIds = [...expectedTeam[0], ...expectedTeam[1], ...expectedTeam[2]].filter((id) => id !== 0n);
    const expectedWinningTeamPlayers = [] as Array<{ playerId: bigint; attack: bigint; defense: bigint; playerType: number }>;

    for (const playerId of expectedPlayerIds) {
      const attrs = await game.getPlayerAttributes(playerId);
      expectedWinningTeamPlayers.push({
        playerId: BigInt(playerId),
        attack: BigInt(attrs[1]),
        defense: BigInt(attrs[3]),
        playerType: Number(attrs[7]),
      });
    }

    const winningTeamPlayers = (completedEvents[0].args.winningTeamPlayers as any[]).map((player: any) => ({
      playerId: BigInt(player.playerId ?? player[0]),
      attack: BigInt(player.attack ?? player[1]),
      defense: BigInt(player.defense ?? player[2]),
      playerType: Number(player.playerType ?? player[3]),
    }));

    expect(winningTeamPlayers).to.deep.equal(expectedWinningTeamPlayers);

    const info = await tournement.tournements(0n);
    expect(info.champion).to.equal(champion);
    expect(Number(info.teamsEntered)).to.equal(4);
    expect(await tournement.tournementMatchCounts(0n)).to.equal(3n);
  });

  it("prevents starting when not enough teams entered", async () => {
    const { tournement, entrants, entrantTeams } = await deploySuite();

    await tournement.create(2, entryFee, 0, 0, 0, 0, [], []);
    await tournement
      .connect(entrants[0])
      .enter(0n, entrantTeams[0][0], entrantTeams[0][1], entrantTeams[0][2], { value: entryFee });

    await expect(tournement.start(0n)).to.be.revertedWith("Not enough teams entered");
  });

  it("prevents starting the same tournament twice", async () => {
    const { tournement, entrants, entrantTeams } = await deploySuite();

    await tournement.create(2, entryFee, 0, 0, 0, 0, [], []);
    for (let i = 0; i < entrants.length; i++) {
      await tournement
        .connect(entrants[i])
        .enter(0n, entrantTeams[i][0], entrantTeams[i][1], entrantTeams[i][2], { value: entryFee });
    }

    await tournement.start(0n);
    await tournement.start(0n);

    await expect(tournement.start(0n)).to.be.revertedWith("Tournament already completed");
  });

  it("returns tournament requirements and availability via getTournements", async () => {
    const { tournement, entrants, entrantTeams } = await deploySuite();

    await tournement.create(2, entryFee, 0, 0, 0, 0, [], []);
    await tournement.create(1, ethers.parseEther("4"), 20, 25, 90, 90, [1, 2], [3]);

    for (let i = 0; i < entrants.length; i++) {
      await tournement
        .connect(entrants[i])
        .enter(0n, entrantTeams[i][0], entrantTeams[i][1], entrantTeams[i][2], { value: entryFee });
    }

    const summaries = await tournement.getTournements();
    expect(summaries).to.have.lengthOf(2);

    expect(BigInt(summaries[0].tournamentId)).to.equal(0n);
    expect(Number(summaries[0].rounds)).to.equal(2);
    expect(BigInt(summaries[0].entryFee)).to.equal(entryFee);
    expect(Number(summaries[0].minAttack)).to.equal(0);
    expect(Number(summaries[0].minDefence)).to.equal(0);
    expect(summaries[0].includeTypes).to.deep.equal([]);
    expect(summaries[0].excludeTypes).to.deep.equal([]);
    expect(Number(summaries[0].teamsEntered)).to.equal(4);
    expect(BigInt(summaries[0].maxTeams)).to.equal(4n);
    expect(summaries[0].isOpen).to.equal(false);

    expect(BigInt(summaries[1].tournamentId)).to.equal(1n);
    expect(Number(summaries[1].rounds)).to.equal(1);
    expect(BigInt(summaries[1].entryFee)).to.equal(ethers.parseEther("4"));
    expect(Number(summaries[1].minAttack)).to.equal(20);
    expect(Number(summaries[1].minDefence)).to.equal(25);
    expect(Number(summaries[1].maxAttack)).to.equal(90);
    expect(Number(summaries[1].maxDefence)).to.equal(90);
    expect(summaries[1].includeTypes.map((v: bigint) => Number(v))).to.deep.equal([1, 2]);
    expect(summaries[1].excludeTypes.map((v: bigint) => Number(v))).to.deep.equal([3]);
    expect(Number(summaries[1].teamsEntered)).to.equal(0);
    expect(BigInt(summaries[1].maxTeams)).to.equal(2n);
    expect(summaries[1].isOpen).to.equal(true);
  });

  it("updates isOpen from true to false when a tournament completes", async () => {
    const { tournement, entrants, entrantTeams } = await deploySuite();

    await tournement.create(2, entryFee, 0, 0, 0, 0, [], []);

    let summaries = await tournement.getTournements();
    expect(summaries).to.have.lengthOf(1);
    expect(summaries[0].isOpen).to.equal(true);

    for (let i = 0; i < entrants.length; i++) {
      await tournement
        .connect(entrants[i])
        .enter(0n, entrantTeams[i][0], entrantTeams[i][1], entrantTeams[i][2], { value: entryFee });
    }

    summaries = await tournement.getTournements();
    expect(summaries[0].isOpen).to.equal(false);

    await tournement.start(0n);
    await tournement.start(0n);

    summaries = await tournement.getTournements();
    expect(summaries).to.have.lengthOf(0);
  });

  describe("Tournament Reward Claiming", () => {
    it("allows champion to claim tournament reward once", async () => {
      const { tournement, entrants, entrantTeams } = await deploySuite();

      await tournement.create(2, entryFee, 0, 0, 0, 0, [], []);

      for (let i = 0; i < entrants.length; i++) {
        await tournement
          .connect(entrants[i])
          .enter(0n, entrantTeams[i][0], entrantTeams[i][1], entrantTeams[i][2], { value: entryFee });
      }

      await tournement.start(0n);
      await tournement.start(0n);

      const info = await tournement.tournements(0n);
      const championSigner = await ethers.getSigner(info.champion);

      const championBalanceBefore = await ethers.provider.getBalance(info.champion);
      const prizePot = entryFee * 4n;
      const executorFee = await tournement.tournementExecutorFees(0n);
      const expectedReward = prizePot - executorFee;

      const tx = await tournement.connect(championSigner).claimReward(0n);
      const receipt = await tx.wait();
      const gasPaid = receipt!.gasUsed * BigInt(receipt!.gasPrice);

      const championBalanceAfter = await ethers.provider.getBalance(info.champion);
      const netReceived = championBalanceAfter - championBalanceBefore + gasPaid;

      expect(netReceived).to.equal(expectedReward);
      await expect(tournement.connect(championSigner).claimReward(0n)).to.be.revertedWith("Reward already claimed");
    });

    it("prevents non-champion from claiming reward", async () => {
      const { tournement, entrants, entrantTeams } = await deploySuite();

      await tournement.create(2, entryFee, 0, 0, 0, 0, [], []);
      for (let i = 0; i < entrants.length; i++) {
        await tournement
          .connect(entrants[i])
          .enter(0n, entrantTeams[i][0], entrantTeams[i][1], entrantTeams[i][2], { value: entryFee });
      }

      await tournement.start(0n);
      await tournement.start(0n);
      const info = await tournement.tournements(0n);
      const nonChampion = entrants.find((e) => e.address !== info.champion)!;

      await expect(tournement.connect(nonChampion).claimReward(0n)).to.be.revertedWith("Only the champion can claim the reward");
    });

    it("prevents claiming reward before tournament completion", async () => {
      const { tournement, entrants, entrantTeams } = await deploySuite();

      await tournement.create(2, entryFee, 0, 0, 0, 0, [], []);
      await tournement
        .connect(entrants[0])
        .enter(0n, entrantTeams[0][0], entrantTeams[0][1], entrantTeams[0][2], { value: entryFee });

      await expect(tournement.connect(entrants[0]).claimReward(0n)).to.be.revertedWith("Tournament has not completed");
    });
  });

  describe("Tournament Validation - Player Types", () => {
    it("rejects conflicting include and exclude type rules at create time", async () => {
      const { tournement } = await deploySuite();

      await expect(
        tournement.create(2, entryFee, 0, 0, 0, 0, [1], [1])
      ).to.be.revertedWith("Type cannot be both included and excluded");
    });

    it("enforces includeTypes restriction", async () => {
      const { tournement, playerToken, entrants } = await deploySuite();
      const owner = entrants[0].address;

      const players = await ensureDistinctTypes(playerToken, owner, 2);
      const allowedType = Number(players[0].playerType);
      const disallowed = players.find((p: any) => Number(p.playerType) !== allowedType);
      expect(disallowed).to.not.equal(undefined);

      const remainingAllowed = players.filter(
        (p: any) => BigInt(p.id) !== BigInt(players[0].id) && BigInt(p.id) !== BigInt(disallowed!.id)
      );
      expect(remainingAllowed.length).to.be.gte(3);

      const ids = [
        BigInt(players[0].id),
        BigInt(disallowed!.id),
        BigInt(remainingAllowed[0].id),
        BigInt(remainingAllowed[1].id),
        BigInt(remainingAllowed[2].id),
      ];

      const team = buildTeam(ids);

      await tournement.create(2, entryFee, 0, 0, 0, 0, [allowedType], []);
      await expect(
        tournement.connect(entrants[0]).enter(0n, team[0], team[1], team[2], { value: entryFee })
      ).to.be.revertedWith("Player type not included in this tournament");
    });

    it("enforces excludeTypes restriction", async () => {
      const { tournement, playerToken, entrants } = await deploySuite();
      const players = await getPlayerRowsForOwner(playerToken, entrants[0].address);

      const bannedType = Number(players[0].playerType);
      const ids = players.slice(0, 5).map((p: any) => BigInt(p.id));
      const team = buildTeam(ids);

      await tournement.create(2, entryFee, 0, 0, 0, 0, [], [bannedType]);
      await expect(
        tournement.connect(entrants[0]).enter(0n, team[0], team[1], team[2], { value: entryFee })
      ).to.be.revertedWith("Player type not allowed in this tournament");
    });
  });

  describe("Tournament Validation - Stats Requirements", () => {
    it("enforces minimum attack requirement", async () => {
      const { tournement, playerToken, entrants } = await deploySuite();
      const players = await getPlayerRowsForOwner(playerToken, entrants[0].address);
      const ids = players.slice(0, 5).map((p: any) => BigInt(p.id));
      const team = buildTeam(ids);

      const maxAttackInTeam = players.slice(0, 5).reduce((acc: number, p: any) => Math.max(acc, Number(p.attack)), 0);
      const minAttack = maxAttackInTeam + 1;

      await tournement.create(2, entryFee, minAttack, 0, 0, 0, [], []);
      await expect(
        tournement.connect(entrants[0]).enter(0n, team[0], team[1], team[2], { value: entryFee })
      ).to.be.revertedWith("One or more players do not meet stat requirements");
    });

    it("enforces maximum defence requirement", async () => {
      const { tournement, playerToken, entrants } = await deploySuite();
      const players = await getPlayerRowsForOwner(playerToken, entrants[0].address);
      const ids = players.slice(0, 5).map((p: any) => BigInt(p.id));
      const team = buildTeam(ids);

      const minDefenceInTeam = players.slice(0, 5).reduce((acc: number, p: any) => Math.min(acc, Number(p.defense)), Number(players[0].defense));
      const maxDefence = minDefenceInTeam - 1;

      await tournement.create(2, entryFee, 0, 0, 0, maxDefence, [], []);
      await expect(
        tournement.connect(entrants[0]).enter(0n, team[0], team[1], team[2], { value: entryFee })
      ).to.be.revertedWith("One or more players do not meet stat requirements");
    });
  });

  describe("Tournament Config Validation", () => {
    it("rejects invalid round bounds", async () => {
      const { tournement } = await deploySuite();

      await expect(tournement.create(0, entryFee, 0, 0, 0, 0, [], [])).to.be.revertedWith("Rounds must be between 1 and 7");
      await expect(tournement.create(8, entryFee, 0, 0, 0, 0, [], [])).to.be.revertedWith("Rounds must be between 1 and 7");
    });

    it("rejects entry fee below the minimum", async () => {
      const { tournement } = await deploySuite();

      await expect(
        tournement.create(2, ethers.parseEther("2.99"), 0, 0, 0, 0, [], [])
      ).to.be.revertedWith("Minimum entry fee is 3 POL");
    });

    it("rejects invalid stat ranges", async () => {
      const { tournement } = await deploySuite();

      await expect(
        tournement.create(2, entryFee, 70, 0, 60, 0, [], [])
      ).to.be.revertedWith("Invalid attack range");

      await expect(
        tournement.create(2, entryFee, 0, 70, 0, 60, [], [])
      ).to.be.revertedWith("Invalid defence range");
    });

    it("rejects invalid player types in include/exclude lists", async () => {
      const { tournement } = await deploySuite();

      await expect(
        tournement.create(2, entryFee, 0, 0, 0, 0, [4], [])
      ).to.be.revertedWith("Invalid player type");

      await expect(
        tournement.create(2, entryFee, 0, 0, 0, 0, [], [9])
      ).to.be.revertedWith("Invalid player type");
    });
  });

  describe("Tournament Edge Cases", () => {
    it("emits TournementReady when final team enters", async () => {
      const { tournement, entrants, entrantTeams } = await deploySuite();

      await tournement.create(2, entryFee, 0, 0, 0, 0, [], []);

      for (let i = 0; i < entrants.length - 1; i++) {
        await tournement
          .connect(entrants[i])
          .enter(0n, entrantTeams[i][0], entrantTeams[i][1], entrantTeams[i][2], { value: entryFee });
      }

      const tx = await tournement
        .connect(entrants[entrants.length - 1])
        .enter(0n, entrantTeams[entrants.length - 1][0], entrantTeams[entrants.length - 1][1], entrantTeams[entrants.length - 1][2], { value: entryFee });
      const receipt = await tx.wait();
      const parsedLogs = getParsedLogs(tournement, receipt);
      const readyEvent = parsedLogs.find((log: any) => log.name === "TournementReady");

      expect(readyEvent).to.not.equal(undefined);
      expect(Number(readyEvent.args.teamsCount)).to.equal(4);
    });

    it("allows creator to cancel an unstarted tournament and entrants to claim refunds", async () => {
      const { tournement, entrants, entrantTeams } = await deploySuite();

      await tournement.create(2, entryFee, 0, 0, 0, 0, [], []);
      await tournement
        .connect(entrants[0])
        .enter(0n, entrantTeams[0][0], entrantTeams[0][1], entrantTeams[0][2], { value: entryFee });

      await tournement.cancel(0n);

      const balanceBefore = await ethers.provider.getBalance(entrants[0].address);
      const tx = await tournement.connect(entrants[0]).claimCancelledEntry(0n);
      const receipt = await tx.wait();
      const gasPaid = receipt!.gasUsed * BigInt(receipt!.gasPrice);
      const balanceAfter = await ethers.provider.getBalance(entrants[0].address);

      expect(balanceAfter - balanceBefore + gasPaid).to.equal(entryFee);
      await expect(tournement.connect(entrants[0]).claimCancelledEntry(0n)).to.be.revertedWith("Entry already refunded");
    });

    it("blocks non-creator cancel attempts", async () => {
      const { tournement, entrants } = await deploySuite();

      await tournement.create(2, entryFee, 0, 0, 0, 0, [], []);
      await expect(tournement.connect(entrants[1]).cancel(0n)).to.be.revertedWith("Only creator can cancel");
    });

    it("prevents entering non-existent tournament", async () => {
      const { tournement, entrants, entrantTeams } = await deploySuite();

      await expect(
        tournement.connect(entrants[0]).enter(999n, entrantTeams[0][0], entrantTeams[0][1], entrantTeams[0][2], { value: entryFee })
      ).to.be.revertedWith("Tournement does not exist");
    });

    it("rejects incorrect entry fee", async () => {
      const { tournement, entrants, entrantTeams } = await deploySuite();

      await tournement.create(2, entryFee, 0, 0, 0, 0, [], []);
      await expect(
        tournement.connect(entrants[0]).enter(0n, entrantTeams[0][0], entrantTeams[0][1], entrantTeams[0][2], {
          value: ethers.parseEther("1"),
        })
      ).to.be.revertedWith("Incorrect entry fee");
    });

    it("prevents duplicate entries by the same address", async () => {
      const { tournement, entrants, entrantTeams } = await deploySuite();

      await tournement.create(2, entryFee, 0, 0, 0, 0, [], []);
      await tournement
        .connect(entrants[0])
        .enter(0n, entrantTeams[0][0], entrantTeams[0][1], entrantTeams[0][2], { value: entryFee });

      await expect(
        tournement.connect(entrants[0]).enter(0n, entrantTeams[0][0], entrantTeams[0][1], entrantTeams[0][2], { value: entryFee })
      ).to.be.revertedWith("Already entered");
    });

    it("prevents starting or claiming with invalid tournament id", async () => {
      const { tournement, entrants } = await deploySuite();

      await expect(tournement.start(999n)).to.be.revertedWith("Tournement does not exist");
      await expect(tournement.connect(entrants[0]).claimReward(999n)).to.be.revertedWith("Tournement does not exist");
    });
  });
});
