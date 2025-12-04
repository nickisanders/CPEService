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

## Project Structure

```
CPEService/
├── src/
│   ├── index.ts              # Main server entry point
│   ├── graphql/
│   │   ├── typeDefs.ts       # GraphQL schema definitions
│   │   └── resolvers.ts      # GraphQL resolvers
│   └── services/
│       └── rpcClient.ts      # RPC client service
├── dist/                      # Compiled JavaScript (generated)
├── .env                       # Environment variables (not in repo)
├── .env.example              # Example environment configuration
├── package.json              # Project dependencies
└── tsconfig.json             # TypeScript configuration
```

## Technologies Used

- **Apollo Server**: Modern GraphQL server
- **Ethers.js**: Ethereum library for RPC interactions
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