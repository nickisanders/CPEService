import { PrivyWalletService } from '../services/privyWalletService';
import { RPCClient } from '../services/rpcClient';
import { ethers } from 'ethers';
import dotenv from 'dotenv';

dotenv.config();

async function mintWithPrivy() {
  // Initialize Privy service
  const privyService = new PrivyWalletService(
    process.env.PRIVY_APP_ID!,
    process.env.PRIVY_APP_SECRET!
  );

  // Create a Privy signer for the service account
  const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
  const privySigner = await privyService.createPrivySigner(
    process.env.PRIVY_MINTING_WALLET_USER_ID!,
    provider
  );

  // Create RPC client with Privy signer
  const rpcClient = new RPCClient(
    process.env.RPC_URL!,
    undefined, // no private key
    privySigner // use Privy signer
  );

  // Mint a certificate
  const receipt = await rpcClient.mintCertificate(
    '0xContractAddress',
    '0xRecipientAddress',
    'https://metadata-uri.com/token/1',
    'John Doe',
    'CERT-12345',
    'Blockchain Security',
    'Tech University',
    Date.now() / 1000,
    Date.now() / 1000,
    10
  );

  console.log('Certificate minted:', receipt.hash);
}

mintWithPrivy().catch(console.error);
