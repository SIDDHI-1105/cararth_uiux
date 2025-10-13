import { batchIngestionService } from './batchIngestion.js';

async function main() {
  console.log('🚀 Triggering batch ingestion for Hyderabad...\n');
  
  // Run ingestion for Hyderabad only
  await batchIngestionService.runIngestion(['hyderabad']);
  
  console.log('\n✅ Batch ingestion complete!');
  process.exit(0);
}

main().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
