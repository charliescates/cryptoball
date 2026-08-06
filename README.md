# HI UR ERROR: https://stackoverflow.com/questions/71543451/h88-error-invalid-account-0-for-network-expected-string-received-undefined 
# I TRIED ALL THE THINGS IN THE STACK OVERFLOW + THEY DIDNT WORK


# Cryptoball
## Running in dev
After cloning, to run the app locally you first need to npm install in all `cryptoball-app` and `smart-contracts` directories.

Then in a new terminal, run:
```
npx hardhat node
```
This will set up a local hardhat ethereum network and will give you a list of pre-setup accounts.

In metamask, add a new network with the following details:
```
Network Name: Hardhat Local
New RPC URL: http://127.0.0.1:8545
Chain ID: 31337 (default for Hardhat)
Currency Symbol: POL (optional)
```

Connect to the network and add into your metamask a new account, copying the address of one of the ones listed in the node start up.

After this, it's time to deploy the contracts! To do this, open a new terminal in the `smart-contracts` directory and run:
```
npx hardhat compile
npx hardhat run scripts/deploy_localhost.ts --network localhost
```
That should deploy the contracts to your local host and give you the addresses. Make sure these match what you have defined in the contracts in `cryptoball-app`.

To run the UI, just go into `cryptoball-app` and run `npm run dev`. This should load up a screen and you should be good to go!

## Running the tests
Running the tests for hardhat is super simple, just cd into `smart-contracts` and run `npx hardhat test`

## Troubleshooting
1. If you are seeing errors implying no contract is running at the address, make sure you deployed it to the right one (i.e. you have `---network localhost` to hardhat commands)
2. If the transaction errors out in metamask, you might need to reset your nonce or change the one for that transaction
