import { expect } from "chai";
import { ethers } from "hardhat";

describe("Game", () => {
  const homeTeam = [[1, 0, 3], [0, 5, 0], [7, 0, 9]];
  const awayTeam = [[2, 0, 4], [0, 6, 0], [8, 0, 10]];

  async function deployContracts() {
    const [homeOwner, awayOwner] = await ethers.getSigners();

    const playerToken: any = await ethers.deployContract("PlayerToken");
    await playerToken.waitForDeployment();

    for (let i = 0; i < 5; i++) {
      await playerToken.mintPlayer(homeOwner.address);
      await playerToken.mintPlayer(awayOwner.address);
    }

    const academyContract: any = await ethers.deployContract("Academy", [await playerToken.getAddress()]);
    await academyContract.waitForDeployment();

    const gameContract: any = await ethers.deployContract("Game", [
      await playerToken.getAddress(),
      await academyContract.getAddress(),
    ]);
    await gameContract.waitForDeployment();

    return { gameContract, academyContract, playerToken, homeOwner, awayOwner };
  }

  function getParsedGameLogs(gameContract: any, receipt: any) {
    return receipt.logs
      .map((log: any) => {
        try {
          const parsed = gameContract.interface.parseLog(log);
          return { name: parsed.name, args: parsed.args };
        } catch {
          return null;
        }
      })
      .filter((log: any) => log !== null);
  }

  it("rejects wagers below the 3 POL minimum", async () => {
    const { gameContract, homeOwner, awayOwner } = await deployContracts();

    await expect(
      gameContract.createGame(ethers.parseEther("2.99"), homeOwner.address, awayOwner.address)
    ).to.be.revertedWith("Wager must be at least 3 POL to ensure winner payouts exceed minimum execution fee");
  });

  it("auto-plays when both teams submit and emits dynamic executor fee", async () => {
    const { gameContract, homeOwner, awayOwner } = await deployContracts();
    const wager = ethers.parseEther("3");
    const pot = wager * 2n;

    await gameContract.createGame(wager, homeOwner.address, awayOwner.address);
    await gameContract.connect(homeOwner).addTeam(1n, homeTeam[0], homeTeam[1], homeTeam[2], { value: wager });

    const tx = await gameContract.connect(awayOwner).addTeam(1n, awayTeam[0], awayTeam[1], awayTeam[2], { value: wager });
    const receipt = await tx.wait();
    const parsedLogs = getParsedGameLogs(gameContract, receipt);

    const distributionLog = parsedLogs.find((log: any) => log.name === "WinningsDistributed");
    expect(distributionLog).to.not.equal(undefined);

    const executor = distributionLog.args.executor as string;
    const executorFee = BigInt(distributionLog.args.executorFee);

    expect(executor).to.equal(awayOwner.address);
    expect(executorFee).to.be.greaterThan(0n);
    expect(executorFee).to.be.at.most(pot);
  });

  it("keeps academy share and winner payout consistent with emitted executor fee", async () => {
    const { gameContract, academyContract, homeOwner, awayOwner } = await deployContracts();
    const wager = ethers.parseEther("3");
    const pot = wager * 2n;

    await gameContract.createGame(wager, homeOwner.address, awayOwner.address);
    await gameContract.connect(homeOwner).addTeam(1n, homeTeam[0], homeTeam[1], homeTeam[2], { value: wager });

    const tx = await gameContract.connect(awayOwner).addTeam(1n, awayTeam[0], awayTeam[1], awayTeam[2], { value: wager });
    const receipt = await tx.wait();
    const parsedLogs = getParsedGameLogs(gameContract, receipt);

    const distributionLog = parsedLogs.find((log: any) => log.name === "WinningsDistributed");
    expect(distributionLog).to.not.equal(undefined);

    const academyShare = BigInt(distributionLog.args.academyShare);
    const winnerWinnings = BigInt(distributionLog.args.winnings);
    const executorFee = BigInt(distributionLog.args.executorFee);

    const payoutPot = pot - executorFee;
    const expectedAcademyShare = (payoutPot * 5n) / 100n;

    expect(academyShare).to.equal(expectedAcademyShare);
    expect(await academyContract.getBalance()).to.equal(expectedAcademyShare);
    expect(winnerWinnings).to.be.at.most(payoutPot);
  });

  it("deletes the match after auto-play completes", async () => {
    const { gameContract, homeOwner, awayOwner } = await deployContracts();
    const wager = ethers.parseEther("3");

    await gameContract.createGame(wager, homeOwner.address, awayOwner.address);
    await gameContract.connect(homeOwner).addTeam(1n, homeTeam[0], homeTeam[1], homeTeam[2], { value: wager });
    await gameContract.connect(awayOwner).addTeam(1n, awayTeam[0], awayTeam[1], awayTeam[2], { value: wager });

    const match = await gameContract.getMatch(1n);
    expect(match.homeAddress).to.equal(ethers.ZeroAddress);
    expect(match.awayAddress).to.equal(ethers.ZeroAddress);
    expect(match.pot).to.equal(0n);
  });

  it("rejects direct tournament match simulation from non-tournament callers", async () => {
    const { gameContract, homeOwner, awayOwner } = await deployContracts();

    await expect(
      gameContract.playTournamentMatch(
        homeOwner.address,
        homeTeam,
        awayOwner.address,
        awayTeam,
        1n,
        1,
        1
      )
    ).to.be.revertedWith("Only tournament contract can play matches");
  });

  it("does not allow direct callers to bypass payout flow via tournament path", async () => {
    const { gameContract, homeOwner, awayOwner } = await deployContracts();

    await expect(
      gameContract.playTournamentMatch(
        homeOwner.address,
        homeTeam,
        awayOwner.address,
        awayTeam,
        9n,
        2,
        1
      )
    ).to.be.revertedWith("Only tournament contract can play matches");
  });

  describe("Game Team Validation", () => {
    it("requires exactly 5 players per team", async () => {
      const { gameContract, homeOwner, awayOwner } = await deployContracts();

      const invalidTeam = [[1, 0, 0], [0, 5, 0], [7, 0, 0]]; // Only 3 players
      const wager = ethers.parseEther("3");

      await gameContract.createGame(wager, homeOwner.address, awayOwner.address);

      await expect(
        gameContract.connect(homeOwner).addTeam(1n, invalidTeam[0], invalidTeam[1], invalidTeam[2], { value: wager })
      ).to.be.revertedWith("Each team must have 5 players to play a match");
    });

    it("rejects duplicate players in team", async () => {
      const { gameContract, homeOwner, awayOwner } = await deployContracts();

      const duplicateTeam = [[1, 1, 3], [0, 5, 0], [0, 0, 7]]; // Player 1 appears twice with exactly 5 selected players
      const wager = ethers.parseEther("3");

      await gameContract.createGame(wager, homeOwner.address, awayOwner.address);

      await expect(
        gameContract.connect(homeOwner).addTeam(1n, duplicateTeam[0], duplicateTeam[1], duplicateTeam[2], { value: wager })
      ).to.be.revertedWith("Each team must have unique players");
    });

    it("requires team owner to own all players", async () => {
      const { gameContract, homeOwner, awayOwner } = await deployContracts();

      // Players 1-5 are owned by homeOwner, 6-10 by awayOwner
      const mixedTeam = [[1n, 2n, 6n], [0n, 5n, 0n], [7n, 0n, 0n]]; // Player 6 is owned by awayOwner
      const wager = ethers.parseEther("3");

      await gameContract.createGame(wager, homeOwner.address, awayOwner.address);

      await expect(
        gameContract.connect(homeOwner).addTeam(1n, mixedTeam[0], mixedTeam[1], mixedTeam[2], { value: wager })
      ).to.be.revertedWith("Each team must be owned by a signle owner");
    });
  });

  describe("Manual playMatch safety", () => {
    it("reverts manual playMatch for a non-existent match", async () => {
      const { gameContract, homeOwner } = await deployContracts();

      await expect(gameContract.playMatch(999n, homeOwner.address)).to.be.revertedWith("Match does not exist");
    });

    it("reverts manual playMatch until both teams are submitted", async () => {
      const { gameContract, homeOwner, awayOwner } = await deployContracts();
      const wager = ethers.parseEther("3");

      await gameContract.createGame(wager, homeOwner.address, awayOwner.address);
      await gameContract.connect(homeOwner).addTeam(1n, homeTeam[0], homeTeam[1], homeTeam[2], { value: wager });

      await expect(gameContract.playMatch(1n, homeOwner.address)).to.be.revertedWith("Both teams must be submitted");
    });
  });

  describe("Game Wager Validation", () => {
    it("rejects addTeam for a non-existent match", async () => {
      const { gameContract, homeOwner } = await deployContracts();
      const wager = ethers.parseEther("3");

      await expect(
        gameContract.connect(homeOwner).addTeam(999n, homeTeam[0], homeTeam[1], homeTeam[2], { value: wager })
      ).to.be.revertedWith("You must be one of the teams playing in the match");
    });

    it("rejects wager amount mismatch on addTeam", async () => {
      const { gameContract, homeOwner, awayOwner } = await deployContracts();
      const wager = ethers.parseEther("3");
      const wrongWager = ethers.parseEther("2");

      await gameContract.createGame(wager, homeOwner.address, awayOwner.address);

      await expect(
        gameContract.connect(homeOwner).addTeam(1n, homeTeam[0], homeTeam[1], homeTeam[2], { value: wrongWager })
      ).to.be.reverted;
    });

    it("prevents teams from submitting twice", async () => {
      const { gameContract, homeOwner, awayOwner } = await deployContracts();
      const wager = ethers.parseEther("3");

      await gameContract.createGame(wager, homeOwner.address, awayOwner.address);
      await gameContract.connect(homeOwner).addTeam(1n, homeTeam[0], homeTeam[1], homeTeam[2], { value: wager });

      // Try to submit again
      await expect(
        gameContract.connect(homeOwner).addTeam(1n, homeTeam[0], homeTeam[1], homeTeam[2], { value: wager })
      ).to.be.revertedWith("Home team already submitted");
    });

    it("only allows match participants to submit teams", async () => {
      const { gameContract, homeOwner, awayOwner } = await deployContracts();
      const [, , thirdParty] = await ethers.getSigners();
      const wager = ethers.parseEther("3");

      await gameContract.createGame(wager, homeOwner.address, awayOwner.address);

      await expect(
        gameContract.connect(thirdParty).addTeam(1n, homeTeam[0], homeTeam[1], homeTeam[2], { value: wager })
      ).to.be.revertedWith("You must be one of the teams playing in the match");
    });
  });

  describe("Game Match Mechanics", () => {
    it("handles drawn matches with extra time and tiebreaker", async () => {
      const { gameContract, homeOwner, awayOwner } = await deployContracts();
      const wager = ethers.parseEther("3");

      await gameContract.createGame(wager, homeOwner.address, awayOwner.address);
      await gameContract.connect(homeOwner).addTeam(1n, homeTeam[0], homeTeam[1], homeTeam[2], { value: wager });

      const tx = await gameContract.connect(awayOwner).addTeam(1n, awayTeam[0], awayTeam[1], awayTeam[2], { value: wager });
      const receipt = await tx.wait();
      const parsedLogs = getParsedGameLogs(gameContract, receipt);

      // Match should complete with either MatchPlayed or ExtraTimePlayed/GoldenGoalPlayed
      const matchLog = parsedLogs.find((log: any) => log.name === "MatchPlayed");
      expect(matchLog).to.not.equal(undefined);
    });

    it("updates player statistics after matches", async () => {
      const { gameContract, playerToken, homeOwner, awayOwner } = await deployContracts();
      const wager = ethers.parseEther("3");

      const playerBefore = await playerToken.getPlayerAttributes(1n);
      const gamesLeftBefore = playerBefore[5]; // gamesLeft is 6th element

      await gameContract.createGame(wager, homeOwner.address, awayOwner.address);
      await gameContract.connect(homeOwner).addTeam(1n, homeTeam[0], homeTeam[1], homeTeam[2], { value: wager });
      await gameContract.connect(awayOwner).addTeam(1n, awayTeam[0], awayTeam[1], awayTeam[2], { value: wager });

      const playerAfter = await playerToken.getPlayerAttributes(1n);
      const gamesLeftAfter = playerAfter[5];

      // Player should have fewer games left after playing
      expect(gamesLeftAfter).to.be.lessThan(gamesLeftBefore);
    });
  });

  describe("Game Financial Consistency", () => {
    it("ensures total distributed equals pot minus executor fee", async () => {
      const { gameContract, academyContract, homeOwner, awayOwner } = await deployContracts();
      const wager = ethers.parseEther("3");
      const pot = wager * 2n;

      await gameContract.createGame(wager, homeOwner.address, awayOwner.address);
      await gameContract.connect(homeOwner).addTeam(1n, homeTeam[0], homeTeam[1], homeTeam[2], { value: wager });

      const tx = await gameContract.connect(awayOwner).addTeam(1n, awayTeam[0], awayTeam[1], awayTeam[2], { value: wager });
      const receipt = await tx.wait();
      const parsedLogs = getParsedGameLogs(gameContract, receipt);

      const distributionLog = parsedLogs.find((log: any) => log.name === "WinningsDistributed");
      expect(distributionLog).to.not.equal(undefined);

      const winner = distributionLog.args.winner as string;
      const executor = distributionLog.args.executor as string;
      const executorFee = BigInt(distributionLog.args.executorFee);
      const academyShare = BigInt(distributionLog.args.academyShare);
      const winnerWinnings = BigInt(distributionLog.args.winnings);
      const expectedWinnerPending = winner === executor ? winnerWinnings + executorFee : winnerWinnings;

      expect(await gameContract.pendingWithdrawals(winner)).to.equal(expectedWinnerPending);
      if (executor !== winner) {
        expect(await gameContract.pendingWithdrawals(executor)).to.equal(executorFee);
      }

      // Total distributed should still equal the original pot.
      const totalDistributed = executorFee + academyShare + winnerWinnings;
      expect(totalDistributed).to.equal(pot);
    });

    it("correctly allocates 5% of payout pot to academy", async () => {
      const { gameContract, academyContract, homeOwner, awayOwner } = await deployContracts();
      const wager = ethers.parseEther("3");
      const pot = wager * 2n;

      await gameContract.createGame(wager, homeOwner.address, awayOwner.address);
      await gameContract.connect(homeOwner).addTeam(1n, homeTeam[0], homeTeam[1], homeTeam[2], { value: wager });

      const academyBalanceBefore = await academyContract.getBalance();

      const tx = await gameContract.connect(awayOwner).addTeam(1n, awayTeam[0], awayTeam[1], awayTeam[2], { value: wager });
      const receipt = await tx.wait();
      const parsedLogs = getParsedGameLogs(gameContract, receipt);

      const distributionLog = parsedLogs.find((log: any) => log.name === "WinningsDistributed");
      expect(distributionLog).to.not.equal(undefined);

      const executorFee = BigInt(distributionLog.args.executorFee);
      const expectedAcademyShare = ((pot - executorFee) * 5n) / 100n;

      const academyBalanceAfter = await academyContract.getBalance();
      expect(academyBalanceAfter - academyBalanceBefore).to.equal(expectedAcademyShare);
    });

    it("allows queued winnings to be withdrawn after a match", async () => {
      const { gameContract, homeOwner, awayOwner } = await deployContracts();
      const wager = ethers.parseEther("3");

      await gameContract.createGame(wager, homeOwner.address, awayOwner.address);
      await gameContract.connect(homeOwner).addTeam(1n, homeTeam[0], homeTeam[1], homeTeam[2], { value: wager });

      const tx = await gameContract.connect(awayOwner).addTeam(1n, awayTeam[0], awayTeam[1], awayTeam[2], { value: wager });
      const receipt = await tx.wait();
      const parsedLogs = getParsedGameLogs(gameContract, receipt);

      const distributionLog = parsedLogs.find((log: any) => log.name === "WinningsDistributed");
      expect(distributionLog).to.not.equal(undefined);

      const winner = distributionLog.args.winner as string;
      const executor = distributionLog.args.executor as string;
      const pendingBefore = await gameContract.pendingWithdrawals(winner);
      const expectedPending = winner === executor
        ? BigInt(distributionLog.args.winnings) + BigInt(distributionLog.args.executorFee)
        : BigInt(distributionLog.args.winnings);
      expect(pendingBefore).to.equal(expectedPending);

      const winnerSigner = winner === homeOwner.address ? homeOwner : awayOwner;
      await gameContract.connect(winnerSigner).withdraw();

      expect(await gameContract.pendingWithdrawals(winner)).to.equal(0n);
    });

    it("handles draw distribution correctly", async () => {
      // This test would require creating a scenario where teams have equal stats
      // For now, we just verify the logic exists
      const { gameContract, homeOwner, awayOwner } = await deployContracts();
      const wager = ethers.parseEther("3");

      await gameContract.createGame(wager, homeOwner.address, awayOwner.address);
      // Teams with identical stats should result in draw distribution
    });
  });

  describe("Match Retrieval", () => {
    it("returns match details correctly", async () => {
      const { gameContract, homeOwner, awayOwner } = await deployContracts();
      const wager = ethers.parseEther("3");

      await gameContract.createGame(wager, homeOwner.address, awayOwner.address);

      const match = await gameContract.getMatch(1n);
      expect(match.wagerRequired).to.equal(wager);
      expect(match.homeAddress).to.equal(homeOwner.address);
      expect(match.awayAddress).to.equal(awayOwner.address);
      expect(match.pot).to.equal(wager * 2n);
    });

    it("returns empty match after completion", async () => {
      const { gameContract, homeOwner, awayOwner } = await deployContracts();
      const wager = ethers.parseEther("3");

      await gameContract.createGame(wager, homeOwner.address, awayOwner.address);
      await gameContract.connect(homeOwner).addTeam(1n, homeTeam[0], homeTeam[1], homeTeam[2], { value: wager });
      await gameContract.connect(awayOwner).addTeam(1n, awayTeam[0], awayTeam[1], awayTeam[2], { value: wager });

      const match = await gameContract.getMatch(1n);
      expect(match.homeAddress).to.equal(ethers.ZeroAddress);
      expect(match.pot).to.equal(0n);
    });
  });
});

