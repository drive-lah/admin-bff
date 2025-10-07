import { GoogleWorkspaceService } from '../src/services/google-workspace';
import { Pool } from 'pg';

// Database connection
const pool = new Pool({
  host: 'collections-db.compunokr5xr.ap-southeast-2.rds.amazonaws.com',
  port: 5432,
  database: 'collections-db',
  user: 'collectionsagent',
  password: 'collectionsagent',
  ssl: {
    rejectUnauthorized: false,
  },
});

async function main() {
  try {
    console.log('🔄 Backfilling Google account creation times for existing users...\n');

    // Initialize Google Workspace service
    const googleService = new GoogleWorkspaceService();
    await new Promise(resolve => setTimeout(resolve, 1000));

    const isInitialized = await googleService.isInitialized();
    if (!isInitialized) {
      console.error('❌ Google Workspace service failed to initialize');
      process.exit(1);
    }

    // Fetch all users from database
    const dbResult = await pool.query(`
      SELECT id, email, google_workspace_id, google_account_created_at
      FROM users
      WHERE google_workspace_id IS NOT NULL
    `);

    console.log(`📊 Found ${dbResult.rows.length} users with Google Workspace IDs\n`);

    let successCount = 0;
    let failCount = 0;
    let skippedCount = 0;

    for (const dbUser of dbResult.rows) {
      try {
        // Skip if already has creation time
        if (dbUser.google_account_created_at) {
          console.log(`⏭️  Skipped: ${dbUser.email} (already has creation time)`);
          skippedCount++;
          continue;
        }

        // Fetch user from Google
        const googleUser = await googleService.fetchUserByEmail(dbUser.email);

        if (!googleUser) {
          console.log(`⚠️  Warning: ${dbUser.email} not found in Google Workspace`);
          failCount++;
          continue;
        }

        if (!googleUser.creationTime) {
          console.log(`⚠️  Warning: ${dbUser.email} has no creation time in Google`);
          failCount++;
          continue;
        }

        // Update user with creation time
        await pool.query(`
          UPDATE users
          SET google_account_created_at = $1, updated_at = CURRENT_TIMESTAMP
          WHERE id = $2
        `, [googleUser.creationTime, dbUser.id]);

        console.log(`✅ Updated: ${dbUser.email}`);
        console.log(`   Google Account Created: ${googleUser.creationTime}`);
        console.log();

        successCount++;

        // Rate limit to avoid hitting Google API limits
        await new Promise(resolve => setTimeout(resolve, 200));

      } catch (error: any) {
        console.error(`❌ Failed to update ${dbUser.email}:`, error.message);
        failCount++;
      }
    }

    console.log('\n✨ Backfill Complete!\n');
    console.log(`✅ Successfully updated: ${successCount} users`);
    console.log(`⏭️  Skipped (already populated): ${skippedCount} users`);
    console.log(`❌ Failed: ${failCount} users`);
    console.log();

  } catch (error: any) {
    console.error('❌ Error:', error.message);
    if (error.stack) {
      console.error(error.stack);
    }
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();
