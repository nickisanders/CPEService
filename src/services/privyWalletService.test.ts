import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PrivyWalletService } from './privyWalletService';
import { ethers } from 'ethers';

// Create mock PrivyClient instance that will be used
const mockPrivyClient = {
  getUserById: vi.fn()
};

// Mock @privy-io/server-auth
vi.mock('@privy-io/server-auth', () => {
  return {
    PrivyClient: vi.fn(() => mockPrivyClient)
  };
});

// Mock ethers
vi.mock('ethers', async () => {
  const actual = await vi.importActual('ethers');
  return {
    ...actual,
    ethers: {
      ...(actual as any).ethers,
      JsonRpcProvider: vi.fn()
    }
  };
});

describe('PrivyWalletService', () => {
  const mockAppId = 'test-app-id';
  const mockAppSecret = 'test-app-secret';
  const mockUserId = 'test-user-id';
  const mockWalletAddress = '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Constructor', () => {
    it('should create PrivyWalletService with app ID and secret', () => {
      const service = new PrivyWalletService(mockAppId, mockAppSecret);
      
      expect(service).toBeDefined();
      // PrivyClient constructor was called during instantiation
      // We just verify the service was created successfully
    });
  });

  describe('getWalletAddress', () => {
    it('should retrieve wallet address for valid user ID', async () => {
      const mockUser = {
        id: mockUserId,
        linkedAccounts: [
          {
            type: 'wallet',
            walletClientType: 'privy',
            address: mockWalletAddress
          }
        ]
      };

      mockPrivyClient.getUserById.mockResolvedValue(mockUser);

      const service = new PrivyWalletService(mockAppId, mockAppSecret);
      const address = await service.getWalletAddress(mockUserId);

      expect(address).toBe(mockWalletAddress);
      expect(mockPrivyClient.getUserById).toHaveBeenCalledWith(mockUserId);
    });

    it('should throw error if user has no embedded wallet', async () => {
      const mockUser = {
        id: mockUserId,
        linkedAccounts: []
      };

      mockPrivyClient.getUserById.mockResolvedValue(mockUser);

      const service = new PrivyWalletService(mockAppId, mockAppSecret);

      await expect(service.getWalletAddress(mockUserId)).rejects.toThrow(
        `No Privy embedded wallet found for user ${mockUserId}`
      );
    });

    it('should throw error if wallet has no address', async () => {
      const mockUser = {
        id: mockUserId,
        linkedAccounts: [
          {
            type: 'wallet',
            walletClientType: 'privy',
            address: null
          }
        ]
      };

      mockPrivyClient.getUserById.mockResolvedValue(mockUser);

      const service = new PrivyWalletService(mockAppId, mockAppSecret);

      await expect(service.getWalletAddress(mockUserId)).rejects.toThrow(
        `No Privy embedded wallet found for user ${mockUserId}`
      );
    });

    it('should throw error for invalid user ID', async () => {
      mockPrivyClient.getUserById.mockRejectedValue(new Error('User not found'));

      const service = new PrivyWalletService(mockAppId, mockAppSecret);

      await expect(service.getWalletAddress('invalid-user')).rejects.toThrow('User not found');
    });

    it('should find Privy wallet among multiple linked accounts', async () => {
      const mockUser = {
        id: mockUserId,
        linkedAccounts: [
          {
            type: 'email',
            address: 'user@example.com'
          },
          {
            type: 'wallet',
            walletClientType: 'metamask',
            address: '0xOtherWalletAddress'
          },
          {
            type: 'wallet',
            walletClientType: 'privy',
            address: mockWalletAddress
          }
        ]
      };

      mockPrivyClient.getUserById.mockResolvedValue(mockUser);

      const service = new PrivyWalletService(mockAppId, mockAppSecret);
      const address = await service.getWalletAddress(mockUserId);

      expect(address).toBe(mockWalletAddress);
    });
  });

  describe('createPrivySigner', () => {
    it('should create a valid signer with correct address', async () => {
      const mockUser = {
        id: mockUserId,
        linkedAccounts: [
          {
            type: 'wallet',
            walletClientType: 'privy',
            address: mockWalletAddress
          }
        ]
      };

      mockPrivyClient.getUserById.mockResolvedValue(mockUser);

      const mockProvider = {} as ethers.Provider;
      const service = new PrivyWalletService(mockAppId, mockAppSecret);
      const signer = await service.createPrivySigner(mockUserId, mockProvider);

      expect(signer).toBeDefined();
      expect(await signer.getAddress()).toBe(mockWalletAddress);
    });

    it('should throw error for user without wallet', async () => {
      const mockUser = {
        id: mockUserId,
        linkedAccounts: []
      };

      mockPrivyClient.getUserById.mockResolvedValue(mockUser);

      const mockProvider = {} as ethers.Provider;
      const service = new PrivyWalletService(mockAppId, mockAppSecret);

      await expect(service.createPrivySigner(mockUserId, mockProvider)).rejects.toThrow(
        `No Privy embedded wallet found for user ${mockUserId}`
      );
    });

    it('should create signer that throws on signTransaction (not implemented)', async () => {
      const mockUser = {
        id: mockUserId,
        linkedAccounts: [
          {
            type: 'wallet',
            walletClientType: 'privy',
            address: mockWalletAddress
          }
        ]
      };

      mockPrivyClient.getUserById.mockResolvedValue(mockUser);

      const mockProvider = {} as ethers.Provider;
      const service = new PrivyWalletService(mockAppId, mockAppSecret);
      const signer = await service.createPrivySigner(mockUserId, mockProvider);

      await expect(signer.signTransaction({})).rejects.toThrow(
        'signTransaction must be implemented with Privy API - see Privy docs for wallet signing endpoint'
      );
    });

    it('should create signer that throws on signMessage (not implemented)', async () => {
      const mockUser = {
        id: mockUserId,
        linkedAccounts: [
          {
            type: 'wallet',
            walletClientType: 'privy',
            address: mockWalletAddress
          }
        ]
      };

      mockPrivyClient.getUserById.mockResolvedValue(mockUser);

      const mockProvider = {} as ethers.Provider;
      const service = new PrivyWalletService(mockAppId, mockAppSecret);
      const signer = await service.createPrivySigner(mockUserId, mockProvider);

      await expect(signer.signMessage('test message')).rejects.toThrow(
        'signMessage must be implemented with Privy API - see Privy docs for message signing endpoint'
      );
    });

    it('should create signer that throws on signTypedData (not implemented)', async () => {
      const mockUser = {
        id: mockUserId,
        linkedAccounts: [
          {
            type: 'wallet',
            walletClientType: 'privy',
            address: mockWalletAddress
          }
        ]
      };

      mockPrivyClient.getUserById.mockResolvedValue(mockUser);

      const mockProvider = {} as ethers.Provider;
      const service = new PrivyWalletService(mockAppId, mockAppSecret);
      const signer = await service.createPrivySigner(mockUserId, mockProvider);

      const domain = { name: 'Test', version: '1' };
      const types = { Test: [{ name: 'value', type: 'string' }] };
      const value = { value: 'test' };

      await expect(signer.signTypedData(domain, types, value)).rejects.toThrow(
        'signTypedData must be implemented with Privy API - see Privy docs for typed data signing endpoint'
      );
    });

    it('should create signer with connect method', async () => {
      const mockUser = {
        id: mockUserId,
        linkedAccounts: [
          {
            type: 'wallet',
            walletClientType: 'privy',
            address: mockWalletAddress
          }
        ]
      };

      mockPrivyClient.getUserById.mockResolvedValue(mockUser);

      const mockProvider1 = {} as ethers.Provider;
      const mockProvider2 = {} as ethers.Provider;
      
      const service = new PrivyWalletService(mockAppId, mockAppSecret);
      const signer1 = await service.createPrivySigner(mockUserId, mockProvider1);
      const signer2 = signer1.connect(mockProvider2);

      expect(signer2).toBeDefined();
      expect(await signer2.getAddress()).toBe(mockWalletAddress);
    });
  });
});
