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
    console.log('🔄 Syncing users from Google Workspace to database...\n');

    // Initialize Google Workspace service
    const googleService = new GoogleWorkspaceService();
    await new Promise(resolve => setTimeout(resolve, 1000));

    const isInitialized = await googleService.isInitialized();
    if (!isInitialized) {
      console.error('❌ Google Workspace service failed to initialize');
      process.exit(1);
    }

    // Fetch users from all domains
    console.log('📥 Fetching users from Google Workspace...');
    const drivelahUsers = await googleService.fetchAllUsers('drivelah.sg');
    const drivemateAuUsers = await googleService.fetchAllUsers('drivemate.au');
    const drivemateNzUsers = await googleService.fetchAllUsers('drivemate.nz');
    const allGoogleUsers = [...drivelahUsers, ...drivemateAuUsers, ...drivemateNzUsers];
    console.log(`   Found ${allGoogleUsers.length} users in Google Workspace (drivelah.sg: ${drivelahUsers.length}, drivemate.au: ${drivemateAuUsers.length}, drivemate.nz: ${drivemateNzUsers.length})\n`);

    // Fetch existing users from database
    const dbResult = await pool.query('SELECT email FROM users');
    const dbEmails = new Set(dbResult.rows.map((u: any) => u.email));

    // Find users missing in database
    const missingUsers = allGoogleUsers.filter(u => !dbEmails.has(u.primaryEmail));

    console.log(`📊 Found ${missingUsers.length} users to sync\n`);

    if (missingUsers.length === 0) {
      console.log('✅ All Google Workspace users are already in the database');
      return;
    }

    console.log('🔄 Starting sync...\n');

    let successCount = 0;
    let failCount = 0;

    for (const user of missingUsers) {
      try {
        // Determine default values
        const email = user.primaryEmail;
        const name = user.name.fullName;
        const googleId = user.id;
        const orgUnit = user.orgUnitPath;
        const photoUrl = user.thumbnailPhotoUrl || null;
        const lastLogin = user.lastLoginTime || null;

        // Default values for new users
        const role = 'viewer'; // Default role
        const teams = ['na']; // Default team
        const status = user.suspended ? 'suspended' : 'active';
        const region = 'global'; // Default region

        // Insert user into database
        await pool.query(`
          INSERT INTO users (
            email,
            name,
            role,
            teams,
            status,
            region,
            google_workspace_id,
            google_org_unit,
            profile_photo_url,
            last_login_at,
            google_account_created_at,
            created_at,
            updated_at,
            last_google_sync_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        `, [
          email,
          name,
          role,
          teams,
          status,
          region,
          googleId,
          orgUnit,
          photoUrl,
          lastLogin,
          user.creationTime
        ]);

        console.log(`✅ Synced: ${email} (${name})`);
        console.log(`   Google ID: ${googleId}`);
        console.log(`   Org Unit: ${orgUnit}`);
        console.log(`   Status: ${status}`);
        console.log();

        successCount++;
        await new Promise(resolve => setTimeout(resolve, 100));

      } catch (error: any) {
        console.error(`❌ Failed to sync ${user.primaryEmail}:`, error.message);
        failCount++;
      }
    }

    console.log('\n✨ Sync Complete!\n');
    console.log(`✅ Successfully synced: ${successCount} users`);
    console.log(`❌ Failed: ${failCount} users`);
    console.log();

    // Show updated stats
    const finalCount = await pool.query('SELECT COUNT(*) as count FROM users');
    console.log(`📊 Total users in database: ${finalCount.rows[0].count}`);

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
