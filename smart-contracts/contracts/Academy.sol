// SPDX-License-Identifier: MIT
pragma solidity 0.8.21;

import "./PlayerToken.sol";

contract Academy is IERC721Receiver {
    PlayerToken playerToken;

    uint[] playerList = new uint[](0);
    mapping(uint256 => uint256) public playerValue;

    constructor(address playerTokenAddress) {
        playerToken = PlayerToken(playerTokenAddress);
    }

    function deposit() external payable {
        require(msg.value > 0, "You must send some ether to deposit");

        if (getBalance() > 0.004 ether) {
            (uint256 id, uint attack, uint defense) = playerToken.mintPlayer(address(this));
            playerValue[id] = 0.004 ether + (0.004 ether * (attack + defense)) / 200;
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

    function onERC721Received(
        address,
        address,
        uint256 tokenId,
        bytes calldata
    ) external override returns (bytes4) {
        playerList.push(tokenId);

        return this.onERC721Received.selector;
    }
}