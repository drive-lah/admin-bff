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
    console.log('🔍 Checking Google Workspace sync status...\n');

    // Initialize Google Workspace service
    const googleService = new GoogleWorkspaceService();

    // Wait a moment for initialization
    await new Promise(resolve => setTimeout(resolve, 1000));

    const isInitialized = await googleService.isInitialized();
    if (!isInitialized) {
      console.error('❌ Google Workspace service failed to initialize');
      console.error('Check that credentials/drivelah-service-account.json exists and is valid');
      process.exit(1);
    }

    console.log('✅ Google Workspace service initialized\n');

    // Fetch users from both domains
    console.log('📥 Fetching users from drivelah.sg...');
    const drivelahUsers = await googleService.fetchAllUsers('drivelah.sg');
    console.log(`   Found ${drivelahUsers.length} users\n`);

    console.log('📥 Fetching users from drivemate.au...');
    const drivemateUsers = await googleService.fetchAllUsers('drivemate.au');
    console.log(`   Found ${drivemateUsers.length} users\n`);

    const allGoogleUsers = [...drivelahUsers, ...drivemateUsers];
    console.log(`📊 Total Google Workspace users: ${allGoogleUsers.length}\n`);

    // Fetch users from database (excluding already-deleted users)
    console.log('📥 Fetching users from database...');
    const dbResult = await pool.query('SELECT email, google_workspace_id, status FROM users WHERE status != $1', ['deleted']);
    const dbUsers = dbResult.rows;
    const deletedResult = await pool.query('SELECT COUNT(*) as count FROM users WHERE status = $1', ['deleted']);
    const deletedCount = parseInt(deletedResult.rows[0].count);
    console.log(`   Found ${dbUsers.length} active/suspended users`);
    console.log(`   Found ${deletedCount} already-deleted users\n`);

    // Compare
    const dbEmails = new Set(dbUsers.map((u: any) => u.email));
    const googleEmails = new Set(allGoogleUsers.map(u => u.primaryEmail));

    // Find users in Google but not in database
    const missingInDb = allGoogleUsers.filter(u => !dbEmails.has(u.primaryEmail));

    // Find users in database but not in Google
    const missingInGoogle = dbUsers.filter((u: any) => !googleEmails.has(u.email));

    console.log('=' .repeat(80));
    console.log('SYNC STATUS REPORT');
    console.log('=' .repeat(80));
    console.log();

    if (missingInDb.length > 0) {
      console.log(`⚠️  Users in Google Workspace but NOT in database: ${missingInDb.length}\n`);
      missingInDb.forEach((user, index) => {
        console.log(`${index + 1}. ${user.primaryEmail} - ${user.name.fullName}`);
        console.log(`   Google ID: ${user.id}`);
        console.log(`   Org Unit: ${user.orgUnitPath}`);
        console.log(`   Suspended: ${user.suspended}`);
        console.log();
      });
    } else {
      console.log('✅ All Google Workspace users are in the database\n');
    }

    if (missingInGoogle.length > 0) {
      console.log(`⚠️  Users in database but NOT in Google Workspace: ${missingInGoogle.length}\n`);
      missingInGoogle.forEach((user: any, index) => {
        console.log(`${index + 1}. ${user.email}`);
        console.log(`   Google ID in DB: ${user.google_workspace_id || 'None'}`);
        console.log(`   Current status: ${user.status || 'unknown'}`);
        console.log();
      });
      console.log('💡 TIP: Run sync-from-google.ts to mark these users as "deleted"\n');
    } else {
      console.log('✅ All database users exist in Google Workspace\n');
    }

    console.log('=' .repeat(80));
    console.log('SUMMARY');
    console.log('=' .repeat(80));
    console.log(`Google Workspace users: ${allGoogleUsers.length}`);
    console.log(`Database users (active/suspended): ${dbUsers.length}`);
    console.log(`Database users (already deleted): ${deletedCount}`);
    console.log(`Missing in database: ${missingInDb.length}`);
    console.log(`Missing in Google (need deletion): ${missingInGoogle.length}`);
    console.log();
    
    if (missingInGoogle.length > 0) {
      console.log('📋 NEXT STEPS:');
      console.log('  1. Review the users marked "Missing in Google" above');
      console.log('  2. Run: npm run sync:google');
      console.log('  3. Verify deletion with: npm run sync:check');
      console.log();
    }

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
