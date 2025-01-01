import { expect } from "chai";
import { ethers } from "hardhat";

describe("PlayerToken", () => {
    // Shouldn't be able to mint a player as a non-contract address
    async function deployPlayerToken() {
        const [owner, addr1, addr2] = await ethers.getSigners();

        const playerToken = await ethers.deployContract("PlayerToken");

        await playerToken.waitForDeployment();

        return { playerToken, owner, addr1, addr2 };
    }

    it("should not mint a player with id 0", async () => {
        const contract = await deployPlayerToken();
        await contract.playerToken.mintPlayer(contract.owner.address)

        expect((await contract.playerToken.getPlayerAttributes(0))[0]).to.equal(0); // attribute cannot be 0
    });

    it("should mint a new player with random attributes", async () => {
        const contract = await deployPlayerToken();
        await contract.playerToken.mintPlayer(contract.owner.address);
        const playerAttributes = await contract.playerToken.getPlayerAttributes(1);

        assertPlayerAttributeInRange(playerAttributes[0]);
        assertPlayerAttributeInRange(playerAttributes[1]);
        assertPlayerAttributeInRange(playerAttributes[2]);
    });

    it("should randomly increase attack player attributes", async () => {
        const contract = await deployPlayerToken();
        await contract.playerToken.mintPlayer(contract.owner.address);
        const attackBefore = (await contract.playerToken.getPlayerAttributes(1))[1];
        await contract.playerToken.playMidfieldGame(1);
        const attackAfter = (await contract.playerToken.getPlayerAttributes(1))[1];

        expect(attackBefore).not.above(attackAfter);
    });

    it("should start a player with 100 games", async () => {
        const contract = await deployPlayerToken();
        await contract.playerToken.mintPlayer(contract.owner.address);

        expect(await contract.playerToken.getGamesLeft(1)).to.equal(100);
    });

    it("should reduce the game count after playing", async () => {
        const contract = await deployPlayerToken();
        await contract.playerToken.mintPlayer(contract.owner.address);
        const gameCountBefore = (await contract.playerToken.getGamesLeft(1));
        await contract.playerToken.playMidfieldGame(1);
        const gameCountAfter = (await contract.playerToken.getGamesLeft(1));

        expect(gameCountBefore).above(gameCountAfter);
    });

    it("should not allow playing when there are no games left", async () => {
        const contract = await deployPlayerToken();
        await contract.playerToken.mintPlayer(contract.owner.address);
        for (let i = 0; i < 100; i++) {
            await contract.playerToken.playMidfieldGame(1);
        }

        await expect(contract.playerToken.playMidfieldGame(1)).to.be.revertedWith("Player has retired, unable to play more games");
    });

    it("should not allow playing with a player that does not exist", async () => {
        const contract = await deployPlayerToken();
        await expect(contract.playerToken.playMidfieldGame(1)).to.be.revertedWith("Player does not exist");
    });

    it("should make a striker have worse defending than attacking over time", async () => {
        const contract = await deployPlayerToken();
        await contract.playerToken.mintPlayer(contract.owner.address);
        
        for (let i = 0; i < 100; i++) {
            await contract.playerToken.playAttackGame(1);
        }
        
        const playerAttributes = await contract.playerToken.getPlayerAttributes(1);
        expect(playerAttributes[0]).above(playerAttributes[1]);
    });

    it("should make a defender have worse attacking than defending over time", async () => {
        const contract = await deployPlayerToken();
        await contract.playerToken.mintPlayer(contract.owner.address);
        
        for (let i = 0; i < 100; i++) {
            await contract.playerToken.playDefenseGame(1);
        }
        
        const playerAttributes = await contract.playerToken.getPlayerAttributes(1);
        expect(playerAttributes[0]).below(playerAttributes[1]);
    });

    it("should allow assigning of goals to players", async () => {
        const contract = await deployPlayerToken();
        await contract.playerToken.mintPlayer(contract.owner.address);

        await contract.playerToken.scoreGoal(1);
        expect(await contract.playerToken.getGoals(1)).to.equal(1);
    });
});

function assertPlayerAttributeInRange(attribute: bigint) {
    expect(attribute).below(100);
    expect(attribute).above(0);
}