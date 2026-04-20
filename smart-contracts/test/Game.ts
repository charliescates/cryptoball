import { expect } from "chai";
import { Listener } from "ethers";
import { ethers } from "hardhat";

describe("Game", () => {
    let gameCount: bigint;
    const homeTeam = [[1, 0, 2], [0, 3, 0], [4, 0, 5]];
    const awayTeam = [[6, 0, 7], [0, 8, 0], [9, 0, 10]];
    
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

    async function startGame(
        gameContract: any,
        homeOwner: any,
        awayOwner: any,
        wager: bigint,
        home = homeTeam,
        away = awayTeam){
            await gameContract.createGame(wager, homeOwner.address, awayOwner.address);

            await gameContract.connect(homeOwner).addTeam(gameCount, home[0], home[1], home[2], {value: wager});
            await gameContract.connect(awayOwner).addTeam(gameCount, away[0], away[1], away[2], {value: wager});
            gameCount++;
    }

    beforeEach(() => {
        gameCount = 1n;
    })

    it("should be able to start a match with ether", async () => {
        const { gameContract, homeOwner, awayOwner } = await deployContracts();

        await startGame(gameContract, homeOwner, awayOwner, ethers.parseEther("0.1"));
    });

    it("should not be able to add a team without the required ether", async () => {
        const { gameContract, homeOwner, awayOwner } = await deployContracts();

        await gameContract.createGame(2, homeOwner.address, awayOwner.address);

        await expect(gameContract.addTeam(gameCount, homeTeam[0], homeTeam[1], homeTeam[2], {value: 1})).to.be.revertedWith("1 does not match required wager of 2");
    });

    // it("should give 1% of the wager to the academy", async () => {
    //     const { gameContract, academyContract, homeOwner, awayOwner } = await deployContracts();
        
    //     await startGame(gameContract, homeOwner, awayOwner, ethers.parseEther("0.1"));

    //     expect(await academyContract.getBalance()).to.equal(ethers.parseEther("0.001"));
    // });

    it("should not be able to start a match if the team is less than 5 players", async () => {
        const { gameContract, homeOwner, awayOwner } = await deployContracts();
        await gameContract.createGame(1, homeOwner.address, awayOwner.address);

        await expect(gameContract.addTeam(gameCount, homeTeam[0], homeTeam[1], [0, 0, 0], { value: 1 })).to.be.revertedWith("Each team must have 5 players to play a match");
    });

    it("should not be able to start a match if the team is more than 5 players", async () => {
        const { gameContract, homeOwner, awayOwner } = await deployContracts();
        await gameContract.createGame(1, homeOwner.address, awayOwner.address);

        await expect(gameContract.addTeam(gameCount, homeTeam[0], homeTeam[1], [4, 5, 6], { value: 1 })).to.be.revertedWith("Each team must have 5 players to play a match");
    });

    it("should not be able to repeat a player in the team", async () => {
        const { gameContract, homeOwner, awayOwner } = await deployContracts();
        await gameContract.createGame(1, homeOwner.address, awayOwner.address);

        await expect(gameContract.addTeam(gameCount, homeTeam[0], homeTeam[1], [4, 4, 0], { value: 1 })).to.be.revertedWith("Each team must have unique players");
   });

    it("should not allow the home side to submit team twice", async () => {
        const { gameContract, homeOwner, awayOwner } = await deployContracts();
        await gameContract.createGame(1, homeOwner.address, awayOwner.address);

        await gameContract.connect(homeOwner).addTeam(gameCount, homeTeam[0], homeTeam[1], homeTeam[2], { value: 1 });

        await expect(
            gameContract.connect(homeOwner).addTeam(gameCount, homeTeam[0], homeTeam[1], homeTeam[2], { value: 1 })
        ).to.be.revertedWith("Home team already submitted");
    });

    it("should not allow the away side to submit team twice", async () => {
        const { gameContract, homeOwner, awayOwner } = await deployContracts();
        await gameContract.createGame(1, homeOwner.address, awayOwner.address);

        await gameContract.connect(awayOwner).addTeam(gameCount, awayTeam[0], awayTeam[1], awayTeam[2], { value: 1 });

        await expect(
            gameContract.connect(awayOwner).addTeam(gameCount, awayTeam[0], awayTeam[1], awayTeam[2], { value: 1 })
        ).to.be.revertedWith("Away team already submitted");
    });

    it("it should play a game and update the player attributes", async () => {
        const { gameContract, playerToken, homeOwner, awayOwner } = await deployContracts();
        const wager = ethers.parseEther("0.1");

        const homeStrikerAttackBefore = await playerToken.getPlayerAttributes(1);
        const awayStrikerAttackBefore = await playerToken.getPlayerAttributes(6);

        for (let i = 0; i < 10; i++) {
            await startGame(gameContract, homeOwner, awayOwner, wager);
        }

        const homeStrikerAttackAfter = await playerToken.getPlayerAttributes(1);
        const awayStrikerAttackAfter = await playerToken.getPlayerAttributes(6);

        expect(homeStrikerAttackAfter[1]).to.be.at.least(homeStrikerAttackBefore[1]);
        expect(awayStrikerAttackAfter[1]).to.be.at.least(awayStrikerAttackBefore[1]);
    });

    it("should assign players goals", async () => {
        const { gameContract, playerToken, homeOwner, awayOwner } = await deployContracts();
        const wager = ethers.parseEther("0.1");

        for (let i = 0; i < 10; i++) {
            await startGame(gameContract, homeOwner, awayOwner, wager);
        }

        const homeStrikerGoals = await playerToken.getGoals(1);

        console.log(`Player 1 scored: ${homeStrikerGoals} goals`);

        expect(homeStrikerGoals).above(0);
    });

    it("should not be able to play a match if you are not the owner of the player", async () => {
        const { gameContract, homeOwner, awayOwner } = await deployContracts();
        await gameContract.createGame(1, homeOwner.address, awayOwner.address);

        await expect((gameContract.connect(homeOwner) as any).addTeam(gameCount, [1, 0, 10], homeTeam[1], homeTeam[2], { value: 1 })).to.be.revertedWith("Each team must be owned by a signle owner");
    });

    it("should not be able to play a match if the player has retired", async () => {
        const { gameContract, playerToken, homeOwner, awayOwner } = await deployContracts();
        const value = ethers.parseEther("0.1");

        for (let i = 0; i < 100; i++) {
            await playerToken.playMidfieldGame(1);
        }

        await expect(startGame(gameContract, homeOwner, awayOwner, value)).to.be.revertedWith("Player has retired, unable to play more games");
    });

    it("should send ether to the winner or acedemy if a draw", async () => {
        const { gameContract, homeOwner, awayOwner, academyContract } = await deployContracts();
        const value = ethers.parseEther("1");
        const beforeHomeBalance = await ethers.provider.getBalance(homeOwner.address);
        const beforeAwayBalance = await ethers.provider.getBalance(awayOwner.address);
        const beforeAcedemyBalance = await ethers.provider.getBalance(academyContract.getAddress());
        let homeGoals;
        let awayGoals;

        await new Promise<void>(async (resolve) => {
            const listener: Listener = (matchId: number, hGoals: number, aGoals: number) => {
                homeGoals = hGoals;
                awayGoals = aGoals;
                resolve();
            };
            await gameContract.addListener("MatchPlayed", listener);

            await startGame(gameContract, homeOwner, awayOwner, value);
        });

        if (homeGoals === undefined || awayGoals === undefined) {
            throw new Error("Goals were not defined");
        }

        const homeBalance = await ethers.provider.getBalance(homeOwner.address);
        const awayBalance = await ethers.provider.getBalance(awayOwner.address);

        console.log("Before Home Balance: " + beforeHomeBalance);
        console.log("After Home Balance: " + homeBalance);
        console.log("Before Away Balance: " + beforeAwayBalance);
        console.log("After Away Balance: " + awayBalance);
        console.log("Before Acedemy Balance: " + beforeAcedemyBalance);
        console.log("After Acedemy Balance: " + await academyContract.getBalance());

        if (homeGoals! > awayGoals!) {
            expect(homeBalance).above(beforeHomeBalance);
        } else if (awayGoals! > homeGoals!) {
            expect(awayBalance).above(beforeAwayBalance);
        } else {
            expect(await academyContract.getBalance()).to.equal(ethers.parseEther("2"));
        }
    });

    describe("Game setup", () => {
        it("should allow you to set up a game", async () => {
            const { gameContract, homeOwner, awayOwner } = await deployContracts();
            let gameId;

            await new Promise<void>(async (resolve) => {
                const listener: Listener = (matchId: number) => {
                    gameId = matchId;
                    resolve();
                };
                await gameContract.addListener("NewMatch", listener);

                await gameContract.createGame(5000, homeOwner.address, awayOwner.address);
            });

            expect(gameId).to.equal(1);
        });

        it("should play after receiving both teams", async () => {
            const { gameContract, homeOwner, awayOwner } = await deployContracts();

            await gameContract.createGame(0, homeOwner.address, awayOwner.address);
            let homeGoals = 0;
            let awayGoals = 0;

            await new Promise<void>(async (resolve) => {
                const listener: Listener = (id: number, hGoals: number, aGoals: number) => {
                    homeGoals = hGoals;
                    awayGoals = aGoals;
                    resolve();
                };
                await gameContract.addListener("MatchPlayed", listener);

                console.log("Adding team 1");
                await (gameContract.connect(homeOwner) as any).addTeam(1, [1, 0, 2], [0, 3, 0], [4, 0, 5]);
                console.log("Adding team 2");
                gameContract.connect(awayOwner);
                await (gameContract.connect(awayOwner) as any).addTeam(1, [6, 0, 7], [0, 8, 0], [9, 0, 10]);
            });

            expect(homeGoals + awayGoals).to.be.greaterThan(0);
        });

        xit("should fail if less than the wager provided");
    });
});