# TAO Transfer Script for Bittensor Testnet

A Node.js script for transferring TAO tokens on the Bittensor testnet using private keys.

## Features

- Transfer TAO tokens on Bittensor testnet
- Interactive input for private key, receiver address, and amount
- Balance checking before transfer
- Gas estimation and fee calculation
- Transaction confirmation and status tracking
- Secure private key input (masked)
- Transaction explorer links

## Prerequisites

- Node.js (version 14 or higher)
- npm (Node Package Manager)
- TAO tokens on Bittensor testnet

## Installation

1. Clone or download this repository
2. Install dependencies:

```bash
npm install
```

## Configuration

The script is pre-configured for Bittensor testnet:

- Network: Bittensor Testnet
- RPC URL: `https://test.chain.opentensor.ai`
- Chain ID: `945`
- Currency: TAO

## Usage

Run the script:

```bash
npm start
```

Or directly with Node.js:

```bash
node transfer.js
```

## Interactive Process

The script will prompt you for:

1. Sender's Private Key: Enter your private key (input will be masked with asterisks)
2. Receiver's Address: Enter the destination wallet address
3. Amount: Enter the amount of TAO to transfer
4. Confirmation: Confirm the transfer details before execution


## Network Details

- Testnet RPC: https://test.chain.opentensor.ai
- Chain ID: 945
- Symbol: TAO
- Decimals: 18