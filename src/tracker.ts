export class HieroCronTracker {
  private networkUrl: string;

  constructor(network: 'mainnet' | 'testnet' = 'testnet') {
    this.networkUrl = `https://${network}.mirrornode.hedera.com`;
  }

  /**
   * Fetches all scheduled transactions queued by a specific Cron Smart Contract
   * @param contractId The Hedera Contract ID (e.g., 0.0.1234)
   */
  public async getUpcomingExecutions(contractId: string) {
    const response = await fetch(`${this.networkUrl}/api/v1/schedules?account.id=${contractId}`);
    if (!response.ok) throw new Error(`Mirror Node Error: ${response.statusText}`);
    const data = await response.json();
    return data.schedules ||[];
  }
}
