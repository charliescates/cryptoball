// SPDX-License-Identifier: MIT
pragma solidity 0.8.21;

import "./PlayerToken.sol";

contract Academy is IERC721Receiver {
    PlayerToken playerToken;

    mapping(uint256 => uint256) public playerValue;

    struct AcademyPlayer {
        uint256 id;
        uint attack;
        uint defense;
        uint potential;
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
            for (uint i = 1; i < id; i++) {
                playerValue[i] = (playerValue[i] * 9) / 10;
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

        playerToken.safeTransferFrom(address(this), toAccount, playerId);
        delete playerValue[playerId];
    }

    function getAcademyPlayers()
        public
        view
        returns (AcademyPlayer[] memory players)
    {
        PlayerToken.Player[] memory allPlayers = playerToken.getAllPlayers();
        uint count = 0;

        for (uint i = 1; i < allPlayers.length; i++) {
            PlayerToken.Player memory player = allPlayers[i];

            if (playerValue[player.id] > 0) {
                count++;
            }
        }

        players = new AcademyPlayer[](count);
        for (uint i = 1; i < allPlayers.length; i++) {
            PlayerToken.Player memory player = allPlayers[i];

            if (playerValue[player.id] > 0) {
                players[count++] = AcademyPlayer(
                    player.id,
                    player.attack,
                    player.defense,
                    player.potential,
                    playerValue[player.id]
                );
            }
        }
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
