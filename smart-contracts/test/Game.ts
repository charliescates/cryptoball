import { expect } from "chai";
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

        const gameContract = await ethers.deployContract("Game", [await playerToken.getAddress()]);

        return { gameContract, playerToken };
    }

    it("should be able to start a match with ether", async () => {
        const { gameContract, playerToken } = await deployContracts();
        const value = ethers.parseEther("0.1");

        await gameContract.playMatch([1, 0, 2], [0, 3, 0], [4, 0, 5], [6, 0, 7], [0, 8, 0], [9, 0, 10], { value });
    });

    it("should not be able to start a match without ether", async () => {
        const { gameContract, playerToken } = await deployContracts();

        await expect(gameContract.playMatch([1, 0, 2], [0, 3, 0], [4, 0, 5], [6, 0, 7], [0, 8, 0], [9, 0, 10])).to.be.revertedWith("You must wager at least 0.1 ether to play a match");
    });

    it("should not be able to start a match if the home team is less than 5 players", async () => {
        const { gameContract, playerToken } = await deployContracts();
        const value = ethers.parseEther("0.1");

        await expect(gameContract.playMatch([1, 0, 0], [0, 3, 0], [4, 0, 5], [6, 0, 7], [0, 8, 0], [9, 0, 10], { value })).to.be.revertedWith("Each team must have 5 players to play a match");
    });

    it("should not be able to start a match if the home team is more than 5 players", async () => {
        const { gameContract, playerToken } = await deployContracts();
        const value = ethers.parseEther("0.1");

        await expect(gameContract.playMatch([1, 0, 2], [0, 3, 0], [4, 6, 5], [6, 0, 7], [0, 8, 0], [9, 0, 10], { value })).to.be.revertedWith("Each team must have 5 players to play a match");
    });

    it("should not be able to start a match if the away team is less than 5 players", async () => {
        const { gameContract, playerToken } = await deployContracts();
        const value = ethers.parseEther("0.1");

        await expect(gameContract.playMatch([1, 0, 2], [0, 3, 0], [4, 0, 5], [6, 0, 0], [0, 8, 0], [9, 0, 10], { value })).to.be.revertedWith("Each team must have 5 players to play a match");
    });

    it("should not be able to start a match if the away team is more than 5 players", async () => {
        const { gameContract, playerToken } = await deployContracts();
        const value = ethers.parseEther("0.1");

        await expect(gameContract.playMatch([1, 0, 2], [0, 3, 0], [4, 0, 5], [6, 11, 7], [0, 8, 0], [9, 0, 10], { value })).to.be.revertedWith("Each team must have 5 players to play a match");
    });

    it("should not be able to repeat a player in the home team", async () => {
        const { gameContract, playerToken } = await deployContracts();
        const value = ethers.parseEther("0.1");

        await expect(gameContract.playMatch([1, 0, 1], [0, 3, 0], [4, 0, 5], [6, 0, 7], [0, 8, 0], [9, 0, 10], { value })).to.be.revertedWith("Each team must have unique players");
    });

    it("should not be able to repeat a player in the away team", async () => {
        const { gameContract, playerToken } = await deployContracts();
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
        
        expect(homeStrikerAttackBefore[0]).below(homeStrikerAttackAfter[0]);
        expect(awayStrikerAttackBefore[0]).below(awayStrikerAttackAfter[0]);
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
    
    })
});
// it("should not be able to start a match if the home owner does not own the player", async () => {
//     const { gameContract, homeOwner, awayOwner } = await deployContracts();
//     const value = ethers.parseEther("0.1");

//     await expect(gameContract.playMatch(0, 1, { value })).to.be.revertedWith("You must own the player to play a match");
// });