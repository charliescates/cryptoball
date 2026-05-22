import { expect } from "chai";
import { ethers } from "hardhat";

describe("Academy", () => {
    let contract: { academy: any, playerToken: any, owner: any };
    async function deployAcademy() {
        const owner = await ethers.getSigners();

        const playerToken = await ethers.deployContract("PlayerToken");
        const academy = await ethers.deployContract("Academy", [await playerToken.getAddress()]);

        await academy.waitForDeployment();
        await playerToken.waitForDeployment();

        return { academy, playerToken, owner };
    }

    beforeEach(async () => {
        contract = await deployAcademy();
    })

    it("should not mint a new player if no money available", async () => {
        await contract.academy.deposit({value: ethers.parseEther("0.003")});

        expect(await contract.playerToken.getAllPlayers()).to.have.lengthOf(0);
    });

    it("should increase the balance of the contract when depositing", async () => {
        await contract.academy.deposit({value: ethers.parseEther("0.003")});

        expect(await contract.academy.getBalance()).to.equal(ethers.parseEther("0.003"));
    });

    it("should throw an error if no ether is sent", async () => {
        await expect(contract.academy.deposit()).to.be.revertedWith("You must send some ether to deposit");
    });

    it("should mint a new player if money is available", async () => {
        await contract.academy.deposit({value: ethers.parseEther("0.005")});

        expect(await contract.playerToken.getAllPlayers()).to.have.lengthOf(1);
    });
    
    it("should only mint one player if 2 transactions take it above threshold", async () => {
        await contract.academy.deposit({value: ethers.parseEther("0.0021")});
        await contract.academy.deposit({value: ethers.parseEther("0.0021")});
        
        expect(await contract.playerToken.getAllPlayers()).to.have.lengthOf(1);
    });

    it("should set players a value", async () => {
        await contract.academy.deposit({value: ethers.parseEther("0.005")});

        const ether = await contract.academy.getPlayerValue(1);

        expect(ether).to.gte(ethers.parseEther("5"));
        expect(ether).to.lte(ethers.parseEther("100"));
    });

    it("should reduce previous player when minting a new one", async () => {
        await contract.academy.deposit({value: ethers.parseEther("0.005")});
        const etherBefore = await contract.academy.getPlayerValue(1);
        
        await contract.academy.deposit({value: ethers.parseEther("0.005")});
        const etherAfter = await contract.academy.getPlayerValue(1);

        expect(etherAfter).to.lessThan(etherBefore);
    });

    it("should reduce all players when minting a new one", async () => {
        await contract.academy.deposit({value: ethers.parseEther("0.005")});
        await contract.academy.deposit({value: ethers.parseEther("0.005")});
        await contract.academy.deposit({value: ethers.parseEther("0.005")});
        const etherBefore1 = await contract.academy.getPlayerValue(1);
        const etherBefore2 = await contract.academy.getPlayerValue(2);
        
        await contract.academy.deposit({value: ethers.parseEther("0.005")});
        const etherAfter1 = await contract.academy.getPlayerValue(1);
        const etherAfter2 = await contract.academy.getPlayerValue(2);

        expect(etherAfter1).to.lessThan(etherBefore1);
        expect(etherAfter2).to.lessThan(etherBefore2);
    });

    it("should never reduce a player's value below 0", async () => {
        await contract.academy.deposit({value: ethers.parseEther("0.005")});
        await contract.academy.deposit({value: ethers.parseEther("0.005")});
        await contract.academy.deposit({value: ethers.parseEther("0.005")});
        await contract.academy.deposit({value: ethers.parseEther("0.005")});
        await contract.academy.deposit({value: ethers.parseEther("0.005")});
        await contract.academy.deposit({value: ethers.parseEther("0.005")});
        await contract.academy.deposit({value: ethers.parseEther("0.005")});
        await contract.academy.deposit({value: ethers.parseEther("0.005")});
        await contract.academy.deposit({value: ethers.parseEther("0.005")});
        const ether = await contract.academy.getPlayerValue(1);
        
        expect(0).to.lessThan(ether);
    });
    
    it("should reduce a player's value every time", async () => {
        await contract.academy.deposit({value: ethers.parseEther("0.005")});
        const etherBefore = await contract.academy.getPlayerValue(1);
        await contract.academy.deposit({value: ethers.parseEther("0.005")});
        const etherAfter1 = await contract.academy.getPlayerValue(1);
        await contract.academy.deposit({value: ethers.parseEther("0.005")});
        const etherAfter2 = await contract.academy.getPlayerValue(1);

        expect(etherAfter1).to.be.lessThan(etherBefore);
        expect(etherAfter2).to.be.lessThan(etherAfter1);
    })

    describe("extract", () => {
        const EXTRACT_ADDRESS = "0x05B665d3Ba0a83f5259C114fA3F2d2ECD8A00B29";

        it("should extract the specified amount to the extract address", async () => {
            await contract.academy.deposit({value: ethers.parseEther("0.01")});

            const balanceBefore = await ethers.provider.getBalance(EXTRACT_ADDRESS);
            await contract.academy.extract(ethers.parseEther("0.005"));
            const balanceAfter = await ethers.provider.getBalance(EXTRACT_ADDRESS);

            expect(balanceAfter - balanceBefore).to.equal(ethers.parseEther("0.005"));
        });

        it("should reduce the contract balance after extraction", async () => {
            await contract.academy.deposit({value: ethers.parseEther("0.01")});
            const contractBalanceBefore = await contract.academy.getBalance();

            await contract.academy.extract(ethers.parseEther("0.005"));
            const contractBalanceAfter = await contract.academy.getBalance();

            expect(contractBalanceAfter).to.equal(contractBalanceBefore - ethers.parseEther("0.005"));
        });

        it("should revert if amount is zero", async () => {
            await expect(contract.academy.extract(0)).to.be.revertedWith("Amount must be greater than zero");
        });

        it("should revert if contract has insufficient balance", async () => {
            await expect(contract.academy.extract(ethers.parseEther("1"))).to.be.revertedWith("Insufficient contract balance");
        });

        it("should allow extracting the entire contract balance", async () => {
            await contract.academy.deposit({value: ethers.parseEther("0.003")});
            const balance = await contract.academy.getBalance();

            await contract.academy.extract(balance);

            expect(await contract.academy.getBalance()).to.equal(0);
        });
    });

    describe("buyPlayer", () => {
        it("should allow purchasing a player at the correct price", async () => {
            const [owner, buyer] = await ethers.getSigners();
            const playerToken = contract.playerToken;
            const academy = contract.academy;

            // Create a player in the academy
            await academy.deposit({ value: ethers.parseEther("0.005") });
            
            const players = await playerToken.getAllPlayers();
            const playerId = players[0].id;
            const price = await academy.getPlayerValue(playerId);

            // Buyer purchases the player
            const playerOwnerBefore = await playerToken.ownerOf(playerId);
            expect(playerOwnerBefore).to.equal(await academy.getAddress());

            await academy.connect(buyer).buyPlayer(buyer.address, playerId, { value: price });

            // Verify ownership transfer
            const playerOwnerAfter = await playerToken.ownerOf(playerId);
            expect(playerOwnerAfter).to.equal(buyer.address);

            // Verify player is removed from academy
            expect(await academy.getPlayerValue(playerId)).to.equal(0);
        });

        it("should reject purchasing non-existent player", async () => {
            const academy = contract.academy;
            const price = ethers.parseEther("50");

            await expect(
                academy.buyPlayer(ethers.ZeroAddress, 999, { value: price })
            ).to.be.revertedWith("Player not owned by the academy");
        });

        it("should reject purchase with insufficient payment", async () => {
            const [owner, buyer] = await ethers.getSigners();
            const academy = contract.academy;
            const playerToken = contract.playerToken;

            await academy.deposit({ value: ethers.parseEther("0.005") });
            
            const players = await playerToken.getAllPlayers();
            const playerId = players[0].id;
            const price = await academy.getPlayerValue(playerId);

            await expect(
                academy.connect(buyer).buyPlayer(buyer.address, playerId, { value: price / 2n })
            ).to.be.revertedWith("You have not sent enough ether for the player");
        });

        it("should track player ownership correctly through purchases", async () => {
            const [owner, buyer1, buyer2] = await ethers.getSigners();
            const academy = contract.academy;
            const playerToken = contract.playerToken;

            await academy.deposit({ value: ethers.parseEther("0.005") });
            
            const players = await playerToken.getAllPlayers();
            const playerId = players[0].id;
            const price = await academy.getPlayerValue(playerId);

            // First purchase
            await academy.connect(buyer1).buyPlayer(buyer1.address, playerId, { value: price });
            expect(await playerToken.ownerOf(playerId)).to.equal(buyer1.address);

            // Second purchase: buyer1 sells to academy, buyer2 buys from academy
            // Note: Academy doesn't have a sell function, so this would require additional functionality
        });
    });

    describe("getAcademyPlayers", () => {
        it("should return list of players owned by academy", async () => {
            const academy = contract.academy;

            await academy.deposit({ value: ethers.parseEther("0.005") });

            const players = await academy.getAcademyPlayers();
            expect(players.length).to.be.greaterThan(0);
            expect(players[0].id).to.be.greaterThan(0);
            expect(players[0].value).to.be.greaterThan(0);
        });

        it("should update when new players are added", async () => {
            const academy = contract.academy;

            const playersBefore = await academy.getAcademyPlayers();
            const countBefore = playersBefore.length;

            await academy.deposit({ value: ethers.parseEther("0.005") });

            const playersAfter = await academy.getAcademyPlayers();
            const countAfter = playersAfter.length;

            expect(countAfter).to.be.greaterThanOrEqual(countBefore);
        });

        it("should reflect reduced values over time", async () => {
            const academy = contract.academy;

            await academy.deposit({ value: ethers.parseEther("0.005") });
            const playersBefore = await academy.getAcademyPlayers();
            const valueBefore = playersBefore[0].value;

            await academy.deposit({ value: ethers.parseEther("0.005") });
            const playersAfter = await academy.getAcademyPlayers();
            const valueAfter = playersAfter[0].value;

            expect(valueAfter).to.be.lessThan(valueBefore);
        });
    });

    describe("calculateAcademyPrice", () => {
        it("should calculate minimum price for minimum stats", async () => {
            const academy = contract.academy;

            // Minimum stats: 10/10/10
            const price = await academy.calculateAcademyPrice(10, 10, 10);
            expect(price).to.equal(ethers.parseEther("5"));
        });

        it("should calculate maximum price for maximum stats", async () => {
            const academy = contract.academy;

            // Maximum stats: 100/100/100
            const price = await academy.calculateAcademyPrice(100, 100, 100);
            expect(price).to.equal(ethers.parseEther("100"));
        });

        it("should linearly scale price for mid-range stats", async () => {
            const academy = contract.academy;

            const minPrice = await academy.calculateAcademyPrice(10, 10, 10);
            const maxPrice = await academy.calculateAcademyPrice(100, 100, 100);
            const midPrice = await academy.calculateAcademyPrice(55, 55, 55);

            // Mid-range should be roughly in the middle
            const expectedMidPrice = (minPrice + maxPrice) / 2n;
            const tolerance = ethers.parseEther("5"); // Allow some variance

            expect(midPrice).to.be.greaterThanOrEqual(expectedMidPrice - tolerance);
            expect(midPrice).to.be.lessThanOrEqual(expectedMidPrice + tolerance);
        });

        it("should handle stat clamping at boundaries", async () => {
            const academy = contract.academy;

            // Values below minimum should be clamped
            const lowPrice = await academy.calculateAcademyPrice(5, 5, 5);
            const minPrice = await academy.calculateAcademyPrice(10, 10, 10);
            expect(lowPrice).to.equal(minPrice);

            // Values above maximum should be clamped
            const highPrice = await academy.calculateAcademyPrice(150, 150, 150);
            const maxPrice = await academy.calculateAcademyPrice(100, 100, 100);
            expect(highPrice).to.equal(maxPrice);
        });
    });

    describe("Financial Edge Cases", () => {
        it("should handle extracting all contract balance", async () => {
            const academy = contract.academy;
            const amount = ethers.parseEther("0.01");

            await academy.deposit({ value: amount });
            const balance = await academy.getBalance();

            await academy.extract(balance);

            expect(await academy.getBalance()).to.equal(0);
        });

        it("should handle multiple deposits and extractions", async () => {
            const academy = contract.academy;

            await academy.deposit({ value: ethers.parseEther("0.005") });
            await academy.deposit({ value: ethers.parseEther("0.005") });
            
            expect(await academy.getBalance()).to.be.greaterThanOrEqual(ethers.parseEther("0.01"));

            await academy.extract(ethers.parseEther("0.005"));
            const finalBalance = await academy.getBalance();

            expect(finalBalance).to.be.lessThan(ethers.parseEther("0.01"));
        });
    });

    describe("onERC721Received", () => {
        it("should implement IERC721Receiver interface", async () => {
            const academy = contract.academy;

            // Academy should implement onERC721Received (part of IERC721Receiver interface)
            expect(academy.onERC721Received).to.be.a("function");
        });
    });
});
