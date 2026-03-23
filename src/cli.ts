import { Command } from 'commander';
import { HieroCronTracker } from './tracker';
import { version } from '../package.json';

const program = new Command();

program
  .name('hiero-cron')
  .description('CLI to monitor Hedera HIP-1215 cron contracts')
  .version(version);

program
  .command('summary')
  .description('Get a summary of cron executions for a deployed contract')
  .argument('<contractId>', 'Hedera Contract ID (e.g., 0.0.1234)')
  .option('-n, --network <network>', 'Hedera network (testnet, mainnet, previewnet)', 'testnet')
  .action(async (contractId, options) => {
    console.log(`\n🔍 Fetching cron summary for ${contractId} on ${options.network}...`);
    try {
      const tracker = new HieroCronTracker(options.network);
      const summary = await tracker.getCronSummary(contractId);
      
      console.log(`\n📊 HieroCron Summary [${contractId}]`);
      console.log(`   ├─ Total Scheduled : ${summary.totalScheduled}`);
      console.log(`   ├─ Total Executed  : ${summary.totalExecuted}`);
      console.log(`   ├─ Total Pending   : ${summary.totalPending}`);
      console.log(`   └─ Next Execution  : ${summary.nextExecution ? new Date(summary.nextExecution).toLocaleString() : 'None'}`);
      
      const balance = await tracker.getBalance(contractId);
      console.log(`\n💰 Contract Balance  : ${(balance / 100_000_000).toFixed(4)} ℏ\n`);
    } catch (error: any) {
      console.error(`\n❌ Error: ${error.message}\n`);
      process.exit(1);
    }
  });

program
  .command('upcoming')
  .description('List upcoming executions for a cron contract')
  .argument('<contractId>', 'Hedera Contract ID (e.g., 0.0.1234)')
  .option('-n, --network <network>', 'Hedera network (testnet, mainnet, previewnet)', 'testnet')
  .action(async (contractId, options) => {
    console.log(`\n📅 Fetching upcoming schedules for ${contractId} on ${options.network}...\n`);
    try {
      const tracker = new HieroCronTracker(options.network);
      const upcoming = await tracker.getUpcomingExecutions(contractId);
      
      const pending = upcoming.filter(s => !s.executed_timestamp && !s.deleted);
      
      if (pending.length === 0) {
        console.log('No pending schedules found.');
        return;
      }

      pending.forEach(s => {
        console.log(`Schedule ID: ${s.schedule_id}`);
        console.log(`├─ Expires:   ${s.expiration_time ? new Date(s.expiration_time).toLocaleString() : 'Unknown'}`);
        console.log(`└─ Payer:     ${s.payer_account_id}`);
        console.log('');
      });
    } catch (error: any) {
      console.error(`\n❌ Error: ${error.message}\n`);
      process.exit(1);
    }
  });

program.parse();
