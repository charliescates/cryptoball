// SPDX-License-Identifier: MIT
pragma solidity 0.8.21;

import './Game.sol';
import './Academy.sol';
import '@openzeppelin/contracts/security/ReentrancyGuard.sol';
import 'hardhat/console.sol';

contract Tournement is ReentrancyGuard {
    uint256 public constant MIN_ENTRY_FEE = 3 ether;
    uint256 public constant TOURNEMENT_ACADEMY_BPS = 600;
    uint256 private constant BPS_DENOMINATOR = 10_000;
    uint256 private tournementCounter = 0;
    Game private game;
    Academy private academy;

    mapping(uint256 => TournementInfo) public tournements;
    mapping(uint256 => mapping(address => bool)) public hasEntered;
    mapping(uint256 => mapping(address => bool)) public hasClaimedReward;
    mapping(uint256 => mapping(address => bool)) public hasRefundedEntry;
    mapping(uint256 => uint256) public tournementMatchCounts;
    mapping(uint256 => uint256) public tournementExecutorFees;
    mapping(uint256 => uint256) public tournementAcademyFees;

    struct TournementInfo {
        uint8 rounds;
        uint256 entryFee;
        address creator;
        uint8 minAttack;
        uint8 minDefence;
        uint8 maxAttack;
        uint8 maxDefence;
        uint8[] includeTypes;
        uint8[] excludeTypes;
        address[] entrants;
        address[] roundEntrants;
        mapping(address => Game.Team) teams;
        uint8 teamsEntered;
        uint8 currentRound;
        bool cancelled;
        address champion;
    }

    struct TournementSummary {
        uint256 tournamentId;
        uint8 rounds;
        uint256 entryFee;
        uint8 minAttack;
        uint8 minDefence;
        uint8 maxAttack;
        uint8 maxDefence;
        uint8[] includeTypes;
        uint8[] excludeTypes;
        address creator;
        uint8 teamsEntered;
        uint256 maxTeams;
        bool isOpen;
        bool isReady;
        bool cancelled;
        uint8 currentRound;
        address champion;
    }

    struct TeamPlayerDetails {
        uint256 playerId;
        uint256 attack;
        uint256 defense;
        uint8 playerType;
    }

    event TournementCreated(
        uint256 indexed tournamentId,
        address indexed creator,
        uint8 rounds,
        uint256 entryFee,
        uint8 minAttack,
        uint8 minDefence,
        uint8 maxAttack,
        uint8 maxDefence,
        uint8[] includeTypes,
        uint8[] excludeTypes
    );
    event TeamEntered(uint256 indexed tournamentId, address indexed player, uint8 teamsEntered);
    event TournementReady(uint256 indexed tournamentId, uint8 teamsCount);
    event TournementRoundAdvanced(uint256 indexed tournamentId, uint8 completedRound, uint8 nextRound, uint8 teamsRemaining);
    event TournementMatchStarted(uint256 indexed tournamentId, uint256 tournamentMatchId, uint8 indexed round, address homeAddress, address awayAddress);
    event TournementCompleted(
        uint256 indexed tournamentId,
        address champion,
        uint256 championWinnings,
        Game.Team winningTeam,
        TeamPlayerDetails[] winningTeamPlayers
    );
    event TournementCompletedSummary(
        uint256 indexed tournamentId,
        address indexed champion,
        uint256 championWinnings,
        uint256 executorFees
    );
    event TournementCancelled(uint256 indexed tournamentId, address indexed cancelledBy);
    event TournementEntryRefunded(uint256 indexed tournamentId, address indexed entrant, uint256 amount);
    event TournementRewardClaimed(uint256 indexed tournamentId, address indexed champion, uint256 amount);
    event TournementExecutorCompensated(uint256 indexed tournamentId, address indexed executor, uint256 executorFee);
    event TournementAcademyFunded(uint256 indexed tournamentId, uint256 academyShare);

    constructor(address gameAddress, address academyAddress) {
        game = Game(gameAddress);
        academy = Academy(academyAddress);
    }

    function create(
        uint8 rounds,
        uint256 entryFee,
        uint8 minAttack,
        uint8 minDefence,
        uint8 maxAttack,
        uint8 maxDefence,
        uint8[] memory includeTypes,
        uint8[] memory excludeTypes
    ) external {
        if (rounds == 0 || rounds > 7) {
            revert("Rounds must be between 1 and 7");
        }

        if (entryFee < MIN_ENTRY_FEE) {
            revert("Minimum entry fee is 3 POL");
        }

        if (maxAttack > 0 && maxAttack < minAttack) {
            revert("Invalid attack range");
        }

        if (maxDefence > 0 && maxDefence < minDefence) {
            revert("Invalid defence range");
        }

        _validateTypeArray(includeTypes);
        _validateTypeArray(excludeTypes);

        TournementInfo storage info = tournements[tournementCounter];
        info.rounds = rounds;
        info.entryFee = entryFee;
        info.creator = msg.sender;
        info.minAttack = minAttack;
        info.minDefence = minDefence;
        info.maxAttack = maxAttack;
        info.maxDefence = maxDefence;
        info.includeTypes = includeTypes;
        info.excludeTypes = excludeTypes;
        info.teamsEntered = 0;
        info.currentRound = 0;
        info.cancelled = false;
        delete info.entrants;
        delete info.roundEntrants;
        info.champion = address(0);

        _validateTypeCompatibility(includeTypes, excludeTypes);

        if (_isLocalDebug()) {
            console.log("[Tournament] Created");
            console.log("[Tournament] tournamentId", tournementCounter);
            console.log("[Tournament] creator", msg.sender);
            console.log("[Tournament] rounds", rounds);
            console.log("[Tournament] entryFee", entryFee);
            console.log("[Tournament] minAttack", minAttack);
            console.log("[Tournament] minDefence", minDefence);
            console.log("[Tournament] maxAttack", maxAttack);
            console.log("[Tournament] maxDefence", maxDefence);
            console.log("[Tournament] includeTypesLength", includeTypes.length);
            console.log("[Tournament] excludeTypesLength", excludeTypes.length);
        }

        emit TournementCreated(tournementCounter, msg.sender, rounds, entryFee, minAttack, minDefence, maxAttack, maxDefence, includeTypes, excludeTypes);

        tournementCounter++;
    }

    function getTournements() external view returns (TournementSummary[] memory summaries) {
        uint256 liveCount = 0;

        for (uint256 i = 0; i < tournementCounter; i++) {
            if (_isLiveTournement(tournements[i])) {
                liveCount++;
            }
        }

        summaries = new TournementSummary[](liveCount);

        uint256 summaryIndex = 0;
        for (uint256 i = 0; i < tournementCounter; i++) {
            TournementInfo storage info = tournements[i];
            if (!_isLiveTournement(info)) {
                continue;
            }

            uint256 maxTeams = 2 ** info.rounds;
            uint8[] memory includeTypes = info.includeTypes;
            uint8[] memory excludeTypes = info.excludeTypes;
            bool isOpen = info.currentRound == 0 && info.teamsEntered < maxTeams;
            bool isReady = info.currentRound == 0 && info.teamsEntered == maxTeams;

            summaries[summaryIndex] = TournementSummary({
                tournamentId: i,
                rounds: info.rounds,
                entryFee: info.entryFee,
                minAttack: info.minAttack,
                minDefence: info.minDefence,
                maxAttack: info.maxAttack,
                maxDefence: info.maxDefence,
                includeTypes: includeTypes,
                excludeTypes: excludeTypes,
                creator: info.creator,
                teamsEntered: info.teamsEntered,
                maxTeams: maxTeams,
                isOpen: isOpen,
                isReady: isReady,
                cancelled: info.cancelled,
                currentRound: info.currentRound,
                champion: info.champion
            });
            summaryIndex++;
        }

        return summaries;
    }

    function enter(
        uint256 tournamentId,
        uint256[3] memory attackingPlayers,
        uint256[3] memory midfieldPlayers,
        uint256[3] memory defensivePlayers
        ) external payable nonReentrant {

        if (tournamentId >= tournementCounter) {
            revert("Tournement does not exist");
        }

        TournementInfo storage info = tournements[tournamentId];
        if (msg.value != info.entryFee) {
            revert("Incorrect entry fee");
        }

        if (info.cancelled) {
            revert("Tournament cancelled");
        }

        if (info.currentRound != 0) {
            revert("Tournament already started");
        }

        if (hasEntered[tournamentId][msg.sender]) {
            revert("Already entered");
        }

        if (info.teamsEntered >= 2 ** info.rounds) {
            revert("Tournement is full");
        }

        bool isValidTeam = game.validateTeam(attackingPlayers, midfieldPlayers, defensivePlayers, msg.sender);
        if (!isValidTeam) {
            revert("Owner does not have the players or team does not meet requirements");
        }

        // Validate minimum and maximum attack and defense stats
        if (info.minAttack > 0 || info.minDefence > 0 || info.maxAttack > 0 || info.maxDefence > 0) {
            _validatePlayerStats(attackingPlayers, midfieldPlayers, defensivePlayers, info.minAttack, info.minDefence, info.maxAttack, info.maxDefence);
        }

        // Validate include/exclude player types
        if (info.includeTypes.length > 0 || info.excludeTypes.length > 0) {
            _validatePlayerTypes(attackingPlayers, midfieldPlayers, defensivePlayers, info.includeTypes, info.excludeTypes);
        }

        info.teams[msg.sender] = Game.Team(attackingPlayers, midfieldPlayers, defensivePlayers);
        info.entrants.push(msg.sender);
        info.teamsEntered++;
        hasEntered[tournamentId][msg.sender] = true;
        
        emit TeamEntered(tournamentId, msg.sender, info.teamsEntered);

        if (info.teamsEntered == 2 ** info.rounds) {
            emit TournementReady(tournamentId, info.teamsEntered);
        }
    }

    function start(uint256 tournamentId) external nonReentrant {
        if (tournamentId >= tournementCounter) {
            revert("Tournement does not exist");
        }

        TournementInfo storage tournement = tournements[tournamentId];
        if (tournement.champion != address(0)) {
            revert("Tournament already completed");
        }

        if (tournement.cancelled) {
            revert("Tournament cancelled");
        }

        if (tournement.teamsEntered < 2 ** tournement.rounds) {
            revert("Not enough teams entered");
        }

        if (tournement.currentRound == 0) {
            delete tournement.roundEntrants;
            for (uint256 i = 0; i < tournement.entrants.length; i++) {
                tournement.roundEntrants.push(tournement.entrants[i]);
            }
            tournement.currentRound = 1;
        }

        address[] memory currentEntrants = tournement.roundEntrants;
        if (currentEntrants.length <= 1) {
            revert("No pending round to run");
        }

        if (_isLocalDebug()) {
            console.log("[Tournament] Round start");
            console.log("[Tournament] tournamentId", tournamentId);
            console.log("[Tournament] round", tournement.currentRound);
            console.log("[Tournament] entrantsThisRound", currentEntrants.length);
        }

        uint256 gasAtStart = gasleft();
        uint8 round = tournement.currentRound;
        address[] memory nextRound = new address[](currentEntrants.length / 2);

        for (uint256 i = 0; i < currentEntrants.length; i += 2) {
            Game.Team memory homeTeam = tournement.teams[currentEntrants[i]];
            Game.Team memory awayTeam = tournement.teams[currentEntrants[i + 1]];

            tournementMatchCounts[tournamentId]++;
            emit TournementMatchStarted(tournamentId, tournementMatchCounts[tournamentId], round, currentEntrants[i], currentEntrants[i + 1]);
            (address winner, , ) = game.playTournamentMatch(
                currentEntrants[i],
                homeTeam,
                currentEntrants[i + 1],
                awayTeam,
                tournamentId,
                tournementMatchCounts[tournamentId],
                round
            );

            if (_isLocalDebug()) {
                console.log("[Tournament] Match resolved");
                console.log("[Tournament] tournamentId", tournamentId);
                console.log("[Tournament] round", round);
                console.log("[Tournament] tournamentMatchId", tournementMatchCounts[tournamentId]);
                console.log("[Tournament] home", currentEntrants[i]);
                console.log("[Tournament] away", currentEntrants[i + 1]);
                console.log("[Tournament] winner", winner);
            }

            nextRound[i / 2] = winner;
        }

        uint256 prizePot = tournement.entryFee * tournement.teamsEntered;
        uint256 alreadyCompensated = tournementExecutorFees[tournamentId];
        uint256 remainingForCompensation = alreadyCompensated >= prizePot ? 0 : (prizePot - alreadyCompensated);
        uint256 gasSpent = gasAtStart - gasleft();
        uint256 executorFee = gasSpent * tx.gasprice;
        if (executorFee > remainingForCompensation) {
            executorFee = remainingForCompensation;
        }

        if (_isLocalDebug()) {
            console.log("[Tournament] Round gas accounting");
            console.log("[Tournament] gasSpent", gasSpent);
            console.log("[Tournament] executorFee", executorFee);
            console.log("[Tournament] totalExecutorFees", alreadyCompensated + executorFee);
        }

        tournementExecutorFees[tournamentId] = alreadyCompensated + executorFee;
        emit TournementExecutorCompensated(tournamentId, msg.sender, executorFee);

        if (executorFee > 0) {
            (bool success, ) = payable(msg.sender).call{value: executorFee}("");
            require(success, "Executor compensation failed");
        }

        delete tournement.roundEntrants;
        for (uint256 i = 0; i < nextRound.length; i++) {
            tournement.roundEntrants.push(nextRound[i]);
        }

        if (nextRound.length == 1) {
            tournement.champion = nextRound[0];
            uint256 distributablePot = prizePot - tournementExecutorFees[tournamentId];
            uint256 academyShare = (distributablePot * TOURNEMENT_ACADEMY_BPS) / BPS_DENOMINATOR;

            if (academyShare > 0) {
                tournementAcademyFees[tournamentId] = academyShare;
                academy.deposit{value: academyShare}();
                emit TournementAcademyFunded(tournamentId, academyShare);
            }

            uint256 championWinnings = distributablePot - academyShare;
            Game.Team memory winningTeam = tournement.teams[tournement.champion];
            TeamPlayerDetails[] memory winningTeamPlayers = _buildTeamPlayerDetails(winningTeam);

            if (_isLocalDebug()) {
                console.log("[Tournament] Completed");
                console.log("[Tournament] tournamentId", tournamentId);
                console.log("[Tournament] champion", tournement.champion);
                console.log("[Tournament] championWinnings", championWinnings);
                console.log("[Tournament] executorFees", tournementExecutorFees[tournamentId]);
                console.log("[Tournament] academyShare", academyShare);
            }

            emit TournementCompleted(tournamentId, tournement.champion, championWinnings, winningTeam, winningTeamPlayers);
            emit TournementCompletedSummary(tournamentId, tournement.champion, championWinnings, tournementExecutorFees[tournamentId]);
            return;
        }

        emit TournementRoundAdvanced(tournamentId, round, round + 1, uint8(nextRound.length));
        tournement.currentRound = round + 1;

        if (_isLocalDebug()) {
            console.log("[Tournament] Round advanced");
            console.log("[Tournament] tournamentId", tournamentId);
            console.log("[Tournament] completedRound", round);
            console.log("[Tournament] nextRound", tournement.currentRound);
            console.log("[Tournament] teamsRemaining", nextRound.length);
        }
    }

    function _isLocalDebug() private view returns (bool) {
        return block.chainid == 31337 || block.chainid == 1337;
    }

    function _isLiveTournement(TournementInfo storage info) private view returns (bool) {
        return !info.cancelled && info.champion == address(0);
    }

    function cancel(uint256 tournamentId) external {
        if (tournamentId >= tournementCounter) {
            revert("Tournement does not exist");
        }

        TournementInfo storage info = tournements[tournamentId];

        if (msg.sender != info.creator) {
            revert("Only creator can cancel");
        }

        if (info.cancelled) {
            revert("Tournament already cancelled");
        }

        if (info.champion != address(0)) {
            revert("Tournament already completed");
        }

        if (info.currentRound != 0) {
            revert("Tournament already started");
        }

        info.cancelled = true;
        emit TournementCancelled(tournamentId, msg.sender);
    }

    function claimCancelledEntry(uint256 tournamentId) external nonReentrant {
        if (tournamentId >= tournementCounter) {
            revert("Tournement does not exist");
        }

        TournementInfo storage info = tournements[tournamentId];

        if (!info.cancelled) {
            revert("Tournament is not cancelled");
        }

        if (!hasEntered[tournamentId][msg.sender]) {
            revert("No entry to refund");
        }

        if (hasRefundedEntry[tournamentId][msg.sender]) {
            revert("Entry already refunded");
        }

        hasRefundedEntry[tournamentId][msg.sender] = true;

        (bool success, ) = payable(msg.sender).call{value: info.entryFee}("");
        require(success, "Refund transfer failed");

        emit TournementEntryRefunded(tournamentId, msg.sender, info.entryFee);
    }

    function claimReward(uint256 tournamentId) external nonReentrant {
        if (tournamentId >= tournementCounter) {
            revert("Tournement does not exist");
        }

        TournementInfo storage info = tournements[tournamentId];
        
        if (info.champion == address(0)) {
            revert("Tournament has not completed");
        }

        if (msg.sender != info.champion) {
            revert("Only the champion can claim the reward");
        }

        if (hasClaimedReward[tournamentId][msg.sender]) {
            revert("Reward already claimed");
        }

        // Calculate reward: entry fee * number of entrants
        uint256 reward =
            (info.entryFee * info.teamsEntered) -
            tournementExecutorFees[tournamentId] -
            tournementAcademyFees[tournamentId];
        
        // Mark as claimed before transfer
        hasClaimedReward[tournamentId][msg.sender] = true;

        // Transfer reward to champion
        (bool success, ) = payable(msg.sender).call{value: reward}("");
        require(success, "Reward transfer failed");

        emit TournementRewardClaimed(tournamentId, msg.sender, reward);
    }

    function getCurrentRoundEntrants(uint256 tournamentId) external view returns (address[] memory entrants) {
        if (tournamentId >= tournementCounter) {
            revert("Tournement does not exist");
        }

        return tournements[tournamentId].roundEntrants;
    }

    function _validatePlayerStats(
        uint256[3] memory attackingPlayers,
        uint256[3] memory midfieldPlayers,
        uint256[3] memory defensivePlayers,
        uint8 minAttack,
        uint8 minDefence,
        uint8 maxAttack,
        uint8 maxDefence
    ) private view {
        require(
            _checkPlayerStatsRequirement(attackingPlayers, minAttack, minDefence, maxAttack, maxDefence) &&
            _checkPlayerStatsRequirement(midfieldPlayers, minAttack, minDefence, maxAttack, maxDefence) &&
            _checkPlayerStatsRequirement(defensivePlayers, minAttack, minDefence, maxAttack, maxDefence),
            "One or more players do not meet stat requirements"
        );
    }

    function _buildTeamPlayerDetails(Game.Team memory team) private view returns (TeamPlayerDetails[] memory details) {
        uint256 count = _countNonZeroPlayers(team);
        details = new TeamPlayerDetails[](count);

        uint256 index = 0;
        index = _appendRolePlayerDetails(team.attackingPlayers, details, index);
        index = _appendRolePlayerDetails(team.midfieldPlayers, details, index);
        _appendRolePlayerDetails(team.defensivePlayers, details, index);

        return details;
    }

    function _countNonZeroPlayers(Game.Team memory team) private pure returns (uint256 count) {
        for (uint256 i = 0; i < 3; i++) {
            if (team.attackingPlayers[i] != 0) {
                count++;
            }
            if (team.midfieldPlayers[i] != 0) {
                count++;
            }
            if (team.defensivePlayers[i] != 0) {
                count++;
            }
        }

        return count;
    }

    function _appendRolePlayerDetails(
        uint256[3] memory playerIds,
        TeamPlayerDetails[] memory details,
        uint256 startIndex
    ) private view returns (uint256) {
        uint256 index = startIndex;

        for (uint256 i = 0; i < 3; i++) {
            uint256 playerId = playerIds[i];
            if (playerId == 0) {
                continue;
            }

            (, uint256 attack, , uint256 defense, , , , uint256 playerType) = game.getPlayerAttributes(playerId);
            details[index] = TeamPlayerDetails({
                playerId: playerId,
                attack: attack,
                defense: defense,
                playerType: uint8(playerType)
            });
            index++;
        }

        return index;
    }

    function _checkPlayerStatsRequirement(
        uint256[3] memory players,
        uint8 minAttack,
        uint8 minDefence,
        uint8 maxAttack,
        uint8 maxDefence
    ) private view returns (bool) {
        for (uint i = 0; i < 3; i++) {
            if (players[i] != 0) {
                // Get player attack and defense stats
                (, uint attack, , uint defense, , , , ) = Game(address(game)).getPlayerAttributes(players[i]);
                
                if (minAttack > 0 && attack < minAttack) {
                    return false;
                }
                if (minDefence > 0 && defense < minDefence) {
                    return false;
                }
                if (maxAttack > 0 && attack > maxAttack) {
                    return false;
                }
                if (maxDefence > 0 && defense > maxDefence) {
                    return false;
                }
            }
        }
        return true;
    }

    function _validatePlayerTypes(
        uint256[3] memory attackingPlayers,
        uint256[3] memory midfieldPlayers,
        uint256[3] memory defensivePlayers,
        uint8[] memory includeTypes,
        uint8[] memory excludeTypes
    ) private view {
        uint256[9] memory allPlayers;
        uint count = 0;
        
        for (uint i = 0; i < 3; i++) {
            if (attackingPlayers[i] != 0) allPlayers[count++] = attackingPlayers[i];
            if (midfieldPlayers[i] != 0) allPlayers[count++] = midfieldPlayers[i];
            if (defensivePlayers[i] != 0) allPlayers[count++] = defensivePlayers[i];
        }

        for (uint i = 0; i < count; i++) {
            (, , , , , , , uint playerType) = Game(address(game)).getPlayerAttributes(allPlayers[i]);
            uint8 pType = uint8(playerType);

            // Check exclude list
            if (excludeTypes.length > 0) {
                for (uint j = 0; j < excludeTypes.length; j++) {
                    require(pType != excludeTypes[j], "Player type not allowed in this tournament");
                }
            }

            // Check include list (if specified, all players must be from include list)
            if (includeTypes.length > 0) {
                bool found = false;
                for (uint j = 0; j < includeTypes.length; j++) {
                    if (pType == includeTypes[j]) {
                        found = true;
                        break;
                    }
                }
                require(found, "Player type not included in this tournament");
            }
        }
    }

    function _validateTypeArray(uint8[] memory playerTypes) private pure {
        for (uint i = 0; i < playerTypes.length; i++) {
            require(playerTypes[i] <= 3, "Invalid player type");
        }
    }

    function _validateTypeCompatibility(uint8[] memory includeTypes, uint8[] memory excludeTypes) private pure {
        for (uint256 i = 0; i < includeTypes.length; i++) {
            for (uint256 j = i + 1; j < includeTypes.length; j++) {
                require(includeTypes[i] != includeTypes[j], "Duplicate include type");
            }
            for (uint256 k = 0; k < excludeTypes.length; k++) {
                require(includeTypes[i] != excludeTypes[k], "Type cannot be both included and excluded");
            }
        }

        for (uint256 i = 0; i < excludeTypes.length; i++) {
            for (uint256 j = i + 1; j < excludeTypes.length; j++) {
                require(excludeTypes[i] != excludeTypes[j], "Duplicate exclude type");
            }
        }
    }
}