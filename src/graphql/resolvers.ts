import { RPCClient } from '../services/rpcClient.js';
import { ethers } from 'ethers';

interface Context {
  rpcClient: RPCClient;
}

export const resolvers = {
  Query: {
    blockNumber: async (_parent: unknown, _args: unknown, context: Context) => {
      return await context.rpcClient.getBlockNumber();
    },

    block: async (_parent: unknown, args: { blockHashOrNumber: string }, context: Context) => {
      const block = await context.rpcClient.getBlock(args.blockHashOrNumber);
      if (!block) return null;

      return {
        number: block.number,
        hash: block.hash,
        timestamp: block.timestamp,
        parentHash: block.parentHash,
        nonce: block.nonce || '0',
        difficulty: block.difficulty.toString(),
        gasLimit: block.gasLimit.toString(),
        gasUsed: block.gasUsed.toString(),
        miner: block.miner,
        extraData: block.extraData,
        transactions: block.transactions,
        baseFeePerGas: block.baseFeePerGas ? block.baseFeePerGas.toString() : null,
      };
    },

    transaction: async (_parent: unknown, args: { txHash: string }, context: Context) => {
      const tx = await context.rpcClient.getTransaction(args.txHash);
      if (!tx) return null;

      return {
        hash: tx.hash,
        from: tx.from,
        to: tx.to,
        value: ethers.formatEther(tx.value),
        gasLimit: tx.gasLimit.toString(),
        gasPrice: tx.gasPrice ? ethers.formatUnits(tx.gasPrice, 'gwei') : null,
        maxFeePerGas: tx.maxFeePerGas ? ethers.formatUnits(tx.maxFeePerGas, 'gwei') : null,
        maxPriorityFeePerGas: tx.maxPriorityFeePerGas ? ethers.formatUnits(tx.maxPriorityFeePerGas, 'gwei') : null,
        nonce: tx.nonce,
        data: tx.data,
        chainId: tx.chainId.toString(),
        blockNumber: tx.blockNumber,
        blockHash: tx.blockHash,
      };
    },

    balance: async (_parent: unknown, args: { address: string }, context: Context) => {
      return await context.rpcClient.getBalance(args.address);
    },

    transactionReceipt: async (_parent: unknown, args: { txHash: string }, context: Context) => {
      const receipt = await context.rpcClient.getTransactionReceipt(args.txHash);
      if (!receipt) return null;

      return {
        transactionHash: receipt.hash,
        blockNumber: receipt.blockNumber,
        blockHash: receipt.blockHash,
        from: receipt.from,
        to: receipt.to,
        cumulativeGasUsed: receipt.cumulativeGasUsed.toString(),
        gasUsed: receipt.gasUsed.toString(),
        contractAddress: receipt.contractAddress,
        status: receipt.status,
        logs: receipt.logs.map(log => ({
          address: log.address,
          topics: log.topics,
          data: log.data,
          blockNumber: log.blockNumber,
          transactionHash: log.transactionHash,
          logIndex: log.index,
        })),
      };
    },

    gasPrice: async (_parent: unknown, _args: unknown, context: Context) => {
      return await context.rpcClient.getGasPrice();
    },

    network: async (_parent: unknown, _args: unknown, context: Context) => {
      const network = await context.rpcClient.getNetwork();
      return {
        name: network.name,
        chainId: network.chainId.toString(),
      };
    },

    transactionCount: async (_parent: unknown, args: { address: string }, context: Context) => {
      return await context.rpcClient.getTransactionCount(args.address);
    },
  },
};
