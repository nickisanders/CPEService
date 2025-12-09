import { ethers } from 'ethers';

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
}