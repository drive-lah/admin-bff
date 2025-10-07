import { parse } from 'csv-parse/sync';
import * as fs from 'fs';
import * as path from 'path';
import { Pool } from 'pg';

// Database connection
const pool = new Pool({
  host: 'collections-db.compunokr5xr.ap-southeast-2.rds.amazonaws.com',
  port: 5432,
  database: 'collections-db',
  user: 'collectionsagent',
  password: 'collectionsagent',
  ssl: {
    rejectUnauthorized: false, // For AWS RDS
  },
});

interface CSVRow {
  email: string;
  Country: string;
  'Org Role': string;
  Team: string;
  region: string;
  'Team Manager': string; // CSV parser trims the trailing space
  'Date of Joining': string;
}

// Email mappings for CSV to actual Google Workspace emails
const EMAIL_MAPPINGS: Record<string, string> = {
  'ernie@drivelah.sg': 'ernie@drivemate.au',
  'patrick@drivelah.sg': 'patrick@drivemate.au',
  'karen@drivelah.sg': 'karen@drivemate.au',
  'julie@drivelah.sg': 'julie@drivemate.au',
  'mary@drivelah.sg': 'mary@drivemate.au',
  'randolf@drivelah.sg': 'randolf@drivemate.au',
  'gabriel@drivelah.sg': 'gabriel@drivemate.au',
  'myrna @drivelah.sg': 'myrna@drivelah.sg', // Fix space in email
  'annabelle@drivelah.sg': 'annabelle@drivemate.au' // Correct: annabelle not annabella
};

// Parse date from various formats to ISO date (YYYY-MM-DD)
function parseDate(dateStr: string): string | null {
  if (!dateStr || dateStr.trim() === '') return null;

  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return null;

    // Format as YYYY-MM-DD
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  } catch (error) {
    console.error(`Failed to parse date: ${dateStr}`, error);
    return null;
  }
}

// Parse teams from comma-separated string to array
function parseTeams(teamsStr: string): string[] {
  if (!teamsStr || teamsStr.trim() === '') return ['na'];

  return teamsStr
    .split(',')
    .map(team => team.trim().toLowerCase())
    .filter(team => team.length > 0);
}

// Get user ID by email
async function getUserIdByEmail(email: string): Promise<number | null> {
  if (!email || email.trim() === '') return null;

  try {
    const result = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      [email.trim()]
    );
    return result.rows.length > 0 ? result.rows[0].id : null;
  } catch (error) {
    console.error(`Error finding user ${email}:`, error);
    return null;
  }
}

// Update user with CSV data
async function updateUser(row: CSVRow): Promise<void> {
  let email: string = row.email.trim();

  // Apply email mapping if exists
  const mappedEmail = EMAIL_MAPPINGS[email];
  if (mappedEmail) {
    console.log(`📧 Mapping: ${email} → ${mappedEmail}`);
    email = mappedEmail;
  }

  // Check if user exists
  const userId = await getUserIdByEmail(email);
  if (!userId) {
    console.log(`❌ User not found: ${email} - skipping`);
    return;
  }

  // Parse teams
  const teams = parseTeams(row.Team);

  // Parse date
  const dateOfJoining = parseDate(row['Date of Joining']);

  // Get manager ID
  let managerEmail: string = row['Team Manager']?.trim() || '';

  // Apply email mapping for manager email too
  const mappedManagerEmail = EMAIL_MAPPINGS[managerEmail];
  if (mappedManagerEmail) {
    managerEmail = mappedManagerEmail;
  }

  let managerId: number | null = null;
  if (managerEmail) {
    managerId = await getUserIdByEmail(managerEmail);
  }

  // Build update query
  const updates: string[] = [];
  const values: any[] = [];
  let paramIndex = 1;

  // Teams
  updates.push(`teams = $${paramIndex++}`);
  values.push(teams);

  // Country
  if (row.Country && row.Country.trim()) {
    updates.push(`country = $${paramIndex++}`);
    values.push(row.Country.trim());
  }

  // Org Role
  if (row['Org Role'] && row['Org Role'].trim()) {
    updates.push(`org_role = $${paramIndex++}`);
    values.push(row['Org Role'].trim());
  }

  // Region
  if (row.region && row.region.trim()) {
    updates.push(`region = $${paramIndex++}`);
    values.push(row.region.trim());
  }

  // Manager ID
  if (managerId) {
    updates.push(`manager_id = $${paramIndex++}`);
    values.push(managerId);
  }

  // Date of Joining
  if (dateOfJoining) {
    updates.push(`date_of_joining = $${paramIndex++}`);
    values.push(dateOfJoining);
  }

  // Updated timestamp
  updates.push('updated_at = CURRENT_TIMESTAMP');

  // Add user ID for WHERE clause
  values.push(userId);

  const query = `
    UPDATE users
    SET ${updates.join(', ')}
    WHERE id = $${paramIndex}
    RETURNING email, name, teams, country, org_role, region, manager_id, date_of_joining
  `;

  try {
    const result = await pool.query(query, values);
    const updated = result.rows[0];
    console.log(`✅ Updated: ${updated.email} (${updated.name}) - Teams: [${updated.teams.join(', ')}], Manager ID: ${updated.manager_id || 'none'}`);
  } catch (error: any) {
    console.error(`❌ Failed to update ${email}:`, error.message);
  }
}

async function main() {
  try {
    console.log('📂 Reading CSV file...\n');

    const csvPath = path.join(__dirname, '../temp_data/Employee Directory c033d874044542e9a7e009fb66e85e65.csv');
    const fileContent = fs.readFileSync(csvPath, 'utf-8');

    // Parse CSV
    const records: CSVRow[] = parse(fileContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
      bom: true, // Handle BOM character
    });

    console.log(`📊 Found ${records.length} employees in CSV\n`);
    console.log('🔄 Processing updates...\n');

    let successCount = 0;
    let skipCount = 0;

    // Process in order (founders first, then managers, then employees)
    // This ensures manager_id references exist
    for (const record of records) {
      await updateUser(record);

      const userId = await getUserIdByEmail(record.email);
      if (userId) {
        successCount++;
      } else {
        skipCount++;
      }

      // Small delay to avoid overwhelming the database
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.log('\n✨ Import Complete!\n');
    console.log(`✅ Successfully updated: ${successCount} users`);
    console.log(`⏭️  Skipped (not found): ${skipCount} users`);

  } catch (error) {
    console.error('❌ Error during import:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run the script
main();
