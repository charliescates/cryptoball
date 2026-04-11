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

        expect(ether).to.greaterThan(ethers.parseEther("0.004"));
        expect(ether).to.lessThan(ethers.parseEther("0.008"));
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
});