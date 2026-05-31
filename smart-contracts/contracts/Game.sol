// SPDX-License-Identifier: MIT
pragma solidity 0.8.21;

import "./PlayerToken.sol";
import "./Academy.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "hardhat/console.sol";

contract Game is ReentrancyGuard {
    uint256 private _tokenIdCounter = 1;
    uint256 public constant MIN_WAGER = 3 ether;
    address public owner;
    address public tournamentContract;
    PlayerToken playerToken;
    Academy academy;
    uint randomCounter = 0;
    mapping(address => uint256) public pendingWithdrawals;

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

    uint8 private constant ROLE_ATTACK = 0;
    uint8 private constant ROLE_MIDFIELD = 1;
    uint8 private constant ROLE_DEFENSE = 2;

    struct TeamSnapshot {
        uint256[5] playerIds;
        uint256[5] attacks;
        uint256[5] defenses;
        uint256[5] potentials;
        uint256[5] gamesLefts;
        uint256[5] goals;
        uint8[5] playerTypes;
        uint8[5] roles;
        uint8 count;
    }

    mapping(uint256 => Match) public matches;

    event NewMatch(uint256 matchId);
    event MatchSnapshot(
        uint256 matchId,
        uint256 tournamentId,
        address homeAddress,
        address awayAddress,
        Team homeTeam,
        Team awayTeam
    );
    event MatchPlayed(uint256 matchId, uint8 homeScore, uint8 awayScore);
    event TournamentMatchPlayed(
        uint256 indexed tournamentId,
        uint256 tournamentMatchId,
        uint8 indexed round,
        address homeAddress,
        address awayAddress,
        address winner,
        uint8 homeScore,
        uint8 awayScore
    );
    event ExtraTimePlayed(uint256 matchId, uint256 tournamentId, uint8 homeScore, uint8 awayScore);
    event GoldenGoalPlayed(uint256 matchId, uint256 tournamentId, uint8 homeScore, uint8 awayScore);
    event PlayerScored(uint256 matchId, uint256 tournamentId, uint256 playerId);
    event TeamStatsCalculated(uint256 matchId, uint256 tournamentId, address team, uint256 totalAttack, uint256 totalDefense);
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
            uint256 tournamentId,
            uint256 playerId,
            address owner,
            uint256 attack,
            uint256 defense,
            uint256 potential,
            uint256 gamesLeft,
            uint256 goals,
            uint8 playerType,
                uint8 position
    );
    event TournamentContractUpdated(address indexed tournamentContract);

    constructor(address playerTokenAddress, address academyAddress) {
        owner = msg.sender;
        playerToken = PlayerToken(playerTokenAddress);
        academy = Academy(academyAddress);
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner");
        _;
    }

    function setTournamentContract(address tournamentAddress) external onlyOwner {
        require(tournamentAddress != address(0), "Invalid tournament address");
        tournamentContract = tournamentAddress;
        emit TournamentContractUpdated(tournamentAddress);
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
            address teamOwner = _validateTeam(attackingPlayers, midfieldPlayers, defensivePlayers);
            require(teamOwner == msg.sender, "You must own all players in your team");
            game.homeTeam = Team(attackingPlayers, midfieldPlayers, defensivePlayers);
            if (_isLocalDebug()) {
                console.log("[Game] Home team submitted");
                console.log("[Game] matchId", matchId);
                console.log("[Game] home", msg.sender);
            }
        } else {
            require(isEmpty(game.awayTeam), "Away team already submitted");
            address teamOwner = _validateTeam(attackingPlayers, midfieldPlayers, defensivePlayers);
            require(teamOwner == msg.sender, "You must own all players in your team");
            game.awayTeam = Team(attackingPlayers, midfieldPlayers, defensivePlayers);
            if (_isLocalDebug()) {
                console.log("[Game] Away team submitted");
                console.log("[Game] matchId", matchId);
                console.log("[Game] away", msg.sender);
            }
        }

        if (!isEmpty(game.homeTeam) && !isEmpty(game.awayTeam)) {
            _playMatch(matchId, msg.sender);
        }
    }

    function playMatch(uint256 matchId, address executor) external nonReentrant returns (uint8 homeGoals, uint8 awayGoals) {
        return _playMatch(matchId, executor);
    }

    function playTournamentMatch(
        address homeAddress,
        Team memory homeTeam,
        address awayAddress,
        Team memory awayTeam,
        uint256 tournamentId,
        uint256 tournamentMatchId,
        uint8 round
    ) external returns (address winner, uint8 homeGoals, uint8 awayGoals) {
        require(msg.sender == tournamentContract, "Only tournament contract can play matches");

        if (_isLocalDebug()) {
            console.log("[Game] Tournament match start");
            console.log("[Game] tournamentId", tournamentId);
            console.log("[Game] tournamentMatchId", tournamentMatchId);
            console.log("[Game] round", round);
            console.log("[Game] home", homeAddress);
            console.log("[Game] away", awayAddress);
        }

        (homeGoals, awayGoals) = _simulateMatch(tournamentMatchId, tournamentId, homeAddress, homeTeam, awayAddress, awayTeam);

        if (homeGoals > awayGoals) {
            winner = homeAddress;
        } else {
            winner = awayAddress;
        }

        emit TournamentMatchPlayed(tournamentId, tournamentMatchId, round, homeAddress, awayAddress, winner, homeGoals, awayGoals);

        if (_isLocalDebug()) {
            console.log("[Game] Tournament match result");
            console.log("[Game] homeGoals", homeGoals);
            console.log("[Game] awayGoals", awayGoals);
            console.log("[Game] winner", winner);
        }

        return (winner, homeGoals, awayGoals);
    }

    function validateTeam(
        uint256[3] memory attack,
        uint256[3] memory midfield,
        uint256[3] memory defense,
        address expectedOwner
    ) external view returns (bool) {
        address teamOwner = _validateTeam(attack, midfield, defense);
        return teamOwner == expectedOwner;
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
        require(game.homeAddress != address(0) && game.awayAddress != address(0), "Match does not exist");
        require(!isEmpty(game.homeTeam) && !isEmpty(game.awayTeam), "Both teams must be submitted");

        if (_isLocalDebug()) {
            console.log("[Game] Match start");
            console.log("[Game] matchId", matchId);
            console.log("[Game] home", game.homeAddress);
            console.log("[Game] away", game.awayAddress);
            console.log("[Game] pot", game.pot);
        }

        uint256 gasAtStart = gasleft();

        (homeGoals, awayGoals) = _simulateMatch(
            matchId,
            0,
            game.homeAddress,
            game.homeTeam,
            game.awayAddress,
            game.awayTeam
        );

        emit MatchPlayed(matchId, homeGoals, awayGoals);

        if (_isLocalDebug()) {
            console.log("[Game] Match result");
            console.log("[Game] homeGoals", homeGoals);
            console.log("[Game] awayGoals", awayGoals);
        }

        // Distribute winnings
        uint256 gasSpentInMatch = gasAtStart - gasleft();
        uint256 executorFee = gasSpentInMatch * tx.gasprice;
        if (executorFee > game.pot) {
            executorFee = game.pot;
        }

        if (_isLocalDebug()) {
            console.log("[Game] Gas and fees");
            console.log("[Game] gasSpentInMatch", gasSpentInMatch);
            console.log("[Game] executorFee", executorFee);
        }

        distributeWinnings(matchId, homeGoals, awayGoals, game.pot, game.homeAddress, game.awayAddress, executor, executorFee);


        delete matches[matchId];

        return (homeGoals, awayGoals);
    }

    function _simulateMatch(
        uint256 matchId,
        uint256 tournamentId,
        address homeAddress,
        Team memory homeTeam,
        address awayAddress,
        Team memory awayTeam
    ) private returns (uint8 homeGoals, uint8 awayGoals) {
        TeamSnapshot memory homeSnapshot = buildTeamSnapshot(homeTeam);
        TeamSnapshot memory awaySnapshot = buildTeamSnapshot(awayTeam);
        (uint homeAttack, uint homeDefense) = calculateTeamStats(homeSnapshot);
        (uint awayAttack, uint awayDefense) = calculateTeamStats(awaySnapshot);

        if (_isLocalDebug()) {
            console.log("[Game] Team stats");
            console.log("[Game] matchId", matchId);
            console.log("[Game] tournamentId", tournamentId);
            console.log("[Game] homeAttack", homeAttack);
            console.log("[Game] homeDefense", homeDefense);
            console.log("[Game] awayAttack", awayAttack);
            console.log("[Game] awayDefense", awayDefense);
        }

        (homeGoals, awayGoals) = iterateThroughGame(
            matchId,
            tournamentId,
            homeAddress,
            awayAddress,
            homeAttack,
            homeDefense,
            awayAttack,
            awayDefense
        );

        // Emit player match info for all players
        emitPlayerMatchInfo(matchId, tournamentId, homeSnapshot, homeAddress);
        emitPlayerMatchInfo(matchId, tournamentId, awaySnapshot, awayAddress);

        // Update player stats
        updatePlayerStats(matchId, tournamentId, homeSnapshot, awaySnapshot);

        // Assign goals to scorers
        assignGoals(matchId, tournamentId, homeGoals, homeSnapshot);
        assignGoals(matchId, tournamentId, awayGoals, awaySnapshot);

        emit MatchSnapshot(matchId, tournamentId, homeAddress, awayAddress, homeTeam, awayTeam);

        return (homeGoals, awayGoals);
    }

    function _isLocalDebug() private view returns (bool) {
        return block.chainid == 31337 || block.chainid == 1337;
    }

    function updatePlayerStats(uint256, uint256, TeamSnapshot memory homeTeam, TeamSnapshot memory awayTeam) private {
        for (uint i = 0; i < homeTeam.count; i++) {
            if (homeTeam.roles[i] == ROLE_ATTACK) {
                playerToken.playAttackGame(homeTeam.playerIds[i]);
            } else if (homeTeam.roles[i] == ROLE_MIDFIELD) {
                playerToken.playMidfieldGame(homeTeam.playerIds[i]);
            } else {
                playerToken.playDefenseGame(homeTeam.playerIds[i]);
            }
        }

        for (uint i = 0; i < awayTeam.count; i++) {
            if (awayTeam.roles[i] == ROLE_ATTACK) {
                playerToken.playAttackGame(awayTeam.playerIds[i]);
            } else if (awayTeam.roles[i] == ROLE_MIDFIELD) {
                playerToken.playMidfieldGame(awayTeam.playerIds[i]);
            } else {
                playerToken.playDefenseGame(awayTeam.playerIds[i]);
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

        uint256 winnerAmount;

        if (homeGoals > awayGoals) {
            winnerAmount = remainingPot;
        } else if (awayGoals > homeGoals) {
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

        if (academyShare > 0) {
            academy.deposit{value: academyShare}();
        }

        if (homeGoals > awayGoals) {
            pendingWithdrawals[homeAddress] += winnerAmount;
        } else if (awayGoals > homeGoals) {
            pendingWithdrawals[awayAddress] += winnerAmount;
        } else {
            pendingWithdrawals[homeAddress] += winnerAmount;
            pendingWithdrawals[awayAddress] += winnerAmount;
        }

        if (executorFee > 0) {
            pendingWithdrawals[executor] += executorFee;
        }
    }

    function withdraw() public nonReentrant {
        uint256 amount = pendingWithdrawals[msg.sender];
        require(amount > 0, "Nothing to withdraw");
        pendingWithdrawals[msg.sender] = 0;
        payable(msg.sender).transfer(amount);
    }

    function iterateThroughGame(
        uint256 matchId,
        uint256 tournamentId,
        address homeAddress,
        address awayAddress,
        uint homeAttack,
        uint homeDefense,
        uint awayAttack,
        uint awayDefense
    ) private returns (uint8 homeGoals, uint8 awayGoals) {
        emit TeamStatsCalculated(matchId, tournamentId, homeAddress, homeAttack, homeDefense);
        emit TeamStatsCalculated(matchId, tournamentId, awayAddress, awayAttack, awayDefense);
        
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

            emit ExtraTimePlayed(matchId, tournamentId, homeGoals, awayGoals);

            // If still level after extra-time, resolve with a weighted tiebreaker.
            if (homeGoals == awayGoals) {
                if (resolveTiebreaker(homeAttack + homeDefense, awayAttack + awayDefense)) {
                    homeGoals += 1;
                } else {
                    awayGoals += 1;
                }

                emit GoldenGoalPlayed(matchId, tournamentId, homeGoals, awayGoals);
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

    function _validateTeam(uint256[3] memory attack, uint256[3] memory midfield, uint256[3] memory defense) internal view returns (address teamOwner) {
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

        teamOwner = playerToken.ownerOf(team[0]);
        for (uint i = 1; i < 5; i++) {
            require(
                playerToken.ownerOf(team[i]) == teamOwner,
                "Each team must be owned by a signle owner"
            );
        }
        return teamOwner;
    }

    function assignGoals(uint256 matchId, uint256 tournamentId, uint goals, TeamSnapshot memory team) private {
        if (goals == 0 || team.count == 0) {
            return;
        }

        uint256[6] memory attackRange;
        for (uint8 i = 0; i < team.count; i++) {
            uint256 positionAttackBase = team.roles[i] == ROLE_ATTACK
                ? 110
                : (team.roles[i] == ROLE_MIDFIELD ? 100 : 90);

            uint8 adjustment = getPlayerTypeAdjustmentFromType(
                team.playerTypes[i],
                team.roles[i] == ROLE_ATTACK,
                team.roles[i] == ROLE_DEFENSE,
                true
            );

            uint256 adjustedAttack = (team.attacks[i] * positionAttackBase) / 100;
            uint256 weight = (adjustedAttack * (100 + adjustment)) / 100;
            attackRange[i + 1] = attackRange[i] + weight;
        }

        uint256 totalWeight = attackRange[team.count];
        if (totalWeight == 0) {
            return;
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
            ) % totalWeight;

            for (uint8 j = 0; j < team.count; j++) {
                if (random < attackRange[j + 1]) {
                    uint256 playerId = team.playerIds[j];
                    playerToken.scoreGoal(playerId);
                    emit PlayerScored(matchId, tournamentId, playerId);
                    break;
                }
            }
        }
    }

    function buildTeamSnapshot(Team memory team) private view returns (TeamSnapshot memory snapshot) {
        for (uint8 i = 0; i < 5; i++) {
            snapshot.roles[i] = type(uint8).max;
            snapshot.playerTypes[i] = type(uint8).max;
        }

        for (uint8 i = 0; i < 3; i++) {
            if (team.attackingPlayers[i] != 0) {
                appendSnapshotPlayer(snapshot, team.attackingPlayers[i], ROLE_ATTACK);
            }
            if (team.midfieldPlayers[i] != 0) {
                appendSnapshotPlayer(snapshot, team.midfieldPlayers[i], ROLE_MIDFIELD);
            }
            if (team.defensivePlayers[i] != 0) {
                appendSnapshotPlayer(snapshot, team.defensivePlayers[i], ROLE_DEFENSE);
            }
        }
    }

    function appendSnapshotPlayer(TeamSnapshot memory snapshot, uint256 playerId, uint8 role) private view {
        uint8 index = snapshot.count;
        (, uint attack, , uint defense, uint potential, uint gamesLeft, uint goals, uint playerType) = playerToken.getPlayerAttributes(playerId);
        snapshot.playerIds[index] = playerId;
        snapshot.attacks[index] = attack;
        snapshot.defenses[index] = defense;
        snapshot.potentials[index] = potential;
        snapshot.gamesLefts[index] = gamesLeft;
        snapshot.goals[index] = goals;
        snapshot.playerTypes[index] = uint8(playerType);
        snapshot.roles[index] = role;
        snapshot.count = index + 1;
    }

    function calculateTeamStats(TeamSnapshot memory team) private pure returns (uint teamAttack, uint teamDefense) {
        for (uint8 i = 0; i < team.count; i++) {
            bool isAttack = team.roles[i] == ROLE_ATTACK;
            bool isDefense = team.roles[i] == ROLE_DEFENSE;
            uint256 attackBase = isAttack ? 110 : (isDefense ? 90 : 100);
            uint256 defenseBase = isAttack ? 90 : (isDefense ? 110 : 100);

            uint8 attackAdjustment = getPlayerTypeAdjustmentFromType(team.playerTypes[i], isAttack, isDefense, true);
            uint8 defenseAdjustment = getPlayerTypeAdjustmentFromType(team.playerTypes[i], isAttack, isDefense, false);

            uint256 attackWithPosition = (team.attacks[i] * attackBase) / 100;
            uint256 defenseWithPosition = (team.defenses[i] * defenseBase) / 100;

            teamAttack += (attackWithPosition * (100 + attackAdjustment)) / 100;
            teamDefense += (defenseWithPosition * (100 + defenseAdjustment)) / 100;
        }

        (uint attackBonus, uint defenseBonus) = calculateTeamChemistry(team);
        teamAttack = teamAttack * (100 + attackBonus) / 100;
        teamDefense = teamDefense * (100 + defenseBonus) / 100;
    }

    function calculateTeamChemistry(TeamSnapshot memory team) private pure returns (uint attackBonus, uint defenseBonus) {
        bool[5] memory usedInBonus;

        {
            bool[5] memory candidateUsed = usedInBonus;
            bool matched = takeByRoleAndType(team.playerTypes, team.roles, candidateUsed, ROLE_DEFENSE, 3, 1)
                && takeByRoleAndType(team.playerTypes, team.roles, candidateUsed, ROLE_DEFENSE, 0, 2);
            if (matched) {
                defenseBonus += 6;
                usedInBonus = candidateUsed;
            }
        }

        {
            bool[5] memory candidateUsed = usedInBonus;
            bool matched = takeByRoleAndType(team.playerTypes, team.roles, candidateUsed, ROLE_MIDFIELD, 2, 1)
                && takeByRoleAndType(team.playerTypes, team.roles, candidateUsed, ROLE_ATTACK, 1, 2);
            if (matched) {
                attackBonus += 6;
                usedInBonus = candidateUsed;
            }
        }

        {
            bool[5] memory candidateUsed = usedInBonus;
            bool matched = takeByRoleAndType(team.playerTypes, team.roles, candidateUsed, ROLE_DEFENSE, 0, 2);
            if (matched) {
                defenseBonus += 3;
                usedInBonus = candidateUsed;
            }
        }

        {
            bool[5] memory candidateUsed = usedInBonus;
            bool matched = takeByRoleAndType(team.playerTypes, team.roles, candidateUsed, ROLE_DEFENSE, 3, 1)
                && takeByRoleAndType(team.playerTypes, team.roles, candidateUsed, ROLE_DEFENSE, 0, 1);
            if (matched) {
                defenseBonus += 3;
                usedInBonus = candidateUsed;
            }
        }

        {
            bool[5] memory candidateUsed = usedInBonus;
            bool matched = takeByRoleAndType(team.playerTypes, team.roles, candidateUsed, ROLE_MIDFIELD, 2, 1)
                && takeByRoleAndType(team.playerTypes, team.roles, candidateUsed, ROLE_ATTACK, 1, 1);
            if (matched) {
                attackBonus += 3;
                usedInBonus = candidateUsed;
            }
        }

        {
            bool[5] memory candidateUsed = usedInBonus;
            bool matched = takeByRoleAndType(team.playerTypes, team.roles, candidateUsed, ROLE_DEFENSE, 3, 1)
                && takeByRoleAndType(team.playerTypes, team.roles, candidateUsed, ROLE_MIDFIELD, 2, 1)
                && takeByRoleAndType(team.playerTypes, team.roles, candidateUsed, ROLE_ATTACK, 1, 1);
            if (matched) {
                defenseBonus += 3;
                attackBonus += 3;
                usedInBonus = candidateUsed;
            }
        }

        {
            bool[5] memory candidateUsed = usedInBonus;
            bool matched = takeByRoleAndType(team.playerTypes, team.roles, candidateUsed, ROLE_ATTACK, 1, 1)
                && takeByRoleAndType(team.playerTypes, team.roles, candidateUsed, ROLE_ATTACK, 0, 1);
            if (matched) {
                attackBonus += 3;
                usedInBonus = candidateUsed;
            }
        }

        {
            bool[5] memory candidateUsed = usedInBonus;
            bool matched = takeByRoleAndType(team.playerTypes, team.roles, candidateUsed, ROLE_MIDFIELD, 2, 1)
                && takeByRoleAndType(team.playerTypes, team.roles, candidateUsed, ROLE_MIDFIELD, 3, 1);
            if (matched) {
                defenseBonus += 3;
                usedInBonus = candidateUsed;
            }
        }

        {
            bool[5] memory candidateUsed = usedInBonus;
            bool matched = takeByRoleAndType(team.playerTypes, team.roles, candidateUsed, ROLE_MIDFIELD, 2, 1)
                && takeByRoleAndType(team.playerTypes, team.roles, candidateUsed, ROLE_MIDFIELD, 3, 1)
                && takeByRoleAndType(team.playerTypes, team.roles, candidateUsed, ROLE_MIDFIELD, 0, 1);
            if (matched) {
                defenseBonus += 3;
                attackBonus += 3;
                usedInBonus = candidateUsed;
            }
        }

        {
            bool[5] memory candidateUsed = usedInBonus;
            bool matched = takeByRoleAndType(team.playerTypes, team.roles, candidateUsed, ROLE_ATTACK, 1, 1)
                && takeByRoleAndType(team.playerTypes, team.roles, candidateUsed, ROLE_ATTACK, 2, 1);
            if (matched) {
                attackBonus += 3;
            }
        }
    }

    function takeByRoleAndType(
        uint8[5] memory playerTypes,
        uint8[5] memory roles,
        bool[5] memory usedInBonus,
        uint8 requiredRole,
        uint8 requiredType,
        uint8 requiredCount
    ) private pure returns (bool matched) {
        uint8[5] memory selectedIndices;
        uint8 selected = 0;

        for (uint8 i = 0; i < 5; i++) {
            if (!usedInBonus[i] && roles[i] == requiredRole && playerTypes[i] == requiredType) {
                usedInBonus[i] = true;
                selectedIndices[selected] = i;
                selected++;
                if (selected == requiredCount) {
                    return true;
                }
            }
        }

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

    function emitPlayerMatchInfo(uint256 matchId, uint256 tournamentId, TeamSnapshot memory team, address teamOwner) private {
        for (uint8 i = 0; i < team.count; i++) {
            emit PlayerMatchInfo(
                matchId,
                tournamentId,
                team.playerIds[i],
                teamOwner,
                team.attacks[i],
                team.defenses[i],
                team.potentials[i],
                team.gamesLefts[i],
                team.goals[i],
                team.playerTypes[i],
                team.roles[i]
            );
        }
    }
}
