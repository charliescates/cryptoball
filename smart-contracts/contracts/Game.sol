// SPDX-License-Identifier: MIT
pragma solidity 0.8.21;

import "./PlayerToken.sol";
import "./Academy.sol";

/**
 * Refactor to replace uint with uint8 where possible
 */
contract Game {
    PlayerToken playerToken;
    Academy academy;
    uint randomCounter = 0;

    event MatchPlayed(uint8 homeScore, uint8 awayScore);
    event PlayerScored(uint256 playerId);

    constructor(address playerTokenAddress, address academyAddress) {
        playerToken = PlayerToken(playerTokenAddress);
        academy = Academy(academyAddress);
    }

    function playMatch(
        uint256[3] memory homeAttackingPlayers,
        uint256[3] memory homeMidfieldPlayers,
        uint256[3] memory homeDefensivePlayers,
        uint256[3] memory awayAttackingPlayers,
        uint256[3] memory awayMidfieldPlayers,
        uint256[3] memory awayDefensivePlayers
    ) external payable returns (uint8 homeGoals, uint8 awayGoals){
        require(
            msg.value > 0 ether,
            "You must wager some ether to play a match"
        );
        // require(
        //     playerToken.ownerOf(homePlayerId) == payable(homeOwnerAddress),
        //     "Home player does not belong to home owner"
        // ACTUALLY: we should just check all players on each team are owned by one person, then send the ether to the winner 
        // );

        address homeAddress = validateTeam(homeAttackingPlayers, homeMidfieldPlayers, homeDefensivePlayers);
        address awayAddress = validateTeam(awayAttackingPlayers, awayMidfieldPlayers, awayDefensivePlayers);

        (homeGoals, awayGoals) = iterateThroughGame(homeAttackingPlayers, homeMidfieldPlayers, homeDefensivePlayers, awayAttackingPlayers, awayMidfieldPlayers, awayDefensivePlayers);

        for (uint i = 0; i < 3; i++) {
            if (homeAttackingPlayers[i] != 0) {
                playerToken.playAttackGame(homeAttackingPlayers[i]);
            }
            if (homeMidfieldPlayers[i] != 0) {
                playerToken.playMidfieldGame(homeMidfieldPlayers[i]);
            }
            if (homeDefensivePlayers[i] != 0) {
                playerToken.playDefenseGame(homeDefensivePlayers[i]);
            }
            if (awayAttackingPlayers[i] != 0) {
                playerToken.playAttackGame(awayAttackingPlayers[i]);
            }
            if (awayMidfieldPlayers[i] != 0) {
                playerToken.playMidfieldGame(awayMidfieldPlayers[i]);
            }
            if (awayDefensivePlayers[i] != 0) {
                playerToken.playDefenseGame(awayDefensivePlayers[i]);
            }
        }

        assignGoals(homeGoals, homeAttackingPlayers, homeMidfieldPlayers, homeDefensivePlayers);
        assignGoals(awayGoals, awayAttackingPlayers, awayMidfieldPlayers, awayDefensivePlayers);

        if (homeGoals > awayGoals) {
            payable(homeAddress).transfer(msg.value);
        } else if (awayGoals > homeGoals) {
            payable(awayAddress).transfer(msg.value);
        } else {
            academy.deposit{value: msg.value}();
        }

        emit MatchPlayed(homeGoals, awayGoals);

        return (homeGoals, awayGoals);
    }

    function iterateThroughGame(
        uint256[3] memory homeAttackingPlayers,
        uint256[3] memory homeMidfieldPlayers,
        uint256[3] memory homeDefensivePlayers,
        uint256[3] memory awayAttackingPlayers,
        uint256[3] memory awayMidfieldPlayers,
        uint256[3] memory awayDefensivePlayers) private returns (uint8 homeGoals, uint8 awayGoals) {
        (uint homeAttack, uint homeDefense) = calculateTeamStats(homeAttackingPlayers, homeMidfieldPlayers, homeDefensivePlayers);
        (uint awayAttack, uint awayDefense) = calculateTeamStats(awayAttackingPlayers, awayMidfieldPlayers, awayDefensivePlayers);

        console.log(
            "Home team stats: Attack %d Defense %d",
            homeAttack,
            homeDefense
        );
        console.log(
            "Away team stats: Attack %d Defense %d",
            awayAttack,
            awayDefense
        );
        
        for (uint i = 0; i < 20; i++) {
            homeGoals += tryAndScore(homeAttack, awayDefense);
            awayGoals += tryAndScore(awayAttack, homeDefense);
        }

        console.log("Home: %d Away: %d", homeGoals, awayGoals);

        return (homeGoals, awayGoals);
    }

    function tryAndScore(uint attack, uint defense) private returns (uint8) {
        if (randomCounter == type(uint).max) {
            randomCounter = 0;
        }
        uint random = uint(
            keccak256(
                abi.encodePacked(
                    block.timestamp,
                    msg.sender,
                    attack + defense + randomCounter++
                )
            )
        ) % 100;
        uint total = attack + defense;
        uint chanceOfScoring = 60 + (defense * 40) / total;

        // console.log("Random: %d Chance: %d", random % 100, chanceOfScoring);

        if (random % 100 > chanceOfScoring) {
            return 1;
        } else {
            return 0;
        }
    }

    function validateTeam(uint256[3] memory attack, uint256[3] memory midfield, uint256[3] memory defense) private view returns (address owner) {
        uint[] memory team = new uint[](5);
        uint playerCount = 0;
        for (uint i = 0; i < 3; i++) {
            if (attack[i] != 0) {
                if (playerCount == 5) {
                    playerCount++;
                    break;
                }
                team[playerCount] = attack[i];
                playerCount++;

            }
            if (midfield[i] != 0) {
                if (playerCount == 5) {
                    playerCount++;
                    break;
                }
                team[playerCount] = midfield[i];
                playerCount++;
            }
            if (defense[i] != 0) {
                if (playerCount == 5) {
                    playerCount++;
                    break;
                }
                team[playerCount] = defense[i];
                playerCount++;
            }
        }
        require(
            playerCount == 5,
            "Each team must have 5 players to play a match"
        );
        require(
            !hasDuplicates(team),
            "Each team must have unique players"
        );

        owner = playerToken.ownerOf(team[0]);
        for (uint i = 1; i < 5; i++) {
            require(
                playerToken.ownerOf(team[i]) == owner,
                "Each team must be owned by a signle owner"
            );
        }
        return owner;
    }

    function assignGoals(uint goals, uint256[3] memory attack, uint256[3] memory midfield, uint256[3] memory defense) private {
        uint[] memory team = new uint[](5);
        uint[] memory attackRange = new uint[](6);
        uint playerCount = 0;
        for (uint i = 0; i < 3; i++) {
            if (attack[i] != 0) {
                team[playerCount] = attack[i];
                (uint attackStat, , , ,) = playerToken.getPlayerAttributes(attack[i]);
                attackRange[playerCount + 1] = attackRange[playerCount] + attackStat;
                playerCount++;
            }
            if (midfield[i] != 0) {
                team[playerCount] = midfield[i];
                (uint attackStat, , , ,) = playerToken.getPlayerAttributes(midfield[i]);
                attackRange[playerCount + 1] = attackRange[playerCount] + attackStat;
                playerCount++;
            }
            if (defense[i] != 0) {
                team[playerCount] = defense[i];
                (uint attackStat, , , ,) = playerToken.getPlayerAttributes(defense[i]);
                attackRange[playerCount + 1] = attackRange[playerCount] + attackStat;
                playerCount++;
            }
        }

        for (uint i = 0; i < goals; i++) {
            uint random = uint(
                keccak256(
                    abi.encodePacked(
                        block.timestamp,
                        msg.sender,
                        i,
                        "goal"
                    )
                )
            ) % attackRange[5];

            for (uint j = 0; j < 5; j++) {
                if (random < attackRange[j + 1]) {
                    console.log("Player %d scored a goal", team[j]);
                    playerToken.scoreGoal(team[j]);
                    emit PlayerScored(team[j]);
                    break;
                }
            }
        }
    }

    function calculateTeamStats(uint256[3] memory attack, uint256[3] memory midfield, uint256[3] memory defense) private view returns (uint, uint) {
        uint teamAttack = 0;
        uint teamDefense = 0;
        for (uint8 i = 0; i < 3; i++) {
            teamAttack += getAttack(attack[i]) * 110 / 100;
            teamAttack += getAttack(midfield[i]);
            teamAttack += getAttack(defense[i]) * 90 / 100;

            teamDefense += getDefense(attack[i]) * 90 / 100;
            teamDefense += getDefense(midfield[i]);
            teamDefense += getDefense(defense[i]) * 110 / 100;
        }

        return (teamAttack, teamDefense);
    }

    function hasDuplicates(uint256[] memory array) private pure returns (bool) {
        for (uint i = 0; i < array.length; i++) {
            for (uint j = i + 1; j < array.length; j++) {
                if (array[i] == array[j]) {
                    return true;
                }
            }
        }
        return false;
    }

    function getAttack(uint256 playerId) private view returns (uint) {
        (uint attack, , , ,) = playerToken.getPlayerAttributes(playerId);
        return attack;
    }

    function getDefense(uint256 playerId) private view returns (uint) {
        (uint defense, , , ,) = playerToken.getPlayerAttributes(playerId);
        return defense;
    }

    function sendWagerToWinner(address winner) private {
        uint wager = msg.value;
        
        wager = wager - wager / 100;

        payable(winner).transfer(wager);
    }
}
