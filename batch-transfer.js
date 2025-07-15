const { ethers } = require('ethers');
const readlineSync = require('readline-sync');

// Bittensor Testnet Configuration
const TESTNET_RPC_URL = 'https://test.chain.opentensor.ai';
const CHAIN_ID = 945;

class BatchTAOTransfer {
  constructor() {
    this.provider = new ethers.JsonRpcProvider(TESTNET_RPC_URL);
    this.wallet = null;
  }

  async initialize() {
    console.log('Batch TAO Transfer Script for Bittensor Testnet');
    
    // Get private key
    const privateKey = readlineSync.question('Enter sender private key: ', {
      hideEchoBack: true,
      mask: '*'
    });
    
    const formattedPrivateKey = privateKey.startsWith('0x') ? privateKey : `0x${privateKey}`;
    this.wallet = new ethers.Wallet(formattedPrivateKey, this.provider);
    
    console.log(`Wallet loaded: ${this.wallet.address}`);
    
    // Check balance
    const balance = await this.provider.getBalance(this.wallet.address);
    console.log(`Balance: ${ethers.formatEther(balance)} TAO`);
    
    return balance;
  }

  async batchTransfer(recipients) {
    console.log('\nStarting batch transfers...');
    
    const results = [];
    
    for (let i = 0; i < recipients.length; i++) {
      const recipient = recipients[i];
      console.log(`\nTransfer ${i + 1}/${recipients.length}:`);
      console.log(`   To: ${recipient.address}`);
      console.log(`   Amount: ${recipient.amount} TAO`);
      
      try {
        const tx = {
          to: recipient.address,
          value: ethers.parseEther(recipient.amount.toString()),
          gasLimit: 21000,
        };
        
        const txResponse = await this.wallet.sendTransaction(tx);
        console.log(`Hash: ${txResponse.hash}`);
        
        // Wait for confirmation
        const receipt = await txResponse.wait();
        
        results.push({
          recipient: recipient.address,
          amount: recipient.amount,
          hash: receipt.hash,
          status: receipt.status === 1 ? 'Success' : 'Failed',
          gasUsed: receipt.gasUsed.toString()
        });
        
        console.log(`Status: ${receipt.status === 1 ? 'Success' : 'Failed'}`);
        
        // Add delay between transfers to avoid rate limiting
        if (i < recipients.length - 1) {
          console.log('Waiting 2 seconds...');
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
        
      } catch (error) {
        console.log(`Error: ${error.message}`);
        results.push({
          recipient: recipient.address,
          amount: recipient.amount,
          hash: 'N/A',
          status: 'Error',
          error: error.message
        });
      }
    }
    
    return results;
  }

  printSummary(results) {
    console.log('\n📊 Batch Transfer Summary:');
    console.log('════════════════════════════════════════════');
    
    const successful = results.filter(r => r.status === 'Success').length;
    const failed = results.filter(r => r.status !== 'Success').length;
    
    console.log(`✅ Successful transfers: ${successful}`);
    console.log(`❌ Failed transfers: ${failed}`);
    console.log(`📊 Total transfers: ${results.length}`);
    
    console.log('\n📋 Detailed Results:');
    console.log('─────────────────────────────────────────────');
    
    results.forEach((result, index) => {
      console.log(`${index + 1}. ${result.recipient}`);
      console.log(`   Amount: ${result.amount} TAO`);
      console.log(`   Status: ${result.status}`);
      console.log(`   Hash: ${result.hash}`);
      if (result.error) {
        console.log(`   Error: ${result.error}`);
      }
      console.log('');
    });
  }

  async run() {
    try {
      await this.initialize();
      
      // Example recipients - modify as needed
      const recipients = [
        { address: '0x1234567890123456789012345678901234567890', amount: 0.1 },
        { address: '0x0987654321098765432109876543210987654321', amount: 0.2 },
        { address: '0x1111111111111111111111111111111111111111', amount: 0.15 }
      ];
      
      console.log('\n🎯 Recipients to transfer to:');
      recipients.forEach((recipient, index) => {
        console.log(`${index + 1}. ${recipient.address} - ${recipient.amount} TAO`);
      });
      
      const confirm = readlineSync.question('\nProceed with batch transfer? (yes/no): ');
      
      if (confirm.toLowerCase() !== 'yes' && confirm.toLowerCase() !== 'y') {
        console.log('❌ Batch transfer cancelled');
        return;
      }
      
      const results = await this.batchTransfer(recipients);
      this.printSummary(results);
      
    } catch (error) {
      console.error(`❌ Error: ${error.message}`);
    }
  }
}

// Example usage with command line arguments
if (require.main === module) {
  const batchTransfer = new BatchTAOTransfer();
  batchTransfer.run();
}

module.exports = BatchTAOTransfer; 