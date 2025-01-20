import { expect } from "chai";
import { Listener } from "ethers";
import { ethers } from "hardhat";

describe("Game", () => {
    async function deployContracts() {
        const [homeOwner, awayOwner] = await ethers.getSigners();

        const playerToken = await ethers.deployContract("PlayerToken");

        await playerToken.waitForDeployment();

        playerToken.mintPlayer(homeOwner.address);
        playerToken.mintPlayer(homeOwner.address);
        playerToken.mintPlayer(homeOwner.address);
        playerToken.mintPlayer(homeOwner.address);
        playerToken.mintPlayer(homeOwner.address);

        playerToken.mintPlayer(awayOwner.address);
        playerToken.mintPlayer(awayOwner.address);
        playerToken.mintPlayer(awayOwner.address);
        playerToken.mintPlayer(awayOwner.address);
        playerToken.mintPlayer(awayOwner.address);

        const academyContract = await ethers.deployContract("Academy", [await playerToken.getAddress()]);
        const gameContract = await ethers.deployContract("Game", [await playerToken.getAddress(), await academyContract.getAddress()]);

        return { gameContract, playerToken, academyContract, homeOwner, awayOwner };
    }

    it("should be able to start a match with ether", async () => {
        const { gameContract } = await deployContracts();
        const value = ethers.parseEther("0.1");

        await gameContract.playMatch([1, 0, 2], [0, 3, 0], [4, 0, 5], [6, 0, 7], [0, 8, 0], [9, 0, 10], { value });
    });

    it("should not be able to start a match without ether", async () => {
        const { gameContract } = await deployContracts();

        await expect(gameContract.playMatch([1, 0, 2], [0, 3, 0], [4, 0, 5], [6, 0, 7], [0, 8, 0], [9, 0, 10])).to.be.revertedWith("You must wager some ether to play a match");
    });

    // it("should give 1% of the wager to the academy", async () => {
    //     const { gameContract, academyContract } = await deployContracts();
    //     const value = ethers.parseEther("0.1");

    //     await gameContract.playMatch([1, 0, 2], [0, 3, 0], [4, 0, 5], [6, 0, 7], [0, 8, 0], [9, 0, 10], { value });

    //     expect(await academyContract.getBalance()).to.equal(ethers.parseEther("0.001"));
    // });

    it("should not be able to start a match if the home team is less than 5 players", async () => {
        const { gameContract } = await deployContracts();
        const value = ethers.parseEther("0.1");

        await expect(gameContract.playMatch([1, 0, 0], [0, 3, 0], [4, 0, 5], [6, 0, 7], [0, 8, 0], [9, 0, 10], { value })).to.be.revertedWith("Each team must have 5 players to play a match");
    });

    it("should not be able to start a match if the home team is more than 5 players", async () => {
        const { gameContract } = await deployContracts();
        const value = ethers.parseEther("0.1");

        await expect(gameContract.playMatch([1, 0, 2], [0, 3, 0], [4, 6, 5], [6, 0, 7], [0, 8, 0], [9, 0, 10], { value })).to.be.revertedWith("Each team must have 5 players to play a match");
    });

    it("should not be able to start a match if the away team is less than 5 players", async () => {
        const { gameContract } = await deployContracts();
        const value = ethers.parseEther("0.1");

        await expect(gameContract.playMatch([1, 0, 2], [0, 3, 0], [4, 0, 5], [6, 0, 0], [0, 8, 0], [9, 0, 10], { value })).to.be.revertedWith("Each team must have 5 players to play a match");
    });

    it("should not be able to start a match if the away team is more than 5 players", async () => {
        const { gameContract } = await deployContracts();
        const value = ethers.parseEther("0.1");

        await expect(gameContract.playMatch([1, 0, 2], [0, 3, 0], [4, 0, 5], [6, 11, 7], [0, 8, 0], [9, 0, 10], { value })).to.be.revertedWith("Each team must have 5 players to play a match");
    });

    it("should not be able to repeat a player in the home team", async () => {
        const { gameContract } = await deployContracts();
        const value = ethers.parseEther("0.1");

        await expect(gameContract.playMatch([1, 0, 1], [0, 3, 0], [4, 0, 5], [6, 0, 7], [0, 8, 0], [9, 0, 10], { value })).to.be.revertedWith("Each team must have unique players");
    });

    it("should not be able to repeat a player in the away team", async () => {
        const { gameContract } = await deployContracts();
        const value = ethers.parseEther("0.1");

        await expect(gameContract.playMatch([1, 0, 2], [0, 3, 0], [4, 0, 5], [6, 0, 6], [0, 8, 0], [9, 0, 10], { value })).to.be.revertedWith("Each team must have unique players");
    });

    it("it should play a game and update the player attributes", async () => {
        const { gameContract, playerToken } = await deployContracts();
        const value = ethers.parseEther("0.1");

        const homeStrikerAttackBefore = await playerToken.getPlayerAttributes(1);
        const awayStrikerAttackBefore = await playerToken.getPlayerAttributes(6);

        for (let i = 0; i < 10; i++) {
            await gameContract.playMatch([1, 0, 2], [0, 3, 0], [4, 0, 5], [6, 0, 7], [0, 8, 0], [9, 0, 10], { value });
        }

        const homeStrikerAttackAfter = await playerToken.getPlayerAttributes(1);
        const awayStrikerAttackAfter = await playerToken.getPlayerAttributes(6);

        expect(homeStrikerAttackBefore[1]).below(homeStrikerAttackAfter[1]);
        expect(awayStrikerAttackBefore[1]).below(awayStrikerAttackAfter[1]);
    });

    it("should assign players goals", async () => {
        const { gameContract, playerToken } = await deployContracts();
        const value = ethers.parseEther("0.1");

        for (let i = 0; i < 10; i++) {
            await gameContract.playMatch([1, 0, 2], [0, 3, 0], [4, 0, 5], [6, 0, 7], [0, 8, 0], [9, 0, 10], { value });
        }

        const homeStrikerGoals = await playerToken.getGoals(1);

        console.log(`Player 1 scored: ${homeStrikerGoals} goals`);

        expect(homeStrikerGoals).above(0);
    });

    it("should not be able to play a match if you are not the owner of the player", async () => {
        const { gameContract, playerToken } = await deployContracts();
        const value = ethers.parseEther("0.1");

        await expect(gameContract.playMatch([1, 0, 10], [0, 3, 0], [4, 0, 5], [6, 0, 7], [0, 8, 0], [9, 0, 2], { value })).to.be.revertedWith("Each team must be owned by a signle owner");
    });

    it("should not be able to play a match if the player has retired", async () => {
        const { gameContract, playerToken } = await deployContracts();
        const value = ethers.parseEther("0.1");

        for (let i = 0; i < 100; i++) {
            await playerToken.playMidfieldGame(1);
        }

        await expect(gameContract.playMatch([1, 0, 2], [0, 3, 0], [4, 0, 5], [6, 0, 7], [0, 8, 0], [9, 0, 10], { value })).to.be.revertedWith("Player has retired, unable to play more games");
    });

    it("should send ether to the winner", async () => {
        const { gameContract, homeOwner, awayOwner, academyContract } = await deployContracts();
        const value = ethers.parseEther("1");
        const beforeHomeBalance = await ethers.provider.getBalance(homeOwner.address);
        const beforeAwayBalance = await ethers.provider.getBalance(awayOwner.address);
        let homeGoals;
        let awayGoals;

        await new Promise<void>(async (resolve) => {
            const listener: Listener = (hGoals: number, aGoals: number) => {
                homeGoals = hGoals;
                awayGoals = aGoals;
                resolve();
            };
            await gameContract.addListener("MatchPlayed", listener);

            await gameContract.playMatch([1, 0, 2], [0, 3, 0], [4, 0, 5], [6, 0, 7], [0, 8, 0], [9, 0, 10], { value });
        });

        if (homeGoals === undefined || awayGoals === undefined) {
            throw new Error("Goals were not defined");
        }

        const homeBalance = await ethers.provider.getBalance(homeOwner.address);
        const awayBalance = await ethers.provider.getBalance(awayOwner.address);

        if (homeGoals! > awayGoals!) {
            expect(homeBalance).above(beforeHomeBalance);
        } else if (awayGoals! > homeGoals!) {
            expect(awayBalance).above(beforeAwayBalance);
        } else {
            expect(await academyContract.getBalance()).to.equal(ethers.parseEther("1"));
        }
    });

    // it("should lose money if it is a draw")
});

// it("should not be able to start a match if the home owner does not own the player", async () => {
//     const { gameContract, homeOwner, awayOwner } = await deployContracts();
//     const value = ethers.parseEther("0.1");

//     await expect(gameContract.playMatch(0, 1, { value })).to.be.revertedWith("You must own the player to play a match");
// });

// it("should send ether to the winner", async () => {
//     const { gameContract, homeOwner, awayOwner } = await deployContracts();
//     const value = ethers.parseEther("0.1");
//
//     await gameContract.playMatch(1, 0, { value });
//
//     const homeBalance = await homeOwner.getBalance();
//     const awayBalance = await awayOwner.getBalance();
//
//     await gameContract.withdraw();
//
//     const homeBalanceAfter = await homeOwner.getBalance();
//     const awayBalanceAfter = await awayOwner.getBalance();
//
//     expect(homeBalanceAfter).above(homeBalance);
//     expect(awayBalanceAfter).below(awayBalance);
// });