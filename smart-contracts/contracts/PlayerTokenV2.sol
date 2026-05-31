// SPDX-License-Identifier: MIT
pragma solidity 0.8.21;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/utils/math/Math.sol";

contract PlayerTokenV2 is ERC721, AccessControl {
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant GAME_ROLE = keccak256("GAME_ROLE");
    bytes32 public constant MIGRATOR_ROLE = keccak256("MIGRATOR_ROLE");

    uint256 private _nextTokenId = 1;
    uint256[101] private _distribution;
    bool public migrationLocked;

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

    struct MigrationPlayer {
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

    event PlayerMinted(address indexed account, uint256 indexed playerId);

    constructor(address admin, address minter, address game) ERC721("PlayerToken", "FPT") {
        address adminAddress = admin == address(0) ? msg.sender : admin;
        _grantRole(DEFAULT_ADMIN_ROLE, adminAddress);

        if (minter != address(0)) {
            _grantRole(MINTER_ROLE, minter);
        }
        if (game != address(0)) {
            _grantRole(GAME_ROLE, game);
        }

        // Admin can grant MIGRATOR_ROLE to migration operator(s).
        _distribution = createDistribution();
    }

    function supportsInterface(bytes4 interfaceId) public view override(ERC721, AccessControl) returns (bool) {
        return super.supportsInterface(interfaceId);
    }

    function setRole(address account, bytes32 role, bool enabled) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(account != address(0), "Invalid account");
        if (enabled) {
            grantRole(role, account);
        } else {
            revokeRole(role, account);
        }
    }

    function lockMigration() external onlyRole(DEFAULT_ADMIN_ROLE) {
        migrationLocked = true;
    }

    function mintPlayer(address account) external onlyRole(MINTER_ROLE) returns (uint256, uint, uint) {
        require(account != address(0), "Invalid recipient");

        uint256 newPlayerId = _nextTokenId;
        _safeMint(account, newPlayerId);
        _nextTokenId += 1;

        players[newPlayerId].attack = uint(
            readFromDistribution(
                _distribution,
                uint256(
                    keccak256(
                        abi.encodePacked(
                            block.prevrandao,
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
                            block.prevrandao,
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
                            block.prevrandao,
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
        players[newPlayerId].distribution = createPoissonDistribution(players[newPlayerId].potential);

        players[newPlayerId].gamesLeft = 100;
        players[newPlayerId].originalAttack = players[newPlayerId].attack;
        players[newPlayerId].originalDefense = players[newPlayerId].defense;
        players[newPlayerId].playerType = uint(
            (players[newPlayerId].attack + players[newPlayerId].defense + players[newPlayerId].potential) % 4
        );

        emit PlayerMinted(account, newPlayerId);

        return (newPlayerId, players[newPlayerId].attack, players[newPlayerId].defense);
    }

    function mintPlayerFromMigration(
        address account,
        MigrationPlayer calldata migrationPlayer
    ) external onlyRole(MIGRATOR_ROLE) returns (uint256) {
        require(!migrationLocked, "Migration locked");
        require(account != address(0), "Invalid recipient");
        require(!_exists(migrationPlayer.id), "Player already exists");
        require(migrationPlayer.id != 0, "Invalid player id");

        _safeMint(account, migrationPlayer.id);

        players[migrationPlayer.id].originalAttack = migrationPlayer.originalAttack;
        players[migrationPlayer.id].attack = migrationPlayer.attack;
        players[migrationPlayer.id].originalDefense = migrationPlayer.originalDefense;
        players[migrationPlayer.id].defense = migrationPlayer.defense;
        players[migrationPlayer.id].potential = migrationPlayer.potential;
        players[migrationPlayer.id].gamesLeft = migrationPlayer.gamesLeft;
        players[migrationPlayer.id].goalsScored = migrationPlayer.goalsScored;
        players[migrationPlayer.id].playerType = migrationPlayer.playerType;
        players[migrationPlayer.id].distribution = createPoissonDistribution(migrationPlayer.potential);

        if (migrationPlayer.id >= _nextTokenId) {
            _nextTokenId = migrationPlayer.id + 1;
        }

        emit PlayerMinted(account, migrationPlayer.id);

        return migrationPlayer.id;
    }

    // Kept for backward compatibility with Market/Academy integration.
    function transfer(address from, address to, uint256 tokenId) external {
        require(_isApprovedOrOwner(msg.sender, tokenId), "Not owner nor approved");
        require(ownerOf(tokenId) == from, "From is not owner");
        _transfer(from, to, tokenId);
    }

    function scoreGoal(uint256 id) external onlyRole(GAME_ROLE) {
        require(_exists(id), "Player does not exist");
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
        require(_exists(playerId), "Player does not exist");
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

    function playMidfieldGame(uint256 id) external onlyRole(GAME_ROLE) {
        playGame(id, false, false);
    }

    function playDefenseGame(uint256 id) external onlyRole(GAME_ROLE) {
        playGame(id, false, true);
    }

    function playAttackGame(uint256 id) external onlyRole(GAME_ROLE) {
        playGame(id, true, false);
    }

    function playGame(uint256 id, bool isAttack, bool isDefense) private {
        require(_exists(id), "Player does not exist");
        require(players[id].gamesLeft != 0, "Player has retired, unable to play more games");

        if (players[id].attack <= 10) {
            players[id].attack = 10;
        } else if (players[id].defense <= 10) {
            players[id].defense = 10;
        }

        uint attackProgression = calculateProgression(players[id].attack, players[id].distribution);

        players[id].attack = players[id].attack + attackProgression - (isDefense ? 1 : 0);
        uint defenseProgression = calculateProgression(players[id].defense, players[id].distribution);

        players[id].defense = players[id].defense + defenseProgression - (isAttack ? 1 : 0);
        players[id].gamesLeft -= 1;
    }

    function calculateProgression(uint baseStat, uint256[101] memory distribution) private view returns (uint) {
        uint256 randomNumber = uint256(
            keccak256(
                abi.encodePacked(block.prevrandao, block.timestamp, msg.sender, baseStat, "progression")
            )
        );

        uint progression = ((100 - baseStat) * readFromDistribution(distribution, randomNumber)) / 100;

        return uint(progression);
    }

    function readFromDistribution(uint256[101] memory distribution, uint256 value) private pure returns (uint) {
        for (uint i = 1; i <= 100; i++) {
            if (distribution[i] >= (value % distribution[100])) {
                return i;
            }
        }

        return 100;
    }

    function createPoissonDistribution(uint potential) private pure returns (uint256[101] memory) {
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
        uint256 activeCount = 0;

        for (uint256 i = 1; i < _nextTokenId; i++) {
            if (_exists(i)) {
                activeCount++;
            }
        }

        Player[] memory allPlayers = new Player[](activeCount);
        uint256 cursor = 0;

        for (uint256 i = 1; i < _nextTokenId; i++) {
            if (_exists(i)) {
                allPlayers[cursor] = Player(
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
                cursor++;
            }
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

    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 firstTokenId,
        uint256 batchSize
    ) internal override {
        super._beforeTokenTransfer(from, to, firstTokenId, batchSize);

        if (from == to) {
            return;
        }

        if (from != address(0)) {
            _removeOwnedToken(from, firstTokenId);
        }

        if (to != address(0)) {
            playerIdsByOwner[to].push(firstTokenId);
        }
    }

    function _removeOwnedToken(address owner, uint256 tokenId) private {
        uint256[] storage ownedTokens = playerIdsByOwner[owner];

        for (uint i = 0; i < ownedTokens.length; i++) {
            if (ownedTokens[i] == tokenId) {
                ownedTokens[i] = ownedTokens[ownedTokens.length - 1];
                ownedTokens.pop();
                break;
            }
        }
    }
}