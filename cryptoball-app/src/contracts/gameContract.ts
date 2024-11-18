export const gameContract = {
    address: '0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0',
    abi: [
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "playerTokenAddress",
          "type": "address"
        }
      ],
      "stateMutability": "nonpayable",
      "type": "constructor"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": false,
          "internalType": "uint8",
          "name": "homeScore",
          "type": "uint8"
        },
        {
          "indexed": false,
          "internalType": "uint8",
          "name": "awayScore",
          "type": "uint8"
        }
      ],
      "name": "MatchPlayed",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "playerId",
          "type": "uint256"
        }
      ],
      "name": "PlayerScored",
      "type": "event"
    },
    {
      "inputs": [
        {
          "internalType": "uint256[3]",
          "name": "homeAttackingPlayers",
          "type": "uint256[3]"
        },
        {
          "internalType": "uint256[3]",
          "name": "homeMidfieldPlayers",
          "type": "uint256[3]"
        },
        {
          "internalType": "uint256[3]",
          "name": "homeDefensivePlayers",
          "type": "uint256[3]"
        },
        {
          "internalType": "uint256[3]",
          "name": "awayAttackingPlayers",
          "type": "uint256[3]"
        },
        {
          "internalType": "uint256[3]",
          "name": "awayMidfieldPlayers",
          "type": "uint256[3]"
        },
        {
          "internalType": "uint256[3]",
          "name": "awayDefensivePlayers",
          "type": "uint256[3]"
        }
      ],
      "name": "playMatch",
      "outputs": [
        {
          "internalType": "uint8",
          "name": "homeGoals",
          "type": "uint8"
        },
        {
          "internalType": "uint8",
          "name": "awayGoals",
          "type": "uint8"
        }
      ],
      "stateMutability": "payable",
      "type": "function"
    }
  ] as const
}