// SPDX-License-Identifier: MIT
pragma solidity 0.8.21;

import "./PlayerToken.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";
import "hardhat/console.sol";

contract Academy is IERC721Receiver, ReentrancyGuard {
    PlayerToken playerToken;
    address public constant EXTRACT_ADDRESS = 0x05B665d3Ba0a83f5259C114fA3F2d2ECD8A00B29;

    uint256 private constant MIN_STAT = 10;
    uint256 private constant MAX_STAT = 100;
    uint256 private constant STAT_COUNT = 3;
    uint256 private constant MIN_PRICE = 5 ether;
    uint256 private constant MAX_PRICE = 100 ether;

    mapping(uint256 => uint256) public playerValue;

    struct AcademyPlayer {
        uint256 id;
        uint attack;
        uint defense;
        uint potential;
        uint playerType;
        uint value;
    }

    constructor(address playerTokenAddress) {
        playerToken = PlayerToken(playerTokenAddress);
    }

    function deposit() external payable {
        require(msg.value > 0, "You must send some ether to deposit");

        if (getBalance() > 0.004 ether) {
            (uint256 id, uint attack, uint defense) = playerToken.mintPlayer(
                address(this)
            );

            (, , , , uint potential, , , ) = playerToken.getPlayerAttributes(id);
            playerValue[id] = calculateAcademyPrice(attack, defense, potential);
            console.log("Player %d minted with value %d", id, playerValue[id]);
            for (uint i = 1; i < id; i++) {
                playerValue[i] = (playerValue[i] * 9) / 10;
                console.log(
                    "Player %d value updated to %d",
                    i,
                    playerValue[i]
                );
            }
        }
    }

    function getPlayerValue(uint256 id) external view returns (uint256) {
        return playerValue[id];
    }

    function calculateAcademyPrice(
        uint attack,
        uint defense,
        uint potential
    ) public pure returns (uint256) {
        uint256 attackScore = clampStat(attack);
        uint256 defenseScore = clampStat(defense);
        uint256 potentialScore = clampStat(potential);

        uint256 totalStat = attackScore + defenseScore + potentialScore;
        uint256 minTotalStat = MIN_STAT * STAT_COUNT;
        uint256 statRange = (MAX_STAT - MIN_STAT) * STAT_COUNT;

        // Linearly maps 10/10/10 -> 5 POL and 100/100/100 -> 100 POL.
        return
            MIN_PRICE +
            ((totalStat - minTotalStat) * (MAX_PRICE - MIN_PRICE)) /
            statRange;
    }

    function clampStat(uint stat) private pure returns (uint256) {
        if (stat < MIN_STAT) {
            return MIN_STAT;
        }

        if (stat > MAX_STAT) {
            return MAX_STAT;
        }

        return stat;
    }

    function getBalance() public view returns (uint) {
        return address(this).balance;
    }

    function buyPlayer(address toAccount, uint256 playerId) external payable nonReentrant {
        require(playerValue[playerId] > 0, "Player not owned by the academy");
        require(
            msg.value >= playerValue[playerId],
            "You have not sent enough ether for the player"
        );

        // Effects: Update state before external calls (checks-effects-interactions)
        delete playerValue[playerId];
        
        // Interactions: Transfer player token
        playerToken.transfer(address(this), toAccount, playerId);
    }

    function getAcademyPlayers()
        public
        view
        returns (AcademyPlayer[] memory)
    {
        console.log("Getting academy players...");
        PlayerToken.Player[] memory allPlayers = playerToken.getAllPlayers();
        uint count = 0;

        console.log("Total players in world: %d", allPlayers.length);

        AcademyPlayer[] memory players = new AcademyPlayer[](allPlayers.length);
        for (uint i = 0; i < allPlayers.length; i++) {
            console.log("Checking player %d with value %d", allPlayers[i].id, playerValue[allPlayers[i].id]);
            PlayerToken.Player memory player = allPlayers[i];

            if (playerValue[player.id] > 0) {
                console.log("Adding player %d to academy list", player.id);
                players[count++] = AcademyPlayer(
                    player.id,
                    player.attack,
                    player.defense,
                    player.potential,
                    player.playerType,
                    playerValue[player.id]
                );
            }
        }

        console.log("Total players returned: %d", count);

        assembly {
            mstore(players, count)
        }

        return players;
    }

    function extract(uint256 amount) external nonReentrant {
        require(amount > 0, "Amount must be greater than zero");
        require(address(this).balance >= amount, "Insufficient contract balance");

        // Effects: Update state before external calls
        // (No state changes needed here, but pattern is maintained)
        
        // Interactions: Send funds
        (bool success, ) = payable(EXTRACT_ADDRESS).call{value: amount}("");
        require(success, "Transfer failed");
    }

    function onERC721Received(
        address,
        address,
        uint256,
        bytes calldata
    ) external pure override returns (bytes4) {
        return this.onERC721Received.selector;
    }
}
