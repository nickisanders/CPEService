# Quick Start Guide

Get CPEService up and running in under 5 minutes!

## Prerequisites

- Node.js 18+ installed
- Access to an RPC endpoint (or use the free default)

## Installation & Setup

1. **Clone and Install**
```bash
git clone https://github.com/nickisanders/CPEService.git
cd CPEService
npm install
```

2. **Configure (Optional)**
```bash
cp .env.example .env
# Edit .env if you want to use a custom RPC endpoint
```

3. **Start the Server**
```bash
npm run dev
```

You should see:
```
✅ Connected to RPC node. Current block: 18500000
🚀 GraphQL server ready at http://localhost:4000/
📡 Connected to RPC: https://eth.llamarpc.com
```

## Your First Query

1. Open your browser to http://localhost:4000
2. In the GraphQL playground, paste this query:

```graphql
query {
  blockNumber
  gasPrice
  network {
    name
    chainId
  }
}
```

3. Click the "Run" button (▶️)

You should get a response like:
```json
{
  "data": {
    "blockNumber": 18500000,
    "gasPrice": "25.5",
    "network": {
      "name": "mainnet",
      "chainId": "1"
    }
  }
}
```

## Common Queries

### Check an Account Balance
```graphql
query {
  balance(address: "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045")
}
```

### Get Latest Block Info
```graphql
query {
  block(blockHashOrNumber: "latest") {
    number
    timestamp
    gasUsed
    transactions
  }
}
```

### Get Transaction Details
```graphql
query {
  transaction(txHash: "YOUR_TX_HASH_HERE") {
    from
    to
    value
    gasPrice
  }
}
```

## Production Deployment

1. **Build**
```bash
npm run build
```

2. **Start**
```bash
npm start
```

## Using Different Networks

Edit `.env` to connect to different networks:

**Polygon:**
```
RPC_URL=https://polygon-rpc.com
```

**Binance Smart Chain:**
```
RPC_URL=https://bsc-dataseed.binance.org
```

**Local Node:**
```
RPC_URL=http://localhost:8545
```

## Next Steps

- 📖 Read [EXAMPLES.md](EXAMPLES.md) for more query examples
- 📚 Check [README.md](README.md) for detailed documentation
- 🔧 Explore the GraphQL schema in the playground's "Docs" tab

## Troubleshooting

**Server won't start?**
- Make sure port 4000 is not in use
- Check that your RPC_URL is accessible
- Verify Node.js version (18+)

**Can't connect to RPC?**
- Try the default RPC endpoint first
- Check your internet connection
- Verify the RPC URL is correct in `.env`

## Support

For issues or questions, please check the [README](README.md) or create an issue on GitHub.

Happy querying! 🚀
