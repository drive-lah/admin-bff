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

    // Fetch users from database
    console.log('📥 Fetching users from database...');
    const dbResult = await pool.query('SELECT email, google_workspace_id FROM users');
    const dbUsers = dbResult.rows;
    console.log(`   Found ${dbUsers.length} users in database\n`);

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
        console.log();
      });
    } else {
      console.log('✅ All database users exist in Google Workspace\n');
    }

    console.log('=' .repeat(80));
    console.log('SUMMARY');
    console.log('=' .repeat(80));
    console.log(`Google Workspace users: ${allGoogleUsers.length}`);
    console.log(`Database users: ${dbUsers.length}`);
    console.log(`Missing in database: ${missingInDb.length}`);
    console.log(`Missing in Google: ${missingInGoogle.length}`);
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
