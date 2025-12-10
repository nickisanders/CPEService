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

  describe('getAllCertificatesByOwner', () => {
    const mockOwnerAddress = '0x70997970C51812dc3A010C7d01b50e0d17dc79C8';
    const mockCertificates = [
      [
        'John Doe',
        'CERT-001',
        'Blockchain Basics',
        'Tech University',
        BigInt(1704067200),
        BigInt(1704153600),
        BigInt(10)
      ],
      [
        'Jane Smith',
        'CERT-002',
        'Smart Contracts',
        'Dev Academy',
        BigInt(1704240000),
        BigInt(1704326400),
        BigInt(15)
      ]
    ];

    describe('Success Cases', () => {
      it('should successfully retrieve all certificates for an owner with multiple certificates', async () => {
        const client = new RPCClient(mockRpcUrl);

        const mockGetAllNFTs = vi.fn().mockResolvedValue(mockCertificates);
        const mockContractSuccess = { getAllNFTsByOwner: mockGetAllNFTs };
        vi.mocked(ethers.Contract).mockReturnValueOnce(mockContractSuccess as any);

        const result = await client.getAllCertificatesByOwner(mockContractAddress, mockOwnerAddress);

        expect(result).toHaveLength(2);
        expect(result[0]).toEqual({
          name: 'John Doe',
          certificateId: 'CERT-001',
          courseTitle: 'Blockchain Basics',
          issuer: 'Tech University',
          dateIssued: BigInt(1704067200),
          completionDate: BigInt(1704153600),
          cpeHours: BigInt(10)
        });
        expect(result[1]).toEqual({
          name: 'Jane Smith',
          certificateId: 'CERT-002',
          courseTitle: 'Smart Contracts',
          issuer: 'Dev Academy',
          dateIssued: BigInt(1704240000),
          completionDate: BigInt(1704326400),
          cpeHours: BigInt(15)
        });
        expect(mockGetAllNFTs).toHaveBeenCalledWith(mockOwnerAddress);
      });

      it('should return empty array when owner has no certificates', async () => {
        const client = new RPCClient(mockRpcUrl);

        const mockGetAllNFTs = vi.fn().mockResolvedValue([]);
        const mockContractEmpty = { getAllNFTsByOwner: mockGetAllNFTs };
        vi.mocked(ethers.Contract).mockReturnValueOnce(mockContractEmpty as any);

        const result = await client.getAllCertificatesByOwner(mockContractAddress, mockOwnerAddress);

        expect(result).toEqual([]);
        expect(mockGetAllNFTs).toHaveBeenCalledWith(mockOwnerAddress);
      });

      it('should correctly map tuple data to CertificateData objects with proper BigInt types', async () => {
        const client = new RPCClient(mockRpcUrl);

        const mockGetAllNFTs = vi.fn().mockResolvedValue([mockCertificates[0]]);
        const mockContractTypes = { getAllNFTsByOwner: mockGetAllNFTs };
        vi.mocked(ethers.Contract).mockReturnValueOnce(mockContractTypes as any);

        const result = await client.getAllCertificatesByOwner(mockContractAddress, mockOwnerAddress);

        expect(result[0].dateIssued).toBeTypeOf('bigint');
        expect(result[0].completionDate).toBeTypeOf('bigint');
        expect(result[0].cpeHours).toBeTypeOf('bigint');
        expect(result[0].name).toBeTypeOf('string');
        expect(result[0].certificateId).toBeTypeOf('string');
      });

      it('should work without a signer (read-only operation)', async () => {
        const clientNoSigner = new RPCClient(mockRpcUrl); // No private key

        const mockGetAllNFTs = vi.fn().mockResolvedValue(mockCertificates);
        const mockContractReadOnly = { getAllNFTsByOwner: mockGetAllNFTs };
        vi.mocked(ethers.Contract).mockReturnValueOnce(mockContractReadOnly as any);

        const result = await clientNoSigner.getAllCertificatesByOwner(mockContractAddress, mockOwnerAddress);

        expect(result).toHaveLength(2);
        expect(ethers.Contract).toHaveBeenCalledWith(
          mockContractAddress,
          expect.any(Array),
          expect.anything() // Should be called with provider, not wallet
        );
      });
    });

    describe('Error Cases', () => {
      it('should throw error if getAllNFTsByOwner function is not found on contract', async () => {
        const client = new RPCClient(mockRpcUrl);

        const mockContractWithoutFunction = {};
        vi.mocked(ethers.Contract).mockReturnValueOnce(mockContractWithoutFunction as any);

        await expect(
          client.getAllCertificatesByOwner(mockContractAddress, mockOwnerAddress)
        ).rejects.toThrow('getAllNFTsByOwner function not found on contract. Check the contract address and ABI match the deployed contract.');
      });

      it('should handle contract call errors gracefully', async () => {
        const client = new RPCClient(mockRpcUrl);

        const mockGetAllNFTs = vi.fn().mockRejectedValue(new Error('Network error: connection timeout'));
        const mockContractError = { getAllNFTsByOwner: mockGetAllNFTs };
        vi.mocked(ethers.Contract).mockReturnValueOnce(mockContractError as any);

        await expect(
          client.getAllCertificatesByOwner(mockContractAddress, mockOwnerAddress)
        ).rejects.toThrow('Network error: connection timeout');
      });
    });
  });

  describe('getAllCertificatesWithMetadata', () => {
    const mockOwnerAddress = '0x70997970C51812dc3A010C7d01b50e0d17dc79C8';
    const mockCertificates = [
      [
        'John Doe',
        'CERT-001',
        'Blockchain Basics',
        'Tech University',
        BigInt(1704067200),
        BigInt(1704153600),
        BigInt(10)
      ],
      [
        'Jane Smith',
        'CERT-002',
        'Smart Contracts',
        'Dev Academy',
        BigInt(1704240000),
        BigInt(1704326400),
        BigInt(15)
      ]
    ];

    const mockMetadata1 = {
      name: 'CPE Certificate #001',
      description: 'Continuing Professional Education Certificate',
      image: 'ipfs://QmHash1/certificate.png',
      attributes: [
        { trait_type: 'Course', value: 'Blockchain Basics' },
        { trait_type: 'CPE Hours', value: '10' }
      ]
    };

    const mockMetadata2 = {
      name: 'CPE Certificate #002',
      description: 'Continuing Professional Education Certificate',
      image: 'ipfs://QmHash2/certificate.png',
      attributes: [
        { trait_type: 'Course', value: 'Smart Contracts' },
        { trait_type: 'CPE Hours', value: '15' }
      ]
    };

    beforeEach(() => {
      // Mock global fetch
      global.fetch = vi.fn();
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    describe('Success Cases', () => {
      it('should retrieve certificates with tokenURI and metadata when fetchMetadata is true', async () => {
        const client = new RPCClient(mockRpcUrl);

        // Mock getAllNFTsByOwner
        const mockGetAllNFTs = vi.fn().mockResolvedValue(mockCertificates);
        const mockGetAllContract = { getAllNFTsByOwner: mockGetAllNFTs };

        // Mock tokenOfOwnerByIndex and tokenURI
        const mockTokenOfOwnerByIndex = vi.fn()
          .mockResolvedValueOnce(BigInt(1))
          .mockResolvedValueOnce(BigInt(2));
        const mockTokenURI = vi.fn()
          .mockResolvedValueOnce('https://example.com/token/1')
          .mockResolvedValueOnce('https://example.com/token/2');
        const mockMetadataContract = {
          tokenOfOwnerByIndex: mockTokenOfOwnerByIndex,
          tokenURI: mockTokenURI
        };

        vi.mocked(ethers.Contract)
          .mockReturnValueOnce(mockGetAllContract as any)
          .mockReturnValueOnce(mockMetadataContract as any);

        // Mock fetch responses
        vi.mocked(global.fetch)
          .mockResolvedValueOnce({
            json: async () => mockMetadata1
          } as Response)
          .mockResolvedValueOnce({
            json: async () => mockMetadata2
          } as Response);

        const result = await client.getAllCertificatesWithMetadata(mockContractAddress, mockOwnerAddress);

        expect(result).toHaveLength(2);
        expect(result[0].tokenURI).toBe('https://example.com/token/1');
        expect(result[0].metadata).toEqual(mockMetadata1);
        expect(result[1].tokenURI).toBe('https://example.com/token/2');
        expect(result[1].metadata).toEqual(mockMetadata2);
      });

      it('should fetch and parse JSON metadata from tokenURIs', async () => {
        const client = new RPCClient(mockRpcUrl);

        const mockGetAllNFTs = vi.fn().mockResolvedValue([mockCertificates[0]]);
        const mockGetAllContract = { getAllNFTsByOwner: mockGetAllNFTs };

        const mockTokenOfOwnerByIndex = vi.fn().mockResolvedValue(BigInt(1));
        const mockTokenURI = vi.fn().mockResolvedValue('https://example.com/token/1');
        const mockMetadataContract = {
          tokenOfOwnerByIndex: mockTokenOfOwnerByIndex,
          tokenURI: mockTokenURI
        };

        vi.mocked(ethers.Contract)
          .mockReturnValueOnce(mockGetAllContract as any)
          .mockReturnValueOnce(mockMetadataContract as any);

        vi.mocked(global.fetch).mockResolvedValueOnce({
          json: async () => mockMetadata1
        } as Response);

        const result = await client.getAllCertificatesWithMetadata(mockContractAddress, mockOwnerAddress);

        expect(global.fetch).toHaveBeenCalledWith('https://example.com/token/1');
        expect(result[0].metadata).toEqual(mockMetadata1);
      });

      it('should return certificates without metadata when fetchMetadata is false', async () => {
        const client = new RPCClient(mockRpcUrl);

        const mockGetAllNFTs = vi.fn().mockResolvedValue(mockCertificates);
        const mockGetAllContract = { getAllNFTsByOwner: mockGetAllNFTs };

        vi.mocked(ethers.Contract).mockReturnValueOnce(mockGetAllContract as any);

        const result = await client.getAllCertificatesWithMetadata(mockContractAddress, mockOwnerAddress, false);

        expect(result).toHaveLength(2);
        expect(result[0].tokenURI).toBeUndefined();
        expect(result[0].metadata).toBeUndefined();
        expect(global.fetch).not.toHaveBeenCalled();
      });

      it('should handle multiple certificates with different metadata', async () => {
        const client = new RPCClient(mockRpcUrl);

        const mockGetAllNFTs = vi.fn().mockResolvedValue(mockCertificates);
        const mockGetAllContract = { getAllNFTsByOwner: mockGetAllNFTs };

        const mockTokenOfOwnerByIndex = vi.fn()
          .mockResolvedValueOnce(BigInt(1))
          .mockResolvedValueOnce(BigInt(2));
        const mockTokenURI = vi.fn()
          .mockResolvedValueOnce('https://example.com/token/1')
          .mockResolvedValueOnce('https://example.com/token/2');
        const mockMetadataContract = {
          tokenOfOwnerByIndex: mockTokenOfOwnerByIndex,
          tokenURI: mockTokenURI
        };

        vi.mocked(ethers.Contract)
          .mockReturnValueOnce(mockGetAllContract as any)
          .mockReturnValueOnce(mockMetadataContract as any);

        vi.mocked(global.fetch)
          .mockResolvedValueOnce({
            json: async () => mockMetadata1
          } as Response)
          .mockResolvedValueOnce({
            json: async () => mockMetadata2
          } as Response);

        const result = await client.getAllCertificatesWithMetadata(mockContractAddress, mockOwnerAddress);

        expect(result[0].metadata).toEqual(mockMetadata1);
        expect(result[1].metadata).toEqual(mockMetadata2);
        expect(result[0].name).toBe('John Doe');
        expect(result[1].name).toBe('Jane Smith');
      });
    });

    describe('Error Cases', () => {
      it('should handle tokenOfOwnerByIndex errors gracefully (continue with other certificates)', async () => {
        const client = new RPCClient(mockRpcUrl);

        const mockGetAllNFTs = vi.fn().mockResolvedValue(mockCertificates);
        const mockGetAllContract = { getAllNFTsByOwner: mockGetAllNFTs };

        const mockTokenOfOwnerByIndex = vi.fn()
          .mockRejectedValueOnce(new Error('Token not found'))
          .mockResolvedValueOnce(BigInt(2));
        const mockTokenURI = vi.fn().mockResolvedValue('https://example.com/token/2');
        const mockMetadataContract = {
          tokenOfOwnerByIndex: mockTokenOfOwnerByIndex,
          tokenURI: mockTokenURI
        };

        vi.mocked(ethers.Contract)
          .mockReturnValueOnce(mockGetAllContract as any)
          .mockReturnValueOnce(mockMetadataContract as any);

        vi.mocked(global.fetch).mockResolvedValue({
          json: async () => mockMetadata2
        } as Response);

        const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

        const result = await client.getAllCertificatesWithMetadata(mockContractAddress, mockOwnerAddress);

        expect(result).toHaveLength(2);
        expect(result[0].tokenURI).toBeUndefined(); // First failed
        expect(result[1].tokenURI).toBe('https://example.com/token/2'); // Second succeeded
        expect(consoleWarnSpy).toHaveBeenCalledWith(
          expect.stringContaining('Failed to get tokenURI for certificate at index 0'),
          expect.any(Error)
        );

        consoleWarnSpy.mockRestore();
      });

      it('should handle tokenURI errors gracefully (continue with other certificates)', async () => {
        const client = new RPCClient(mockRpcUrl);

        const mockGetAllNFTs = vi.fn().mockResolvedValue(mockCertificates);
        const mockGetAllContract = { getAllNFTsByOwner: mockGetAllNFTs };

        const mockTokenOfOwnerByIndex = vi.fn()
          .mockResolvedValueOnce(BigInt(1))
          .mockResolvedValueOnce(BigInt(2));
        const mockTokenURI = vi.fn()
          .mockRejectedValueOnce(new Error('URI not set'))
          .mockResolvedValueOnce('https://example.com/token/2');
        const mockMetadataContract = {
          tokenOfOwnerByIndex: mockTokenOfOwnerByIndex,
          tokenURI: mockTokenURI
        };

        vi.mocked(ethers.Contract)
          .mockReturnValueOnce(mockGetAllContract as any)
          .mockReturnValueOnce(mockMetadataContract as any);

        vi.mocked(global.fetch).mockResolvedValue({
          json: async () => mockMetadata2
        } as Response);

        const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

        const result = await client.getAllCertificatesWithMetadata(mockContractAddress, mockOwnerAddress);

        expect(result).toHaveLength(2);
        expect(result[0].tokenURI).toBeUndefined(); // First failed
        expect(result[1].tokenURI).toBe('https://example.com/token/2'); // Second succeeded
        expect(consoleWarnSpy).toHaveBeenCalled();

        consoleWarnSpy.mockRestore();
      });

      it('should handle fetch errors gracefully when metadata URL is unreachable', async () => {
        const client = new RPCClient(mockRpcUrl);

        const mockGetAllNFTs = vi.fn().mockResolvedValue([mockCertificates[0]]);
        const mockGetAllContract = { getAllNFTsByOwner: mockGetAllNFTs };

        const mockTokenOfOwnerByIndex = vi.fn().mockResolvedValue(BigInt(1));
        const mockTokenURI = vi.fn().mockResolvedValue('https://example.com/token/1');
        const mockMetadataContract = {
          tokenOfOwnerByIndex: mockTokenOfOwnerByIndex,
          tokenURI: mockTokenURI
        };

        vi.mocked(ethers.Contract)
          .mockReturnValueOnce(mockGetAllContract as any)
          .mockReturnValueOnce(mockMetadataContract as any);

        vi.mocked(global.fetch).mockRejectedValue(new Error('Network error'));

        const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

        const result = await client.getAllCertificatesWithMetadata(mockContractAddress, mockOwnerAddress);

        expect(result).toHaveLength(1);
        expect(result[0].tokenURI).toBe('https://example.com/token/1');
        expect(result[0].metadata).toBeUndefined(); // Metadata fetch failed
        expect(consoleWarnSpy).toHaveBeenCalledWith(
          expect.stringContaining('Failed to fetch metadata from https://example.com/token/1'),
          expect.any(Error)
        );

        consoleWarnSpy.mockRestore();
      });

      it('should handle invalid JSON in metadata gracefully', async () => {
        const client = new RPCClient(mockRpcUrl);

        const mockGetAllNFTs = vi.fn().mockResolvedValue([mockCertificates[0]]);
        const mockGetAllContract = { getAllNFTsByOwner: mockGetAllNFTs };

        const mockTokenOfOwnerByIndex = vi.fn().mockResolvedValue(BigInt(1));
        const mockTokenURI = vi.fn().mockResolvedValue('https://example.com/token/1');
        const mockMetadataContract = {
          tokenOfOwnerByIndex: mockTokenOfOwnerByIndex,
          tokenURI: mockTokenURI
        };

        vi.mocked(ethers.Contract)
          .mockReturnValueOnce(mockGetAllContract as any)
          .mockReturnValueOnce(mockMetadataContract as any);

        vi.mocked(global.fetch).mockResolvedValue({
          json: async () => {
            throw new Error('Invalid JSON');
          }
        } as Response);

        const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

        const result = await client.getAllCertificatesWithMetadata(mockContractAddress, mockOwnerAddress);

        expect(result).toHaveLength(1);
        expect(result[0].tokenURI).toBe('https://example.com/token/1');
        expect(result[0].metadata).toBeUndefined();
        expect(consoleWarnSpy).toHaveBeenCalled();

        consoleWarnSpy.mockRestore();
      });

      it('should throw error if tokenOfOwnerByIndex function is not found on contract', async () => {
        const client = new RPCClient(mockRpcUrl);

        const mockGetAllNFTs = vi.fn().mockResolvedValue(mockCertificates);
        const mockGetAllContract = { getAllNFTsByOwner: mockGetAllNFTs };

        const mockMetadataContractMissing = {
          tokenURI: vi.fn()
        };

        vi.mocked(ethers.Contract)
          .mockReturnValueOnce(mockGetAllContract as any)
          .mockReturnValueOnce(mockMetadataContractMissing as any);

        await expect(
          client.getAllCertificatesWithMetadata(mockContractAddress, mockOwnerAddress)
        ).rejects.toThrow('tokenOfOwnerByIndex function not found on contract. Check the contract address and ABI match the deployed contract.');
      });

      it('should throw error if tokenURI function is not found on contract', async () => {
        const client = new RPCClient(mockRpcUrl);

        const mockGetAllNFTs = vi.fn().mockResolvedValue(mockCertificates);
        const mockGetAllContract = { getAllNFTsByOwner: mockGetAllNFTs };

        const mockMetadataContractMissing = {
          tokenOfOwnerByIndex: vi.fn()
        };

        vi.mocked(ethers.Contract)
          .mockReturnValueOnce(mockGetAllContract as any)
          .mockReturnValueOnce(mockMetadataContractMissing as any);

        await expect(
          client.getAllCertificatesWithMetadata(mockContractAddress, mockOwnerAddress)
        ).rejects.toThrow('tokenURI function not found on contract. Check the contract address and ABI match the deployed contract.');
      });
    });
  });
});
