// SPDX-License-Identifier: MIT
pragma solidity 0.8.21;

import "./PlayerToken.sol";
import "./Academy.sol";
import "hardhat/console.sol";

/**
 * Refactor to replace uint with uint8 where possible
 */
contract Game {
    uint256 private _tokenIdCounter = 1;
    PlayerToken playerToken;
    Academy academy;
    uint randomCounter = 0;

    struct Match {
        uint256 wagerRequired;
        address homeAddress;
        Team homeTeam;
        address awayAddress;
        Team awayTeam;
        uint256 pot;
    }

    struct Team {
        uint256[3] attackingPlayers;
        uint256[3] midfieldPlayers;
        uint256[3] defensivePlayers;
    }

    mapping(uint256 => Match) public matches;

    event NewMatch(uint256 matchId);
    event MatchPlayed(uint256 matchId, uint8 homeScore, uint8 awayScore);
    event PlayerScored(uint256 matchId, uint256 playerId);

    constructor(address playerTokenAddress, address academyAddress) {
        playerToken = PlayerToken(playerTokenAddress);
        academy = Academy(academyAddress);
    }

    function createGame(uint wagerRequired, address homeAddress, address awayAddress) external payable {
        console.log("Making game");
        Match memory game;
        game.wagerRequired = wagerRequired;
        game.homeAddress = homeAddress;
        game.awayAddress = awayAddress;
        game.pot = wagerRequired * 2;
        matches[_tokenIdCounter] = game;
        console.log("Made game");

        emit NewMatch(_tokenIdCounter++);
    }

    function getMatch(uint256 matchId) external view returns (Match memory) {
        return matches[matchId];
    }

    function getMatchList() external view returns (uint256[] memory) {
        uint256[] memory matchIds = new uint256[](_tokenIdCounter - 1);
        uint256 count = 0;
        for (uint256 i = 1; i < _tokenIdCounter; i++) {
            if (matches[i].homeAddress != address(0)) {
                matchIds[count] = i;
                count++;
            }
        }
        return matchIds;
    }

    function addTeam(
        uint256 matchId,
        uint256[3] memory attackingPlayers,
        uint256[3] memory midfieldPlayers,
        uint256[3] memory defensivePlayers) external payable {
        console.log("Starting match");
        Match storage game = matches[matchId];
        require(
            msg.sender == game.homeAddress || msg.sender == game.awayAddress,
            "You must be one of the teams playing in the match"
        );

        require(
            msg.value == game.wagerRequired,
            string.concat(Strings.toString(msg.value), " does not match required wager of ", Strings.toString(game.wagerRequired))
        );

        console.log("Adding team");

        if (msg.sender == game.homeAddress) {
            validateTeam(attackingPlayers, midfieldPlayers, defensivePlayers);
            game.homeTeam = Team(attackingPlayers, midfieldPlayers, defensivePlayers);
            console.log("Home team added");
        } else {
            validateTeam(attackingPlayers, midfieldPlayers, defensivePlayers);
            game.awayTeam = Team(attackingPlayers, midfieldPlayers, defensivePlayers);
            console.log("Away team added");
        }

        console.log("Game, home team included: %s, away team included: %s", isEmpty(game.homeTeam), isEmpty(game.awayTeam));

        if (!isEmpty(game.homeTeam) && !isEmpty(game.awayTeam)) {
            console.log("Playing match");
            playMatch(matchId);
        }
    }

    function isEmpty(Team memory team) private pure returns (bool) {
        return team.attackingPlayers[0] == 0
        && team.attackingPlayers[1] == 0
        && team.attackingPlayers[2] == 0
        && team.midfieldPlayers[0] == 0
        && team.midfieldPlayers[1] == 0
        && team.midfieldPlayers[2] == 0
        && team.defensivePlayers[0] == 0
        && team.defensivePlayers[1] == 0
        && team.defensivePlayers[2] == 0;
    }

    function playMatch(uint256 matchId) internal returns (uint8 homeGoals, uint8 awayGoals) {
        Match memory game = matches[matchId];
        
        (homeGoals, awayGoals) = iterateThroughGame(
            game.homeTeam.attackingPlayers,
            game.homeTeam.midfieldPlayers,
            game.homeTeam.defensivePlayers,
            game.awayTeam.attackingPlayers,
            game.awayTeam.midfieldPlayers,
            game.awayTeam.defensivePlayers
        );

        // Update player stats
        updatePlayerStats(game.homeTeam, game.awayTeam);

        // Assign goals to scorers
        assignGoals(matchId, homeGoals, game.homeTeam);
        assignGoals(matchId, awayGoals, game.awayTeam);

        // Distribute winnings
        distributeWinnings(matchId, homeGoals, awayGoals, game.pot, game.homeAddress, game.awayAddress);

        emit MatchPlayed(matchId, homeGoals, awayGoals);

        delete matches[matchId];

        return (homeGoals, awayGoals);
    }

    function updatePlayerStats(Team memory homeTeam, Team memory awayTeam) private {
        for (uint i = 0; i < 3; i++) {
            if (homeTeam.attackingPlayers[i] != 0) {
                playerToken.playAttackGame(homeTeam.attackingPlayers[i]);
            }
            if (homeTeam.midfieldPlayers[i] != 0) {
                playerToken.playMidfieldGame(homeTeam.midfieldPlayers[i]);
            }
            if (homeTeam.defensivePlayers[i] != 0) {
                playerToken.playDefenseGame(homeTeam.defensivePlayers[i]);
            }
            if (awayTeam.attackingPlayers[i] != 0) {
                playerToken.playAttackGame(awayTeam.attackingPlayers[i]);
            }
            if (awayTeam.midfieldPlayers[i] != 0) {
                playerToken.playMidfieldGame(awayTeam.midfieldPlayers[i]);
            }
            if (awayTeam.defensivePlayers[i] != 0) {
                playerToken.playDefenseGame(awayTeam.defensivePlayers[i]);
            }
        }
    }

    function distributeWinnings(uint256 matchId, uint8 homeGoals, uint8 awayGoals, uint256 pot, address homeAddress, address awayAddress) private {
        uint academyShare = (pot * 5) / 100;
        console.log("Sending money to the academy: %s wen", academyShare);
        academy.deposit{value: academyShare}();
        
        uint remainingPot = pot - academyShare;

        if (homeGoals > awayGoals) {
            console.log("Home team wins, sending %s wen to home team: %s", remainingPot, homeAddress);
            payable(homeAddress).transfer(remainingPot);
        } else if (awayGoals > homeGoals) {
            console.log("Away team wins, sending %s wen to away team: %s", remainingPot, awayAddress);
            payable(awayAddress).transfer(remainingPot);
        } else {
            console.log("It's a draw, sending %s wen to home and away teams", remainingPot / 2);
            payable(homeAddress).transfer(remainingPot / 2);
            payable(awayAddress).transfer(remainingPot / 2);
        }
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

    function assignGoals(uint256 matchId, uint goals, Team memory team) private {
        uint[] memory players = new uint[](5);
        uint[] memory attackRange = new uint[](6);
        uint playerCount = 0;
        for (uint i = 0; i < 3; i++) {
            if (team.attackingPlayers[i] != 0) {
                players[playerCount] = team.attackingPlayers[i];
                ( , uint attackStat, , , , , ,) = playerToken.getPlayerAttributes(team.attackingPlayers[i]);
                attackRange[playerCount + 1] = attackRange[playerCount] + attackStat;
                playerCount++;
            }
            if (team.midfieldPlayers[i] != 0) {
                players[playerCount] = team.midfieldPlayers[i];
                ( , uint attackStat, , , , , ,) = playerToken.getPlayerAttributes(team.midfieldPlayers[i]);
                attackRange[playerCount + 1] = attackRange[playerCount] + attackStat;
                playerCount++;
            }
            if (team.defensivePlayers[i] != 0) {
                players[playerCount] = team.defensivePlayers[i];
                ( , uint attackStat, , , , , ,) = playerToken.getPlayerAttributes(team.defensivePlayers[i]);
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
                    console.log("Player %d scored a goal", players[j]);
                    playerToken.scoreGoal(players[j]);
                    emit PlayerScored(matchId, players[j]);
                    break;
                }
            }
        }
    }

    function calculateTeamStats(uint256[3] memory attack, uint256[3] memory midfield, uint256[3] memory defense) private view returns (uint, uint) {
        uint teamAttack = 0;
        uint teamDefense = 0;
        for (uint8 i = 0; i < 3; i++) {
            // TODO Add playertype changes in here
            teamAttack += getAttack(attack[i]) * (110 + getPlayerTypeAdjustment(attack[i], true, false, true)) / 100;
            teamAttack += getAttack(midfield[i]) * (100 + getPlayerTypeAdjustment(midfield[i], false, false, true)) / 100;
            teamAttack += getAttack(defense[i]) * (90 + getPlayerTypeAdjustment(defense[i], false, true, true)) / 100;

            teamDefense += getDefense(attack[i]) * (90 + getPlayerTypeAdjustment(attack[i], true, false, false)) / 100;
            teamDefense += getDefense(midfield[i]) * (100 + getPlayerTypeAdjustment(midfield[i], false, false, false)) / 100;
            teamDefense += getDefense(defense[i]) * (110 + getPlayerTypeAdjustment(defense[i], false, true, false)) / 100;
        }

        // Calculate team chemistry bonuses
        (uint attackBonus, uint defenseBonus) = calculateTeamChemistry(attack, midfield, defense);
        teamAttack = teamAttack * (100 + attackBonus) / 100;
        teamDefense = teamDefense * (100 + defenseBonus) / 100;

        return (teamAttack, teamDefense);
    }

    function calculateTeamChemistry(uint256[3] memory attack, uint256[3] memory midfield, uint256[3] memory defense) private view returns (uint attackBonus, uint defenseBonus) {
        // Get player types for all positions
        uint8[9] memory playerTypes;
        bool[9] memory usedInBonus;
        
        for (uint i = 0; i < 3; i++) {
            if (defense[i] != 0) {
                (, , , , , , , uint pType) = playerToken.getPlayerAttributes(defense[i]);
                playerTypes[i] = uint8(pType);
            }
            if (midfield[i] != 0) {
                (, , , , , , , uint pType) = playerToken.getPlayerAttributes(midfield[i]);
                playerTypes[i + 3] = uint8(pType);
            }
            if (attack[i] != 0) {
                (, , , , , , , uint pType) = playerToken.getPlayerAttributes(attack[i]);
                playerTypes[i + 6] = uint8(pType);
            }
        }

        // Indices: 0-2 = Defense, 3-5 = Midfield, 6-8 = Attack
        // Player Types: 0=Enforcer, 1=Target Man, 2=Playmaker, 3=Anchor

        // Check for 6-point bonuses first (higher priority)
        
        // Defense: Anchor + Enforcer + Enforcer = +6 defense
        if (!usedInBonus[0] && !usedInBonus[1] && !usedInBonus[2]) {
            if (playerTypes[0] == 3 && playerTypes[1] == 0 && playerTypes[2] == 0) {
                defenseBonus += 6;
                usedInBonus[0] = true;
                usedInBonus[1] = true;
                usedInBonus[2] = true;
            }
        }

        // Midfield: Playmaker + Attack: Target Man + Target Man = +6 attack
        if (!usedInBonus[3] && !usedInBonus[6] && !usedInBonus[7]) {
            if (playerTypes[3] == 2 && playerTypes[6] == 1 && playerTypes[7] == 1) {
                attackBonus += 6;
                usedInBonus[3] = true;
                usedInBonus[6] = true;
                usedInBonus[7] = true;
            }
        }

        // Defense: Enforcer + Enforcer = +3 defense
        if (!usedInBonus[0] && !usedInBonus[1]) {
            if (playerTypes[0] == 0 && playerTypes[1] == 0) {
                defenseBonus += 3;
                usedInBonus[0] = true;
                usedInBonus[1] = true;
            }
        }

        // Check for 3-point bonuses
        
        // Defense: Anchor + Enforcer = +3 defense
        if (!usedInBonus[0] && !usedInBonus[1]) {
            if (playerTypes[0] == 3 && playerTypes[1] == 0) {
                defenseBonus += 3;
                usedInBonus[0] = true;
                usedInBonus[1] = true;
            }
        }

        // Midfield: Playmaker + Attack: Target Man = +3 attack
        if (!usedInBonus[3] && !usedInBonus[6]) {
            if (playerTypes[3] == 2 && playerTypes[6] == 1) {
                attackBonus += 3;
                usedInBonus[3] = true;
                usedInBonus[6] = true;
            }
        }

        // Defense: Anchor + Midfield: Playmaker + Attack: Target Man = +3 defense, +3 attack
        if (!usedInBonus[0] && !usedInBonus[3] && !usedInBonus[6]) {
            if (playerTypes[0] == 3 && playerTypes[3] == 2 && playerTypes[6] == 1) {
                defenseBonus += 3;
                attackBonus += 3;
                usedInBonus[0] = true;
                usedInBonus[3] = true;
                usedInBonus[6] = true;
            }
        }

        // Attack: Target Man + Enforcer = +3 attack
        if (!usedInBonus[6] && !usedInBonus[7]) {
            if (playerTypes[6] == 1 && playerTypes[7] == 0) {
                attackBonus += 3;
                usedInBonus[6] = true;
                usedInBonus[7] = true;
            }
        }

        // Midfield: Playmaker + Anchor = +3 defense
        if (!usedInBonus[3] && !usedInBonus[4]) {
            if (playerTypes[3] == 2 && playerTypes[4] == 3) {
                defenseBonus += 3;
                usedInBonus[3] = true;
                usedInBonus[4] = true;
            }
        }

        // Midfield: Playmaker + Anchor + Enforcer = +3 defense, +3 attack
        if (!usedInBonus[3] && !usedInBonus[4] && !usedInBonus[5]) {
            if (playerTypes[3] == 2 && playerTypes[4] == 3 && playerTypes[5] == 0) {
                defenseBonus += 3;
                attackBonus += 3;
                usedInBonus[3] = true;
                usedInBonus[4] = true;
                usedInBonus[5] = true;
            }
        }

        // Attack: Target Man + Playmaker = +3 attack
        if (!usedInBonus[6] && !usedInBonus[7]) {
            if (playerTypes[6] == 1 && playerTypes[7] == 2) {
                attackBonus += 3;
                usedInBonus[6] = true;
                usedInBonus[7] = true;
            }
        }

        return (attackBonus, defenseBonus);
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
        ( , uint attack, , , , , ,) = playerToken.getPlayerAttributes(playerId);
        return attack;
    }

    function getDefense(uint256 playerId) private view returns (uint) {
        ( , , , uint defense, , , ,) = playerToken.getPlayerAttributes(playerId);
        return defense;
    }

    function getPlayerTypeAdjustment(uint playerId, bool isAttack, bool isDefense, bool isAttackingStat) private view returns (uint8) {
        ( , , , , , , , uint playerType) = playerToken.getPlayerAttributes(playerId);
        if (playerType == 0) { // Enforcer
            if (isAttack) {
                return isAttackingStat ? 5 : 0; 
            } else if (isDefense) {
                return isAttackingStat ? 0 : 10; 
            } else {
                return isAttackingStat ? 0 : 5; 
            }
        } else if (playerType == 1) { // Target Man
            if (isAttack) {
                return isAttackingStat ? 10 : 0; 
            } else {
                return 0;
            }
        } else if (playerType == 2) { // Playmaker
            if (isAttack) {
                return isAttackingStat ? 5 : 0; 
            } else if (isDefense) {
                return 0;
            } else {
                return isAttackingStat ? 10 : 0; 
            }
        } else {
            // Anchor
            if (isAttack) {
                return 0; 
            } else if (isDefense) {
                return isAttackingStat ? 0 : 10; 
            } else {
                return isAttackingStat ? 0 : 5; 
            } 
        }
    }

    function sendWagerToWinner(address winner) private {
        uint wager = msg.value;
        
        wager = wager - wager / 100;

        payable(winner).transfer(wager);
    }
}
