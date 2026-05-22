// SPDX-License-Identifier: MIT
pragma solidity 0.8.21;

import "./PlayerToken.sol";
import "./Academy.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract Game is ReentrancyGuard {
    uint256 private _tokenIdCounter = 1;
    uint256 public constant MIN_WAGER = 3 ether;
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
    event MatchSnapshot(
        uint256 matchId,
        address homeAddress,
        address awayAddress,
        Team homeTeam,
        Team awayTeam
    );
    event MatchPlayed(uint256 matchId, uint8 homeScore, uint8 awayScore);
    event TournamentMatchPlayed(
        uint256 indexed tournementId,
        uint8 indexed round,
        address homeAddress,
        address awayAddress,
        address winner,
        uint8 homeScore,
        uint8 awayScore
    );
    event ExtraTimePlayed(uint256 matchId, uint8 homeScore, uint8 awayScore);
    event GoldenGoalPlayed(uint256 matchId, uint8 homeScore, uint8 awayScore);
    event PlayerScored(uint256 matchId, uint256 playerId);
    event PlayerStatsUpdated(uint256 matchId, uint256 playerId, string position);
    event TeamStatsCalculated(uint256 matchId, address team, uint256 totalAttack, uint256 totalDefense);
    event WinningsDistributed(
        uint256 matchId,
        address winner,
        uint256 winnings,
        address academy,
        uint256 academyShare,
        address executor,
        uint256 executorFee
    );
    event PlayerMatchInfo(
            uint256 matchId,
            uint256 playerId,
            address owner,
            uint256 attack,
            uint256 defense,
            uint256 potential,
            uint256 gamesLeft,
            uint256 goals,
            uint8 playerType,
            string position
    );

    constructor(address playerTokenAddress, address academyAddress) {
        playerToken = PlayerToken(playerTokenAddress);
        academy = Academy(academyAddress);
    }

    function createGame(uint wagerRequired, address homeAddress, address awayAddress) external payable {
        require(wagerRequired >= MIN_WAGER, "Wager must be at least 3 POL to ensure winner payouts exceed minimum execution fee");

        Match memory game;
        game.wagerRequired = wagerRequired;
        game.homeAddress = homeAddress;
        game.awayAddress = awayAddress;
        game.pot = wagerRequired * 2;
        matches[_tokenIdCounter] = game;

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
        uint256[3] memory defensivePlayers) external payable nonReentrant {
        Match storage game = matches[matchId];
        require(
            msg.sender == game.homeAddress || msg.sender == game.awayAddress,
            "You must be one of the teams playing in the match"
        );

        require(
            msg.value == game.wagerRequired,
            string.concat(Strings.toString(msg.value), " does not match required wager of ", Strings.toString(game.wagerRequired))
        );

        if (msg.sender == game.homeAddress) {
            require(isEmpty(game.homeTeam), "Home team already submitted");
            address owner = _validateTeam(attackingPlayers, midfieldPlayers, defensivePlayers);
            require(owner == msg.sender, "You must own all players in your team");
            game.homeTeam = Team(attackingPlayers, midfieldPlayers, defensivePlayers);
        } else {
            require(isEmpty(game.awayTeam), "Away team already submitted");
            address owner = _validateTeam(attackingPlayers, midfieldPlayers, defensivePlayers);
            require(owner == msg.sender, "You must own all players in your team");
            game.awayTeam = Team(attackingPlayers, midfieldPlayers, defensivePlayers);
        }

        if (!isEmpty(game.homeTeam) && !isEmpty(game.awayTeam)) {
            _playMatch(matchId, msg.sender);
        }
    }

    function playMatch(uint256 matchId, address executor) external returns (uint8 homeGoals, uint8 awayGoals) {
        return _playMatch(matchId, executor);
    }

    function playTournamentMatch(
        address homeAddress,
        Team memory homeTeam,
        address awayAddress,
        Team memory awayTeam,
        uint256 tournementId,
        uint8 round
    ) external returns (address winner, uint8 homeGoals, uint8 awayGoals) {
        (homeGoals, awayGoals) = _simulateMatch(0, homeAddress, homeTeam, awayAddress, awayTeam);

        if (homeGoals > awayGoals) {
            winner = homeAddress;
        } else {
            winner = awayAddress;
        }

        emit TournamentMatchPlayed(tournementId, round, homeAddress, awayAddress, winner, homeGoals, awayGoals);

        return (winner, homeGoals, awayGoals);
    }

    function validateTeam(
        uint256[3] memory attack,
        uint256[3] memory midfield,
        uint256[3] memory defense,
        address expectedOwner
    ) external view returns (bool) {
        address owner = _validateTeam(attack, midfield, defense);
        return owner == expectedOwner;
    }

    function getPlayerAttributes(uint256 playerId) external view returns (
        uint256 id,
        uint256 attack,
        uint256 level,
        uint256 defense,
        uint256 potential,
        uint256 gamesLeft,
        uint256 goals,
        uint256 playerType
    ) {
        return playerToken.getPlayerAttributes(playerId);
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

    function _playMatch(uint256 matchId, address executor) internal returns (uint8 homeGoals, uint8 awayGoals) {
        Match memory game = matches[matchId];
        uint256 gasAtStart = gasleft();

        (homeGoals, awayGoals) = _simulateMatch(
            matchId,
            game.homeAddress,
            game.homeTeam,
            game.awayAddress,
            game.awayTeam
        );

        emit MatchPlayed(matchId, homeGoals, awayGoals);

        // Distribute winnings
        uint256 gasSpentInMatch = gasAtStart - gasleft();
        uint256 executorFee = gasSpentInMatch * tx.gasprice;
        if (executorFee > game.pot) {
            executorFee = game.pot;
        }
        distributeWinnings(matchId, homeGoals, awayGoals, game.pot, game.homeAddress, game.awayAddress, executor, executorFee);


        delete matches[matchId];

        return (homeGoals, awayGoals);
    }

    function _simulateMatch(
        uint256 matchId,
        address homeAddress,
        Team memory homeTeam,
        address awayAddress,
        Team memory awayTeam
    ) private returns (uint8 homeGoals, uint8 awayGoals) {
        (homeGoals, awayGoals) = iterateThroughGame(
            matchId,
            homeAddress,
            awayAddress,
            homeTeam.attackingPlayers,
            homeTeam.midfieldPlayers,
            homeTeam.defensivePlayers,
            awayTeam.attackingPlayers,
            awayTeam.midfieldPlayers,
            awayTeam.defensivePlayers
        );

        // Emit player match info for all players
        emitPlayerMatchInfo(matchId, homeTeam, homeAddress);
        emitPlayerMatchInfo(matchId, awayTeam, awayAddress);

        // Update player stats
        updatePlayerStats(matchId, homeTeam, awayTeam);

        // Assign goals to scorers
        assignGoals(matchId, homeGoals, homeTeam);
        assignGoals(matchId, awayGoals, awayTeam);

        emit MatchSnapshot(matchId, homeAddress, awayAddress, homeTeam, awayTeam);

        return (homeGoals, awayGoals);
    }

    function updatePlayerStats(uint256 matchId, Team memory homeTeam, Team memory awayTeam) private {
        for (uint i = 0; i < 3; i++) {
            if (homeTeam.attackingPlayers[i] != 0) {
                playerToken.playAttackGame(homeTeam.attackingPlayers[i]);
                emit PlayerStatsUpdated(matchId, homeTeam.attackingPlayers[i], "attacking");
            }
            if (homeTeam.midfieldPlayers[i] != 0) {
                playerToken.playMidfieldGame(homeTeam.midfieldPlayers[i]);
                emit PlayerStatsUpdated(matchId, homeTeam.midfieldPlayers[i], "midfield");
            }
            if (homeTeam.defensivePlayers[i] != 0) {
                playerToken.playDefenseGame(homeTeam.defensivePlayers[i]);
                emit PlayerStatsUpdated(matchId, homeTeam.defensivePlayers[i], "defensive");
            }
            if (awayTeam.attackingPlayers[i] != 0) {
                playerToken.playAttackGame(awayTeam.attackingPlayers[i]);
                emit PlayerStatsUpdated(matchId, awayTeam.attackingPlayers[i], "attacking");
            }
            if (awayTeam.midfieldPlayers[i] != 0) {
                playerToken.playMidfieldGame(awayTeam.midfieldPlayers[i]);
                emit PlayerStatsUpdated(matchId, awayTeam.midfieldPlayers[i], "midfield");
            }
            if (awayTeam.defensivePlayers[i] != 0) {
                playerToken.playDefenseGame(awayTeam.defensivePlayers[i]);
                emit PlayerStatsUpdated(matchId, awayTeam.defensivePlayers[i], "defensive");
            }
        }
    }

    function distributeWinnings(
        uint256 matchId,
        uint8 homeGoals,
        uint8 awayGoals,
        uint256 pot,
        address homeAddress,
        address awayAddress,
        address executor,
        uint256 executorFee
    ) private {
        // Calculate amounts before any transfers (checks-effects-interactions pattern)
        uint payoutPot = pot - executorFee;
        uint academyShare = (payoutPot * 5) / 100;
        uint remainingPot = payoutPot - academyShare;
        
        address winner;
        uint256 winnerAmount;
        
        if (homeGoals > awayGoals) {
            winner = homeAddress;
            winnerAmount = remainingPot;
        } else if (awayGoals > homeGoals) {
            winner = awayAddress;
            winnerAmount = remainingPot;
        } else {
            // Draw - split remaining pot
            winnerAmount = remainingPot / 2;
        }

        // Emit event before transfers
        if (homeGoals > awayGoals) {
            emit WinningsDistributed(matchId, homeAddress, remainingPot, address(academy), academyShare, executor, executorFee);
        } else if (awayGoals > homeGoals) {
            emit WinningsDistributed(matchId, awayAddress, remainingPot, address(academy), academyShare, executor, executorFee);
        } else {
            emit WinningsDistributed(matchId, homeAddress, remainingPot / 2, address(academy), academyShare, executor, executorFee);
        }

        // Effects: All state updates done
        // Interactions: Now do all external transfers
        if (executorFee > 0) {
            payable(executor).transfer(executorFee);
        }

        if (academyShare > 0) {
            academy.deposit{value: academyShare}();
        }

        if (homeGoals > awayGoals) {
            payable(homeAddress).transfer(winnerAmount);
        } else if (awayGoals > homeGoals) {
            payable(awayAddress).transfer(winnerAmount);
        } else {
            payable(homeAddress).transfer(winnerAmount);
            payable(awayAddress).transfer(winnerAmount);
        }
    }

    function iterateThroughGame(
        uint256 matchId,
        address homeAddress,
        address awayAddress,
        uint256[3] memory homeAttackingPlayers,
        uint256[3] memory homeMidfieldPlayers,
        uint256[3] memory homeDefensivePlayers,
        uint256[3] memory awayAttackingPlayers,
        uint256[3] memory awayMidfieldPlayers,
        uint256[3] memory awayDefensivePlayers) private returns (uint8 homeGoals, uint8 awayGoals) {
        (uint homeAttack, uint homeDefense) = calculateTeamStats(homeAttackingPlayers, homeMidfieldPlayers, homeDefensivePlayers);
        (uint awayAttack, uint awayDefense) = calculateTeamStats(awayAttackingPlayers, awayMidfieldPlayers, awayDefensivePlayers);
        
        emit TeamStatsCalculated(matchId, homeAddress, homeAttack, homeDefense);
        emit TeamStatsCalculated(matchId, awayAddress, awayAttack, awayDefense);
        
        for (uint i = 0; i < 20; i++) {
            homeGoals += tryAndScore(homeAttack, awayDefense);
            awayGoals += tryAndScore(awayAttack, homeDefense);
        }

        if (homeGoals == awayGoals) {
            // Extra-time period for drawn matches.
            for (uint i = 0; i < 5; i++) {
                homeGoals += tryAndScore(homeAttack, awayDefense);
                awayGoals += tryAndScore(awayAttack, homeDefense);
            }

            emit ExtraTimePlayed(matchId, homeGoals, awayGoals);

            // If still level after extra-time, resolve with a weighted tiebreaker.
            if (homeGoals == awayGoals) {
                if (resolveTiebreaker(homeAttack + homeDefense, awayAttack + awayDefense)) {
                    homeGoals += 1;
                } else {
                    awayGoals += 1;
                }

                emit GoldenGoalPlayed(matchId, homeGoals, awayGoals);
            }
        }

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
        if (total == 0) {
            return 0;
        }

        uint linearChance = (attack * 100) / total;
        uint attackSq = attack * attack;
        uint defenseSq = defense * defense;
        uint quadraticChance = (attackSq * 100) / (attackSq + defenseSq);

        // 70% linear + 30% quadratic to keep scoring lower but still stat-sensitive.
        uint blendedChance = (linearChance * 70 + quadraticChance * 30) / 100;

        // Clamp to 2%-36% to reduce total goals in normal time.
        uint chanceOfScoring = 2 + (blendedChance * 34) / 100;

        if (random < chanceOfScoring) {
            return 1;
        } else {
            return 0;
        }
    }

    function resolveTiebreaker(uint homeStrength, uint awayStrength) private returns (bool homeWins) {
        if (randomCounter == type(uint).max) {
            randomCounter = 0;
        }

        uint total = homeStrength + awayStrength;
        uint homeWinChance = total == 0 ? 50 : (homeStrength * 100) / total;

        uint random = uint(
            keccak256(
                abi.encodePacked(
                    block.timestamp,
                    msg.sender,
                    homeStrength + awayStrength + randomCounter++,
                    "tiebreaker"
                )
            )
        ) % 100;

        return random < homeWinChance;
    }

    function _validateTeam(uint256[3] memory attack, uint256[3] memory midfield, uint256[3] memory defense) internal view returns (address owner) {
        uint256[5] memory team;
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
        uint256[5] memory players;
        uint256[6] memory attackRange;
        uint playerCount = 0;
        
        for (uint i = 0; i < 3; i++) {
            if (team.attackingPlayers[i] != 0) {
                players[playerCount] = team.attackingPlayers[i];
                uint adjustedAttack = getAdjustedGoalWeight(team.attackingPlayers[i], 110, true, false);
                
                attackRange[playerCount + 1] = attackRange[playerCount] + adjustedAttack;
                playerCount++;
            }
            if (team.midfieldPlayers[i] != 0) {
                players[playerCount] = team.midfieldPlayers[i];
                uint adjustedAttack = getAdjustedGoalWeight(team.midfieldPlayers[i], 100, false, false);
                
                attackRange[playerCount + 1] = attackRange[playerCount] + adjustedAttack;
                playerCount++;
            }
            if (team.defensivePlayers[i] != 0) {
                players[playerCount] = team.defensivePlayers[i];
                uint adjustedAttack = getAdjustedGoalWeight(team.defensivePlayers[i], 90, false, true);
                
                attackRange[playerCount + 1] = attackRange[playerCount] + adjustedAttack;
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
            (uint attackAttack, uint attackDefense) = getPositionAdjustedStats(attack[i], 110, 90, true, false);
            teamAttack += attackAttack;
            teamDefense += attackDefense;

            (uint midfieldAttack, uint midfieldDefense) = getPositionAdjustedStats(midfield[i], 100, 100, false, false);
            teamAttack += midfieldAttack;
            teamDefense += midfieldDefense;

            (uint defenseAttack, uint defenseDefense) = getPositionAdjustedStats(defense[i], 90, 110, false, true);
            teamAttack += defenseAttack;
            teamDefense += defenseDefense;
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
        for (uint8 i = 0; i < 9; i++) {
            // 255 means "no player in this slot" so empty slots are never treated as a type.
            playerTypes[i] = type(uint8).max;
        }
        
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
        
        // Defense: Anchor + Enforcer + Enforcer = +6 defense (any 3 defense slots)
        {
            bool[9] memory candidateUsed = usedInBonus;
            bool matched = takeByRoleAndType(playerTypes, candidateUsed, 0, 2, 3, 1)
                && takeByRoleAndType(playerTypes, candidateUsed, 0, 2, 0, 2);
            if (matched) {
                defenseBonus += 6;
                usedInBonus = candidateUsed;
            }
        }

        // Midfield: Playmaker + Attack: Target Man + Target Man = +6 attack
        {
            bool[9] memory candidateUsed = usedInBonus;
            bool matched = takeByRoleAndType(playerTypes, candidateUsed, 3, 5, 2, 1)
                && takeByRoleAndType(playerTypes, candidateUsed, 6, 8, 1, 2);
            if (matched) {
                attackBonus += 6;
                usedInBonus = candidateUsed;
            }
        }

        // Defense: Enforcer + Enforcer = +3 defense
        {
            bool[9] memory candidateUsed = usedInBonus;
            bool matched = takeByRoleAndType(playerTypes, candidateUsed, 0, 2, 0, 2);
            if (matched) {
                defenseBonus += 3;
                usedInBonus = candidateUsed;
            }
        }

        // Check for 3-point bonuses
        
        // Defense: Anchor + Enforcer = +3 defense
        {
            bool[9] memory candidateUsed = usedInBonus;
            bool matched = takeByRoleAndType(playerTypes, candidateUsed, 0, 2, 3, 1)
                && takeByRoleAndType(playerTypes, candidateUsed, 0, 2, 0, 1);
            if (matched) {
                defenseBonus += 3;
                usedInBonus = candidateUsed;
            }
        }

        // Midfield: Playmaker + Attack: Target Man = +3 attack
        {
            bool[9] memory candidateUsed = usedInBonus;
            bool matched = takeByRoleAndType(playerTypes, candidateUsed, 3, 5, 2, 1)
                && takeByRoleAndType(playerTypes, candidateUsed, 6, 8, 1, 1);
            if (matched) {
                attackBonus += 3;
                usedInBonus = candidateUsed;
            }
        }

        // Defense: Anchor + Midfield: Playmaker + Attack: Target Man = +3 defense, +3 attack
        {
            bool[9] memory candidateUsed = usedInBonus;
            bool matched = takeByRoleAndType(playerTypes, candidateUsed, 0, 2, 3, 1)
                && takeByRoleAndType(playerTypes, candidateUsed, 3, 5, 2, 1)
                && takeByRoleAndType(playerTypes, candidateUsed, 6, 8, 1, 1);
            if (matched) {
                defenseBonus += 3;
                attackBonus += 3;
                usedInBonus = candidateUsed;
            }
        }

        // Attack: Target Man + Enforcer = +3 attack
        {
            bool[9] memory candidateUsed = usedInBonus;
            bool matched = takeByRoleAndType(playerTypes, candidateUsed, 6, 8, 1, 1)
                && takeByRoleAndType(playerTypes, candidateUsed, 6, 8, 0, 1);
            if (matched) {
                attackBonus += 3;
                usedInBonus = candidateUsed;
            }
        }

        // Midfield: Playmaker + Anchor = +3 defense
        {
            bool[9] memory candidateUsed = usedInBonus;
            bool matched = takeByRoleAndType(playerTypes, candidateUsed, 3, 5, 2, 1)
                && takeByRoleAndType(playerTypes, candidateUsed, 3, 5, 3, 1);
            if (matched) {
                defenseBonus += 3;
                usedInBonus = candidateUsed;
            }
        }

        // Midfield: Playmaker + Anchor + Enforcer = +3 defense, +3 attack
        {
            bool[9] memory candidateUsed = usedInBonus;
            bool matched = takeByRoleAndType(playerTypes, candidateUsed, 3, 5, 2, 1)
                && takeByRoleAndType(playerTypes, candidateUsed, 3, 5, 3, 1)
                && takeByRoleAndType(playerTypes, candidateUsed, 3, 5, 0, 1);
            if (matched) {
                defenseBonus += 3;
                attackBonus += 3;
                usedInBonus = candidateUsed;
            }
        }

        // Attack: Target Man + Playmaker = +3 attack
        {
            bool[9] memory candidateUsed = usedInBonus;
            bool matched = takeByRoleAndType(playerTypes, candidateUsed, 6, 8, 1, 1)
                && takeByRoleAndType(playerTypes, candidateUsed, 6, 8, 2, 1);
            if (matched) {
                attackBonus += 3;
                usedInBonus = candidateUsed;
            }
        }

        return (attackBonus, defenseBonus);
    }

    function takeByRoleAndType(
        uint8[9] memory playerTypes,
        bool[9] memory usedInBonus,
        uint8 startIndex,
        uint8 endIndex,
        uint8 requiredType,
        uint8 requiredCount
    ) private pure returns (bool matched) {
        uint8[3] memory selectedIndices;
        uint8 selected = 0;

        for (uint8 i = startIndex; i <= endIndex; i++) {
            if (!usedInBonus[i] && playerTypes[i] == requiredType) {
                usedInBonus[i] = true;
                selectedIndices[selected] = i;
                selected++;
                if (selected == requiredCount) {
                    return true;
                }
            }
        }

        // Roll back any partial picks from this attempt.
        for (uint8 j = 0; j < selected; j++) {
            usedInBonus[selectedIndices[j]] = false;
        }

        return false;
    }

    function hasDuplicates(uint256[5] memory array) private pure returns (bool) {
        for (uint i = 0; i < 5; i++) {
            for (uint j = i + 1; j < 5; j++) {
                if (array[i] == array[j]) {
                    return true;
                }
            }
        }
        return false;
    }

    function getAdjustedGoalWeight(uint256 playerId, uint256 positionAttackBase, bool isAttack, bool isDefense) private view returns (uint256) {
        (, uint attackStat, , , , , , uint playerType) = playerToken.getPlayerAttributes(playerId);
        uint8 adjustment = getPlayerTypeAdjustmentFromType(playerType, isAttack, isDefense, true);
        uint256 adjustedAttack = (attackStat * positionAttackBase) / 100;
        return (adjustedAttack * (100 + adjustment)) / 100;
    }

    function getPositionAdjustedStats(
        uint256 playerId,
        uint256 attackBase,
        uint256 defenseBase,
        bool isAttack,
        bool isDefense
    ) private view returns (uint256 adjustedAttack, uint256 adjustedDefense) {
        if (playerId == 0) {
            return (0, 0);
        }

        (, uint attackStat, , uint defenseStat, , , , uint playerType) = playerToken.getPlayerAttributes(playerId);
        uint8 attackAdjustment = getPlayerTypeAdjustmentFromType(playerType, isAttack, isDefense, true);
        uint8 defenseAdjustment = getPlayerTypeAdjustmentFromType(playerType, isAttack, isDefense, false);

        uint256 attackWithPosition = (attackStat * attackBase) / 100;
        uint256 defenseWithPosition = (defenseStat * defenseBase) / 100;

        adjustedAttack = (attackWithPosition * (100 + attackAdjustment)) / 100;
        adjustedDefense = (defenseWithPosition * (100 + defenseAdjustment)) / 100;
    }

    function getPlayerTypeAdjustmentFromType(uint playerType, bool isAttack, bool isDefense, bool isAttackingStat) private pure returns (uint8) {
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
        } else { // Anchor
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


    function emitPlayerMatchInfo(uint256 matchId, Team memory team, address) private {
        for (uint i = 0; i < 3; i++) {
            if (team.attackingPlayers[i] != 0) {
                emitPlayerInfo(matchId, team.attackingPlayers[i], "attacking");
            }
            if (team.midfieldPlayers[i] != 0) {
                emitPlayerInfo(matchId, team.midfieldPlayers[i], "midfield");
            }
            if (team.defensivePlayers[i] != 0) {
                emitPlayerInfo(matchId, team.defensivePlayers[i], "defensive");
            }
        }
    }

    function emitPlayerInfo(uint256 matchId, uint256 playerId, string memory position) private {
        address owner = playerToken.ownerOf(playerId);
        (,uint256 attack, , uint256 defense, uint256 potential, uint256 gamesLeft, uint256 goals, uint playerType) = playerToken.getPlayerAttributes(playerId);
        emit PlayerMatchInfo(matchId, playerId, owner, attack, defense, potential, gamesLeft, goals, uint8(playerType), position);
    }
}
