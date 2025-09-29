import { db } from './database';
import { logger } from '../utils/logger';

export class DatabaseMigrations {
  public static async runMigrations(): Promise<void> {
    try {
      logger.info('Running database migrations...');

      // Create users table
      await db.run(`
        CREATE TABLE IF NOT EXISTS users (
          id SERIAL PRIMARY KEY,
          email VARCHAR(255) UNIQUE NOT NULL,
          name VARCHAR(255) NOT NULL,
          role VARCHAR(50) NOT NULL CHECK (role IN ('admin', 'manager', 'viewer')),
          team VARCHAR(100) NOT NULL,
          status VARCHAR(50) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
          google_workspace_id VARCHAR(255) UNIQUE,
          google_org_unit VARCHAR(255),
          google_groups TEXT, -- JSON array stored as string
          intercom_id VARCHAR(255),
          aircall_id VARCHAR(255),
          slack_id VARCHAR(255),
          profile_photo_url TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          last_login_at TIMESTAMP,
          last_google_sync_at TIMESTAMP
        )
      `);

      // Create user_permissions table
      await db.run(`
        CREATE TABLE IF NOT EXISTS user_permissions (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL,
          module VARCHAR(100) NOT NULL,
          access_level VARCHAR(50) NOT NULL CHECK (access_level IN ('read', 'write', 'admin')),
          granted_by INTEGER NOT NULL,
          granted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
          FOREIGN KEY (granted_by) REFERENCES users(id),
          UNIQUE(user_id, module)
        )
      `);

      // Create indexes for performance
      await db.run(`CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)`);
      await db.run(`CREATE INDEX IF NOT EXISTS idx_users_google_workspace_id ON users(google_workspace_id)`);
      await db.run(`CREATE INDEX IF NOT EXISTS idx_users_status ON users(status)`);
      await db.run(`CREATE INDEX IF NOT EXISTS idx_user_permissions_user_id ON user_permissions(user_id)`);
      await db.run(`CREATE INDEX IF NOT EXISTS idx_user_permissions_module ON user_permissions(module)`);

      // Create function and trigger to update updated_at timestamp (PostgreSQL style)
      await db.run(`
        CREATE OR REPLACE FUNCTION update_updated_at_column()
        RETURNS TRIGGER AS $$
        BEGIN
          NEW.updated_at = CURRENT_TIMESTAMP;
          RETURN NEW;
        END;
        $$ language 'plpgsql'
      `);

      await db.run(`
        DO $$
        BEGIN
          IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_users_updated_at') THEN
            CREATE TRIGGER update_users_updated_at
              BEFORE UPDATE ON users
              FOR EACH ROW
              EXECUTE FUNCTION update_updated_at_column();
          END IF;
        END
        $$
      `);

      logger.info('Database migrations completed successfully');
    } catch (error) {
      logger.error('Error running database migrations:', error);
      throw error;
    }
  }

  public static async insertDefaultData(): Promise<void> {
    try {
      // Check if we already have users
      const existingUsers = await db.all('SELECT COUNT(*) as count FROM users');
      if (existingUsers[0] && parseInt((existingUsers[0] as any).count) > 0) {
        logger.info('Default data already exists, skipping...');
        return;
      }

      logger.info('Inserting default admin user...');

      // Insert a default admin user (this would typically be synced from Google Workspace)
      await db.run(`
        INSERT INTO users (
          email, name, role, team, status, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      `, [
        'admin@drivelah.sg',
        'System Admin',
        'admin',
        'tech',
        'active'
      ]);

      // Get the admin user ID
      const adminUser = await db.get<{ id: number }>('SELECT id FROM users WHERE email = $1', ['admin@drivelah.sg']);

      if (adminUser) {
        // Grant all module permissions to the admin
        const modules = ['users', 'finance', 'ai-agents', 'tech', 'listings', 'transactions', 'resolution', 'claims', 'host-management'];

        for (const module of modules) {
          await db.run(`
            INSERT INTO user_permissions (user_id, module, access_level, granted_by, granted_at)
            VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
          `, [adminUser.id, module, 'admin', adminUser.id]);
        }
      }

      logger.info('Default data inserted successfully');
    } catch (error) {
      logger.error('Error inserting default data:', error);
      throw error;
    }
  }
}