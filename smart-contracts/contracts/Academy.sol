// SPDX-License-Identifier: MIT
pragma solidity 0.8.21;

import "./PlayerToken.sol";
import "hardhat/console.sol";

contract Academy is IERC721Receiver {
    PlayerToken playerToken;
    address public constant EXTRACT_ADDRESS = 0x05B665d3Ba0a83f5259C114fA3F2d2ECD8A00B29;

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
            playerValue[id] =
                0.004 ether +
                (0.004 ether * (attack + defense)) /
                200;
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

    function getBalance() public view returns (uint) {
        return address(this).balance;
    }

    function buyPlayer(address toAccount, uint256 playerId) external payable {
        require(playerValue[playerId] > 0, "Player not owned by the academy");
        require(
            msg.value >= playerValue[playerId],
            "You have not sent enough ether for the player"
        );

        playerToken.transfer(address(this), toAccount, playerId);
        delete playerValue[playerId];
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

    function extract(uint256 amount) external {
        require(amount > 0, "Amount must be greater than zero");
        require(address(this).balance >= amount, "Insufficient contract balance");

        (bool success, ) = EXTRACT_ADDRESS.call{value: amount}("");
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
