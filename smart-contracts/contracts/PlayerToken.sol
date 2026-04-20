// SPDX-License-Identifier: MIT
pragma solidity 0.8.21;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/utils/math/Math.sol";

contract PlayerToken is ERC721 {
    uint256 private _tokenIdCounter = 1;
    uint256[101] private _distribution;

    struct PlayerAttributes {
        uint originalAttack;
        uint attack;
        uint originalDefense;
        uint defense;
        uint potential;
        uint256[101] distribution;
        uint gamesLeft;
        uint goalsScored;
        uint playerType;
    }

    struct Player {
        uint256 id;
        uint originalAttack;
        uint attack;
        uint originalDefense;
        uint defense;
        uint potential;
        uint gamesLeft;
        uint goalsScored;
        uint playerType;
    }

    mapping(uint256 => PlayerAttributes) public players;
    mapping(address => uint256[]) public playerIdsByOwner;

    constructor() ERC721("PlayerToken", "FPT") {
        _distribution = createDistribution();
    }

    event PlayerMinted(address indexed account, uint256 indexed playerId);

    function mintPlayer(
        address account
    ) external returns (uint256, uint, uint) {
        uint256 newPlayerId = _tokenIdCounter;
        playerIdsByOwner[account].push(newPlayerId);
        _safeMint(account, newPlayerId);
        _tokenIdCounter += 1;

        players[newPlayerId].attack = uint(
            readFromDistribution(
                _distribution,
                uint256(
                    keccak256(
                        abi.encodePacked(
                            block.timestamp,
                            msg.sender,
                            newPlayerId,
                            "attack"
                        )
                    )
                )
            )
        );
        players[newPlayerId].defense = uint(
            readFromDistribution(
                _distribution,
                uint256(
                    keccak256(
                        abi.encodePacked(
                            block.timestamp,
                            msg.sender,
                            newPlayerId,
                            "defense"
                        )
                    )
                )
            )
        );
        players[newPlayerId].potential = uint(
            Math.max(
                uint256(
                    keccak256(
                        abi.encodePacked(
                            block.timestamp,
                            msg.sender,
                            newPlayerId,
                            "potential"
                        )
                    )
                ) % 100,
                10
            )
        );
        players[newPlayerId].distribution = createPoissonDistribution(
            players[newPlayerId].potential
        );

        players[newPlayerId].gamesLeft = 100;
        players[newPlayerId].originalAttack = players[newPlayerId].attack;
        players[newPlayerId].originalDefense = players[newPlayerId].defense;
        players[newPlayerId].playerType = uint(
            (players[newPlayerId].attack + players[newPlayerId].defense + players[newPlayerId].potential) % 4
        );

        emit PlayerMinted(account, newPlayerId);

        return (
            newPlayerId,
            players[newPlayerId].attack,
            players[newPlayerId].defense
        );
    }

    function transfer(
        address from,
        address to,
        uint256 tokenId
    ) external {
        _transfer(from, to, tokenId);
        uint256[] storage fromPlayerIds = playerIdsByOwner[from];
        uint256[] storage toPlayerIds = playerIdsByOwner[to];

        for (uint i = 0; i < fromPlayerIds.length; i++) {
            if (fromPlayerIds[i] == tokenId) {
                fromPlayerIds[i] = fromPlayerIds[fromPlayerIds.length - 1];
                fromPlayerIds.pop();
                break;
            }
        }

        toPlayerIds.push(tokenId);
    }

    function scoreGoal(uint256 id) external {
        players[id].goalsScored++;
    }

    function getGoals(uint256 id) external view returns (uint) {
        return players[id].goalsScored;
    }

    function getPlayerAttributes(
        uint256 playerId
    )
        public
        view
        returns (
            uint origAttack,
            uint attack,
            uint origDef,
            uint defense,
            uint potential,
            uint gamesLeft,
            uint goalsScored,
            uint playerType
        )
    {
        return (
            players[playerId].originalAttack,
            players[playerId].attack,
            players[playerId].originalDefense,
            players[playerId].defense,
            players[playerId].potential,
            players[playerId].gamesLeft,
            players[playerId].goalsScored,
            players[playerId].playerType
        );
    }

    function getGamesLeft(uint256 id) external view returns (uint) {
        return players[id].gamesLeft;
    }

    function playMidfieldGame(uint256 id) external {
        playGame(id, false, false);
    }

    function playDefenseGame(uint256 id) external {
        playGame(id, false, true);
    }

    function playAttackGame(uint256 id) external {
        playGame(id, true, false);
    }

    function playGame(uint256 id, bool isAttack, bool isDefense) private {
        require(players[id].attack != 0, "Player does not exist"); // Relies on minimum attack being 20
        require(
            players[id].gamesLeft != 0,
            "Player has retired, unable to play more games"
        );

        // This is so that attack or defense is never negative
        if (players[id].attack <= 10) {
            players[id].attack = 10;
        } else if (players[id].defense <= 10) {
            players[id].defense = 10;
        }

        uint attackProgression = calculateProgression(
            players[id].attack,
            players[id].distribution
        );

        players[id].attack =
            players[id].attack +
            attackProgression -
            (isDefense ? 1 : 0);
        uint defenseProgression = calculateProgression(
            players[id].defense,
            players[id].distribution
        );

        players[id].defense =
            players[id].defense +
            defenseProgression -
            (isAttack ? 1 : 0);
        players[id].gamesLeft -= 1;
    }

    function calculateProgression(
        uint baseStat,
        uint256[101] memory distribution
    ) private view returns (uint) {
        uint256 randomNumber = uint256(
            keccak256(
                abi.encodePacked(
                    block.timestamp,
                    msg.sender,
                    baseStat,
                    "progression"
                )
            )
        );

        uint progression = ((100 - baseStat) *
            readFromDistribution(distribution, randomNumber)) / 100;

        return uint(progression);
    }

    function readFromDistribution(
        uint256[101] memory distribution,
        uint256 value
    ) private pure returns (uint) {
        for (uint i = 1; i <= 100; i++) {
            if (distribution[i] >= (value % distribution[100])) {
                return i;
            }
        }

        return 100;
    }

    /**
     * TODO: Make this not use an array by calulating the values on the fly until 100
     *
     * @param potential The potential of the player
     */
    function createPoissonDistribution(
        uint potential
    ) private pure returns (uint256[101] memory) {
        uint256[101] memory distribution;
        uint256 poissonValue = 1;
        distribution[0] = 0;

        for (uint i = 0; i < potential / 10; i++) {
            poissonValue *= 2718;
        }

        for (uint i = 1; i <= 100; i++) {
            poissonValue = (potential * poissonValue) / (i * 10);
            distribution[i] = distribution[i - 1] + poissonValue;
        }

        return distribution;
    }

    /**
     * TODO: Make this not use an array by calulating the values on the fly until 100
     */
    function createDistribution() private pure returns (uint256[101] memory) {
        uint256[101] memory distribution;

        for (uint i = 0; i < 20; i++) {
            distribution[i] = 0;
        }

        for (uint i = 20; i <= 50; i++) {
            distribution[i] = distribution[i - 1] + i;
        }

        for (uint i = 51; i <= 80; i++) {
            distribution[i] = distribution[i - 1] + 100 - i;
        }

        for (uint i = 81; i <= 100; i++) {
            distribution[i] = distribution[i - 1] + 1;
        }

        return distribution;
    }

    function getAllPlayers() external view returns (Player[] memory) {
        Player[] memory allPlayers = new Player[](_tokenIdCounter - 1);

        for (uint i = 1; i < _tokenIdCounter; i++) {
            allPlayers[i - 1] = Player(
                i,
                players[i].originalAttack,
                players[i].attack,
                players[i].originalDefense,
                players[i].defense,
                players[i].potential,
                players[i].gamesLeft,
                players[i].goalsScored,
                players[i].playerType
            );
        }

        return allPlayers;
    }

    function getPlayersByOwner(address owner) public view returns (Player[] memory) {
        uint[] memory playerIds = playerIdsByOwner[owner];

        Player[] memory playerList = new Player[](playerIds.length);

        for (uint i = 0; i < playerIds.length; i++) {
            uint256 id = playerIds[i];
            playerList[i] = Player(
                id,
                players[id].originalAttack,
                players[id].attack,
                players[id].originalDefense,
                players[id].defense,
                players[id].potential,
                players[id].gamesLeft,
                players[id].goalsScored,
                players[id].playerType
            );
        }

        return playerList;
    }
}
