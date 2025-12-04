# CPEService - GraphQL Query Examples

This document provides example GraphQL queries you can run against the CPEService API.

## Getting Started

1. Start the server:
```bash
npm run dev
# or for production
npm run build && npm start
```

2. Open your browser to `http://localhost:4000` to access the GraphQL playground

## Example Queries

### 1. Get Current Block Number

This is the simplest query to verify your connection is working:

```graphql
query GetBlockNumber {
  blockNumber
}
```

**Expected Response:**
```json
{
  "data": {
    "blockNumber": 18500000
  }
}
```

### 2. Get Network Information

Check which blockchain network you're connected to:

```graphql
query GetNetwork {
  network {
    name
    chainId
  }
}
```

**Expected Response:**
```json
{
  "data": {
    "network": {
      "name": "mainnet",
      "chainId": "1"
    }
  }
}
```

### 3. Get Current Gas Price

Query the current gas price in Gwei:

```graphql
query GetGasPrice {
  gasPrice
}
```

**Expected Response:**
```json
{
  "data": {
    "gasPrice": "25.5"
  }
}
```

### 4. Get Latest Block Details

Retrieve detailed information about the latest block:

```graphql
query GetLatestBlock {
  block(blockHashOrNumber: "latest") {
    number
    hash
    timestamp
    parentHash
    gasLimit
    gasUsed
    miner
    transactions
    baseFeePerGas
  }
}
```

**Expected Response:**
```json
{
  "data": {
    "block": {
      "number": 18500000,
      "hash": "0x1234...",
      "timestamp": 1702000000,
      "parentHash": "0x5678...",
      "gasLimit": "30000000",
      "gasUsed": "15000000",
      "miner": "0xabcd...",
      "transactions": ["0xtx1...", "0xtx2..."],
      "baseFeePerGas": "25000000000"
    }
  }
}
```

### 5. Get Block by Number

Query a specific block by its number:

```graphql
query GetBlockByNumber {
  block(blockHashOrNumber: "18000000") {
    number
    hash
    timestamp
    gasUsed
    transactions
  }
}
```

### 6. Get Account Balance

Check the ETH balance of any address:

```graphql
query GetBalance {
  balance(address: "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045")
}
```

**Expected Response:**
```json
{
  "data": {
    "balance": "1.23456789"
  }
}
```

Note: Balance is returned in ETH (not Wei).

### 7. Get Transaction Count (Nonce)

Get the transaction count for an address:

```graphql
query GetTransactionCount {
  transactionCount(address: "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045")
}
```

**Expected Response:**
```json
{
  "data": {
    "transactionCount": 42
  }
}
```

### 8. Get Transaction Details

Query details of a specific transaction:

```graphql
query GetTransaction {
  transaction(txHash: "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef") {
    hash
    from
    to
    value
    gasLimit
    gasPrice
    nonce
    blockNumber
    blockHash
  }
}
```

**Expected Response:**
```json
{
  "data": {
    "transaction": {
      "hash": "0x1234...",
      "from": "0xabc...",
      "to": "0xdef...",
      "value": "1.5",
      "gasLimit": "21000",
      "gasPrice": "30.5",
      "nonce": 10,
      "blockNumber": 18500000,
      "blockHash": "0x5678..."
    }
  }
}
```

### 9. Get Transaction Receipt

Get the receipt of a mined transaction:

```graphql
query GetTransactionReceipt {
  transactionReceipt(txHash: "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef") {
    transactionHash
    blockNumber
    blockHash
    from
    to
    gasUsed
    cumulativeGasUsed
    status
    contractAddress
    logs {
      address
      topics
      data
      logIndex
    }
  }
}
```

**Expected Response:**
```json
{
  "data": {
    "transactionReceipt": {
      "transactionHash": "0x1234...",
      "blockNumber": 18500000,
      "blockHash": "0x5678...",
      "from": "0xabc...",
      "to": "0xdef...",
      "gasUsed": "21000",
      "cumulativeGasUsed": "1500000",
      "status": 1,
      "contractAddress": null,
      "logs": []
    }
  }
}
```

### 10. Complex Query - Multiple Fields

You can combine multiple queries in a single request:

```graphql
query GetMultipleData {
  blockNumber
  gasPrice
  network {
    name
    chainId
  }
  balance(address: "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045")
}
```

**Expected Response:**
```json
{
  "data": {
    "blockNumber": 18500000,
    "gasPrice": "25.5",
    "network": {
      "name": "mainnet",
      "chainId": "1"
    },
    "balance": "1.23456789"
  }
}
```

## Testing with Different Networks

You can test the service with different blockchain networks by changing the `RPC_URL` in your `.env` file:

### Ethereum Mainnet
```
RPC_URL=https://eth.llamarpc.com
```

### Polygon
```
RPC_URL=https://polygon-rpc.com
```

### Binance Smart Chain
```
RPC_URL=https://bsc-dataseed.binance.org
```

### Local Development Node
```
RPC_URL=http://localhost:8545
```

## Error Handling

If a query returns `null` for a resource (like a block or transaction), it means that resource doesn't exist. For example:

```graphql
query {
  transaction(txHash: "0xinvalidhash") {
    hash
  }
}
```

Returns:
```json
{
  "data": {
    "transaction": null
  }
}
```

## Using Variables

You can use GraphQL variables for dynamic queries:

```graphql
query GetBalance($address: String!) {
  balance(address: $address)
}
```

With variables:
```json
{
  "address": "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045"
}
```

## Tips

1. The GraphQL playground provides autocomplete - press `Ctrl+Space` to see available fields
2. Use the "Docs" tab in the playground to explore the full schema
3. You can query multiple resources in a single request to reduce round trips
4. All Ethereum addresses must be valid checksummed addresses
5. Transaction hashes must be valid 66-character hex strings (including '0x' prefix)
