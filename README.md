# CPEService

A GraphQL API service that connects to blockchain RPC nodes to provide easy access to blockchain data and operations.

## Features

- **GraphQL API**: Clean, type-safe API for querying blockchain data
- **RPC Integration**: Connects to any Ethereum-compatible RPC node
- **Comprehensive Queries**: Access blocks, transactions, balances, gas prices, and more
- **TypeScript**: Fully typed codebase for better developer experience

## Prerequisites

- Node.js 18 or higher
- npm or yarn
- Access to an Ethereum-compatible RPC endpoint

## Installation

1. Clone the repository:
```bash
git clone https://github.com/nickisanders/CPEService.git
cd CPEService
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables:
```bash
cp .env.example .env
```

Edit `.env` to set your RPC URL:
```
RPC_URL=https://eth.llamarpc.com
PORT=4000
```

## Usage

### Development Mode

Run the server in development mode with hot reload:
```bash
npm run dev
```

### Production Mode

1. Build the project:
```bash
npm run build
```

2. Start the server:
```bash
npm start
```

The GraphQL server will be available at `http://localhost:4000`

## GraphQL API

Once the server is running, you can access the GraphQL playground at `http://localhost:4000`

### Available Queries

#### Get Current Block Number
```graphql
query {
  blockNumber
}
```

#### Get Block Information
```graphql
query {
  block(blockHashOrNumber: "latest") {
    number
    hash
    timestamp
    gasUsed
    gasLimit
    transactions
  }
}
```

#### Get Transaction Details
```graphql
query {
  transaction(txHash: "0x...") {
    hash
    from
    to
    value
    gasPrice
    blockNumber
  }
}
```

#### Get Account Balance
```graphql
query {
  balance(address: "0x...")
}
```

#### Get Gas Price
```graphql
query {
  gasPrice
}
```

#### Get Network Info
```graphql
query {
  network {
    name
    chainId
  }
}
```

#### Get Transaction Receipt
```graphql
query {
  transactionReceipt(txHash: "0x...") {
    transactionHash
    blockNumber
    status
    gasUsed
  }
}
```

#### Get Transaction Count (Nonce)
```graphql
query {
  transactionCount(address: "0x...")
}
```

## RPC Configuration

The service supports any Ethereum-compatible RPC endpoint. Common options include:

- **Public RPCs**: 
  - `https://eth.llamarpc.com` (default)
  - `https://rpc.ankr.com/eth`
  - `https://cloudflare-eth.com`

- **Infura**: `https://mainnet.infura.io/v3/YOUR_PROJECT_ID`
- **Alchemy**: `https://eth-mainnet.g.alchemy.com/v2/YOUR_API_KEY`
- **Local Node**: `http://localhost:8545`

## Privy Wallet Integration

