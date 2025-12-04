import { ApolloServer } from '@apollo/server';
import { startStandaloneServer } from '@apollo/server/standalone';
import dotenv from 'dotenv';
import { typeDefs } from './graphql/typeDefs.js';
import { resolvers } from './graphql/resolvers.js';
import { RPCClient } from './services/rpcClient.js';

// Load environment variables
dotenv.config();

// Get RPC URL from environment or use default
const RPC_URL = process.env.RPC_URL || 'https://eth.llamarpc.com';
const PORT = parseInt(process.env.PORT || '4000', 10);

async function startServer() {
  // Initialize RPC client
  const rpcClient = new RPCClient(RPC_URL);

  // Test connection
  try {
    const blockNumber = await rpcClient.getBlockNumber();
    console.log(`✅ Connected to RPC node. Current block: ${blockNumber}`);
  } catch (error) {
    console.error('❌ Failed to connect to RPC node:', error);
    process.exit(1);
  }

  // Create Apollo Server
  const server = new ApolloServer({
    typeDefs,
    resolvers,
  });

  // Start the server
  const { url } = await startStandaloneServer(server, {
    listen: { port: PORT },
    context: async () => ({
      rpcClient,
    }),
  });

  console.log(`🚀 GraphQL server ready at ${url}`);
  console.log(`📡 Connected to RPC: ${RPC_URL}`);
}

startServer().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
