// SPDX-License-Identifier: MIT
pragma solidity 0.8.21;

import './Game.sol';
import '@openzeppelin/contracts/security/ReentrancyGuard.sol';

contract Tournement is ReentrancyGuard {
    uint256 private tournementCounter = 0;
    Game private game;

    mapping(uint256 => TournementInfo) public tournements;
    mapping(uint256 => mapping(address => bool)) public hasEntered;
    mapping(uint256 => mapping(address => bool)) public hasClaimedReward;

    struct TournementInfo {
        uint8 rounds;
        uint256 entryFee;
        uint8 minAttack;
        uint8 minDefence;
        uint8 maxAttack;
        uint8 maxDefence;
        uint8[] includeTypes;
        uint8[] excludeTypes;
        address[] entrants;
        mapping(address => Game.Team) teams;
        uint8 teamsEntered;
        address champion;
    }

    struct TournementSummary {
        uint256 tournementId;
        uint8 rounds;
        uint256 entryFee;
        uint8 minAttack;
        uint8 minDefence;
        uint8 maxAttack;
        uint8 maxDefence;
        uint8[] includeTypes;
        uint8[] excludeTypes;
        uint8 teamsEntered;
        uint256 maxTeams;
        bool isOpen;
        address champion;
    }

    event TournementCreated(
        uint256 indexed tournementId,
        uint8 rounds,
        uint256 entryFee,
        uint8 minAttack,
        uint8 minDefence,
        uint8 maxAttack,
        uint8 maxDefence,
        uint8[] includeTypes,
        uint8[] excludeTypes
    );
    event TournementMatchStarted(uint256 indexed tournementId, uint8 indexed round, address homeAddress, address awayAddress);
    event TournementCompleted(uint256 indexed tournementId, address champion);

    constructor(address gameAddress) {
        game = Game(gameAddress);
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
        TournementInfo storage info = tournements[tournementCounter];
        info.rounds = rounds;
        info.entryFee = entryFee;
        info.minAttack = minAttack;
        info.minDefence = minDefence;
        info.maxAttack = maxAttack;
        info.maxDefence = maxDefence;
        info.includeTypes = includeTypes;
        info.excludeTypes = excludeTypes;
        info.teamsEntered = 0;
        delete info.entrants;
        info.champion = address(0);

        emit TournementCreated(tournementCounter, rounds, entryFee, minAttack, minDefence, maxAttack, maxDefence, includeTypes, excludeTypes);

        tournementCounter++;
    }

    function getTournements() external view returns (TournementSummary[] memory summaries) {
        summaries = new TournementSummary[](tournementCounter);

        for (uint256 i = 0; i < tournementCounter; i++) {
            TournementInfo storage info = tournements[i];
            uint256 maxTeams = 2 ** info.rounds;
            uint8[] memory includeTypes = info.includeTypes;
            uint8[] memory excludeTypes = info.excludeTypes;
            bool isOpen = info.champion == address(0) && info.teamsEntered < maxTeams;

            summaries[i] = TournementSummary({
                tournementId: i,
                rounds: info.rounds,
                entryFee: info.entryFee,
                minAttack: info.minAttack,
                minDefence: info.minDefence,
                maxAttack: info.maxAttack,
                maxDefence: info.maxDefence,
                includeTypes: includeTypes,
                excludeTypes: excludeTypes,
                teamsEntered: info.teamsEntered,
                maxTeams: maxTeams,
                isOpen: isOpen,
                champion: info.champion
            });
        }

        return summaries;
    }

    function enter(
        uint256 tournementId,
        uint256[3] memory attackingPlayers,
        uint256[3] memory midfieldPlayers,
        uint256[3] memory defensivePlayers
        ) external payable nonReentrant {

        if (tournementId >= tournementCounter) {
            revert("Tournement does not exist");
        }

        TournementInfo storage info = tournements[tournementId];
        if (msg.value != info.entryFee) {
            revert("Incorrect entry fee");
        }

        if (hasEntered[tournementId][msg.sender]) {
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
        hasEntered[tournementId][msg.sender] = true;
    }

    function start(uint256 tournementId) external {
        if (tournementId >= tournementCounter) {
            revert("Tournement does not exist");
        }

        TournementInfo storage tournement = tournements[tournementId];

        if (tournement.teamsEntered < 2 ** tournement.rounds) {
            revert("Not enough teams entered");
        }

        address[] memory currentEntrants = tournement.entrants;

        uint8 round = 1;

        while (currentEntrants.length > 1) {
            address[] memory nextRound = new address[](currentEntrants.length / 2);

            for (uint256 i = 0; i < currentEntrants.length; i += 2) {
                Game.Team memory homeTeam = tournement.teams[currentEntrants[i]];
                Game.Team memory awayTeam = tournement.teams[currentEntrants[i + 1]];

                emit TournementMatchStarted(tournementId, round, currentEntrants[i], currentEntrants[i + 1]);

                (address winner, , ) = game.playTournamentMatch(
                    currentEntrants[i],
                    homeTeam,
                    currentEntrants[i + 1],
                    awayTeam,
                    tournementId,
                    round
                );

                nextRound[i / 2] = winner;
            }

            currentEntrants = nextRound;
            round++;
        }

        tournement.champion = currentEntrants[0];
        emit TournementCompleted(tournementId, tournement.champion);
    }

    function claimReward(uint256 tournementId) external nonReentrant {
        if (tournementId >= tournementCounter) {
            revert("Tournement does not exist");
        }

        TournementInfo storage info = tournements[tournementId];
        
        if (info.champion == address(0)) {
            revert("Tournament has not completed");
        }

        if (msg.sender != info.champion) {
            revert("Only the champion can claim the reward");
        }

        if (hasClaimedReward[tournementId][msg.sender]) {
            revert("Reward already claimed");
        }

        // Calculate reward: entry fee * number of entrants
        uint256 reward = info.entryFee * info.teamsEntered;
        
        // Mark as claimed before transfer
        hasClaimedReward[tournementId][msg.sender] = true;

        // Transfer reward to champion
        (bool success, ) = payable(msg.sender).call{value: reward}("");
        require(success, "Reward transfer failed");
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
                
                if (minAttack > 0 && uint8(attack) < minAttack) {
                    return false;
                }
                if (minDefence > 0 && uint8(defense) < minDefence) {
                    return false;
                }
                if (maxAttack > 0 && uint8(attack) > maxAttack) {
                    return false;
                }
                if (maxDefence > 0 && uint8(defense) > maxDefence) {
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
}