const { ethers } = require('ethers');
const readlineSync = require('readline-sync');
require('dotenv').config();

// Bittensor Testnet Configuration
const TESTNET_RPC_URL = 'https://test.chain.opentensor.ai';
const CHAIN_ID = 945;

class TAOTransfer {
  constructor() {
    this.provider = new ethers.JsonRpcProvider(TESTNET_RPC_URL);
    this.wallet = null;
  }

  async initialize() {
    console.log('TAO Transfer Script for Bittensor Testnet');
    console.log(`Network: Bittensor Testnet (Chain ID: ${CHAIN_ID})`);
    console.log(`RPC URL: ${TESTNET_RPC_URL}`);

    // Check network connection
    try {
      const network = await this.provider.getNetwork();
      console.log(`Connected to network: ${network.name} (Chain ID: ${network.chainId})`);
    } catch (error) {
      console.error('Failed to connect to network:', error.message);
      process.exit(1);
    }
  }

  async getWalletInfo() {
    console.log('\nPlease provide the following information:');
    
    // Get private key
    const privateKey = readlineSync.question('Enter sender private key (without 0x prefix): ', {
      hideEchoBack: true,
      mask: '*'
    });

    if (!privateKey) {
      throw new Error('Private key is required');
    }

    // Ensure proper format
    const formattedPrivateKey = privateKey.startsWith('0x') ? privateKey : `0x${privateKey}`;
    
    try {
      this.wallet = new ethers.Wallet(formattedPrivateKey, this.provider);
      console.log(`Wallet loaded successfully`);
      console.log(`Sender address: ${this.wallet.address}`);
    } catch (error) {
      throw new Error(`Invalid private key: ${error.message}`);
    }
  }

  async getTransferDetails() {
    console.log('\nTransfer Details:');
    
    // Get receiver address
    const receiverAddress = readlineSync.question('Enter receiver address: ');
    
    if (!ethers.isAddress(receiverAddress)) {
      throw new Error('Invalid receiver address');
    }

    // Get amount
    const amountInput = readlineSync.question('Enter amount to transfer (in TAO): ');
    const amount = parseFloat(amountInput);
    
    if (isNaN(amount) || amount <= 0) {
      throw new Error('Invalid amount');
    }

    // Convert TAO to Wei (TAO has 18 decimals like ETH)
    const amountWei = ethers.parseEther(amount.toString());

    return {
      receiverAddress,
      amount,
      amountWei
    };
  }

  async checkBalance() {
    try {
      const balance = await this.provider.getBalance(this.wallet.address);
      const balanceInTAO = ethers.formatEther(balance);
      console.log(`Current balance: ${balanceInTAO} TAO`);
      return balance;
    } catch (error) {
      throw new Error(`Failed to check balance: ${error.message}`);
    }
  }

  async estimateGas(receiverAddress, amountWei) {
    try {
      const gasEstimate = await this.provider.estimateGas({
        to: receiverAddress,
        value: amountWei,
        from: this.wallet.address
      });
      
      const gasPrice = await this.provider.getFeeData();
      const estimatedFee = gasEstimate * gasPrice.gasPrice;
      
      console.log(`Estimated gas: ${gasEstimate.toString()}`);
      console.log(`Estimated fee: ${ethers.formatEther(estimatedFee)} TAO`);
      
      return { gasEstimate, gasPrice: gasPrice.gasPrice, estimatedFee };
    } catch (error) {
      throw new Error(`Failed to estimate gas: ${error.message}`);
    }
  }

  async performTransfer(receiverAddress, amountWei) {
    console.log('\nPerforming transfer...');
    
    try {
      // Create transaction
      const tx = {
        to: receiverAddress,
        value: amountWei,
        gasLimit: 21000, // Standard gas limit for ETH/TAO transfer
      };

      // Send transaction
      const txResponse = await this.wallet.sendTransaction(tx);
      console.log(`Transaction sent!`);
      console.log(`Transaction hash: ${txResponse.hash}`);
      console.log(`Explorer: https://test.chain.opentensor.ai/tx/${txResponse.hash}`);

      const receipt = await txResponse.wait();
      
      if (receipt.status === 1) {
        console.log('Transaction confirmed!');
        console.log(`Block number: ${receipt.blockNumber}`);
        console.log(`Gas used: ${receipt.gasUsed.toString()}`);
        console.log(`Transaction fee: ${ethers.formatEther(receipt.gasUsed * receipt.gasPrice)} TAO`);
      } else {
        console.log('Transaction failed');
      }
      
      return receipt;
    } catch (error) {
      throw new Error(`Transfer failed: ${error.message}`);
    }
  }

  async showSummary(receiverAddress, amount, receipt) {
    console.log('\nTransfer Summary:');
    console.log(`From: ${this.wallet.address}`);
    console.log(`To: ${receiverAddress}`);
    console.log(`Amount: ${amount} TAO`);
    console.log(`Status: ${receipt.status === 1 ? 'Success' : 'Failed'}`);
    console.log(`Transaction Hash: ${receipt.hash}`);
    console.log(`Block Number: ${receipt.blockNumber}`);
    console.log(`Gas Used: ${receipt.gasUsed.toString()}`);
  }

  async run() {
    try {
      await this.initialize();
      await this.getWalletInfo();
      
      const balance = await this.checkBalance();
      const { receiverAddress, amount, amountWei } = await this.getTransferDetails();
      
      // Check if sufficient balance
      if (balance < amountWei) {
        throw new Error('Insufficient balance for transfer');
      }

      // Estimate gas
      const { estimatedFee } = await this.estimateGas(receiverAddress, amountWei);
      
      // Check if sufficient balance including fees
      if (balance < amountWei + estimatedFee) {
        throw new Error('Insufficient balance for transfer including gas fees');
      }

      // Confirmation
      console.log('\nTransfer Confirmation:');
      console.log('─────────────────────────');
      console.log(`From: ${this.wallet.address}`);
      console.log(`To: ${receiverAddress}`);
      console.log(`Amount: ${amount} TAO`);
      console.log(`Estimated Fee: ${ethers.formatEther(estimatedFee)} TAO`);
      console.log(`Total Deduction: ${ethers.formatEther(amountWei + estimatedFee)} TAO`);
      
      const confirm = readlineSync.question('\nConfirm transfer? (yes/no): ');
      
      if (confirm.toLowerCase() !== 'yes' && confirm.toLowerCase() !== 'y') {
        console.log('Transfer cancelled');
        return;
      }

      // Perform the transfer
      const receipt = await this.performTransfer(receiverAddress, amountWei);
      await this.showSummary(receiverAddress, amount, receipt);
      
    } catch (error) {
      console.error(`\nError: ${error.message}`);
      process.exit(1);
    }
  }
}

// Run the transfer script
const transfer = new TAOTransfer();
transfer.run(); 