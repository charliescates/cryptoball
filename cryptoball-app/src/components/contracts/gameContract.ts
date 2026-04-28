import { Contract } from "./types";

export const gameContract: Contract = {
  address: '0xbD4680D8A39CB68A11794e235212AD7664504d84' as `0x${string}`,
  abi: [
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "playerTokenAddress",
          "type": "address"
        },
        {
          "internalType": "address",
          "name": "academyAddress",
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
          "internalType": "uint256",
          "name": "matchId",
          "type": "uint256"
        },
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
          "name": "matchId",
          "type": "uint256"
        }
      ],
      "name": "NewMatch",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "matchId",
          "type": "uint256"
        },
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
      "inputs": [],
      "name": "EXECUTION_FEE_BPS",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "matchId",
          "type": "uint256"
        },
        {
          "internalType": "uint256[3]",
          "name": "attackingPlayers",
          "type": "uint256[3]"
        },
        {
          "internalType": "uint256[3]",
          "name": "midfieldPlayers",
          "type": "uint256[3]"
        },
        {
          "internalType": "uint256[3]",
          "name": "defensivePlayers",
          "type": "uint256[3]"
        }
      ],
      "name": "addTeam",
      "outputs": [],
      "stateMutability": "payable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "wagerRequired",
          "type": "uint256"
        },
        {
          "internalType": "address",
          "name": "homeAddress",
          "type": "address"
        },
        {
          "internalType": "address",
          "name": "awayAddress",
          "type": "address"
        }
      ],
      "name": "createGame",
      "outputs": [],
      "stateMutability": "payable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "matchId",
          "type": "uint256"
        }
      ],
      "name": "getMatch",
      "outputs": [
        {
          "components": [
            {
              "internalType": "uint256",
              "name": "wagerRequired",
              "type": "uint256"
            },
            {
              "internalType": "address",
              "name": "homeAddress",
              "type": "address"
            },
            {
              "components": [
                {
                  "internalType": "uint256[3]",
                  "name": "attackingPlayers",
                  "type": "uint256[3]"
                },
                {
                  "internalType": "uint256[3]",
                  "name": "midfieldPlayers",
                  "type": "uint256[3]"
                },
                {
                  "internalType": "uint256[3]",
                  "name": "defensivePlayers",
                  "type": "uint256[3]"
                }
              ],
              "internalType": "struct Game.Team",
              "name": "homeTeam",
              "type": "tuple"
            },
            {
              "internalType": "address",
              "name": "awayAddress",
              "type": "address"
            },
            {
              "components": [
                {
                  "internalType": "uint256[3]",
                  "name": "attackingPlayers",
                  "type": "uint256[3]"
                },
                {
                  "internalType": "uint256[3]",
                  "name": "midfieldPlayers",
                  "type": "uint256[3]"
                },
                {
                  "internalType": "uint256[3]",
                  "name": "defensivePlayers",
                  "type": "uint256[3]"
                }
              ],
              "internalType": "struct Game.Team",
              "name": "awayTeam",
              "type": "tuple"
            },
            {
              "internalType": "uint256",
              "name": "pot",
              "type": "uint256"
            }
          ],
          "internalType": "struct Game.Match",
          "name": "",
          "type": "tuple"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "getMatchList",
      "outputs": [
        {
          "internalType": "uint256[]",
          "name": "",
          "type": "uint256[]"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "name": "matches",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "wagerRequired",
          "type": "uint256"
        },
        {
          "internalType": "address",
          "name": "homeAddress",
          "type": "address"
        },
        {
          "components": [
            {
              "internalType": "uint256[3]",
              "name": "attackingPlayers",
              "type": "uint256[3]"
            },
            {
              "internalType": "uint256[3]",
              "name": "midfieldPlayers",
              "type": "uint256[3]"
            },
            {
              "internalType": "uint256[3]",
              "name": "defensivePlayers",
              "type": "uint256[3]"
            }
          ],
          "internalType": "struct Game.Team",
          "name": "homeTeam",
          "type": "tuple"
        },
        {
          "internalType": "address",
          "name": "awayAddress",
          "type": "address"
        },
        {
          "components": [
            {
              "internalType": "uint256[3]",
              "name": "attackingPlayers",
              "type": "uint256[3]"
            },
            {
              "internalType": "uint256[3]",
              "name": "midfieldPlayers",
              "type": "uint256[3]"
            },
            {
              "internalType": "uint256[3]",
              "name": "defensivePlayers",
              "type": "uint256[3]"
            }
          ],
          "internalType": "struct Game.Team",
          "name": "awayTeam",
          "type": "tuple"
        },
        {
          "internalType": "uint256",
          "name": "pot",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    }
  ] as const
}