CPEService supports secure, programmatic transaction signing through [Privy](https://privy.io)'s server-side wallet management. This keeps private keys secure on Privy's infrastructure while maintaining programmatic minting capabilities.

### Wallet Configuration Modes

#### Development/Testing Mode (Direct Private Key)
For local development and testing, you can use a direct private key:

```bash
# .env
RPC_URL=https://sepolia.infura.io/v3/YOUR_PROJECT_ID
PRIVATE_KEY=0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef
```

```typescript
import { RPCClient } from './services/rpcClient';

const rpcClient = new RPCClient(
  process.env.RPC_URL!,
  process.env.PRIVATE_KEY // Direct private key
);
```

⚠️ **Warning**: Never use direct private keys in production. They should only be used for local development and testing.

#### Production Mode (Privy Signer)
For production, use Privy's secure wallet management:

```bash
# .env
RPC_URL=https://mainnet.infura.io/v3/YOUR_PROJECT_ID
PRIVY_APP_ID=your_privy_app_id
PRIVY_APP_SECRET=your_privy_app_secret
PRIVY_MINTING_WALLET_USER_ID=your_service_account_user_id
```

```typescript
import { PrivyWalletService } from './services/privyWalletService';
import { RPCClient } from './services/rpcClient';
import { ethers } from 'ethers';

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

// Mint a certificate using Privy
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
```

### Setting Up Privy

1. **Create a Privy Account**
   - Sign up at [privy.io](https://privy.io)
   - Create a new app in the Privy dashboard

2. **Get Your Credentials**
   - Navigate to your app settings
   - Copy your App ID and App Secret
   - Store them securely as environment variables

3. **Create a Service Account**
   - In your Privy dashboard, create a user account that will be used for minting
   - This account will have an embedded wallet managed by Privy
   - Copy the user ID (e.g., `did:privy:abc123...`)

4. **Configure Environment Variables**
   ```bash
   PRIVY_APP_ID=your_privy_app_id
   PRIVY_APP_SECRET=your_privy_app_secret
   PRIVY_MINTING_WALLET_USER_ID=did:privy:abc123...
   ```

### Example Usage

A complete example is available at `src/examples/privyMintingExample.ts`:

```typescript
import { PrivyWalletService } from '../services/privyWalletService';
import { RPCClient } from '../services/rpcClient';
import { ethers } from 'ethers';
import dotenv from 'dotenv';

dotenv.config();

async function mintWithPrivy() {
  const privyService = new PrivyWalletService(
    process.env.PRIVY_APP_ID!,
    process.env.PRIVY_APP_SECRET!
  );

  const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
  const privySigner = await privyService.createPrivySigner(
    process.env.PRIVY_MINTING_WALLET_USER_ID!,
    provider
  );

  const rpcClient = new RPCClient(
    process.env.RPC_URL!,
    undefined,
    privySigner
  );

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
```

### Security Best Practices

1. **Never commit private keys** to version control
2. **Use Privy for production** - keeps private keys secure on Privy's infrastructure
3. **Use environment variables** for all sensitive configuration
4. **Rotate credentials regularly** - update Privy app secrets periodically
5. **Limit permissions** - use service accounts with minimal required permissions
6. **Monitor transactions** - set up alerts for unusual minting activity

### API Reference

#### PrivyWalletService

```typescript
class PrivyWalletService {
  constructor(appId: string, appSecret: string);
  
  // Get wallet address for a Privy user
  async getWalletAddress(userId: string): Promise<string>;
  
  // Create a signer that uses Privy for transaction signing
  async createPrivySigner(
    userId: string, 
    provider: ethers.Provider
  ): Promise<ethers.Signer>;
}
```

#### RPCClient (Updated)

```typescript
class RPCClient {
  constructor(
    rpcUrl: string,
    privateKey?: string,        // For development/testing
    externalSigner?: ethers.Signer  // For production (Privy)
  );
  
  // Get the address of the configured signer
  async getSignerAddress(): Promise<string | undefined>;
  
  // ... other methods
}
```

### Important Notes

- The `PrivySigner` implementation includes placeholder methods for `signTransaction` and `signMessage`
- These methods need to be implemented based on Privy's actual API endpoints
- Check [Privy's documentation](https://docs.privy.io/) for the latest server-side signing APIs
- The current implementation demonstrates the integration pattern but requires completion for production use

## Project Structure

```
CPEService/
├── src/
│   ├── index.ts              # Main server entry point
│   ├── graphql/
│   │   ├── typeDefs.ts       # GraphQL schema definitions
│   │   └── resolvers.ts      # GraphQL resolvers
│   ├── services/
│   │   ├── rpcClient.ts      # RPC client service
│   │   └── privyWalletService.ts  # Privy wallet integration
│   └── examples/
│       └── privyMintingExample.ts # Example Privy usage
├── dist/                      # Compiled JavaScript (generated)
├── .env                       # Environment variables (not in repo)
├── .env.example              # Example environment configuration
├── package.json              # Project dependencies
└── tsconfig.json             # TypeScript configuration
```

## Technologies Used

- **Apollo Server**: Modern GraphQL server
- **Ethers.js**: Ethereum library for RPC interactions
- **Privy**: Secure server-side wallet management
- **TypeScript**: Type-safe development
- **Node.js**: Runtime environment

## Development

### Building

```bash
npm run build
```

### Running Tests

```bash
npm test
```

## License

ISC