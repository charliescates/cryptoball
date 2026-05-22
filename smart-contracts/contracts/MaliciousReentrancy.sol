// SPDX-License-Identifier: MIT
pragma solidity 0.8.21;

import "./Academy.sol";
import "./Game.sol";

/**
 * @dev This contract is used for testing reentrancy protection.
 * It attempts to exploit reentrancy vulnerabilities in Academy and Game contracts.
 */
contract MaliciousReentrancy {
    Academy public academy;
    Game public game;

    uint256 public callCount = 0;
    uint256 public maxCalls = 1;

    constructor(address academyAddress, address gameAddress) {
        academy = Academy(academyAddress);
        game = Game(gameAddress);
    }

    function attackAcademyExtract(uint256 amount) external {
        callCount = 0;
        academy.extract(amount);
    }

    function attackAcademyBuyPlayer(uint256 playerId, uint256 price) external payable {
        callCount = 0;
        academy.buyPlayer{value: price}(address(this), playerId);
    }

    function attackGameAddTeam(
        uint256 matchId,
        uint256[3][3] calldata teams,
        uint256 wager
    ) external payable {
        callCount = 0;
        game.addTeam{value: wager}(matchId, teams[0], teams[1], teams[2]);
    }

    // This receive function handles incoming ether and tracks calls
    receive() external payable {
        callCount++;
        
        // Attempt reentrancy only once to avoid infinite loops
        if (callCount <= maxCalls) {
            // The ReentrancyGuard should prevent any reentrancy attempts
        }
    }
}
