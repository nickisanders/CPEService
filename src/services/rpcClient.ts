import { ethers } from 'ethers';

/**
 * Certificate data structure matching the Solidity contract
 */
export interface CertificateData {
  name: string;
  certificateId: string;
  courseTitle: string;
  issuer: string;
  dateIssued: bigint;
  completionDate: bigint;
  cpeHours: bigint;
}

/**
 * Certificate with metadata from tokenURI
 */
export interface CertificateWithMetadata extends CertificateData {
  tokenURI?: string;
  metadata?: any;
}

/**
 * RPC Client service for blockchain interactions
 * Connects to an Ethereum-compatible RPC node
 *
 * Optional: pass a privateKey to enable write operations (signing transactions).
 */
export class RPCClient {
  private provider: ethers.JsonRpcProvider;
  private wallet?: ethers.Wallet;

  constructor(rpcUrl: string, privateKey?: string) {
    this.provider = new ethers.JsonRpcProvider(rpcUrl);
    if (privateKey) {
      this.wallet = new ethers.Wallet(privateKey, this.provider);
    }
  }

  /**
   * Get the current block number
   */
  async getBlockNumber(): Promise<number> {
    return await this.provider.getBlockNumber();
  }

  /**
   * Get block information by block number or tag
   */
  async getBlock(blockHashOrNumber: string | number): Promise<ethers.Block | null> {
    return await this.provider.getBlock(blockHashOrNumber);
  }

  /**
   * Get transaction details by hash
   */
  async getTransaction(txHash: string): Promise<ethers.TransactionResponse | null> {
    return await this.provider.getTransaction(txHash);
  }

  /**
   * Get account balance
   */
  async getBalance(address: string): Promise<string> {
    const balance = await this.provider.getBalance(address);
    return ethers.formatEther(balance);
  }

  /**
   * Get transaction receipt
   */
  async getTransactionReceipt(txHash: string): Promise<ethers.TransactionReceipt | null> {
    return await this.provider.getTransactionReceipt(txHash);
  }

  /**
   * Get gas price
   */
  async getGasPrice(): Promise<string> {
    const feeData = await this.provider.getFeeData();
    return feeData.gasPrice ? ethers.formatUnits(feeData.gasPrice, 'gwei') : '0';
  }

  /**
   * Get network information
   */
  async getNetwork(): Promise<ethers.Network> {
    return await this.provider.getNetwork();
  }

  /**
   * Get transaction count for an address (nonce)
   */
  async getTransactionCount(address: string): Promise<number> {
    return await this.provider.getTransactionCount(address);
  }

  /**
   * Mint a new certificate NFT by calling the deployed CPECertificate contract's mintCertificate function.
   *
   * Requirements:
   * - The RPCClient must have been constructed with a privateKey so a signer (wallet) is available.
   *
   * Parameters correspond to the Solidity contract:
   * function mintCertificate(
   *   address to,
   *   string memory tokenURI,
   *   string memory name,
   *   string memory certificateId,
   *   string memory courseTitle,
   *   string memory issuer,
   *   uint256 dateIssued,
   *   uint256 completionDate,
   *   uint256 cpeHours
   * ) public onlyOwner
   *
   * Returns the transaction receipt after the transaction is mined.
   */
  async mintCertificate(
    contractAddress: string,
    to: string,
    tokenURI: string,
    name: string,
    certificateId: string,
    courseTitle: string,
    issuer: string,
    dateIssued: number | bigint,
    completionDate: number | bigint,
    cpeHours: number | bigint
  ): Promise<ethers.TransactionReceipt> {
    if (!this.wallet) {
      throw new Error('No signer available. Instantiate RPCClient with a privateKey to perform write operations.');
    }

    // Minimal ABI for the mintCertificate function
    const abi = [
      'function mintCertificate(address to, string tokenURI, string name, string certificateId, string courseTitle, string issuer, uint256 dateIssued, uint256 completionDate, uint256 cpeHours) public'
    ];

    const contract = new ethers.Contract(contractAddress, abi, this.wallet);

    // Narrow the contract type so TypeScript knows mintCertificate exists after our runtime check
    type MintFn = (
      to: string,
      tokenURI: string,
      name: string,
      certificateId: string,
      courseTitle: string,
      issuer: string,
      dateIssued: bigint,
      completionDate: bigint,
      cpeHours: bigint
    ) => Promise<ethers.TransactionResponse>;

    const typedContract = contract as unknown as { mintCertificate?: MintFn };

    if (typeof typedContract.mintCertificate !== 'function') {
      throw new Error(
        'mintCertificate function not found on contract. Check the contract address and ABI match the deployed contract.'
      );
    }

    // Ensure numeric args are BigInt if needed
    const dateIssuedBI = typeof dateIssued === 'bigint' ? dateIssued : BigInt(dateIssued);
    const completionDateBI = typeof completionDate === 'bigint' ? completionDate : BigInt(completionDate);
    const cpeHoursBI = typeof cpeHours === 'bigint' ? cpeHours : BigInt(cpeHours);

    // Now safe to call; TS knows mintCertificate exists on typedContract
    const txResponse = await typedContract.mintCertificate(
      to,
      tokenURI,
      name,
      certificateId,
      courseTitle,
      issuer,
      dateIssuedBI,
      completionDateBI,
      cpeHoursBI
    );

    const receipt = await txResponse.wait();
    return receipt as ethers.TransactionReceipt;
  }

