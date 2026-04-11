# Polygon Amoy RPC Error Troubleshooting Guide

## Changes Made to Fix -32603 Errors

### 1. Improved RPC Configuration
- Added fallback RPC endpoints in `wagmi.ts`
- Using multiple RPCs: primary, drpc.org backup, and default public
- Fallback ensures if one RPC fails, another is tried

### 2. Simplified Transaction Calls
- Removed complex EIP-1559 parameter overrides
- Let wagmi/viem handle gas estimation automatically with better RPC
- Only specify `gas` limit where needed (complex transactions)

### 3. Reasonable Gas Limits
- Deposit: Auto-estimated (simple transfer)
- Buy Player: Auto-estimated
- Play Match: 5,000,000 gas
- Create Game: 1,000,000 gas
- Add Team: 1,000,000 gas

## If You Still Get -32603 Errors

### Try These in Order:

1. **Clear MetaMask Cache**
   - MetaMask Settings → Advanced
   - "Clear activity and nonce data"
   - Refresh your dapp

2. **Switch Networks Back and Forth**
   - Switch from Amoy to another network
   - Wait 5 seconds
   - Switch back to Amoy

3. **Try Different RPC in MetaMask**
   Add custom RPC in MetaMask:
   - Network Name: Polygon Amoy (Custom)
   - RPC URL: https://polygon-amoy.drpc.org
   - Chain ID: 80002
   - Currency: POL
   - Block Explorer: https://amoy.polygonscan.com

4. **Check Your Balance**
   - Make sure you have enough POL for gas
   - Get testnet POL from: https://faucet.polygon.technology/

5. **Wait Between Transactions**
   - Don't send multiple transactions rapidly
   - Wait for confirmation before sending next one
   - This prevents nonce collisions

6. **If a specific transaction fails repeatedly:**
   - Check the console logs for more details
   - The transaction hash might reveal more info on PolygonScan
   - Contract might be reverting (not an RPC issue)

## Common Error Meanings

| Error | Likely Cause | Solution |
|-------|--------------|----------|
| -32603 Internal JSON-RPC error | RPC can't estimate gas or simulate tx | Try different RPC or wait |
| Insufficient funds | Not enough POL for gas + value | Get more POL from faucet |
| Transaction underpriced | Gas too low (rare on Amoy) | Increase gas price in MetaMask |
| Nonce too low/high | MetaMask nonce out of sync | Clear activity data |
| Transaction reverted | Contract rejected the transaction | Check contract requirements |

## Debugging Tips

Check browser console (F12) for:
- Transaction parameters being sent
- Any contract error messages
- RPC endpoint being used

The app now logs:
- Account address
- Transaction values
- Gas parameters (when set)
- Chain ID

## Still Having Issues?

1. Check if your contract is deployed to Amoy
2. Verify contract addresses in `contracts/` folder
3. Try the transaction with smaller amounts first
4. Test on local hardhat network first if possible
