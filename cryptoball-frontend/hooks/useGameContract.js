import { ethers } from 'ethers';
import { useEffect, useState } from 'react';

const contractABI = [
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
      "inputs": [
        {
          "internalType": "uint256",
          "name": "playerId",
          "type": "uint256"
        }
      ],
      "name": "getAttack",
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
          "name": "playerId",
          "type": "uint256"
        }
      ],
      "name": "getDefense",
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
          "internalType": "uint256[]",
          "name": "array",
          "type": "uint256[]"
        }
      ],
      "name": "hasDuplicates",
      "outputs": [
        {
          "internalType": "bool",
          "name": "",
          "type": "bool"
        }
      ],
      "stateMutability": "pure",
      "type": "function"
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
          "internalType": "uint256",
          "name": "homeGoals",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "awayGoals",
          "type": "uint256"
        }
      ],
      "stateMutability": "payable",
      "type": "function"
    }
  ];
const contractAddress = '0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0';

export const useGameContract = () => {
    const [provider, setProvider] = useState(null);
    const [gameContract, setGameContract] = useState(null);
    const [score, setScore] = useState(0);

    useEffect(() => {
        if (window.ethereum) {
            const provider = new ethers.providers.Web3Provider(window.ethereum);
            const signer = provider.getSigner();
            const gameContract = new ethers.Contract(contractAddress, contractABI, signer);
            setProvider(provider);
            setGameContract(gameContract);
        } else {
            console.error('Ethereum object not found, install MetaMask.');
        }
    }, []);

    const play = async (homeTeam, awayTeam) => {
        if (!gameContract) return;
        const tx = await gameContract.playMatch(homeTeam);
        await tx.wait();
    };

    const getScore = async () => {
        if (!gameContract) return;
        const score = await gameContract.getScore();
        setScore(score);
    };

    return { play, getScore };
};