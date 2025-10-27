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
    const dbEmailsMap = new Map(dbResult.rows.map((u: any) => [u.email, true]));

    // Separate new and existing users
    const newUsers = allGoogleUsers.filter(u => !dbEmailsMap.has(u.primaryEmail));
    const existingUsers = allGoogleUsers.filter(u => dbEmailsMap.has(u.primaryEmail));

    console.log(`📊 Users to process:`);
    console.log(`   New users to insert: ${newUsers.length}`);
    console.log(`   Existing users to update: ${existingUsers.length}\n`);

    console.log('🔄 Starting sync...\n');

    let insertedCount = 0;
    let updatedCount = 0;
    let failCount = 0;

    // Process new users (INSERT)
    for (const user of newUsers) {
      try {
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

        console.log(`✅ Inserted: ${email} (${name})`);
        console.log(`   Status: ${status}\n`);

        insertedCount++;
        await new Promise(resolve => setTimeout(resolve, 100));

      } catch (error: any) {
        console.error(`❌ Failed to insert ${user.primaryEmail}:`, error.message);
        failCount++;
      }
    }

    // Process existing users (UPDATE)
    for (const user of existingUsers) {
      try {
        const email = user.primaryEmail;
        const name = user.name.fullName;
        const googleId = user.id;
        const orgUnit = user.orgUnitPath;
        const photoUrl = user.thumbnailPhotoUrl || null;
        const lastLogin = user.lastLoginTime || null;
        const status = user.suspended ? 'suspended' : 'active';

        // Update existing user - preserves role, teams, permissions
        await pool.query(`
          UPDATE users
          SET
            name = $1,
            status = $2,
            google_workspace_id = $3,
            google_org_unit = $4,
            profile_photo_url = $5,
            last_login_at = $6,
            google_account_created_at = $7,
            updated_at = CURRENT_TIMESTAMP,
            last_google_sync_at = CURRENT_TIMESTAMP
          WHERE email = $8
        `, [
          name,
          status,
          googleId,
          orgUnit,
          photoUrl,
          lastLogin,
          user.creationTime,
          email
        ]);

        console.log(`🔄 Updated: ${email} (${name})`);
        console.log(`   Status: ${status}\n`);

        updatedCount++;
        await new Promise(resolve => setTimeout(resolve, 100));

      } catch (error: any) {
        console.error(`❌ Failed to update ${user.primaryEmail}:`, error.message);
        failCount++;
      }
    }

    console.log('\n✨ Sync Complete!\n');
    console.log(`✅ Inserted new users: ${insertedCount}`);
    console.log(`🔄 Updated existing users: ${updatedCount}`);
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