  /**
   * Optional helper to get the address of the configured signer/wallet.
   */
  getSignerAddress(): string | undefined {
    return this.wallet?.address;
  }

  /**
   * Get all CPE certificate NFTs owned by a specific address.
   * 
   * Calls the contract's getAllNFTsByOwner function which returns an array of CertificateData structs.
   * 
   * @param contractAddress - The deployed CPECertificate contract address
   * @param ownerAddress - The wallet address to query certificates for
   * @returns Array of certificate data owned by the address
   */
  async getAllCertificatesByOwner(
    contractAddress: string,
    ownerAddress: string
  ): Promise<CertificateData[]> {
    // Minimal ABI for the getAllNFTsByOwner function
    const abi = [
      'function getAllNFTsByOwner(address owner) public view returns (tuple(string name, string certificateId, string courseTitle, string issuer, uint256 dateIssued, uint256 completionDate, uint256 cpeHours)[])'
    ];

    // Use provider for read-only operations (no signer needed)
    const contract = new ethers.Contract(contractAddress, abi, this.provider);

    // Narrow the contract type so TypeScript knows getAllNFTsByOwner exists after our runtime check
    type GetAllNFTsFn = (owner: string) => Promise<any[]>;

    const typedContract = contract as unknown as { getAllNFTsByOwner?: GetAllNFTsFn };

    if (typeof typedContract.getAllNFTsByOwner !== 'function') {
      throw new Error(
        'getAllNFTsByOwner function not found on contract. Check the contract address and ABI match the deployed contract.'
      );
    }

    // Call the contract function
    const rawCertificates = await typedContract.getAllNFTsByOwner(ownerAddress);

    // Map the raw tuple array to typed CertificateData objects
    const certificates: CertificateData[] = rawCertificates.map((cert: any) => ({
      name: cert[0] as string,
      certificateId: cert[1] as string,
      courseTitle: cert[2] as string,
      issuer: cert[3] as string,
      dateIssued: BigInt(cert[4]),
      completionDate: BigInt(cert[5]),
      cpeHours: BigInt(cert[6])
    }));

    return certificates;
  }

  /**
   * Get all CPE certificate NFTs owned by a specific address WITH their metadata from tokenURIs.
   * 
   * This fetches both the on-chain certificate data and the off-chain metadata (JSON).
   * 
   * @param contractAddress - The deployed CPECertificate contract address
   * @param ownerAddress - The wallet address to query certificates for
   * @param fetchMetadata - Whether to fetch the JSON metadata from tokenURIs (default: true)
   * @returns Array of certificates with optional metadata
   */
  async getAllCertificatesWithMetadata(
    contractAddress: string,
    ownerAddress: string,
    fetchMetadata: boolean = true
  ): Promise<CertificateWithMetadata[]> {
    // First get base certificate data
    const certificates = await this.getAllCertificatesByOwner(contractAddress, ownerAddress);

    // If not fetching metadata, return early
    if (!fetchMetadata) {
      return certificates;
    }

    // ABI for additional functions needed to get tokenURIs
    const abi = [
      'function tokenOfOwnerByIndex(address owner, uint256 index) public view returns (uint256)',
      'function tokenURI(uint256 tokenId) public view returns (string)'
    ];

    const contract = new ethers.Contract(contractAddress, abi, this.provider);

    // Narrow the contract type
    type TokenOfOwnerByIndexFn = (owner: string, index: bigint) => Promise<bigint>;
    type TokenURIFn = (tokenId: bigint) => Promise<string>;

    const typedContract = contract as unknown as {
      tokenOfOwnerByIndex?: TokenOfOwnerByIndexFn;
      tokenURI?: TokenURIFn;
    };

    if (typeof typedContract.tokenOfOwnerByIndex !== 'function') {
      throw new Error(
        'tokenOfOwnerByIndex function not found on contract. Check the contract address and ABI match the deployed contract.'
      );
    }

    if (typeof typedContract.tokenURI !== 'function') {
      throw new Error(
        'tokenURI function not found on contract. Check the contract address and ABI match the deployed contract.'
      );
    }

    // Fetch metadata for each certificate
    const certificatesWithMetadata: CertificateWithMetadata[] = await Promise.all(
      certificates.map(async (cert, index) => {
        try {
          // Get token ID for this index
          const tokenId = await typedContract.tokenOfOwnerByIndex!(ownerAddress, BigInt(index));

          // Get tokenURI
          const uri = await typedContract.tokenURI!(tokenId);

          // Fetch metadata from URI
          try {
            const response = await fetch(uri);
            const metadata = await response.json();
            return { ...cert, tokenURI: uri, metadata };
          } catch (fetchError) {
            console.warn(`Failed to fetch metadata from ${uri}:`, fetchError);
            return { ...cert, tokenURI: uri };
          }
        } catch (error) {
          console.warn(`Failed to get tokenURI for certificate at index ${index}:`, error);
          return cert;
        }
      })
    );

    return certificatesWithMetadata;
  }
}