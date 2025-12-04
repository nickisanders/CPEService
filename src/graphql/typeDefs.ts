export const typeDefs = `#graphql
  type Query {
    """
    Get the current block number
    """
    blockNumber: Int!

    """
    Get block information by block number or hash
    """
    block(blockHashOrNumber: String!): Block

    """
    Get transaction details by hash
    """
    transaction(txHash: String!): Transaction

    """
    Get account balance in ETH
    """
    balance(address: String!): String!

    """
    Get transaction receipt
    """
    transactionReceipt(txHash: String!): TransactionReceipt

    """
    Get current gas price in Gwei
    """
    gasPrice: String!

    """
    Get network information
    """
    network: Network!

    """
    Get transaction count (nonce) for an address
    """
    transactionCount(address: String!): Int!
  }

  type Block {
    number: Int!
    hash: String!
    timestamp: Int!
    parentHash: String!
    nonce: String
    difficulty: String
    gasLimit: String!
    gasUsed: String!
    miner: String
    extraData: String
    transactions: [String!]!
    baseFeePerGas: String
  }

  type Transaction {
    hash: String!
    from: String!
    to: String
    value: String!
    gasLimit: String!
    gasPrice: String
    maxFeePerGas: String
    maxPriorityFeePerGas: String
    nonce: Int!
    data: String!
    chainId: String!
    blockNumber: Int
    blockHash: String
  }

  type TransactionReceipt {
    transactionHash: String!
    blockNumber: Int!
    blockHash: String!
    from: String!
    to: String
    cumulativeGasUsed: String!
    gasUsed: String!
    contractAddress: String
    status: Int
    logs: [Log!]!
  }

  type Log {
    address: String!
    topics: [String!]!
    data: String!
    blockNumber: Int!
    transactionHash: String!
    logIndex: Int!
  }

  type Network {
    name: String!
    chainId: String!
  }
`;
