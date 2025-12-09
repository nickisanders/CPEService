import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ethers } from 'ethers';
import { RPCClient } from './rpcClient';

// Mock ethers.js module
vi.mock('ethers', () => {
  const mockProvider = {
    getBlockNumber: vi.fn(),
    getBlock: vi.fn(),
    getTransaction: vi.fn(),
    getBalance: vi.fn(),
    getTransactionReceipt: vi.fn(),
    getFeeData: vi.fn(),
    getNetwork: vi.fn(),
    getTransactionCount: vi.fn()
  };

  const mockWallet = {
    address: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0'
  };

  const mockContract = {
    mintCertificate: vi.fn()
  };

  return {
    ethers: {
      JsonRpcProvider: vi.fn(() => mockProvider),
      Wallet: vi.fn(() => mockWallet),
      Contract: vi.fn(() => mockContract),
      formatEther: vi.fn((value: bigint) => value.toString()),
      formatUnits: vi.fn((value: bigint) => value.toString())
    }
  };
});

describe('RPCClient', () => {
  const mockRpcUrl = 'https://mock-rpc-url.com';
  const mockPrivateKey = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';
  const mockContractAddress = '0x5FbDB2315678afecb367f032d93F642f64180aa3';
  const mockRecipientAddress = '0x70997970C51812dc3A010C7d01b50e0d17dc79C8';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Constructor', () => {
    it('should create RPCClient with provider only (no signer)', () => {
      const client = new RPCClient(mockRpcUrl);
      
      expect(ethers.JsonRpcProvider).toHaveBeenCalledWith(mockRpcUrl);
      expect(ethers.Wallet).not.toHaveBeenCalled();
      expect(client.getSignerAddress()).toBeUndefined();
    });

    it('should create RPCClient with provider and wallet when privateKey is provided', () => {
      const client = new RPCClient(mockRpcUrl, mockPrivateKey);
      
      expect(ethers.JsonRpcProvider).toHaveBeenCalledWith(mockRpcUrl);
      expect(ethers.Wallet).toHaveBeenCalledWith(mockPrivateKey, expect.anything());
      expect(client.getSignerAddress()).toBe('0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0');
    });
  });

  describe('getSignerAddress', () => {
    it('should return undefined when no private key provided', () => {
      const client = new RPCClient(mockRpcUrl);
      expect(client.getSignerAddress()).toBeUndefined();
    });

    it('should return wallet address when private key provided', () => {
      const client = new RPCClient(mockRpcUrl, mockPrivateKey);
      expect(client.getSignerAddress()).toBe('0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0');
    });
  });

  describe('mintCertificate', () => {
    describe('Error Cases', () => {
      it('should throw error if no signer is available (no private key provided)', async () => {
        const client = new RPCClient(mockRpcUrl);
        
        await expect(
          client.mintCertificate(
            mockContractAddress,
            mockRecipientAddress,
            'https://example.com/metadata.json',
            'John Doe',
            'CERT-12345',
            'Advanced Blockchain Development',
            'Blockchain University',
            1704067200,
            1704153600,
            10
          )
        ).rejects.toThrow('No signer available. Instantiate RPCClient with a privateKey to perform write operations.');
      });

      it('should throw error if mintCertificate function is not found on contract (ABI mismatch)', async () => {
        const client = new RPCClient(mockRpcUrl, mockPrivateKey);
        
        // Mock Contract to return an object without mintCertificate
        const mockContractWithoutMint = {};
        vi.mocked(ethers.Contract).mockReturnValueOnce(mockContractWithoutMint as any);
        
        await expect(
          client.mintCertificate(
            mockContractAddress,
            mockRecipientAddress,
            'https://example.com/metadata.json',
            'John Doe',
            'CERT-12345',
            'Advanced Blockchain Development',
            'Blockchain University',
            1704067200,
            1704153600,
            10
          )
        ).rejects.toThrow('mintCertificate function not found on contract. Check the contract address and ABI match the deployed contract.');
      });

      it('should handle network errors during minting', async () => {
        const client = new RPCClient(mockRpcUrl, mockPrivateKey);
        
        const mockMintFunction = vi.fn().mockRejectedValue(new Error('Network error: connection timeout'));
        const mockContractWithError = { mintCertificate: mockMintFunction };
        vi.mocked(ethers.Contract).mockReturnValueOnce(mockContractWithError as any);
        
        await expect(
          client.mintCertificate(
            mockContractAddress,
            mockRecipientAddress,
            'https://example.com/metadata.json',
            'John Doe',
            'CERT-12345',
            'Advanced Blockchain Development',
            'Blockchain University',
            1704067200,
            1704153600,
            10
          )
        ).rejects.toThrow('Network error: connection timeout');
      });

      it('should handle contract revert errors (e.g., "Ownable: caller is not the owner")', async () => {
        const client = new RPCClient(mockRpcUrl, mockPrivateKey);
        
        const mockMintFunction = vi.fn().mockRejectedValue(new Error('Ownable: caller is not the owner'));
        const mockContractWithRevert = { mintCertificate: mockMintFunction };
        vi.mocked(ethers.Contract).mockReturnValueOnce(mockContractWithRevert as any);
        
        await expect(
          client.mintCertificate(
            mockContractAddress,
            mockRecipientAddress,
            'https://example.com/metadata.json',
            'John Doe',
            'CERT-12345',
            'Advanced Blockchain Development',
            'Blockchain University',
            1704067200,
            1704153600,
            10
          )
        ).rejects.toThrow('Ownable: caller is not the owner');
      });

      it('should handle transaction failure (status: 0)', async () => {
        const client = new RPCClient(mockRpcUrl, mockPrivateKey);
        
        const mockReceipt = {
          status: 0,
          blockNumber: 12345,
          transactionHash: '0xabcdef',
          gasUsed: BigInt(21000)
        };
        
        const mockTxResponse = {
          wait: vi.fn().mockResolvedValue(mockReceipt)
        };
        
        const mockMintFunction = vi.fn().mockResolvedValue(mockTxResponse);
        const mockContractWithFailure = { mintCertificate: mockMintFunction };
        vi.mocked(ethers.Contract).mockReturnValueOnce(mockContractWithFailure as any);
        
        const receipt = await client.mintCertificate(
          mockContractAddress,
          mockRecipientAddress,
          'https://example.com/metadata.json',
          'John Doe',
          'CERT-12345',
          'Advanced Blockchain Development',
          'Blockchain University',
          1704067200,
          1704153600,
          10
        );
        
        // The function returns the receipt even if status is 0
        // The caller should check the status
        expect(receipt.status).toBe(0);
      });
    });

    describe('Success Cases', () => {
      it('should successfully mint a certificate NFT with all parameters', async () => {
        const client = new RPCClient(mockRpcUrl, mockPrivateKey);
        
        const mockReceipt = {
          status: 1,
          blockNumber: 12345,
          transactionHash: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
          gasUsed: BigInt(250000)
        };
        
        const mockTxResponse = {
          wait: vi.fn().mockResolvedValue(mockReceipt)
        };
        
        const mockMintFunction = vi.fn().mockResolvedValue(mockTxResponse);
        const mockContractSuccess = { mintCertificate: mockMintFunction };
        vi.mocked(ethers.Contract).mockReturnValueOnce(mockContractSuccess as any);
        
        const receipt = await client.mintCertificate(
          mockContractAddress,
          mockRecipientAddress,
          'https://example.com/metadata.json',
          'John Doe',
          'CERT-12345',
          'Advanced Blockchain Development',
          'Blockchain University',
          1704067200,
          1704153600,
          10
        );
        
        expect(receipt).toEqual(mockReceipt);
        expect(receipt.status).toBe(1);
        expect(receipt.blockNumber).toBe(12345);
        expect(receipt.transactionHash).toBe('0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890');
        expect(mockTxResponse.wait).toHaveBeenCalledOnce();
      });

      it('should handle both number and BigInt parameters correctly', async () => {
        const client = new RPCClient(mockRpcUrl, mockPrivateKey);
        
        const mockReceipt = {
          status: 1,
          blockNumber: 67890,
          transactionHash: '0x9876543210fedcba9876543210fedcba9876543210fedcba9876543210fedcba',
          gasUsed: BigInt(300000)
        };
        
        const mockTxResponse = {
          wait: vi.fn().mockResolvedValue(mockReceipt)
        };
        
        const mockMintFunction = vi.fn().mockResolvedValue(mockTxResponse);
        const mockContractBigInt = { mintCertificate: mockMintFunction };
        vi.mocked(ethers.Contract).mockReturnValueOnce(mockContractBigInt as any);
        
        // Test with BigInt parameters
        const receipt = await client.mintCertificate(
          mockContractAddress,
          mockRecipientAddress,
          'https://example.com/metadata.json',
          'Jane Smith',
          'CERT-67890',
          'Smart Contract Security',
          'CyberSec Institute',
          BigInt(1704067200),
          BigInt(1704153600),
          BigInt(15)
        );
        
        expect(receipt).toEqual(mockReceipt);
        expect(mockMintFunction).toHaveBeenCalledWith(
          mockRecipientAddress,
          'https://example.com/metadata.json',
          'Jane Smith',
          'CERT-67890',
          'Smart Contract Security',
          'CyberSec Institute',
          BigInt(1704067200),
          BigInt(1704153600),
          BigInt(15)
        );
      });

      it('should verify Contract is instantiated with correct address, ABI, and wallet', async () => {
        const client = new RPCClient(mockRpcUrl, mockPrivateKey);
        
        const mockReceipt = {
          status: 1,
          blockNumber: 11111,
          transactionHash: '0x1111111111111111111111111111111111111111111111111111111111111111',
          gasUsed: BigInt(220000)
        };
        
        const mockTxResponse = {
          wait: vi.fn().mockResolvedValue(mockReceipt)
        };
        
        const mockMintFunction = vi.fn().mockResolvedValue(mockTxResponse);
        const mockContractVerify = { mintCertificate: mockMintFunction };
        vi.mocked(ethers.Contract).mockReturnValueOnce(mockContractVerify as any);
        
        await client.mintCertificate(
          mockContractAddress,
          mockRecipientAddress,
          'https://example.com/metadata.json',
          'John Doe',
          'CERT-12345',
          'Advanced Blockchain Development',
          'Blockchain University',
          1704067200,
          1704153600,
          10
        );
        
        // Verify Contract was called with correct parameters
        expect(ethers.Contract).toHaveBeenCalledWith(
          mockContractAddress,
          [
            'function mintCertificate(address to, string tokenURI, string name, string certificateId, string courseTitle, string issuer, uint256 dateIssued, uint256 completionDate, uint256 cpeHours) public'
          ],
          expect.objectContaining({ address: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0' })
        );
      });

      it('should verify mintCertificate is called with correct parameters (including BigInt conversions)', async () => {
        const client = new RPCClient(mockRpcUrl, mockPrivateKey);
        
        const mockReceipt = {
          status: 1,
          blockNumber: 22222,
          transactionHash: '0x2222222222222222222222222222222222222222222222222222222222222222',
          gasUsed: BigInt(240000)
        };
        
        const mockTxResponse = {
          wait: vi.fn().mockResolvedValue(mockReceipt)
        };
        
        const mockMintFunction = vi.fn().mockResolvedValue(mockTxResponse);
        const mockContractParams = { mintCertificate: mockMintFunction };
        vi.mocked(ethers.Contract).mockReturnValueOnce(mockContractParams as any);
        
        await client.mintCertificate(
          mockContractAddress,
          mockRecipientAddress,
          'https://example.com/metadata.json',
          'John Doe',
          'CERT-12345',
          'Advanced Blockchain Development',
          'Blockchain University',
          1704067200, // number
          1704153600, // number
          10 // number
        );
        
        // Verify mintCertificate was called with BigInt conversions
        expect(mockMintFunction).toHaveBeenCalledWith(
          mockRecipientAddress,
          'https://example.com/metadata.json',
          'John Doe',
          'CERT-12345',
          'Advanced Blockchain Development',
          'Blockchain University',
          BigInt(1704067200),
          BigInt(1704153600),
          BigInt(10)
        );
      });

      it('should return the transaction receipt', async () => {
        const client = new RPCClient(mockRpcUrl, mockPrivateKey);
        
        const mockReceipt = {
          status: 1,
          blockNumber: 33333,
          transactionHash: '0x3333333333333333333333333333333333333333333333333333333333333333',
          gasUsed: BigInt(260000),
          from: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0',
          to: mockContractAddress,
          contractAddress: null,
          logs: []
        };
        
        const mockTxResponse = {
          wait: vi.fn().mockResolvedValue(mockReceipt)
        };
        
        const mockMintFunction = vi.fn().mockResolvedValue(mockTxResponse);
        const mockContractReceipt = { mintCertificate: mockMintFunction };
        vi.mocked(ethers.Contract).mockReturnValueOnce(mockContractReceipt as any);
        
        const receipt = await client.mintCertificate(
          mockContractAddress,
          mockRecipientAddress,
          'https://example.com/metadata.json',
          'Jane Smith',
          'CERT-67890',
          'Smart Contract Security',
          'CyberSec Institute',
          1704067200,
          1704153600,
          15
        );
        
        expect(receipt).toEqual(mockReceipt);
        expect(receipt.status).toBe(1);
        expect(receipt.blockNumber).toBe(33333);
        expect(receipt.transactionHash).toBe('0x3333333333333333333333333333333333333333333333333333333333333333');
        expect(receipt.gasUsed).toEqual(BigInt(260000));
      });
    });
  });
});
